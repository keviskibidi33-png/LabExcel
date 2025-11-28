"""
Servicio para verificación de muestras cilíndricas de concreto
Implementa la lógica de fórmulas y patrones según los requerimientos
"""

from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from models import VerificacionMuestras, MuestraVerificada
from schemas import (
    VerificacionMuestrasCreate, 
    MuestraVerificadaCreate,
    CalculoFormulaRequest,
    CalculoFormulaResponse,
    CalculoPatronRequest,
    CalculoPatronResponse
)
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class VerificacionService:
    """Servicio para manejo de verificación de muestras cilíndricas"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calcular_formula_diametros(self, request: CalculoFormulaRequest) -> CalculoFormulaResponse:
        """
        Calcula la tolerancia de diámetros según la fórmula especificada
        
        Fórmula: |Diámetro1 - Diámetro2| / Diámetro1 * 100
        Tolerancia: 2% (Testigo 30x15cm = 3mm, Testigo 20x10cm = 2mm)
        """
        try:
            diametro_1 = request.diametro_1_mm
            diametro_2 = request.diametro_2_mm
            tipo_testigo = request.tipo_testigo.lower()
            
            # Calcular diferencia porcentual
            diferencia_absoluta = abs(diametro_1 - diametro_2)
            tolerancia_porcentaje = (diferencia_absoluta / diametro_1) * 100
            
            # Determinar si cumple según el tipo de testigo
            if tipo_testigo == "30x15":
                cumple = tolerancia_porcentaje <= 2.0  # 2% para 30x15cm
            elif tipo_testigo == "20x10":
                cumple = tolerancia_porcentaje <= 2.0  # 2% para 20x10cm
            else:
                # Para otros tipos, usar 2% como estándar
                cumple = tolerancia_porcentaje <= 2.0
            
            mensaje = f"Tolerancia calculada: {tolerancia_porcentaje:.2f}% - {'CUMPLE' if cumple else 'NO CUMPLE'}"
            
            # Determinar aceptación como texto
            aceptacion = "Cumple" if cumple else "No cumple"
            
            return CalculoFormulaResponse(
                tolerancia_porcentaje=round(tolerancia_porcentaje, 2),
                cumple_tolerancia=cumple,
                mensaje=mensaje
            )
            
        except Exception as e:
            logger.error(f"Error calculando fórmula de diámetros: {str(e)}")
            raise ValueError(f"Error en el cálculo: {str(e)}")
    
    def calcular_patron_accion(self, request: CalculoPatronRequest) -> CalculoPatronResponse:
        """
        Calcula la acción a realizar según el patrón especificado
        
        Patrones basados en: C. SUPERIOR, C. INFERIOR, Depresiones
        - NO CUMPLE + CUMPLE + CUMPLE → "NEOPRENO CARA INFERIOR"
        - CUMPLE + NO CUMPLE + CUMPLE → "NEOPRENO CARA SUPERIOR"  
        - CUMPLE + CUMPLE + CUMPLE → "-"
        - NO CUMPLE + NO CUMPLE + CUMPLE → "NEOPRENO CARA INFERIOR E SUPERIOR"
        - NO CUMPLE + NO CUMPLE + NO CUMPLE → "CAPEO"
        """
        try:
            # Convertir a booleanos si vienen como strings
            def convertir_a_bool(valor):
                if isinstance(valor, str):
                    return valor.lower() in ['cumple', 'true', '1', 'yes', 'sí']
                return bool(valor) if valor is not None else False
            
            planitud_superior = convertir_a_bool(request.planitud_superior)
            planitud_inferior = convertir_a_bool(request.planitud_inferior)
            planitud_depresiones = convertir_a_bool(request.planitud_depresiones)
            
            # Función para calcular patrón de planitud
            def calcular_patron_planitud(superior: bool, inferior: bool, depresiones: bool) -> str:
                clave = f"{'C' if superior else 'N'}{'C' if inferior else 'N'}{'C' if depresiones else 'N'}"
                patrones = {
                    'NCC': 'NEOPRENO CARA INFERIOR',      # NO CUMPLE + CUMPLE + CUMPLE
                    'CNC': 'NEOPRENO CARA SUPERIOR',      # CUMPLE + NO CUMPLE + CUMPLE
                    'CCC': '-',                           # CUMPLE + CUMPLE + CUMPLE
                    'NNC': 'NEOPRENO CARA INFERIOR E SUPERIOR', # NO CUMPLE + NO CUMPLE + CUMPLE
                    'NNN': 'CAPEO'                        # NO CUMPLE + NO CUMPLE + NO CUMPLE
                }
                return patrones.get(clave, f"ERROR: Patrón no reconocido ({clave})")
            
            # Aplicar patrón de decisión
            accion = calcular_patron_planitud(planitud_superior, planitud_inferior, planitud_depresiones)
            
            mensaje = f"Acción calculada según patrón: {accion}"
            
            return CalculoPatronResponse(
                accion_realizar=accion,
                mensaje=mensaje
            )
            
        except Exception as e:
            logger.error(f"Error calculando patrón de acción: {str(e)}")
            raise ValueError(f"Error en el cálculo del patrón: {str(e)}")
    
    def crear_verificacion(self, verificacion_data: VerificacionMuestrasCreate) -> VerificacionMuestras:
        """Crea una nueva verificación de muestras"""
        try:
            # Crear la verificación principal
            db_verificacion = VerificacionMuestras(
                numero_verificacion=verificacion_data.numero_verificacion,
                codigo_documento=verificacion_data.codigo_documento,
                version=verificacion_data.version,
                fecha_documento=verificacion_data.fecha_documento,
                pagina=verificacion_data.pagina,
                verificado_por=verificacion_data.verificado_por,
                fecha_verificacion=verificacion_data.fecha_verificacion,
                cliente=verificacion_data.cliente,
                equipo_bernier=getattr(verificacion_data, 'equipo_bernier', None),
                equipo_lainas_1=getattr(verificacion_data, 'equipo_lainas_1', None),
                equipo_lainas_2=getattr(verificacion_data, 'equipo_lainas_2', None),
                equipo_escuadra=getattr(verificacion_data, 'equipo_escuadra', None),
                equipo_balanza=getattr(verificacion_data, 'equipo_balanza', None),
                nota=getattr(verificacion_data, 'nota', None)
            )
            
            self.db.add(db_verificacion)
            self.db.flush()  # Para obtener el ID
            
            # Procesar cada muestra verificada
            for muestra_data in verificacion_data.muestras_verificadas:
                # Calcular fórmula de diámetros si se proporcionan
                tolerancia_porcentaje = None
                cumple_tolerancia = None
                
                if muestra_data.diametro_1_mm and muestra_data.diametro_2_mm:
                    # Determinar tipo de testigo basado en el texto ingresado
                    tipo_testigo = "20x10"  # default
                    if muestra_data.tipo_testigo and "30x15" in muestra_data.tipo_testigo.lower():
                        tipo_testigo = "30x15"
                    elif muestra_data.tipo_testigo and "20x10" in muestra_data.tipo_testigo.lower():
                        tipo_testigo = "20x10"
                    
                    formula_request = CalculoFormulaRequest(
                        diametro_1_mm=muestra_data.diametro_1_mm,
                        diametro_2_mm=muestra_data.diametro_2_mm,
                        tipo_testigo=tipo_testigo
                    )
                    
                    formula_result = self.calcular_formula_diametros(formula_request)
                    tolerancia_porcentaje = formula_result.tolerancia_porcentaje
                    cumple_tolerancia = formula_result.cumple_tolerancia
                
                # Calcular patrón de acción si se tienen todos los datos de planitud
                accion_realizar = None
                # Obtener valores de planitud (nuevos o legacy)
                planitud_sup_val = getattr(muestra_data, 'planitud_superior_aceptacion', None)
                planitud_inf_val = getattr(muestra_data, 'planitud_inferior_aceptacion', None)
                planitud_dep_val = getattr(muestra_data, 'planitud_depresiones_aceptacion', None)
                
                # Si no hay aceptaciones como texto, usar booleanos legacy
                if not planitud_sup_val:
                    planitud_sup_val = getattr(muestra_data, 'planitud_superior', None)
                if not planitud_inf_val:
                    planitud_inf_val = getattr(muestra_data, 'planitud_inferior', None)
                if not planitud_dep_val:
                    planitud_dep_val = getattr(muestra_data, 'planitud_depresiones', None)
                
                # Función para convertir strings a booleanos
                def convertir_a_bool(valor):
                    if valor is None:
                        return None
                    if isinstance(valor, bool):
                        return valor
                    if isinstance(valor, str):
                        valor_lower = valor.lower().strip()
                        # Si es "cumple" o equivalente, retornar True
                        if valor_lower in ['cumple', 'true', '1', 'yes', 'sí', 'si']:
                            return True
                        # Si es "no cumple" o equivalente, retornar False
                        elif valor_lower in ['no cumple', 'false', '0', 'no', 'n']:
                            return False
                        # Si no coincide, intentar convertir a bool
                        return bool(valor) if valor else False
                    return bool(valor) if valor is not None else False
                
                # Convertir valores a booleanos antes de crear CalculoPatronRequest
                planitud_sup_bool = convertir_a_bool(planitud_sup_val)
                planitud_inf_bool = convertir_a_bool(planitud_inf_val)
                planitud_dep_bool = convertir_a_bool(planitud_dep_val)
                
                if (planitud_sup_bool is not None and 
                    planitud_inf_bool is not None and 
                    planitud_dep_bool is not None):
                    
                    patron_request = CalculoPatronRequest(
                        planitud_superior=planitud_sup_bool,
                        planitud_inferior=planitud_inf_bool,
                        planitud_depresiones=planitud_dep_bool
                    )
                    
                    patron_result = self.calcular_patron_accion(patron_request)
                    accion_realizar = patron_result.accion_realizar
                
                # Obtener código LEM (nuevo) o código cliente (legacy)
                codigo_lem = getattr(muestra_data, 'codigo_lem', None) or getattr(muestra_data, 'codigo_cliente', None) or ""
                
                # Calcular aceptación de diámetro
                aceptacion_diametro = "Cumple" if cumple_tolerancia else "No cumple" if cumple_tolerancia is False else None
                
                # Obtener valores de perpendicularidad (nuevos o legacy)
                perp_sup1 = getattr(muestra_data, 'perpendicularidad_sup1', None) or getattr(muestra_data, 'perpendicularidad_p1', None)
                perp_sup2 = getattr(muestra_data, 'perpendicularidad_sup2', None) or getattr(muestra_data, 'perpendicularidad_p2', None)
                perp_inf1 = getattr(muestra_data, 'perpendicularidad_inf1', None) or getattr(muestra_data, 'perpendicularidad_p3', None)
                perp_inf2 = getattr(muestra_data, 'perpendicularidad_inf2', None) or getattr(muestra_data, 'perpendicularidad_p4', None)
                perp_medida = getattr(muestra_data, 'perpendicularidad_medida', None) or getattr(muestra_data, 'perpendicularidad_cumple', None)
                
                # Obtener valores de planitud (nuevos o legacy)
                planitud_medida = getattr(muestra_data, 'planitud_medida', None)
                planitud_sup_acept = getattr(muestra_data, 'planitud_superior_aceptacion', None)
                planitud_inf_acept = getattr(muestra_data, 'planitud_inferior_aceptacion', None)
                planitud_dep_acept = getattr(muestra_data, 'planitud_depresiones_aceptacion', None)
                
                # Si no hay aceptaciones como texto, convertir de booleanos
                if not planitud_sup_acept and muestra_data.planitud_superior is not None:
                    planitud_sup_acept = "Cumple" if muestra_data.planitud_superior else "No cumple"
                if not planitud_inf_acept and muestra_data.planitud_inferior is not None:
                    planitud_inf_acept = "Cumple" if muestra_data.planitud_inferior else "No cumple"
                if not planitud_dep_acept and muestra_data.planitud_depresiones is not None:
                    planitud_dep_acept = "Cumple" if muestra_data.planitud_depresiones else "No cumple"
                
                # Obtener conformidad (nuevo texto o legacy booleano)
                # IMPORTANTE: La conformidad es independiente y NO valida longitudes ni masa.
                # Valida aspectos geométricos: Perpendicularidad, Planitud, Depresiones.
                conformidad = getattr(muestra_data, 'conformidad', None)
                if not conformidad and getattr(muestra_data, 'conformidad_correccion', None) is not None:
                    conformidad = "Ensayar" if muestra_data.conformidad_correccion else ""
                
                # Obtener longitudes, masa y pesar
                longitud_1 = getattr(muestra_data, 'longitud_1_mm', None)
                longitud_2 = getattr(muestra_data, 'longitud_2_mm', None)
                longitud_3 = getattr(muestra_data, 'longitud_3_mm', None)
                masa = getattr(muestra_data, 'masa_muestra_aire_g', None)
                pesar = getattr(muestra_data, 'pesar', None)
                
                # Crear la muestra verificada con nuevos campos
                db_muestra = MuestraVerificada(
                    verificacion_id=db_verificacion.id,
                    item_numero=muestra_data.item_numero,
                    codigo_lem=codigo_lem,
                    tipo_testigo=muestra_data.tipo_testigo,
                    diametro_1_mm=muestra_data.diametro_1_mm,
                    diametro_2_mm=muestra_data.diametro_2_mm,
                    tolerancia_porcentaje=tolerancia_porcentaje,
                    aceptacion_diametro=aceptacion_diametro,
                    perpendicularidad_sup1=perp_sup1,
                    perpendicularidad_sup2=perp_sup2,
                    perpendicularidad_inf1=perp_inf1,
                    perpendicularidad_inf2=perp_inf2,
                    perpendicularidad_medida=perp_medida,
                    planitud_medida=planitud_medida,
                    planitud_superior_aceptacion=planitud_sup_acept,
                    planitud_inferior_aceptacion=planitud_inf_acept,
                    planitud_depresiones_aceptacion=planitud_dep_acept,
                    accion_realizar=accion_realizar,
                    conformidad=conformidad,
                    longitud_1_mm=longitud_1,
                    longitud_2_mm=longitud_2,
                    longitud_3_mm=longitud_3,
                    masa_muestra_aire_g=masa,
                    pesar=pesar,
                    # Campos legacy para compatibilidad
                    codigo_cliente=codigo_lem,
                    cumple_tolerancia=cumple_tolerancia,
                    perpendicularidad_p1=perp_sup1,
                    perpendicularidad_p2=perp_sup2,
                    perpendicularidad_p3=perp_inf1,
                    perpendicularidad_p4=perp_inf2,
                    perpendicularidad_cumple=perp_medida,
                    planitud_superior=muestra_data.planitud_superior,
                    planitud_inferior=muestra_data.planitud_inferior,
                    planitud_depresiones=muestra_data.planitud_depresiones,
                    conformidad_correccion=muestra_data.conformidad_correccion
                )
                
                self.db.add(db_muestra)
            
            self.db.commit()
            self.db.refresh(db_verificacion)
            
            return db_verificacion
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creando verificación: {str(e)}")
            raise ValueError(f"Error creando verificación: {str(e)}")
    
    def obtener_verificacion(self, verificacion_id: int) -> Optional[VerificacionMuestras]:
        """Obtiene una verificación por ID con todas sus muestras"""
        from sqlalchemy.orm import joinedload
        verificacion = self.db.query(VerificacionMuestras).options(
            joinedload(VerificacionMuestras.muestras_verificadas)
        ).filter(
            VerificacionMuestras.id == verificacion_id
        ).first()
        
        if verificacion and verificacion.muestras_verificadas:
            # Ordenar muestras por item_numero
            verificacion.muestras_verificadas.sort(key=lambda m: m.item_numero or 0)
        
        return verificacion
    
    def listar_verificaciones(self, skip: int = 0, limit: int = 100) -> List[VerificacionMuestras]:
        """Lista todas las verificaciones"""
        return self.db.query(VerificacionMuestras).offset(skip).limit(limit).all()
    
    def actualizar_verificacion(self, verificacion_id: int, update_data: Dict[str, Any]) -> Optional[VerificacionMuestras]:
        """Actualiza una verificación existente"""
        try:
            db_verificacion = self.obtener_verificacion(verificacion_id)
            if not db_verificacion:
                return None
            
            # Separar muestras_verificadas del resto de los datos
            muestras_verificadas = update_data.pop('muestras_verificadas', None)
            
            # Actualizar campos directos de la verificación
            for field, value in update_data.items():
                if hasattr(db_verificacion, field) and field != 'muestras_verificadas':
                    setattr(db_verificacion, field, value)
            
            # Si hay muestras_verificadas, actualizarlas
            if muestras_verificadas is not None:
                logger.info(f"Actualizando {len(muestras_verificadas)} muestras para verificación {verificacion_id}")
                # Eliminar todas las muestras existentes
                deleted_count = self.db.query(MuestraVerificada).filter(
                    MuestraVerificada.verificacion_id == verificacion_id
                ).delete()
                logger.info(f"Eliminadas {deleted_count} muestras existentes")
                
                # Crear las nuevas muestras (usar la misma lógica que en crear_verificacion)
                for idx, muestra_data in enumerate(muestras_verificadas, 1):
                    # Convertir a dict si es un objeto Pydantic
                    if hasattr(muestra_data, 'dict'):
                        muestra_dict = muestra_data.dict()
                    elif hasattr(muestra_data, '__dict__'):
                        muestra_dict = muestra_data.__dict__
                    else:
                        muestra_dict = muestra_data if isinstance(muestra_data, dict) else {}
                    
                    # Función helper para obtener valores
                    def get_val(key, default=None):
                        if isinstance(muestra_dict, dict):
                            return muestra_dict.get(key, default)
                        return getattr(muestra_data, key, default) if hasattr(muestra_data, key) else default
                    
                    item_numero = get_val('item_numero')
                    codigo_lem = get_val('codigo_lem') or get_val('codigo_cliente') or ""
                    
                    # Calcular fórmula de diámetros si se tienen ambos diámetros
                    tolerancia_porcentaje = None
                    cumple_tolerancia = None
                    aceptacion_diametro = None
                    
                    diametro_1 = get_val('diametro_1_mm')
                    diametro_2 = get_val('diametro_2_mm')
                    tipo_testigo = get_val('tipo_testigo', "30x15")
                    
                    if diametro_1 and diametro_2:
                        formula_request = CalculoFormulaRequest(
                            diametro_1_mm=diametro_1,
                            diametro_2_mm=diametro_2,
                            tipo_testigo=tipo_testigo
                        )
                        formula_result = self.calcular_formula_diametros(formula_request)
                        tolerancia_porcentaje = formula_result.tolerancia_porcentaje
                        cumple_tolerancia = formula_result.cumple_tolerancia
                        aceptacion_diametro = "Cumple" if cumple_tolerancia else "No cumple"
                    
                    # Calcular patrón de acción si se tienen todos los datos de planitud
                    accion_realizar = None
                    planitud_sup_val = get_val('planitud_superior_aceptacion')
                    planitud_inf_val = get_val('planitud_inferior_aceptacion')
                    planitud_dep_val = get_val('planitud_depresiones_aceptacion')
                    
                    if not planitud_sup_val:
                        planitud_sup_val = get_val('planitud_superior')
                    if not planitud_inf_val:
                        planitud_inf_val = get_val('planitud_inferior')
                    if not planitud_dep_val:
                        planitud_dep_val = get_val('planitud_depresiones')
                    
                    def convertir_a_bool(valor):
                        if valor is None:
                            return None
                        if isinstance(valor, bool):
                            return valor
                        if isinstance(valor, str):
                            valor_lower = valor.lower().strip()
                            if valor_lower in ['cumple', 'true', '1', 'yes', 'sí', 'si']:
                                return True
                            elif valor_lower in ['no cumple', 'false', '0', 'no', 'n']:
                                return False
                            return bool(valor) if valor else False
                        return bool(valor) if valor is not None else False
                    
                    planitud_sup_bool = convertir_a_bool(planitud_sup_val)
                    planitud_inf_bool = convertir_a_bool(planitud_inf_val)
                    planitud_dep_bool = convertir_a_bool(planitud_dep_val)
                    
                    if (planitud_sup_bool is not None and 
                        planitud_inf_bool is not None and 
                        planitud_dep_bool is not None):
                        patron_request = CalculoPatronRequest(
                            planitud_superior=planitud_sup_bool,
                            planitud_inferior=planitud_inf_bool,
                            planitud_depresiones=planitud_dep_bool
                        )
                        patron_result = self.calcular_patron_accion(patron_request)
                        accion_realizar = patron_result.accion_realizar
                    
                    # Obtener valores de perpendicularidad
                    perp_sup1 = get_val('perpendicularidad_sup1') or get_val('perpendicularidad_p1')
                    perp_sup2 = get_val('perpendicularidad_sup2') or get_val('perpendicularidad_p2')
                    perp_inf1 = get_val('perpendicularidad_inf1') or get_val('perpendicularidad_p3')
                    perp_inf2 = get_val('perpendicularidad_inf2') or get_val('perpendicularidad_p4')
                    perp_medida = get_val('perpendicularidad_medida') or get_val('perpendicularidad_cumple')
                    
                    # Obtener valores de planitud
                    planitud_medida = get_val('planitud_medida')
                    planitud_sup_acept = get_val('planitud_superior_aceptacion')
                    planitud_inf_acept = get_val('planitud_inferior_aceptacion')
                    planitud_dep_acept = get_val('planitud_depresiones_aceptacion')
                    
                    if not planitud_sup_acept and get_val('planitud_superior') is not None:
                        planitud_sup_acept = "Cumple" if get_val('planitud_superior') else "No cumple"
                    if not planitud_inf_acept and get_val('planitud_inferior') is not None:
                        planitud_inf_acept = "Cumple" if get_val('planitud_inferior') else "No cumple"
                    if not planitud_dep_acept and get_val('planitud_depresiones') is not None:
                        planitud_dep_acept = "Cumple" if get_val('planitud_depresiones') else "No cumple"
                    
                    conformidad = get_val('conformidad')
                    if not conformidad and get_val('conformidad_correccion') is not None:
                        conformidad = "Ensayar" if get_val('conformidad_correccion') else ""
                    
                    longitud_1 = get_val('longitud_1_mm')
                    longitud_2 = get_val('longitud_2_mm')
                    longitud_3 = get_val('longitud_3_mm')
                    masa = get_val('masa_muestra_aire_g')
                    pesar = get_val('pesar')
                    
                    # Crear la muestra verificada
                    db_muestra = MuestraVerificada(
                        verificacion_id=db_verificacion.id,
                        item_numero=item_numero,
                        codigo_lem=codigo_lem,
                        tipo_testigo=tipo_testigo,
                        diametro_1_mm=diametro_1,
                        diametro_2_mm=diametro_2,
                        tolerancia_porcentaje=tolerancia_porcentaje,
                        aceptacion_diametro=aceptacion_diametro,
                        perpendicularidad_sup1=perp_sup1,
                        perpendicularidad_sup2=perp_sup2,
                        perpendicularidad_inf1=perp_inf1,
                        perpendicularidad_inf2=perp_inf2,
                        perpendicularidad_medida=perp_medida,
                        planitud_medida=planitud_medida,
                        planitud_superior_aceptacion=planitud_sup_acept,
                        planitud_inferior_aceptacion=planitud_inf_acept,
                        planitud_depresiones_aceptacion=planitud_dep_acept,
                        accion_realizar=accion_realizar,
                        conformidad=conformidad,
                        longitud_1_mm=longitud_1,
                        longitud_2_mm=longitud_2,
                        longitud_3_mm=longitud_3,
                        masa_muestra_aire_g=masa,
                        pesar=pesar,
                        codigo_cliente=codigo_lem,
                        cumple_tolerancia=cumple_tolerancia,
                        perpendicularidad_p1=perp_sup1,
                        perpendicularidad_p2=perp_sup2,
                        perpendicularidad_p3=perp_inf1,
                        perpendicularidad_p4=perp_inf2,
                        perpendicularidad_cumple=perp_medida,
                        planitud_superior=get_val('planitud_superior'),
                        planitud_inferior=get_val('planitud_inferior'),
                        planitud_depresiones=get_val('planitud_depresiones'),
                        conformidad_correccion=get_val('conformidad_correccion')
                    )
                    
                    self.db.add(db_muestra)
                
                # Forzar flush para asegurar que los cambios se escriban antes del commit
                self.db.flush()
                
                # Commit después de agregar todas las muestras
                self.db.commit()
                logger.info(f"Verificación {verificacion_id} actualizada: {len(muestras_verificadas)} muestras guardadas")
            else:
                # Si no hay muestras_verificadas, solo hacer commit de los cambios en la verificación
                self.db.commit()
            
            self.db.refresh(db_verificacion)
            return db_verificacion
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error actualizando verificación: {str(e)}")
            raise ValueError(f"Error actualizando verificación: {str(e)}")
    
    def eliminar_verificacion(self, verificacion_id: int) -> bool:
        """Elimina una verificación"""
        try:
            db_verificacion = self.obtener_verificacion(verificacion_id)
            if not db_verificacion:
                return False
            
            self.db.delete(db_verificacion)
            self.db.commit()
            
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error eliminando verificación: {str(e)}")
            raise ValueError(f"Error eliminando verificación: {str(e)}")

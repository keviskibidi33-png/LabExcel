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
            planitud_superior = request.planitud_superior
            planitud_inferior = request.planitud_inferior
            planitud_depresiones = request.planitud_depresiones
            
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
                cliente=verificacion_data.cliente
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
                if (muestra_data.planitud_superior is not None and 
                    muestra_data.planitud_inferior is not None and 
                    muestra_data.planitud_depresiones is not None):
                    
                    patron_request = CalculoPatronRequest(
                        planitud_superior=muestra_data.planitud_superior,
                        planitud_inferior=muestra_data.planitud_inferior,
                        planitud_depresiones=muestra_data.planitud_depresiones
                    )
                    
                    patron_result = self.calcular_patron_accion(patron_request)
                    accion_realizar = patron_result.accion_realizar
                
                # Crear la muestra verificada
                db_muestra = MuestraVerificada(
                    verificacion_id=db_verificacion.id,
                    item_numero=muestra_data.item_numero,
                    codigo_cliente=muestra_data.codigo_cliente,
                    tipo_testigo=muestra_data.tipo_testigo,
                    diametro_1_mm=muestra_data.diametro_1_mm,
                    diametro_2_mm=muestra_data.diametro_2_mm,
                    tolerancia_porcentaje=tolerancia_porcentaje,
                    cumple_tolerancia=cumple_tolerancia,
                    perpendicularidad_p1=muestra_data.perpendicularidad_p1,
                    perpendicularidad_p2=muestra_data.perpendicularidad_p2,
                    perpendicularidad_p3=muestra_data.perpendicularidad_p3,
                    perpendicularidad_p4=muestra_data.perpendicularidad_p4,
                    perpendicularidad_cumple=muestra_data.perpendicularidad_cumple,
                    planitud_superior=muestra_data.planitud_superior,
                    planitud_inferior=muestra_data.planitud_inferior,
                    planitud_depresiones=muestra_data.planitud_depresiones,
                    accion_realizar=accion_realizar,
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
        """Obtiene una verificación por ID"""
        return self.db.query(VerificacionMuestras).filter(
            VerificacionMuestras.id == verificacion_id
        ).first()
    
    def listar_verificaciones(self, skip: int = 0, limit: int = 100) -> List[VerificacionMuestras]:
        """Lista todas las verificaciones"""
        return self.db.query(VerificacionMuestras).offset(skip).limit(limit).all()
    
    def actualizar_verificacion(self, verificacion_id: int, update_data: Dict[str, Any]) -> Optional[VerificacionMuestras]:
        """Actualiza una verificación existente"""
        try:
            db_verificacion = self.obtener_verificacion(verificacion_id)
            if not db_verificacion:
                return None
            
            for field, value in update_data.items():
                if hasattr(db_verificacion, field):
                    setattr(db_verificacion, field, value)
            
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

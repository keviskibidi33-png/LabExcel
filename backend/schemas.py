"""
Esquemas Pydantic para validación de datos del sistema de recepción de muestras
"""

from pydantic import BaseModel, Field, EmailStr, validator, root_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import re

class MuestraConcretoBase(BaseModel):
    """Esquema base para muestras de concreto"""
    item_numero: int = Field(..., ge=1, description="Número de item")
    codigo_muestra: Optional[str] = Field("", max_length=50, description="Código de la muestra")
    codigo_muestra_lem: Optional[str] = Field("", max_length=50, description="Código muestra LEM (zona sombreada)")
    identificacion_muestra: Optional[str] = Field("", max_length=50, description="Identificación de la muestra")
    estructura: Optional[str] = Field("", max_length=100, description="Tipo de estructura")
    fc_kg_cm2: float = Field(280, gt=0, description="Resistencia característica en kg/cm²")
    fecha_moldeo: Optional[str] = Field("", description="Fecha de moldeo (DD/MM/YYYY)")
    hora_moldeo: Optional[str] = Field("", description="Hora de moldeo (HH:MM)")
    edad: int = Field(10, ge=1, le=365, description="Edad de la muestra en días")
    fecha_rotura: Optional[str] = Field("", description="Fecha programada de rotura (DD/MM/YYYY)")
    requiere_densidad: bool = Field(False, description="Requiere ensayo de densidad")

    @validator('fecha_moldeo', 'fecha_rotura')
    def validate_date_format(cls, v):
        """Validar formato de fecha DD/MM/YYYY"""
        if v and v.strip() and not re.match(r'^\d{2}/\d{2}/\d{4}$', v):
            raise ValueError('La fecha debe estar en formato DD/MM/YYYY')
        return v

    # Validación de hora_moldeo eliminada para permitir cualquier texto

class MuestraConcretoCreate(MuestraConcretoBase):
    """Esquema para crear una muestra de concreto"""
    pass

class MuestraConcretoResponse(MuestraConcretoBase):
    """Esquema de respuesta para muestras de concreto"""
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class RecepcionMuestraBase(BaseModel):
    """Esquema base para recepciones de muestras"""
    # Campos principales
    numero_ot: str = Field(..., min_length=1, max_length=50, description="Número de orden de trabajo")
    numero_recepcion: str = Field(..., min_length=1, max_length=50, description="Número de recepción")
    numero_cotizacion: Optional[str] = Field(None, max_length=50, description="Número de cotización")
    # codigo_trazabilidad eliminado
    
    # Información del proyecto
    # asunto eliminado
    cliente: Optional[str] = Field("", max_length=200, description="Nombre del cliente")
    domicilio_legal: Optional[str] = Field("", max_length=300, description="Domicilio legal del cliente")
    ruc: Optional[str] = Field("", max_length=20, description="RUC del cliente")
    persona_contacto: Optional[str] = Field("", max_length=100, description="Persona de contacto")
    email: Optional[str] = Field("", description="Email de contacto")
    telefono: Optional[str] = Field("", max_length=20, description="Teléfono de contacto")
    
    # Información del solicitante
    solicitante: Optional[str] = Field("", max_length=200, description="Nombre del solicitante")
    domicilio_solicitante: Optional[str] = Field("", max_length=300, description="Domicilio del solicitante")
    proyecto: Optional[str] = Field("", max_length=200, description="Nombre del proyecto")
    ubicacion: Optional[str] = Field("", max_length=200, description="Ubicación del proyecto")
    
    # Fechas importantes
    fecha_recepcion: Optional[str] = Field(None, description="Fecha de recepción (DD/MM/YYYY)")
    fecha_estimada_culminacion: Optional[str] = Field(None, description="Fecha estimada de culminación (DD/MM/YYYY)")
    
    # Configuración de emisión
    emision_fisica: bool = Field(False, description="Emisión física")
    emision_digital: bool = Field(False, description="Emisión digital")
    
    # Responsables
    entregado_por: Optional[str] = Field(None, max_length=100, description="Persona que entregó")
    recibido_por: Optional[str] = Field(None, max_length=100, description="Persona que recibió")
    
    # Metadatos del laboratorio
    codigo_laboratorio: str = Field("F-LEM-P-01.02", max_length=20, description="Código del laboratorio")
    version: str = Field("07", max_length=10, description="Versión del documento")
    
    # Campos de seguimiento
    fecha_inicio_programado: Optional[datetime] = Field(None, description="Fecha de inicio programada")
    fecha_inicio_real: Optional[datetime] = Field(None, description="Fecha de inicio real")
    fecha_fin_programado: Optional[datetime] = Field(None, description="Fecha de fin programada")
    fecha_fin_real: Optional[datetime] = Field(None, description="Fecha de fin real")
    plazo_entrega_dias: Optional[int] = Field(None, ge=1, description="Plazo de entrega en días")
    duracion_real_dias: Optional[int] = Field(None, ge=1, description="Duración real en días")
    
    # Información adicional
    observaciones: Optional[str] = Field(None, description="Observaciones generales")
    aperturada_por: Optional[str] = Field(None, max_length=100, description="Persona que aperturó la recepción")
    designada_a: Optional[str] = Field(None, max_length=100, description="Persona designada para el trabajo")
    estado: str = Field("PENDIENTE", max_length=20, description="Estado de la recepción")

    @validator('fecha_recepcion', 'fecha_estimada_culminacion')
    def validate_date_format(cls, v):
        """Validar formato de fecha DD/MM/YYYY"""
        if v and v.strip() and not re.match(r'^\d{2}/\d{2}/\d{4}$', v):
            raise ValueError('La fecha debe estar en formato DD/MM/YYYY')
        return v

    @validator('ruc')
    def validate_ruc(cls, v):
        """Validar formato de RUC"""
        if v and v.strip() and not re.match(r'^\d{8,20}$', v):
            raise ValueError('El RUC debe contener solo números y tener entre 8 y 20 dígitos')
        return v

    @validator('email')
    def validate_email(cls, v):
        """Validar formato de email"""
        if v and v.strip() and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('Formato de email inválido')
        return v

class RecepcionMuestraCreate(RecepcionMuestraBase):
    """Esquema para crear una recepción de muestra"""
    muestras: List[MuestraConcretoCreate] = Field(default=[], description="Lista de muestras de concreto")

class RecepcionMuestraResponse(RecepcionMuestraBase):
    """Esquema de respuesta para recepciones de muestras"""
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None
    muestras: List[MuestraConcretoResponse] = Field(default=[], description="Lista de muestras de concreto")
    
    @validator('fecha_recepcion', 'fecha_estimada_culminacion', pre=True)
    def convert_datetime_to_string(cls, v):
        """Convertir datetime a string en formato DD/MM/YYYY"""
        if isinstance(v, datetime):
            return v.strftime('%d/%m/%Y')
        return v
    
    class Config:
        from_attributes = True

class ExcelUploadResponse(BaseModel):
    """Respuesta para carga de archivos Excel"""
    message: str
    recepcion_id: int
    muestras_procesadas: int

class ExcelExportRequest(BaseModel):
    """Solicitud para exportar datos a Excel"""
    recepcion_ids: List[int] = Field(..., description="IDs de las recepciones a exportar")
    incluir_muestras: bool = Field(True, description="Incluir muestras en la exportación")
    formato: str = Field("xlsx", description="Formato de exportación")

class RecepcionMuestraUpdate(BaseModel):
    """Esquema para actualizar una recepción de muestra"""
    numero_cotizacion: Optional[str] = None
    # codigo_trazabilidad eliminado
    # asunto eliminado
    cliente: Optional[str] = None
    domicilio_legal: Optional[str] = None
    ruc: Optional[str] = None
    persona_contacto: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    solicitante: Optional[str] = None
    domicilio_solicitante: Optional[str] = None
    proyecto: Optional[str] = None
    ubicacion: Optional[str] = None
    fecha_recepcion: Optional[str] = None
    fecha_estimada_culminacion: Optional[str] = None
    emision_fisica: Optional[bool] = None
    emision_digital: Optional[bool] = None
    entregado_por: Optional[str] = None
    recibido_por: Optional[str] = None
    observaciones: Optional[str] = None
    estado: Optional[str] = None

    @validator('fecha_recepcion', 'fecha_estimada_culminacion')
    def validate_date_format(cls, v):
        """Validar formato de fecha DD/MM/YYYY"""
        if v and not re.match(r'^\d{2}/\d{2}/\d{4}$', v):
            raise ValueError('La fecha debe estar en formato DD/MM/YYYY')
        return v

    @validator('ruc')
    def validate_ruc(cls, v):
        """Validar formato de RUC"""
        if v and not re.match(r'^\d{8,20}$', v):
            raise ValueError('El RUC debe contener solo números y tener entre 8 y 20 dígitos')
        return v

    @validator('email')
    def validate_email(cls, v):
        """Validar formato de email"""
        if v and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('Formato de email inválido')
        return v

# Esquemas para Orden de Trabajo
class ItemOrdenTrabajoBase(BaseModel):
    """Esquema base para items de orden de trabajo"""
    item_numero: int = Field(..., ge=1, description="Número de item")
    codigo_muestra: Optional[str] = Field(None, max_length=50, description="Código de la muestra")
    descripcion: str = Field(..., min_length=1, max_length=200, description="Descripción del item")
    cantidad: int = Field(..., ge=1, description="Cantidad")
    
    @validator('codigo_muestra', pre=True)
    def validate_codigo_muestra(cls, v):
        """Validar código de muestra"""
        if v is None or v == '':
            return None
        return v

class ItemOrdenTrabajoCreate(ItemOrdenTrabajoBase):
    """Esquema para crear un item de orden de trabajo"""
    pass

class ItemOrdenTrabajoResponse(ItemOrdenTrabajoBase):
    """Esquema de respuesta para items de orden de trabajo"""
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class OrdenTrabajoBase(BaseModel):
    """Esquema base para órdenes de trabajo"""
    # Campos principales
    numero_ot: str = Field(..., min_length=1, max_length=50, description="Número de orden de trabajo")
    numero_recepcion: str = Field(..., min_length=1, max_length=50, description="Número de recepción")
    
    # Fechas importantes
    fecha_recepcion: Optional[str] = Field(None, description="Fecha de recepción (DD/MM/YYYY)")
    plazo_entrega_dias: Optional[int] = Field(None, ge=0, description="Plazo de entrega en días")
    
    # Fechas programadas y reales
    fecha_inicio_programado: Optional[str] = Field(None, description="Fecha de inicio programada (DD/MM/YYYY)")
    fecha_fin_programado: Optional[str] = Field(None, description="Fecha de fin programada (DD/MM/YYYY)")
    fecha_inicio_real: Optional[str] = Field(None, description="Fecha de inicio real (DD/MM/YYYY)")
    fecha_fin_real: Optional[str] = Field(None, description="Fecha de fin real (DD/MM/YYYY)")
    
    # Cálculos de variación
    variacion_inicio: Optional[int] = Field(None, description="Variación de inicio en días")
    variacion_fin: Optional[int] = Field(None, description="Variación de fin en días")
    duracion_real_dias: Optional[int] = Field(None, ge=0, description="Duración real en días")
    
    # Información adicional
    observaciones: Optional[str] = Field(None, description="Observaciones generales")
    aperturada_por: Optional[str] = Field(None, max_length=100, description="Persona que aperturó la OT")
    designada_a: Optional[str] = Field(None, max_length=100, description="Persona designada para el trabajo")
    estado: str = Field("PENDIENTE", max_length=20, description="Estado de la OT")
    
    # Metadatos del laboratorio
    codigo_laboratorio: str = Field("F-LEM-P-01.02", max_length=20, description="Código del laboratorio")
    version: str = Field("07", max_length=10, description="Versión del documento")

    @validator('fecha_recepcion', 'fecha_inicio_programado', 'fecha_fin_programado', 'fecha_inicio_real', 'fecha_fin_real')
    def validate_date_format(cls, v):
        """Validar formato de fecha DD/MM/YYYY"""
        if v and v.strip() and not re.match(r'^\d{2}/\d{2}/\d{4}$', v):
            raise ValueError('La fecha debe estar en formato DD/MM/YYYY')
        return v

class OrdenTrabajoCreate(OrdenTrabajoBase):
    """Esquema para crear una orden de trabajo"""
    items: List[ItemOrdenTrabajoCreate] = Field(..., min_items=1, description="Lista de items de la orden de trabajo")

class OrdenTrabajoResponse(OrdenTrabajoBase):
    """Esquema de respuesta para órdenes de trabajo"""
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None
    items: List[ItemOrdenTrabajoResponse] = Field(default=[], description="Lista de items de la orden de trabajo")
    
    @validator('fecha_recepcion', 'fecha_inicio_programado', 'fecha_fin_programado', 'fecha_inicio_real', 'fecha_fin_real', pre=True)
    def convert_datetime_to_string(cls, v):
        """Convertir datetime a string en formato DD/MM/YYYY"""
        if isinstance(v, datetime):
            return v.strftime('%d/%m/%Y')
        return v
    
    class Config:
        from_attributes = True

class OrdenTrabajoUpdate(BaseModel):
    """Esquema para actualizar una orden de trabajo"""
    fecha_recepcion: Optional[str] = None
    plazo_entrega_dias: Optional[int] = None
    fecha_inicio_programado: Optional[str] = None
    fecha_fin_programado: Optional[str] = None
    fecha_inicio_real: Optional[str] = None
    fecha_fin_real: Optional[str] = None
    variacion_inicio: Optional[int] = None
    variacion_fin: Optional[int] = None
    duracion_real_dias: Optional[int] = None
    observaciones: Optional[str] = None
    aperturada_por: Optional[str] = None
    designada_a: Optional[str] = None
    estado: Optional[str] = None

    @validator('fecha_recepcion', 'fecha_inicio_programado', 'fecha_fin_programado', 'fecha_inicio_real', 'fecha_fin_real')
    def validate_date_format(cls, v):
        """Validar formato de fecha DD/MM/YYYY"""
        if v and not re.match(r'^\d{2}/\d{2}/\d{4}$', v):
            raise ValueError('La fecha debe estar en formato DD/MM/YYYY')
        return v


# ===== SCHEMAS PARA CONTROL DE CONCRETO =====

class ProbetaConcretoBase(BaseModel):
    """Esquema base para probetas de concreto"""
    item_numero: int = Field(..., ge=1, description="Número de item")
    orden_trabajo: Optional[str] = Field("", max_length=50, description="Código de orden de trabajo")
    codigo_muestra: str = Field(..., min_length=1, max_length=50, description="Código de la muestra")
    codigo_muestra_cliente: Optional[str] = Field("", max_length=50, description="Código de muestra del cliente")
    fecha_rotura: Optional[str] = Field("", description="Fecha de rotura (DD/MM/YYYY)")
    elemento: Optional[str] = Field("", max_length=20, description="Tipo de elemento (4in x 8in, 6in x 12in, cubos, viga)")
    fc_kg_cm2: Optional[float] = Field(None, gt=0, description="Resistencia característica en kg/cm²")
    status_ensayado: str = Field("PENDIENTE", max_length=50, description="Status del ensayo")

    @validator('fecha_rotura')
    def validate_fecha_rotura(cls, v):
        """Validar formato de fecha DD/MM/YYYY"""
        if v and v.strip() and not re.match(r'^\d{2}/\d{2}/\d{4}$', v):
            raise ValueError('La fecha debe estar en formato DD/MM/YYYY')
        return v

    @validator('elemento')
    def validate_elemento(cls, v):
        """Validar tipo de elemento"""
        if v and v.strip():
            elementos_validos = ['4in x 8in', '6in x 12in', 'cubos', 'viga']
            if v not in elementos_validos:
                raise ValueError(f'Elemento debe ser uno de: {", ".join(elementos_validos)}')
        return v

    @validator('status_ensayado')
    def validate_status(cls, v):
        """Validar status del ensayo"""
        status_validos = ['PENDIENTE', 'ROTURADO', 'EN PROCESO', 'CANCELADO']
        if v.upper() not in status_validos:
            raise ValueError(f'Status debe ser uno de: {", ".join(status_validos)}')
        return v.upper()

class ProbetaConcretoCreate(ProbetaConcretoBase):
    """Esquema para crear una probeta de concreto"""
    pass

class ProbetaConcretoResponse(ProbetaConcretoBase):
    """Esquema de respuesta para probetas de concreto"""
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ControlConcretoBase(BaseModel):
    """Esquema base para control de concreto"""
    numero_control: str = Field(..., min_length=1, max_length=50, description="Número de control")
    codigo_documento: str = Field("F-LEM-P-01.09", max_length=50, description="Código del documento")
    version: str = Field("04", max_length=10, description="Versión del documento")
    fecha_documento: str = Field(..., description="Fecha del documento (DD/MM/YYYY)")
    pagina: str = Field("1 de 1", max_length=20, description="Página del documento")
    probetas: List[ProbetaConcretoBase] = Field(..., min_items=1, description="Lista de probetas")

    @validator('fecha_documento')
    def validate_fecha_documento(cls, v):
        """Validar formato de fecha DD/MM/YYYY"""
        if not re.match(r'^\d{2}/\d{2}/\d{4}$', v):
            raise ValueError('La fecha debe estar en formato DD/MM/YYYY')
        return v

class ControlConcretoCreate(ControlConcretoBase):
    """Esquema para crear un control de concreto"""
    pass

class ControlConcretoResponse(ControlConcretoBase):
    """Esquema de respuesta para control de concreto"""
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None
    archivo_excel: Optional[str] = Field(None, description="Ruta del archivo Excel generado")
    
    class Config:
        from_attributes = True

class BusquedaClienteRequest(BaseModel):
    """Esquema para búsqueda de datos del cliente"""
    numero_recepcion: str = Field(..., min_length=1, description="Número de recepción para búsqueda")

class BusquedaClienteResponse(BaseModel):
    """Esquema de respuesta para búsqueda de datos del cliente"""
    encontrado: bool = Field(..., description="Si se encontraron datos del cliente")
    datos_cliente: Optional[Dict[str, Any]] = Field(None, description="Datos del cliente encontrados")
    probetas: List[ProbetaConcretoBase] = Field(default=[], description="Probetas de la recepción encontrada")
    mensaje: str = Field(..., description="Mensaje descriptivo del resultado")


# ===== SCHEMAS PARA VERIFICACIÓN DE MUESTRAS CILÍNDRICAS =====

class MuestraVerificadaBase(BaseModel):
    """Esquema base para muestras verificadas - Formato V03"""
    item_numero: int = Field(..., ge=1, description="Número de item")
    codigo_lem: Optional[str] = Field(None, max_length=50, description="Código LEM de la muestra")
    
    # TIPO DE TESTIGO (MANUAL)
    tipo_testigo: Optional[str] = Field("", max_length=50, description="Tipo de testigo (4in x 8in, 6in x 12in, Diamantina)")
    
    # DIÁMETRO (FORMULA)
    diametro_1_mm: Optional[float] = Field(None, gt=0, description="Diámetro 1 en mm")
    diametro_2_mm: Optional[float] = Field(None, gt=0, description="Diámetro 2 en mm")
    tolerancia_porcentaje: Optional[float] = Field(None, description="ΔΦ 2%> - Tolerancia calculada en %")
    aceptacion_diametro: Optional[str] = Field(None, max_length=20, description="Aceptación diámetro (Cumple/No cumple)")
    
    # PERPENDICULARIDAD (4inx8in < 2mm) o (6inx12in < 3mm)
    perpendicularidad_sup1: Optional[bool] = Field(None, description="SUP 1 Aceptacion (V/X)")
    perpendicularidad_sup2: Optional[bool] = Field(None, description="SUP 2 Aceptacion (V/X)")
    perpendicularidad_inf1: Optional[bool] = Field(None, description="INF 1 Aceptacion (V/X)")
    perpendicularidad_inf2: Optional[bool] = Field(None, description="INF 2 Aceptacion (V/X)")
    perpendicularidad_medida: Optional[bool] = Field(None, description="MEDIDA < 0.5* (V/X)")
    
    # PLANITUD
    planitud_medida: Optional[bool] = Field(None, description="MEDIDA < 0.5* (V/X)")
    planitud_superior_aceptacion: Optional[str] = Field(None, max_length=20, description="C. SUPERIOR < 0.05 mm Aceptacion (Cumple/No cumple)")
    planitud_inferior_aceptacion: Optional[str] = Field(None, max_length=20, description="C. INFERIOR < 0.05 mm Aceptacion (Cumple/No cumple)")
    planitud_depresiones_aceptacion: Optional[str] = Field(None, max_length=20, description="Depresiones ≤ 5 mm Aceptacion (Cumple/No cumple)")
    
    # ACCIÓN A REALIZAR (PATRON - CALCULADO AUTOMÁTICAMENTE)
    accion_realizar: Optional[str] = Field(None, max_length=200, description="Acción a realizar calculada por patrón")
    
    # CONFORMIDAD
    # IMPORTANTE: La conformidad es independiente y NO valida longitudes ni masa.
    # Valida aspectos geométricos: Perpendicularidad, Planitud, Depresiones.
    conformidad: Optional[str] = Field(None, max_length=50, description="Conformidad (Ensayar, etc.) - Independiente de longitudes y masa")
    
    # LONGITUD (L/D ≤1.75)
    longitud_1_mm: Optional[float] = Field(None, gt=0, description="Longitud 1 en mm")
    longitud_2_mm: Optional[float] = Field(None, gt=0, description="Longitud 2 en mm")
    longitud_3_mm: Optional[float] = Field(None, gt=0, description="Longitud 3 en mm")
    
    # MASA
    masa_muestra_aire_g: Optional[float] = Field(None, gt=0, description="Masa muestra aire en gramos")
    pesar: Optional[str] = Field(None, max_length=20, description="Pesar / No pesar")
    
    # Campos legacy para compatibilidad
    codigo_cliente: Optional[str] = Field(None, max_length=50, description="[DEPRECATED] Usar codigo_lem")
    perpendicularidad_p1: Optional[bool] = Field(None, description="[DEPRECATED] Usar perpendicularidad_sup1")
    perpendicularidad_p2: Optional[bool] = Field(None, description="[DEPRECATED] Usar perpendicularidad_sup2")
    perpendicularidad_p3: Optional[bool] = Field(None, description="[DEPRECATED] Usar perpendicularidad_inf1")
    perpendicularidad_p4: Optional[bool] = Field(None, description="[DEPRECATED] Usar perpendicularidad_inf2")
    perpendicularidad_cumple: Optional[bool] = Field(None, description="[DEPRECATED] Usar perpendicularidad_medida")
    planitud_superior: Optional[bool] = Field(None, description="[DEPRECATED] Usar planitud_superior_aceptacion")
    planitud_inferior: Optional[bool] = Field(None, description="[DEPRECATED] Usar planitud_inferior_aceptacion")
    planitud_depresiones: Optional[bool] = Field(None, description="[DEPRECATED] Usar planitud_depresiones_aceptacion")
    cumple_tolerancia: Optional[bool] = Field(None, description="[DEPRECATED] Usar aceptacion_diametro")
    conformidad_correccion: Optional[bool] = Field(None, description="[DEPRECATED] Usar conformidad")


class MuestraVerificadaCreate(MuestraVerificadaBase):
    """Esquema para crear una muestra verificada"""
    pass

class MuestraVerificadaResponse(MuestraVerificadaBase):
    """Esquema de respuesta para muestras verificadas"""
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None
    
    @validator('codigo_lem', pre=True, always=True)
    def ensure_codigo_lem_string(cls, v):
        """Asegurar que codigo_lem siempre sea una cadena"""
        return v if v is not None else ''
    
    class Config:
        from_attributes = True

class VerificacionMuestrasBase(BaseModel):
    """Esquema base para verificación de muestras"""
    numero_verificacion: str = Field(..., min_length=1, max_length=50, description="Número de verificación")
    codigo_documento: str = Field("F-LEM-P-01.12", max_length=50, description="Código del documento")
    version: str = Field("03", max_length=10, description="Versión del documento")
    fecha_documento: str = Field(..., description="Fecha del documento (DD/MM/YYYY)")
    pagina: str = Field("1 de 1", max_length=20, description="Página del documento")
    
    # Información del verificador
    verificado_por: Optional[str] = Field(None, max_length=50, description="Código del verificador")
    fecha_verificacion: Optional[str] = Field(None, description="Fecha de verificación (DD/MM/YYYY)")
    
    # Información del cliente
    cliente: Optional[str] = Field(None, max_length=200, description="Nombre del cliente")
    
    # Equipos utilizados (fila 18 en Excel)
    equipo_bernier: Optional[str] = Field(None, max_length=50, description="Código equipo Bernier")
    equipo_lainas_1: Optional[str] = Field(None, max_length=50, description="Código equipo Lainas 1")
    equipo_lainas_2: Optional[str] = Field(None, max_length=50, description="Código equipo Lainas 2")
    equipo_escuadra: Optional[str] = Field(None, max_length=50, description="Código equipo Escuadra")
    equipo_balanza: Optional[str] = Field(None, max_length=50, description="Código equipo Balanza")
    
    # Nota (fila 19 en Excel)
    nota: Optional[str] = Field(None, max_length=500, description="Nota adicional")
    
    # Lista de muestras verificadas
    muestras_verificadas: List[MuestraVerificadaBase] = Field(..., min_items=1, description="Lista de muestras verificadas")

    @validator('fecha_documento', 'fecha_verificacion')
    def validate_date_format(cls, v):
        """Validar formato de fecha DD/MM/YYYY"""
        if v and v.strip() and not re.match(r'^\d{2}/\d{2}/\d{4}$', v):
            raise ValueError('La fecha debe estar en formato DD/MM/YYYY')
        return v

class VerificacionMuestrasCreate(VerificacionMuestrasBase):
    """Esquema para crear una verificación de muestras"""
    pass

class VerificacionMuestrasResponse(VerificacionMuestrasBase):
    """Esquema de respuesta para verificación de muestras"""
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None
    archivo_excel: Optional[str] = Field(None, description="Ruta del archivo Excel generado")
    muestras_verificadas: List[MuestraVerificadaResponse] = Field(default=[], description="Lista de muestras verificadas")
    
    class Config:
        from_attributes = True

class VerificacionMuestrasUpdate(BaseModel):
    """Esquema para actualizar una verificación de muestras"""
    verificado_por: Optional[str] = None
    fecha_verificacion: Optional[str] = None
    cliente: Optional[str] = None
    estado: Optional[str] = None
    muestras_verificadas: Optional[List[Dict[str, Any]]] = None  # Permitir actualizar muestras

    @validator('fecha_verificacion')
    def validate_date_format(cls, v):
        """Validar formato de fecha DD/MM/YYYY"""
        if v and v.strip() and not re.match(r'^\d{2}/\d{2}/\d{4}$', v):
            raise ValueError('La fecha debe estar en formato DD/MM/YYYY')
        return v

class CalculoFormulaRequest(BaseModel):
    """Esquema para solicitar cálculo de fórmula de diámetros"""
    diametro_1_mm: float = Field(..., gt=0, description="Diámetro 1 en mm")
    diametro_2_mm: float = Field(..., gt=0, description="Diámetro 2 en mm")
    tipo_testigo: str = Field(..., description="Tipo de testigo (30x15 o 20x10)")

class CalculoFormulaResponse(BaseModel):
    """Esquema de respuesta para cálculo de fórmula de diámetros"""
    tolerancia_porcentaje: float = Field(..., description="Tolerancia calculada en %")
    cumple_tolerancia: bool = Field(..., description="Cumple tolerancia (V/X)")
    mensaje: str = Field(..., description="Mensaje descriptivo del resultado")

class CalculoPatronRequest(BaseModel):
    """Esquema para solicitar cálculo de patrón de acción"""
    planitud_superior: bool = Field(..., description="Planitud superior <0.05mm (V/X)")
    planitud_inferior: bool = Field(..., description="Planitud inferior <0.05mm (V/X)")
    planitud_depresiones: bool = Field(..., description="Depresiones ≤5mm (V/X)")

class CalculoPatronResponse(BaseModel):
    """Esquema de respuesta para cálculo de patrón de acción"""
    accion_realizar: str = Field(..., description="Acción a realizar calculada por patrón")
    mensaje: str = Field(..., description="Mensaje descriptivo del resultado")

"""
Esquemas Pydantic para validación de datos del sistema de recepción de muestras
"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional
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

    @validator('hora_moldeo')
    def validate_time_format(cls, v):
        """Validar formato de hora HH:MM"""
        if v and v.strip() and not re.match(r'^\d{2}:\d{2}$', v):
            raise ValueError('La hora debe estar en formato HH:MM')
        return v

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

"""
Modelos de base de datos SQLAlchemy para el sistema de recepción de muestras
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class RecepcionMuestra(Base):
    """
    Modelo principal para recepciones de muestras cilíndricas de concreto
    """
    __tablename__ = "recepcion"
    
    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    numero_ot = Column(String(50), unique=True, index=True, nullable=False, comment="Número de orden de trabajo")
    numero_recepcion = Column(String(50), index=True, nullable=False, comment="Número de recepción")
    numero_cotizacion = Column(String(50), nullable=True, comment="Número de cotización")
    # codigo_trazabilidad eliminado
    
    # Información del proyecto
    # asunto eliminado
    cliente = Column(String(200), nullable=False, comment="Nombre del cliente")
    domicilio_legal = Column(String(300), nullable=False, comment="Domicilio legal del cliente")
    ruc = Column(String(20), nullable=False, comment="RUC del cliente")
    persona_contacto = Column(String(100), nullable=False, comment="Persona de contacto")
    email = Column(String(100), nullable=False, comment="Email de contacto")
    telefono = Column(String(20), nullable=False, comment="Teléfono de contacto")
    
    # Información del solicitante
    solicitante = Column(String(200), nullable=False, comment="Nombre del solicitante")
    domicilio_solicitante = Column(String(300), nullable=False, comment="Domicilio del solicitante")
    proyecto = Column(String(200), nullable=False, comment="Nombre del proyecto")
    ubicacion = Column(String(200), nullable=False, comment="Ubicación del proyecto")
    
    # Fechas importantes
    fecha_recepcion = Column(DateTime, nullable=True, comment="Fecha de recepción")
    fecha_estimada_culminacion = Column(DateTime, nullable=True, comment="Fecha estimada de culminación")
    
    # Configuración de emisión
    emision_fisica = Column(Boolean, nullable=False, default=False, comment="Emisión física")
    emision_digital = Column(Boolean, nullable=False, default=False, comment="Emisión digital")
    
    # Responsables
    entregado_por = Column(String(100), nullable=True, comment="Persona que entregó")
    recibido_por = Column(String(100), nullable=True, comment="Persona que recibió")
    
    # Metadatos del laboratorio
    codigo_laboratorio = Column(String(20), nullable=False, default="F-LEM-P-01.02", comment="Código del laboratorio")
    version = Column(String(10), nullable=False, default="07", comment="Versión del documento")
    
    # Timestamps
    fecha_creacion = Column(DateTime, nullable=False, default=func.now(), comment="Fecha de creación")
    fecha_actualizacion = Column(DateTime, nullable=True, onupdate=func.now(), comment="Fecha de última actualización")
    
    # Campos de seguimiento
    fecha_inicio_programado = Column(DateTime, nullable=True, comment="Fecha de inicio programada")
    fecha_inicio_real = Column(DateTime, nullable=True, comment="Fecha de inicio real")
    fecha_fin_programado = Column(DateTime, nullable=True, comment="Fecha de fin programada")
    fecha_fin_real = Column(DateTime, nullable=True, comment="Fecha de fin real")
    plazo_entrega_dias = Column(Integer, nullable=True, comment="Plazo de entrega en días")
    duracion_real_dias = Column(Integer, nullable=True, comment="Duración real en días")
    
    # Información adicional
    observaciones = Column(Text, nullable=True, comment="Observaciones generales")
    aperturada_por = Column(String(100), nullable=True, comment="Persona que aperturó la recepción")
    designada_a = Column(String(100), nullable=True, comment="Persona designada para el trabajo")
    estado = Column(String(20), nullable=False, default="PENDIENTE", comment="Estado de la recepción")
    
    # Relación con muestras
    muestras = relationship("MuestraConcreto", back_populates="recepcion", cascade="all, delete-orphan")

class MuestraConcreto(Base):
    """
    Modelo para muestras cilíndricas de concreto
    """
    __tablename__ = "muestras_concreto"
    
    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    recepcion_id = Column(Integer, ForeignKey("recepcion.id"), nullable=False, comment="ID de la recepción")
    item_numero = Column(Integer, nullable=False, comment="Número de item")
    codigo_muestra = Column(String(50), nullable=True, comment="Código de la muestra")
    codigo_muestra_lem = Column(String(50), nullable=True, comment="Código muestra LEM (zona sombreada)")
    identificacion_muestra = Column(String(50), nullable=False, comment="Identificación de la muestra")
    
    # Características de la muestra
    estructura = Column(String(100), nullable=False, comment="Tipo de estructura")
    fc_kg_cm2 = Column(Float, nullable=False, comment="Resistencia característica (kg/cm²)")
    
    # Fechas de moldeo
    fecha_moldeo = Column(String(20), nullable=False, comment="Fecha de moldeo")
    hora_moldeo = Column(String(10), nullable=True, comment="Hora de moldeo")
    
    # Parámetros de ensayo
    edad = Column(Integer, nullable=False, comment="Edad de la muestra en días")
    fecha_rotura = Column(String(20), nullable=False, comment="Fecha programada de rotura")
    requiere_densidad = Column(Boolean, nullable=False, default=False, comment="Requiere ensayo de densidad")
    
    # Timestamps
    fecha_creacion = Column(DateTime, nullable=False, default=func.now(), comment="Fecha de creación")
    fecha_actualizacion = Column(DateTime, nullable=True, onupdate=func.now(), comment="Fecha de última actualización")
    
    # Relación con recepción
    recepcion = relationship("RecepcionMuestra", back_populates="muestras")

class OrdenTrabajo(Base):
    """
    Modelo principal para órdenes de trabajo
    """
    __tablename__ = "orden_trabajo"
    
    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    numero_ot = Column(String(50), unique=True, index=True, nullable=False, comment="Número de orden de trabajo")
    numero_recepcion = Column(String(50), index=True, nullable=False, comment="Número de recepción")
    
    # Fechas importantes
    fecha_recepcion = Column(DateTime, nullable=True, comment="Fecha de recepción")
    plazo_entrega_dias = Column(Integer, nullable=True, comment="Plazo de entrega en días")
    
    # Fechas programadas y reales
    fecha_inicio_programado = Column(DateTime, nullable=True, comment="Fecha de inicio programada")
    fecha_fin_programado = Column(DateTime, nullable=True, comment="Fecha de fin programada")
    fecha_inicio_real = Column(DateTime, nullable=True, comment="Fecha de inicio real")
    fecha_fin_real = Column(DateTime, nullable=True, comment="Fecha de fin real")
    
    # Cálculos de variación
    variacion_inicio = Column(Integer, nullable=True, comment="Variación de inicio en días")
    variacion_fin = Column(Integer, nullable=True, comment="Variación de fin en días")
    duracion_real_dias = Column(Integer, nullable=True, comment="Duración real en días")
    
    # Información adicional
    observaciones = Column(Text, nullable=True, comment="Observaciones generales")
    aperturada_por = Column(String(100), nullable=True, comment="Persona que aperturó la OT")
    designada_a = Column(String(100), nullable=True, comment="Persona designada para el trabajo")
    estado = Column(String(20), nullable=False, default="PENDIENTE", comment="Estado de la OT")
    
    # Metadatos del laboratorio
    codigo_laboratorio = Column(String(20), nullable=False, default="F-LEM-P-01.02", comment="Código del laboratorio")
    version = Column(String(10), nullable=False, default="07", comment="Versión del documento")
    
    # Timestamps
    fecha_creacion = Column(DateTime, nullable=False, default=func.now(), comment="Fecha de creación")
    fecha_actualizacion = Column(DateTime, nullable=True, onupdate=func.now(), comment="Fecha de última actualización")
    
    # Relación con items
    items = relationship("ItemOrdenTrabajo", back_populates="orden_trabajo", cascade="all, delete-orphan")

class ItemOrdenTrabajo(Base):
    """
    Modelo para items de orden de trabajo
    """
    __tablename__ = "items_orden_trabajo"
    
    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    orden_trabajo_id = Column(Integer, ForeignKey("orden_trabajo.id"), nullable=False, comment="ID de la orden de trabajo")
    item_numero = Column(Integer, nullable=False, comment="Número de item")
    codigo_muestra = Column(String(50), nullable=True, comment="Código de la muestra")
    descripcion = Column(String(200), nullable=False, comment="Descripción del item")
    cantidad = Column(Integer, nullable=False, comment="Cantidad")
    
    # Timestamps
    fecha_creacion = Column(DateTime, nullable=False, default=func.now(), comment="Fecha de creación")
    fecha_actualizacion = Column(DateTime, nullable=True, onupdate=func.now(), comment="Fecha de última actualización")
    
    # Relación con orden de trabajo
    orden_trabajo = relationship("OrdenTrabajo", back_populates="items")


# ===== MODELOS PARA CONTROL DE CONCRETO =====

class ControlConcreto(Base):
    """
    Modelo principal para control de probetas de concreto
    """
    __tablename__ = "control_concreto"
    
    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    numero_control = Column(String(50), unique=True, index=True, nullable=False, comment="Número de control")
    codigo_documento = Column(String(50), nullable=False, default="F-LEM-P-01.09", comment="Código del documento")
    version = Column(String(10), nullable=False, default="04", comment="Versión del documento")
    fecha_documento = Column(String(20), nullable=False, comment="Fecha del documento")
    pagina = Column(String(20), nullable=False, default="1 de 1", comment="Página del documento")
    
    # Metadatos
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), comment="Fecha de creación")
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now(), comment="Fecha de actualización")
    archivo_excel = Column(String(500), nullable=True, comment="Ruta del archivo Excel generado")
    
    # Relación con probetas
    probetas = relationship("ProbetaConcreto", back_populates="control", cascade="all, delete-orphan")


class ProbetaConcreto(Base):
    """
    Modelo para probetas individuales de concreto
    """
    __tablename__ = "probetas_concreto"
    
    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    item_numero = Column(Integer, nullable=False, comment="Número de item")
    orden_trabajo = Column(String(50), nullable=True, comment="Código de orden de trabajo")
    codigo_muestra = Column(String(50), nullable=False, comment="Código de la muestra")
    codigo_muestra_cliente = Column(String(50), nullable=True, comment="Código de muestra del cliente")
    fecha_rotura = Column(String(20), nullable=True, comment="Fecha de rotura")
    elemento = Column(String(20), nullable=True, comment="Tipo de elemento")
    fc_kg_cm2 = Column(Float, nullable=True, comment="Resistencia característica en kg/cm²")
    status_ensayado = Column(String(50), nullable=False, default="PENDIENTE", comment="Status del ensayo")
    
    # Metadatos
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), comment="Fecha de creación")
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now(), comment="Fecha de actualización")
    
    # Relación con control
    control_id = Column(Integer, ForeignKey("control_concreto.id"), nullable=False, comment="ID del control")
    control = relationship("ControlConcreto", back_populates="probetas")
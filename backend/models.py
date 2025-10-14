"""
Modelos de base de datos SQLAlchemy
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class OrdenTrabajo(Base):
    __tablename__ = "ordenes_trabajo"
    
    id = Column(Integer, primary_key=True, index=True)
    numero_ot = Column(String(50), unique=True, index=True, nullable=False)
    numero_recepcion = Column(String(50), index=True, nullable=False)
    referencia = Column(String(100), nullable=True)
    codigo_laboratorio = Column(String(20), nullable=False, default="F-LEM-P-02.01")
    version = Column(String(10), nullable=False, default="03")
    fecha_creacion = Column(DateTime, nullable=False, default=func.now())
    fecha_recepcion = Column(DateTime, nullable=True)
    fecha_inicio_programado = Column(DateTime, nullable=True)
    fecha_inicio_real = Column(DateTime, nullable=True)
    fecha_fin_programado = Column(DateTime, nullable=True)
    fecha_fin_real = Column(DateTime, nullable=True)
    plazo_entrega_dias = Column(Integer, nullable=True)
    duracion_real_dias = Column(Integer, nullable=True)
    observaciones = Column(Text, nullable=True)
    aperturada_por = Column(String(100), nullable=True)
    designada_a = Column(String(100), nullable=True)
    estado = Column(String(20), nullable=False, default="PENDIENTE")
    
    # Relación con items
    items = relationship("ItemOrden", back_populates="orden", cascade="all, delete-orphan")

class ItemOrden(Base):
    __tablename__ = "items_orden"
    
    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes_trabajo.id"), nullable=False)
    item_numero = Column(Integer, nullable=False)
    codigo_muestra = Column(String(50), nullable=False)
    descripcion = Column(String(200), nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    especificacion = Column(String(100), nullable=True)
    
    # Relación con orden
    orden = relationship("OrdenTrabajo", back_populates="items")

"""
Esquemas Pydantic para validación de datos
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ItemOrdenBase(BaseModel):
    item_numero: int
    codigo_muestra: str
    descripcion: str
    cantidad: int = 1
    especificacion: Optional[str] = None

class ItemOrdenCreate(ItemOrdenBase):
    pass

class ItemOrdenResponse(ItemOrdenBase):
    id: int
    
    class Config:
        from_attributes = True

class OrdenTrabajoBase(BaseModel):
    numero_ot: str
    numero_recepcion: str
    referencia: Optional[str] = None
    codigo_laboratorio: str = "F-LEM-P-02.01"
    version: str = "03"
    fecha_recepcion: Optional[datetime] = None
    fecha_inicio_programado: Optional[datetime] = None
    fecha_inicio_real: Optional[datetime] = None
    fecha_fin_programado: Optional[datetime] = None
    fecha_fin_real: Optional[datetime] = None
    plazo_entrega_dias: Optional[int] = None
    duracion_real_dias: Optional[int] = None
    observaciones: Optional[str] = None
    aperturada_por: Optional[str] = None
    designada_a: Optional[str] = None
    estado: str = "PENDIENTE"

class OrdenTrabajoCreate(OrdenTrabajoBase):
    items: List[ItemOrdenCreate] = []

class OrdenTrabajoResponse(OrdenTrabajoBase):
    id: int
    fecha_creacion: datetime
    items: List[ItemOrdenResponse] = []
    
    class Config:
        from_attributes = True

class ExcelUploadResponse(BaseModel):
    message: str
    orden_id: int
    items_procesados: int

class ExcelExportRequest(BaseModel):
    orden_ids: List[int]
    incluir_items: bool = True
    formato: str = "xlsx"

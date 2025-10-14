"""
Servicio para gestión de órdenes de trabajo
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from models import OrdenTrabajo, ItemOrden
from schemas import OrdenTrabajoCreate, OrdenTrabajoResponse

class OrdenService:
    def crear_orden(self, db: Session, orden_data: OrdenTrabajoCreate) -> OrdenTrabajo:
        """Crear nueva orden de trabajo"""
        # Verificar si ya existe una orden con el mismo número OT
        orden_existente = db.query(OrdenTrabajo).filter(
            OrdenTrabajo.numero_ot == orden_data.numero_ot
        ).first()
        
        if orden_existente:
            raise ValueError(f"Ya existe una orden con el número OT: {orden_data.numero_ot}")
        
        # Crear orden
        orden = OrdenTrabajo(**orden_data.dict(exclude={'items'}))
        db.add(orden)
        db.flush()  # Para obtener el ID
        
        # Crear items
        for item_data in orden_data.items:
            item = ItemOrden(orden_id=orden.id, **item_data.dict())
            db.add(item)
        
        db.commit()
        db.refresh(orden)
        
        return orden
    
    def listar_ordenes(self, db: Session, skip: int = 0, limit: int = 100) -> List[OrdenTrabajo]:
        """Listar órdenes de trabajo con paginación"""
        return db.query(OrdenTrabajo).order_by(desc(OrdenTrabajo.fecha_creacion)).offset(skip).limit(limit).all()
    
    def obtener_orden(self, db: Session, orden_id: int) -> Optional[OrdenTrabajo]:
        """Obtener orden por ID"""
        return db.query(OrdenTrabajo).filter(OrdenTrabajo.id == orden_id).first()
    
    def actualizar_orden(self, db: Session, orden_id: int, orden_data: dict) -> Optional[OrdenTrabajo]:
        """Actualizar orden existente"""
        orden = db.query(OrdenTrabajo).filter(OrdenTrabajo.id == orden_id).first()
        
        if not orden:
            return None
        
        # Actualizar campos
        for campo, valor in orden_data.items():
            if hasattr(orden, campo):
                setattr(orden, campo, valor)
        
        db.commit()
        db.refresh(orden)
        
        return orden
    
    def eliminar_orden(self, db: Session, orden_id: int) -> bool:
        """Eliminar orden"""
        orden = db.query(OrdenTrabajo).filter(OrdenTrabajo.id == orden_id).first()
        
        if not orden:
            return False
        
        db.delete(orden)
        db.commit()
        
        return True
    
    def buscar_ordenes(self, db: Session, termino: str) -> List[OrdenTrabajo]:
        """Buscar órdenes por término"""
        return db.query(OrdenTrabajo).filter(
            OrdenTrabajo.numero_ot.contains(termino) |
            OrdenTrabajo.numero_recepcion.contains(termino) |
            OrdenTrabajo.referencia.contains(termino)
        ).all()

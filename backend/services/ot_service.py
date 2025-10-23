"""
Servicio para gestión de órdenes de trabajo
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from models import OrdenTrabajo, ItemOrdenTrabajo
from schemas import OrdenTrabajoCreate, OrdenTrabajoUpdate
from services.ot_excel_service import OTExcelService
from datetime import datetime
import re

class OTService:
    def __init__(self):
        self.ot_excel_service = OTExcelService()
    
    def _parse_date(self, date_str: str) -> datetime:
        """Convertir string de fecha DD/MM/YYYY a datetime"""
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str, '%d/%m/%Y')
        except ValueError:
            raise ValueError(f"Formato de fecha inválido: {date_str}. Use DD/MM/YYYY")
    
    def _format_date(self, date_obj: datetime) -> str:
        """Convertir datetime a string DD/MM/YYYY"""
        if not date_obj:
            return ''
        return date_obj.strftime('%d/%m/%Y')
    
    def crear_orden_trabajo(self, db: Session, ot_data: OrdenTrabajoCreate) -> OrdenTrabajo:
        """Crear nueva orden de trabajo"""
        try:
            # Verificar si ya existe una OT con el mismo número
            ot_existente = db.query(OrdenTrabajo).filter(
                OrdenTrabajo.numero_ot == ot_data.numero_ot
            ).first()
            
            if ot_existente:
                raise ValueError(f"Ya existe una orden de trabajo con el número: {ot_data.numero_ot}")
            
            # Validar que haya al menos un item
            if not ot_data.items:
                raise ValueError("Debe incluir al menos un item")
            
            # Convertir fechas de string a datetime
            fecha_recepcion = self._parse_date(ot_data.fecha_recepcion) if ot_data.fecha_recepcion else None
            fecha_inicio_programado = self._parse_date(ot_data.fecha_inicio_programado) if ot_data.fecha_inicio_programado else None
            fecha_fin_programado = self._parse_date(ot_data.fecha_fin_programado) if ot_data.fecha_fin_programado else None
            fecha_inicio_real = self._parse_date(ot_data.fecha_inicio_real) if ot_data.fecha_inicio_real else None
            fecha_fin_real = self._parse_date(ot_data.fecha_fin_real) if ot_data.fecha_fin_real else None
            
            # Crear la orden de trabajo
            db_ot = OrdenTrabajo(
                numero_ot=ot_data.numero_ot,
                numero_recepcion=ot_data.numero_recepcion,
                fecha_recepcion=fecha_recepcion,
                plazo_entrega_dias=ot_data.plazo_entrega_dias,
                fecha_inicio_programado=fecha_inicio_programado,
                fecha_fin_programado=fecha_fin_programado,
                fecha_inicio_real=fecha_inicio_real,
                fecha_fin_real=fecha_fin_real,
                variacion_inicio=ot_data.variacion_inicio,
                variacion_fin=ot_data.variacion_fin,
                duracion_real_dias=ot_data.duracion_real_dias,
                observaciones=ot_data.observaciones,
                aperturada_por=ot_data.aperturada_por,
                designada_a=ot_data.designada_a,
                estado=ot_data.estado,
                codigo_laboratorio=ot_data.codigo_laboratorio,
                version=ot_data.version
            )
            
            db.add(db_ot)
            db.flush()  # Para obtener el ID
            
            # Crear los items
            for i, item_data in enumerate(ot_data.items, 1):
                # Validación más flexible: solo verificar que item_numero sea un número positivo
                if not isinstance(item_data.item_numero, int) or item_data.item_numero <= 0:
                    raise ValueError(f"El item número debe ser un entero positivo. Recibido: {item_data.item_numero}")
                
                db_item = ItemOrdenTrabajo(
                    orden_trabajo_id=db_ot.id,
                    item_numero=item_data.item_numero,
                    codigo_muestra=item_data.codigo_muestra,
                    descripcion=item_data.descripcion,
                    cantidad=item_data.cantidad
                )
                db.add(db_item)
            
            db.commit()
            db.refresh(db_ot)
            
            return db_ot
            
        except Exception as e:
            db.rollback()
            raise e
    
    def listar_ordenes_trabajo(self, db: Session, skip: int = 0, limit: int = 100) -> List[OrdenTrabajo]:
        """Listar órdenes de trabajo con paginación"""
        return db.query(OrdenTrabajo).order_by(desc(OrdenTrabajo.fecha_creacion)).offset(skip).limit(limit).all()
    
    def obtener_orden_trabajo(self, db: Session, ot_id: int) -> Optional[OrdenTrabajo]:
        """Obtener orden de trabajo por ID"""
        return db.query(OrdenTrabajo).filter(OrdenTrabajo.id == ot_id).first()
    
    def actualizar_orden_trabajo(self, db: Session, ot_id: int, ot_data: OrdenTrabajoUpdate) -> Optional[OrdenTrabajo]:
        """Actualizar orden de trabajo existente"""
        db_ot = self.obtener_orden_trabajo(db, ot_id)
        
        if not db_ot:
            return None
        
        # Actualizar campos
        for campo, valor in ot_data.model_dump(exclude_unset=True).items():
            if hasattr(db_ot, campo):
                if campo in ['fecha_recepcion', 'fecha_inicio_programado', 'fecha_fin_programado', 'fecha_inicio_real', 'fecha_fin_real'] and valor:
                    setattr(db_ot, campo, self._parse_date(valor))
                else:
                    setattr(db_ot, campo, valor)
        
        db.commit()
        db.refresh(db_ot)
        
        return db_ot
    
    def eliminar_orden_trabajo(self, db: Session, ot_id: int) -> bool:
        """Eliminar orden de trabajo"""
        db_ot = self.obtener_orden_trabajo(db, ot_id)
        
        if not db_ot:
            return False
        
        db.delete(db_ot)
        db.commit()
        
        return True
    
    def buscar_ordenes_trabajo(self, db: Session, termino: str) -> List[OrdenTrabajo]:
        """Buscar órdenes de trabajo por término"""
        return db.query(OrdenTrabajo).filter(
            OrdenTrabajo.numero_ot.contains(termino) |
            OrdenTrabajo.numero_recepcion.contains(termino)
        ).all()
    
    def generar_excel_ot(self, db: Session, ot_id: int) -> bytes:
        """Generar Excel para orden de trabajo"""
        db_ot = self.obtener_orden_trabajo(db, ot_id)
        if not db_ot:
            raise ValueError("Orden de trabajo no encontrada")
        
        # Preparar datos para el Excel
        ot_data = {
            'numero_ot': db_ot.numero_ot,
            'numero_recepcion': db_ot.numero_recepcion,
            'fecha_recepcion': self._format_date(db_ot.fecha_recepcion),
            'plazo_entrega_dias': db_ot.plazo_entrega_dias,
            'fecha_inicio_programado': self._format_date(db_ot.fecha_inicio_programado),
            'fecha_fin_programado': self._format_date(db_ot.fecha_fin_programado),
            'fecha_inicio_real': self._format_date(db_ot.fecha_inicio_real),
            'fecha_fin_real': self._format_date(db_ot.fecha_fin_real),
            'variacion_inicio': db_ot.variacion_inicio,
            'variacion_fin': db_ot.variacion_fin,
            'duracion_real_dias': db_ot.duracion_real_dias,
            'observaciones': db_ot.observaciones,
            'aperturada_por': db_ot.aperturada_por,
            'designada_a': db_ot.designada_a,
            'codigo_laboratorio': db_ot.codigo_laboratorio,
            'version': db_ot.version
        }
        
        # Preparar items
        items_data = []
        for item in db_ot.items:
            items_data.append({
                'item_numero': item.item_numero,
                'codigo_muestra': item.codigo_muestra,
                'descripcion': item.descripcion,
                'cantidad': item.cantidad
            })
        
        return self.ot_excel_service.generar_excel_ot(ot_data, items_data)
    
    def obtener_items_orden_trabajo(self, db: Session, ot_id: int) -> List[ItemOrdenTrabajo]:
        """Obtener items de una orden de trabajo"""
        return db.query(ItemOrdenTrabajo).filter(ItemOrdenTrabajo.orden_trabajo_id == ot_id).all()
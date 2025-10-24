"""
Servicio para gestión de recepciones de muestras
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from models import RecepcionMuestra, MuestraConcreto
from schemas import RecepcionMuestraCreate, RecepcionMuestraResponse

class RecepcionService:
    def crear_recepcion(self, db: Session, recepcion_data: RecepcionMuestraCreate) -> RecepcionMuestra:
        """Crear nueva recepción de muestra"""
        try:
            # Verificar si ya existe una recepción con el mismo número OT
            recepcion_existente = db.query(RecepcionMuestra).filter(
                RecepcionMuestra.numero_ot == recepcion_data.numero_ot
            ).first()
            
            if recepcion_existente:
                raise ValueError(f"Ya existe una recepción con el número OT: {recepcion_data.numero_ot}")
            
            # Validar que haya al menos una muestra
            if not recepcion_data.muestras:
                raise ValueError("Debe incluir al menos una muestra de concreto")
            
            # Crear recepción - manejar campos vacíos
            recepcion_dict = recepcion_data.dict(exclude={'muestras'})
            
            # Convertir strings vacíos a None para campos opcionales
            for field in ['numero_cotizacion', 'entregado_por', 'recibido_por']:
                if field in recepcion_dict and recepcion_dict[field] == "":
                    recepcion_dict[field] = None
            
            # Asegurar que campos requeridos no estén vacíos
            for field in ['cliente', 'domicilio_legal', 'ruc', 'persona_contacto', 'email', 'telefono', 
                         'solicitante', 'domicilio_solicitante', 'proyecto', 'ubicacion']:
                if field in recepcion_dict and recepcion_dict[field] == "":
                    recepcion_dict[field] = "Sin especificar"
            
            recepcion = RecepcionMuestra(**recepcion_dict)
            db.add(recepcion)
            db.flush()  # Para obtener el ID
            
            # Crear muestras
            for i, muestra_data in enumerate(recepcion_data.muestras, 1):
                # Validación más flexible: solo verificar que item_numero sea un número positivo
                if not isinstance(muestra_data.item_numero, int) or muestra_data.item_numero <= 0:
                    raise ValueError(f"El item número debe ser un entero positivo. Recibido: {muestra_data.item_numero}")
                
                muestra = MuestraConcreto(recepcion_id=recepcion.id, **muestra_data.dict())
                db.add(muestra)
            
            db.commit()
            db.refresh(recepcion)
            
            return recepcion
            
        except Exception as e:
            db.rollback()
            raise e
    
    def listar_recepciones(self, db: Session, skip: int = 0, limit: int = 100) -> List[RecepcionMuestra]:
        """Listar recepciones de muestras con paginación"""
        return db.query(RecepcionMuestra).order_by(desc(RecepcionMuestra.fecha_creacion)).offset(skip).limit(limit).all()
    
    def obtener_recepcion(self, db: Session, recepcion_id: int) -> Optional[RecepcionMuestra]:
        """Obtener recepción por ID"""
        return db.query(RecepcionMuestra).filter(RecepcionMuestra.id == recepcion_id).first()
    
    def actualizar_recepcion(self, db: Session, recepcion_id: int, recepcion_data: dict) -> Optional[RecepcionMuestra]:
        """Actualizar recepción existente"""
        recepcion = db.query(RecepcionMuestra).filter(RecepcionMuestra.id == recepcion_id).first()
        
        if not recepcion:
            return None
        
        # Actualizar campos
        for campo, valor in recepcion_data.items():
            if hasattr(recepcion, campo):
                setattr(recepcion, campo, valor)
        
        db.commit()
        db.refresh(recepcion)
        
        return recepcion
    
    def eliminar_recepcion(self, db: Session, recepcion_id: int) -> bool:
        """Eliminar recepción"""
        recepcion = db.query(RecepcionMuestra).filter(RecepcionMuestra.id == recepcion_id).first()
        
        if not recepcion:
            return False
        
        db.delete(recepcion)
        db.commit()
        
        return True
    
    def buscar_recepciones(self, db: Session, termino: str) -> List[RecepcionMuestra]:
        """Buscar recepciones por término"""
        return db.query(RecepcionMuestra).filter(
            RecepcionMuestra.numero_ot.contains(termino) |
            RecepcionMuestra.numero_recepcion.contains(termino) |
            RecepcionMuestra.codigo_trazabilidad.contains(termino)
        ).all()

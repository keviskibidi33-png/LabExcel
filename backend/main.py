"""
Sistema de Gestión y Manipulación de Archivos Excel
Backend FastAPI para procesamiento de órdenes de trabajo de laboratorio
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import pandas as pd
import openpyxl
from io import BytesIO
import os
from datetime import datetime
from typing import List, Optional

from database import get_db, engine
from models import Base, OrdenTrabajo, ItemOrden
from schemas import OrdenTrabajoCreate, OrdenTrabajoResponse, ItemOrdenCreate
from services.excel_service import ExcelService
from services.orden_service import OrdenService

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema de Gestión Excel - Laboratorio",
    description="API para gestión automatizada de órdenes de trabajo y archivos Excel",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar servicios
excel_service = ExcelService()
orden_service = OrdenService()

@app.get("/")
async def root():
    return {"message": "Sistema de Gestión Excel - Laboratorio API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

@app.post("/api/ordenes/", response_model=OrdenTrabajoResponse)
async def crear_orden_trabajo(
    orden: OrdenTrabajoCreate,
    db: Session = Depends(get_db)
):
    """Crear nueva orden de trabajo"""
    return orden_service.crear_orden(db, orden)

@app.get("/api/ordenes/", response_model=List[OrdenTrabajoResponse])
async def listar_ordenes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Listar órdenes de trabajo"""
    return orden_service.listar_ordenes(db, skip=skip, limit=limit)

@app.get("/api/ordenes/{orden_id}", response_model=OrdenTrabajoResponse)
async def obtener_orden(
    orden_id: int,
    db: Session = Depends(get_db)
):
    """Obtener orden de trabajo por ID"""
    orden = orden_service.obtener_orden(db, orden_id)
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return orden

@app.post("/api/excel/upload")
async def subir_archivo_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Subir y procesar archivo Excel"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos Excel")
    
    try:
        contenido = await file.read()
        orden = excel_service.procesar_archivo_excel(contenido, db)
        return {"message": "Archivo procesado exitosamente", "orden_id": orden.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error procesando archivo: {str(e)}")

@app.get("/api/excel/template/{orden_id}")
async def descargar_plantilla(
    orden_id: int,
    db: Session = Depends(get_db)
):
    """Descargar plantilla Excel prellenada"""
    orden = orden_service.obtener_orden(db, orden_id)
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    try:
        archivo_excel = excel_service.generar_plantilla_excel(orden)
        return FileResponse(
            archivo_excel,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=f"OT-{orden.numero_ot}-{orden.numero_recepcion}.xlsx"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando plantilla: {str(e)}")

@app.post("/api/excel/export")
async def exportar_ordenes(
    orden_ids: List[int],
    db: Session = Depends(get_db)
):
    """Exportar múltiples órdenes a Excel"""
    try:
        archivo_excel = excel_service.exportar_ordenes(orden_ids, db)
        return FileResponse(
            archivo_excel,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=f"export_ordenes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exportando órdenes: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

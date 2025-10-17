"""
Sistema de Gestión y Manipulación de Archivos Excel
Backend FastAPI para procesamiento de órdenes de trabajo de laboratorio
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

# Configuración y utilidades
from config import settings
from utils.logger import app_logger, api_logger, db_logger
from utils.exceptions import (
    ValidationError, DatabaseError, ExcelProcessingError, 
    PDFGenerationError, RecepcionNotFoundError, DuplicateRecepcionError
)
from utils.validators import DataValidator

# Base de datos y modelos
from database import get_db, engine
from models import Base, RecepcionMuestra, MuestraConcreto
from schemas import RecepcionMuestraCreate, RecepcionMuestraResponse, MuestraConcretoCreate

# Servicios
from services.excel_service import ExcelService
from services.orden_service import RecepcionService
from services.pdf_service import PDFService
from services.simple_pdf_service import SimplePDFService
from services.excel_collaborative_service import ExcelCollaborativeService

# Crear tablas
Base.metadata.create_all(bind=engine)

# Inicializar aplicación
app = FastAPI(
    title=settings.app_name,
    description="API para gestión automatizada de órdenes de trabajo y archivos Excel",
    version=settings.app_version,
    debug=settings.debug
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

# Middleware de logging
@app.middleware("http")
async def log_requests(request, call_next):
    """Middleware para logging de requests"""
    api_logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    api_logger.info(f"Response: {response.status_code}")
    return response

# Inicializar servicios
excel_service = ExcelService()
recepcion_service = RecepcionService()
pdf_service = PDFService()
simple_pdf_service = SimplePDFService()
excel_collaborative_service = ExcelCollaborativeService()


# Funciones auxiliares
def _prepare_recepcion_data_for_excel(recepcion: RecepcionMuestra) -> dict:
    """Preparar datos de recepción para Excel"""
    def format_date(date_value):
        """Formatear fecha de manera segura"""
        if not date_value:
            return ''
        if isinstance(date_value, str):
            return date_value
        if hasattr(date_value, 'strftime'):
            return date_value.strftime('%d/%m/%Y')
        return str(date_value)
    
    return {
        'numero_ot': recepcion.numero_ot or '',
        'numero_recepcion': recepcion.numero_recepcion or '',
        'numero_cotizacion': recepcion.numero_cotizacion or '',
        'codigo_trazabilidad': recepcion.codigo_trazabilidad or '',
        'asunto': recepcion.asunto or '',
        'cliente': recepcion.cliente or '',
        'domicilio_legal': recepcion.domicilio_legal or '',
        'ruc': recepcion.ruc or '',
        'persona_contacto': recepcion.persona_contacto or '',
        'email': recepcion.email or '',
        'telefono': recepcion.telefono or '',
        'solicitante': recepcion.solicitante or '',
        'domicilio_solicitante': recepcion.domicilio_solicitante or '',
        'proyecto': recepcion.proyecto or '',
        'ubicacion': recepcion.ubicacion or '',
        'fecha_recepcion': format_date(recepcion.fecha_recepcion),
        'fecha_estimada_culminacion': format_date(recepcion.fecha_estimada_culminacion),
        'emision_fisica': recepcion.emision_fisica or False,
        'emision_digital': recepcion.emision_digital or False,
        'entregado_por': recepcion.entregado_por or '',
        'recibido_por': recepcion.recibido_por or '',
        'codigo_laboratorio': recepcion.codigo_laboratorio or '',
        'version': recepcion.version or ''
    }


def _prepare_muestras_data_for_excel(muestras: List[MuestraConcreto]) -> List[dict]:
    """Preparar datos de muestras para Excel"""
    def format_date(date_value):
        """Formatear fecha de manera segura"""
        if not date_value:
            return ''
        if isinstance(date_value, str):
            return date_value
        if hasattr(date_value, 'strftime'):
            return date_value.strftime('%d/%m/%Y')
        return str(date_value)
    
    def format_time(time_value):
        """Formatear hora de manera segura"""
        if not time_value:
            return ''
        if isinstance(time_value, str):
            return time_value
        if hasattr(time_value, 'strftime'):
            return time_value.strftime('%H:%M')
        return str(time_value)
    
    muestras_dict = []
    for muestra in muestras:
        muestras_dict.append({
            'item_numero': muestra.item_numero or 0,
            'codigo_muestra': muestra.codigo_muestra or '',
            'identificacion_muestra': muestra.identificacion_muestra or '',
            'estructura': muestra.estructura or '',
            'fc_kg_cm2': muestra.fc_kg_cm2 or 0,
            'fecha_moldeo': format_date(muestra.fecha_moldeo),
            'hora_moldeo': format_time(muestra.hora_moldeo),
            'edad': muestra.edad or 0,
            'fecha_rotura': format_date(muestra.fecha_rotura),
            'requiere_densidad': muestra.requiere_densidad or False
        })
    return muestras_dict

@app.get("/")
async def root():
    return {"message": "Sistema de Gestión Excel - Laboratorio API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

@app.options("/api/ordenes/")
async def options_crear_recepcion():
    """Manejar peticiones OPTIONS para CORS"""
    return {"message": "OK"}

@app.options("/api/debug/ordenes/")
async def options_debug_ordenes():
    """Manejar peticiones OPTIONS para CORS en debug"""
    return {"message": "OK"}

@app.post("/api/debug/ordenes/")
async def debug_crear_recepcion(request: dict):
    """Endpoint de debug para ver qué datos está enviando el frontend"""
    print("=" * 50)
    print("DEBUG: Datos recibidos del frontend:")
    print(f"Tipo: {type(request)}")
    print(f"Contenido: {request}")
    print("=" * 50)
    
    # Intentar validar los datos
    validation_errors = []
    try:
        # Intentar crear el objeto Pydantic
        recepcion_data = RecepcionMuestraCreate(**request)
        print("✅ Validación Pydantic exitosa")
        return {
            "message": "Datos recibidos y validados correctamente", 
            "data": request,
            "validation": "SUCCESS"
        }
    except Exception as e:
        print(f"❌ Error de validación Pydantic: {e}")
        validation_errors.append(str(e))
        
        # Intentar validar campo por campo
        print("\n--- ANÁLISIS DETALLADO ---")
        
        # Verificar campos requeridos
        required_fields = [
            'numero_ot', 'numero_recepcion', 'asunto', 'cliente', 
            'domicilio_legal', 'ruc', 'persona_contacto', 'email', 
            'telefono', 'solicitante', 'domicilio_solicitante', 
            'proyecto', 'ubicacion'
        ]
        
        missing_fields = []
        for field in required_fields:
            if field not in request or not request[field]:
                missing_fields.append(field)
                print(f"❌ Campo faltante: {field}")
        
        if missing_fields:
            validation_errors.append(f"Campos faltantes: {missing_fields}")
        
        # Verificar muestras
        if 'muestras' in request:
            muestras = request['muestras']
            print(f"📊 Número de muestras: {len(muestras)}")
            
            for i, muestra in enumerate(muestras):
                print(f"  Muestra {i+1}:")
                if 'item_numero' in muestra:
                    print(f"    item_numero: {muestra['item_numero']} (tipo: {type(muestra['item_numero'])})")
                if 'fc_kg_cm2' in muestra:
                    print(f"    fc_kg_cm2: {muestra['fc_kg_cm2']} (tipo: {type(muestra['fc_kg_cm2'])})")
                if 'edad' in muestra:
                    print(f"    edad: {muestra['edad']} (tipo: {type(muestra['edad'])})")
        else:
            print("❌ No hay muestras en el request")
            validation_errors.append("Campo 'muestras' faltante")
        
        return {
            "message": "Datos recibidos con errores de validación", 
            "data": request,
            "validation": "FAILED",
            "errors": validation_errors
        }

@app.post("/api/ordenes/", response_model=RecepcionMuestraResponse)
async def crear_recepcion_muestra(
    recepcion: RecepcionMuestraCreate,
    db: Session = Depends(get_db)
):
    """Crear nueva recepción de muestra"""
    try:
        app_logger.info(f"Creando recepción: {recepcion.numero_ot}")
        print(f"DEBUG REAL ENDPOINT: Datos recibidos: {recepcion.model_dump()}")
        
        # Validar datos antes de procesar
        validation_errors = DataValidator.validate_recepcion_data(recepcion.model_dump())
        if validation_errors:
            app_logger.warning(f"Errores de validación: {validation_errors}")
            print(f"DEBUG REAL ENDPOINT: Errores de validación: {validation_errors}")
            raise ValidationError("Datos de recepción inválidos", details={"errors": validation_errors})
        
        result = recepcion_service.crear_recepcion(db, recepcion)
        app_logger.info(f"Recepción creada exitosamente: {result.id}")
        print(f"DEBUG REAL ENDPOINT: Recepción creada exitosamente: {result.id}")
        return result
        
    except ValidationError as e:
        app_logger.error(f"Error de validación: {e.message}")
        raise HTTPException(status_code=400, detail=e.message)
    except DuplicateRecepcionError as e:
        app_logger.error(f"Recepción duplicada: {e.message}")
        raise HTTPException(status_code=409, detail=e.message)
    except DatabaseError as e:
        app_logger.error(f"Error de base de datos: {e.message}")
        raise HTTPException(status_code=500, detail="Error interno de base de datos")
    except Exception as e:
        app_logger.error(f"Error inesperado: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/ordenes/", response_model=List[RecepcionMuestraResponse])
async def listar_recepciones(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Listar recepciones de muestras"""
    return recepcion_service.listar_recepciones(db, skip=skip, limit=limit)

@app.get("/api/ordenes/{recepcion_id}", response_model=RecepcionMuestraResponse)
async def obtener_recepcion(
    recepcion_id: int,
    db: Session = Depends(get_db)
):
    """Obtener recepción de muestra por ID"""
    recepcion = recepcion_service.obtener_recepcion(db, recepcion_id)
    if not recepcion:
        raise HTTPException(status_code=404, detail="Recepción no encontrada")
    return recepcion

@app.delete("/api/ordenes/{recepcion_id}")
async def eliminar_recepcion(
    recepcion_id: int,
    db: Session = Depends(get_db)
):
    """Eliminar recepción de muestra"""
    try:
        app_logger.info(f"Eliminando recepción: {recepcion_id}")
        
        # Verificar que la recepción existe
        recepcion = recepcion_service.obtener_recepcion(db, recepcion_id)
        if not recepcion:
            app_logger.warning(f"Recepción {recepcion_id} no encontrada")
            raise HTTPException(status_code=404, detail="Recepción no encontrada")
        
        # Eliminar la recepción
        recepcion_service.eliminar_recepcion(db, recepcion_id)
        app_logger.info(f"Recepción {recepcion_id} eliminada exitosamente")
        
        return {"message": "Recepción eliminada exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Error eliminando recepción {recepcion_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

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

@app.get("/api/excel/template/{recepcion_id}")
async def descargar_plantilla(
    recepcion_id: int,
    db: Session = Depends(get_db)
):
    """Descargar plantilla Excel prellenada"""
    recepcion = recepcion_service.obtener_recepcion(db, recepcion_id)
    if not recepcion:
        raise HTTPException(status_code=404, detail="Recepción no encontrada")
    
    try:
        archivo_excel = excel_service.generar_plantilla_excel(recepcion)
        return FileResponse(
            archivo_excel,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=f"OT-{recepcion.numero_ot}-{recepcion.numero_recepcion}.xlsx"
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

@app.get("/api/ordenes/{recepcion_id}/pdf")
async def generar_pdf_recepcion(
    recepcion_id: int,
    db: Session = Depends(get_db)
):
    """Generar PDF del formulario de recepción de muestras"""
    try:
        # Obtener la recepción
        recepcion = recepcion_service.obtener_recepcion(db, recepcion_id)
        if not recepcion:
            raise HTTPException(status_code=404, detail="Recepción no encontrada")
        
        # Convertir a diccionario para el PDF
        recepcion_dict = {
            'numero_ot': recepcion.numero_ot,
            'numero_recepcion': recepcion.numero_recepcion,
            'numero_cotizacion': recepcion.numero_cotizacion,
            'codigo_trazabilidad': recepcion.codigo_trazabilidad,
            'asunto': recepcion.asunto,
            'cliente': recepcion.cliente,
            'domicilio_legal': recepcion.domicilio_legal,
            'ruc': recepcion.ruc,
            'persona_contacto': recepcion.persona_contacto,
            'email': recepcion.email,
            'telefono': recepcion.telefono,
            'solicitante': recepcion.solicitante,
            'domicilio_solicitante': recepcion.domicilio_solicitante,
            'proyecto': recepcion.proyecto,
            'ubicacion': recepcion.ubicacion,
            'fecha_recepcion': recepcion.fecha_recepcion.strftime('%d/%m/%Y') if recepcion.fecha_recepcion else '',
            'fecha_estimada_culminacion': recepcion.fecha_estimada_culminacion.strftime('%d/%m/%Y') if recepcion.fecha_estimada_culminacion else '',
            'emision_fisica': recepcion.emision_fisica,
            'emision_digital': recepcion.emision_digital,
            'entregado_por': recepcion.entregado_por,
            'recibido_por': recepcion.recibido_por,
            'codigo_laboratorio': recepcion.codigo_laboratorio,
            'version': recepcion.version
        }
        
        # Convertir muestras a diccionarios
        muestras_dict = []
        for muestra in recepcion.muestras:
            muestras_dict.append({
                'item_numero': muestra.item_numero,
                'codigo_muestra': muestra.codigo_muestra,
                'identificacion_muestra': muestra.identificacion_muestra,
                'estructura': muestra.estructura,
                'fc_kg_cm2': muestra.fc_kg_cm2,
                'fecha_moldeo': muestra.fecha_moldeo,
                'hora_moldeo': muestra.hora_moldeo,
                'edad': muestra.edad,
                'fecha_rotura': muestra.fecha_rotura,
                'requiere_densidad': muestra.requiere_densidad
            })
        
        # Generar PDF usando servicio simple (compatible con Windows)
        pdf_content = simple_pdf_service.generar_pdf_recepcion(recepcion_dict, muestras_dict)
        
        # Crear respuesta con el PDF
        from fastapi.responses import Response
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=recepcion_{recepcion.numero_recepcion}.pdf"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {str(e)}")

@app.get("/api/ordenes/{recepcion_id}/excel")
async def generar_excel_recepcion(
    recepcion_id: int,
    db: Session = Depends(get_db)
):
    """Generar Excel del formulario de recepción de muestras usando OpenPyXL"""
    try:
        app_logger.info(f"Iniciando generación de Excel para recepción {recepcion_id}")
        
        # Obtener la recepción
        app_logger.info(f"Obteniendo recepción {recepcion_id} de la base de datos")
        recepcion = recepcion_service.obtener_recepcion(db, recepcion_id)
        if not recepcion:
            app_logger.error(f"Recepción {recepcion_id} no encontrada")
            raise HTTPException(status_code=404, detail="Recepción no encontrada")
        
        app_logger.info(f"Recepción encontrada: {recepcion.numero_ot}")
        
        # Preparar datos para Excel
        app_logger.info("Preparando datos de recepción para Excel")
        try:
            recepcion_dict = _prepare_recepcion_data_for_excel(recepcion)
            app_logger.info("Datos de recepción preparados correctamente")
        except Exception as e:
            app_logger.error(f"Error preparando datos de recepción: {str(e)}")
            raise e
        
        app_logger.info("Preparando datos de muestras para Excel")
        try:
            muestras_dict = _prepare_muestras_data_for_excel(recepcion.muestras)
            app_logger.info(f"Datos de {len(muestras_dict)} muestras preparados correctamente")
        except Exception as e:
            app_logger.error(f"Error preparando datos de muestras: {str(e)}")
            raise e
        
        # Generar Excel usando OpenPyXL
        app_logger.info(f"Generando Excel para recepción {recepcion_id}")
        try:
            excel_content = excel_collaborative_service.modificar_excel_con_datos(recepcion_dict, muestras_dict)
            app_logger.info(f"Excel generado exitosamente, tamaño: {len(excel_content)} bytes")
        except Exception as e:
            app_logger.error(f"Error generando Excel: {str(e)}")
            raise e
        
        # Crear respuesta con el Excel
        app_logger.info("Creando respuesta HTTP con Excel")
        response = Response(
            content=excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=recepcion_{recepcion.numero_recepcion}.xlsx"
            }
        )
        app_logger.info(f"Excel generado exitosamente para recepción {recepcion_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Error inesperado generando Excel para recepción {recepcion_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generando Excel: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

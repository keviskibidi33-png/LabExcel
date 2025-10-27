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
import os

# Configuración y utilidades
from config import settings
from utils.logger import app_logger, api_logger, db_logger
from utils.exceptions import (
    ValidationError, DatabaseError, ExcelProcessingError, 
    RecepcionNotFoundError, DuplicateRecepcionError
)
from utils.validators import DataValidator

# Base de datos y modelos
from database import get_db, engine
from models import Base, RecepcionMuestra, MuestraConcreto, OrdenTrabajo, ItemOrdenTrabajo, ControlConcreto, ProbetaConcreto
from schemas import (
    RecepcionMuestraCreate, RecepcionMuestraResponse, MuestraConcretoCreate,
    OrdenTrabajoCreate, OrdenTrabajoResponse, OrdenTrabajoUpdate,
    ControlConcretoCreate, ControlConcretoResponse, ProbetaConcretoCreate, ProbetaConcretoBase,
    BusquedaClienteRequest, BusquedaClienteResponse
)

# Servicios
from services.excel_service import ExcelService
from services.orden_service import RecepcionService
from services.ot_service import OTService
from services.excel_collaborative_service import ExcelCollaborativeService
from services.ot_excel_collaborative_service import OTExcelCollaborativeService
from services.concreto_excel_service import ConcretoExcelService

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
ot_service = OTService()
excel_collaborative_service = ExcelCollaborativeService()
ot_excel_collaborative_service = OTExcelCollaborativeService()


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
        # codigo_trazabilidad eliminado
        # asunto eliminado
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
        # Incluir explicitamente codigo_muestra_lem para columna B
        muestras_dict.append({
            'item_numero': muestra.item_numero or 0,
            'codigo_muestra_lem': getattr(muestra, 'codigo_muestra_lem', '') or '',
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


def _prepare_ot_data_for_excel(ot: OrdenTrabajo) -> dict:
    """Preparar datos de orden de trabajo para Excel"""
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
        'numero_ot': ot.numero_ot or '',
        'numero_recepcion': ot.numero_recepcion or '',
        'fecha_recepcion': format_date(ot.fecha_recepcion),
        'plazo_entrega_dias': ot.plazo_entrega_dias or '',
        'fecha_inicio_programado': format_date(ot.fecha_inicio_programado),
        'fecha_fin_programado': format_date(ot.fecha_fin_programado),
        'fecha_inicio_real': format_date(ot.fecha_inicio_real),
        'fecha_fin_real': format_date(ot.fecha_fin_real),
        'variacion_inicio': ot.variacion_inicio or '',
        'variacion_fin': ot.variacion_fin or '',
        'duracion_real_dias': ot.duracion_real_dias or '',
        'observaciones': ot.observaciones or '',
        'aperturada_por': ot.aperturada_por or '',
        'designada_a': ot.designada_a or '',
        'estado': ot.estado or '',
        'codigo_laboratorio': ot.codigo_laboratorio or '',
        'version': ot.version or ''
    }


def _prepare_items_data_for_excel(items: List[ItemOrdenTrabajo]) -> List[dict]:
    """Preparar datos de items para Excel"""
    items_dict = []
    for item in items:
        items_dict.append({
            'item_numero': item.item_numero or 0,
            'codigo_muestra': item.codigo_muestra or '',
            'descripcion': item.descripcion or '',
            'cantidad': item.cantidad or 0
        })
    return items_dict


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
@app.options("/api/debug/ordenes")
async def options_debug_ordenes():
    """Manejar peticiones OPTIONS para CORS en debug"""
    return {"message": "OK"}

@app.post("/api/debug/ordenes/")
@app.post("/api/debug/ordenes")
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
            'numero_ot', 'numero_recepcion', 'cliente', 
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

# ==================== RUTAS PARA ÓRDENES DE TRABAJO ====================

@app.get("/api/ot/test")
async def test_ot_endpoint():
    """Endpoint de prueba para verificar que las rutas de OT funcionan"""
    return {"message": "Endpoint de OT funcionando correctamente"}

@app.post("/api/ot/debug")
async def debug_ot_data(data: dict):
    """Endpoint de debug para ver qué datos se están enviando"""
    app_logger.info(f"Datos recibidos en debug: {data}")
    return {"received_data": data, "data_type": type(data).__name__}

@app.post("/api/ot/", response_model=OrdenTrabajoResponse)
async def crear_orden_trabajo(
    ot_data: OrdenTrabajoCreate,
    db: Session = Depends(get_db)
):
    """Crear nueva orden de trabajo"""
    try:
        app_logger.info(f"Creando orden de trabajo: {ot_data.numero_ot}")
        app_logger.info(f"Datos recibidos: {ot_data.model_dump()}")
        result = ot_service.crear_orden_trabajo(db, ot_data)
        app_logger.info(f"Orden de trabajo creada exitosamente: {result.id}")
        return result
        
    except ValueError as e:
        app_logger.error(f"Error de validación: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        app_logger.error(f"Error creando orden de trabajo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creando orden de trabajo: {str(e)}")

@app.get("/api/ot/", response_model=List[OrdenTrabajoResponse])
async def listar_ordenes_trabajo(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Listar órdenes de trabajo"""
    return ot_service.listar_ordenes_trabajo(db, skip=skip, limit=limit)

@app.get("/api/ot/{ot_id}", response_model=OrdenTrabajoResponse)
async def obtener_orden_trabajo(
    ot_id: int,
    db: Session = Depends(get_db)
):
    """Obtener orden de trabajo por ID"""
    ot = ot_service.obtener_orden_trabajo(db, ot_id)
    if not ot:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
    return ot

@app.put("/api/ot/{ot_id}", response_model=OrdenTrabajoResponse)
async def actualizar_orden_trabajo(
    ot_id: int,
    ot_data: OrdenTrabajoUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar orden de trabajo"""
    try:
        result = ot_service.actualizar_orden_trabajo(db, ot_id, ot_data)
        if not result:
            raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Error actualizando orden de trabajo {ot_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error actualizando orden de trabajo: {str(e)}")

@app.delete("/api/ot/{ot_id}")
async def eliminar_orden_trabajo(
    ot_id: int,
    db: Session = Depends(get_db)
):
    """Eliminar orden de trabajo"""
    try:
        success = ot_service.eliminar_orden_trabajo(db, ot_id)
        if not success:
            raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
        return {"message": "Orden de trabajo eliminada exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Error eliminando orden de trabajo {ot_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error eliminando orden de trabajo: {str(e)}")

@app.get("/api/ot/{ot_id}/excel")
async def generar_excel_ot(
    ot_id: int,
    db: Session = Depends(get_db)
):
    """Generar Excel de orden de trabajo"""
    try:
        app_logger.info(f"Generando Excel para orden de trabajo {ot_id}")
        
        # Obtener datos de la OT
        ot = ot_service.obtener_orden_trabajo(db, ot_id)
        if not ot:
            raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
        
        # Obtener items de la OT
        items = ot_service.obtener_items_orden_trabajo(db, ot_id)
        
        # Preparar datos para Excel
        ot_dict = _prepare_ot_data_for_excel(ot)
        items_dict = _prepare_items_data_for_excel(items)
        
        # Generar Excel usando el servicio directo
        excel_content = ot_excel_collaborative_service.modificar_excel_con_datos(ot_dict, items_dict)
        
        filename = f"OT-{ot.numero_ot}.xlsx"
        
        return Response(
            content=excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except Exception as e:
        app_logger.error(f"Error generando Excel para orden de trabajo {ot_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generando Excel: {str(e)}")


# ===== ENDPOINTS PARA CONTROL DE CONCRETO =====

@app.post("/api/concreto/control", response_model=ControlConcretoResponse)
async def crear_control_concreto(
    control_data: ControlConcretoCreate,
    db: Session = Depends(get_db)
):
    """Crear un nuevo control de concreto con probetas"""
    try:
        app_logger.info(f"Datos recibidos: {control_data}")
        app_logger.info(f"Probetas recibidas: {control_data.probetas}")
        # Crear control en base de datos
        db_control = ControlConcreto(
            numero_control=control_data.numero_control,
            codigo_documento=control_data.codigo_documento,
            version=control_data.version,
            fecha_documento=control_data.fecha_documento,
            pagina=control_data.pagina
        )
        
        db.add(db_control)
        db.flush()  # Para obtener el ID
        
        # Crear probetas
        for probeta_data in control_data.probetas:
            db_probeta = ProbetaConcreto(
                control_id=db_control.id,
                item_numero=probeta_data.item_numero,
                orden_trabajo=probeta_data.orden_trabajo,
                codigo_muestra=probeta_data.codigo_muestra,
                codigo_muestra_cliente=probeta_data.codigo_muestra_cliente,
                fecha_rotura=probeta_data.fecha_rotura,
                elemento=probeta_data.elemento,
                fc_kg_cm2=probeta_data.fc_kg_cm2,
                status_ensayado=probeta_data.status_ensayado
            )
            db.add(db_probeta)
        
        db.commit()
        db.refresh(db_control)
        
        app_logger.info(f"Control de concreto creado: {db_control.numero_control}")
        return db_control
        
    except Exception as e:
        db.rollback()
        app_logger.error(f"Error creando control de concreto: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creando control: {str(e)}")


@app.get("/api/concreto/control/{control_id}", response_model=ControlConcretoResponse)
async def obtener_control_concreto(control_id: int, db: Session = Depends(get_db)):
    """Obtener un control de concreto por ID"""
    control = db.query(ControlConcreto).filter(ControlConcreto.id == control_id).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control de concreto no encontrado")
    return control


@app.get("/api/concreto/controles", response_model=List[ControlConcretoResponse])
async def listar_controles_concreto(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Listar todos los controles de concreto"""
    controles = db.query(ControlConcreto).offset(skip).limit(limit).all()
    return controles


@app.post("/api/concreto/generar-excel/{control_id}")
async def generar_excel_control_concreto(control_id: int, db: Session = Depends(get_db)):
    """Generar archivo Excel para un control de concreto"""
    try:
        # Obtener control y probetas
        control = db.query(ControlConcreto).filter(ControlConcreto.id == control_id).first()
        if not control:
            raise HTTPException(status_code=404, detail="Control de concreto no encontrado")
        
        # Convertir probetas a formato para el servicio
        probetas_data = []
        for probeta in control.probetas:
            probeta_dict = {
                'item_numero': probeta.item_numero,
                'orden_trabajo': probeta.orden_trabajo,
                'codigo_muestra': probeta.codigo_muestra,
                'codigo_muestra_cliente': probeta.codigo_muestra_cliente,
                'fecha_rotura': probeta.fecha_rotura,
                'elemento': probeta.elemento,
                'fc_kg_cm2': probeta.fc_kg_cm2,
                'status_ensayado': probeta.status_ensayado
            }
            probetas_data.append(probeta_dict)
        
        # Datos del cliente para relleno automático
        datos_cliente = {
            'codigo_documento': control.codigo_documento,
            'version': control.version,
            'fecha_documento': control.fecha_documento,
            'pagina': control.pagina
        }
        
        # Generar Excel
        concreto_service = ConcretoExcelService()
        archivo_path = concreto_service.generar_excel_concreto(probetas_data, datos_cliente)
        
        # Actualizar control con ruta del archivo
        control.archivo_excel = archivo_path
        db.commit()
        
        # Retornar archivo
        return FileResponse(
            path=archivo_path,
            filename=f"control_concreto_{control.numero_control}.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
    except Exception as e:
        app_logger.error(f"Error generando Excel para control {control_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generando Excel: {str(e)}")


@app.post("/api/concreto/buscar-recepcion", response_model=BusquedaClienteResponse)
async def buscar_datos_por_recepcion(request: BusquedaClienteRequest, db: Session = Depends(get_db)):
    """Buscar datos del cliente y probetas basado en número de recepción"""
    try:
        # Buscar la recepción en la base de datos
        recepcion = db.query(RecepcionMuestra).filter(
            RecepcionMuestra.numero_recepcion == request.numero_recepcion
        ).first()
        
        if not recepcion:
            return BusquedaClienteResponse(
                encontrado=False,
                datos_cliente=None,
                probetas=[],
                mensaje=f"No se encontró la recepción: {request.numero_recepcion}"
            )
        
        # Obtener las muestras de concreto de la recepción
        muestras = db.query(MuestraConcreto).filter(
            MuestraConcreto.recepcion_id == recepcion.id
        ).all()
        
        # Convertir muestras a probetas de concreto
        probetas = []
        for i, muestra in enumerate(muestras):
            probeta = ProbetaConcretoBase(
                item_numero=i + 1,
                orden_trabajo=recepcion.numero_ot,
                codigo_muestra=muestra.codigo_muestra_lem or muestra.codigo_muestra,
                codigo_muestra_cliente=recepcion.cliente,  # Usar nombre del cliente de la recepción
                fecha_rotura=muestra.fecha_rotura,
                elemento="",  # Campo elemento - se llena manualmente
                fc_kg_cm2=muestra.fc_kg_cm2,
                status_ensayado="PENDIENTE"
            )
            probetas.append(probeta)
        
        # Datos del cliente
        datos_cliente = {
            'orden_trabajo': recepcion.numero_ot,
            'codigo_documento': 'F-LEM-P-01.09',
            'version': '04',
            'fecha_documento': recepcion.fecha_recepcion.strftime('%d/%m/%Y') if recepcion.fecha_recepcion else '',
            'pagina': '1 de 1',
            'cliente': recepcion.cliente,
            'proyecto': recepcion.proyecto,
            'ubicacion': recepcion.ubicacion,
            'nota': f"Recepción {recepcion.numero_recepcion}",
            'status_ensayado': 'PENDIENTE'
        }
        
        return BusquedaClienteResponse(
            encontrado=True,
            datos_cliente=datos_cliente,
            probetas=probetas,
            mensaje=f"Recepción {request.numero_recepcion} encontrada con {len(probetas)} probetas"
        )
            
    except Exception as e:
        app_logger.error(f"Error en búsqueda de recepción: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en búsqueda: {str(e)}")


@app.delete("/api/concreto/control/{control_id}")
async def eliminar_control_concreto(control_id: int, db: Session = Depends(get_db)):
    """Eliminar un control de concreto"""
    try:
        control = db.query(ControlConcreto).filter(ControlConcreto.id == control_id).first()
        if not control:
            raise HTTPException(status_code=404, detail="Control de concreto no encontrado")
        
        # Eliminar archivo Excel si existe
        if control.archivo_excel and os.path.exists(control.archivo_excel):
            os.remove(control.archivo_excel)
        
        db.delete(control)
        db.commit()
        
        app_logger.info(f"Control de concreto eliminado: {control.numero_control}")
        return {"mensaje": "Control de concreto eliminado exitosamente"}
        
    except Exception as e:
        db.rollback()
        app_logger.error(f"Error eliminando control de concreto: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error eliminando control: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

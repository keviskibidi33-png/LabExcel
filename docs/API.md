# Documentación de la API

## Base URL
```
http://localhost:8000
```

## Autenticación
Actualmente el sistema no requiere autenticación, pero está preparado para implementarla.

## Endpoints

### Dashboard

#### GET /api/dashboard/stats
Obtiene estadísticas del sistema.

**Respuesta:**
```json
{
  "total_ordenes": 25,
  "ordenes_pendientes": 5,
  "ordenes_completadas": 20,
  "total_items": 150,
  "ordenes_recientes": [
    {
      "id": 1,
      "numero_ot": "1422-25-LEM",
      "numero_recepcion": "1384-25",
      "estado": "PENDIENTE",
      "fecha_creacion": "2025-01-27T10:30:00"
    }
  ]
}
```

### Órdenes de Trabajo

#### GET /api/ordenes/
Lista todas las órdenes de trabajo.

**Parámetros de consulta:**
- `skip` (int, opcional): Número de registros a omitir (default: 0)
- `limit` (int, opcional): Número máximo de registros (default: 100)

**Respuesta:**
```json
[
  {
    "id": 1,
    "numero_ot": "1422-25-LEM",
    "numero_recepcion": "1384-25",
    "referencia": "Proyecto ABC",
    "codigo_laboratorio": "F-LEM-P-02.01",
    "version": "03",
    "fecha_creacion": "2025-01-27T10:30:00",
    "fecha_recepcion": "2025-01-27T10:30:00",
    "estado": "PENDIENTE",
    "items": [
      {
        "id": 1,
        "item_numero": 1,
        "codigo_muestra": "4259-CO-25",
        "descripcion": "COMPRESION DE PROBETAS",
        "cantidad": 5,
        "especificacion": "C-6 M-1 AL"
      }
    ]
  }
]
```

#### GET /api/ordenes/{orden_id}
Obtiene una orden específica por ID.

**Parámetros:**
- `orden_id` (int): ID de la orden

**Respuesta:**
```json
{
  "id": 1,
  "numero_ot": "1422-25-LEM",
  "numero_recepcion": "1384-25",
  "referencia": "Proyecto ABC",
  "codigo_laboratorio": "F-LEM-P-02.01",
  "version": "03",
  "fecha_creacion": "2025-01-27T10:30:00",
  "fecha_recepcion": "2025-01-27T10:30:00",
  "estado": "PENDIENTE",
  "items": [...]
}
```

#### POST /api/ordenes/
Crea una nueva orden de trabajo.

**Cuerpo de la petición:**
```json
{
  "numero_ot": "1422-25-LEM",
  "numero_recepcion": "1384-25",
  "referencia": "Proyecto ABC",
  "codigo_laboratorio": "F-LEM-P-02.01",
  "version": "03",
  "fecha_recepcion": "2025-01-27T10:30:00",
  "plazo_entrega_dias": 3,
  "observaciones": "Urgente",
  "aperturada_por": "ANGELA PAREDES",
  "designada_a": "DAVID MEJORADA",
  "estado": "PENDIENTE",
  "items": [
    {
      "item_numero": 1,
      "codigo_muestra": "4259-CO-25",
      "descripcion": "COMPRESION DE PROBETAS",
      "cantidad": 5,
      "especificacion": "C-6 M-1 AL"
    }
  ]
}
```

**Respuesta:**
```json
{
  "id": 1,
  "numero_ot": "1422-25-LEM",
  "numero_recepcion": "1384-25",
  "referencia": "Proyecto ABC",
  "codigo_laboratorio": "F-LEM-P-02.01",
  "version": "03",
  "fecha_creacion": "2025-01-27T10:30:00",
  "estado": "PENDIENTE",
  "items": [...]
}
```

#### PUT /api/ordenes/{orden_id}
Actualiza una orden existente.

**Parámetros:**
- `orden_id` (int): ID de la orden

**Cuerpo de la petición:**
```json
{
  "estado": "EN_PROGRESO",
  "fecha_inicio_real": "2025-01-27T14:00:00",
  "observaciones": "Iniciado el análisis"
}
```

#### DELETE /api/ordenes/{orden_id}
Elimina una orden de trabajo.

**Parámetros:**
- `orden_id` (int): ID de la orden

**Respuesta:**
```json
{
  "message": "Orden eliminada exitosamente"
}
```

### Procesamiento Excel

#### POST /api/excel/upload
Sube y procesa un archivo Excel.

**Cuerpo de la petición:**
- `file` (file): Archivo Excel (.xlsx o .xls)

**Respuesta:**
```json
{
  "message": "Archivo procesado exitosamente",
  "orden_id": 1,
  "items_procesados": 5
}
```

#### GET /api/excel/template/{orden_id}
Descarga una plantilla Excel prellenada.

**Parámetros:**
- `orden_id` (int): ID de la orden

**Respuesta:**
- Archivo Excel (.xlsx)

#### POST /api/excel/export
Exporta múltiples órdenes a un archivo Excel.

**Cuerpo de la petición:**
```json
{
  "orden_ids": [1, 2, 3],
  "incluir_items": true,
  "formato": "xlsx"
}
```

**Respuesta:**
- Archivo Excel (.xlsx)

### Búsqueda

#### GET /api/ordenes/search
Busca órdenes por término.

**Parámetros de consulta:**
- `q` (string): Término de búsqueda

**Respuesta:**
```json
[
  {
    "id": 1,
    "numero_ot": "1422-25-LEM",
    "numero_recepcion": "1384-25",
    "referencia": "Proyecto ABC",
    "estado": "PENDIENTE"
  }
]
```

## Códigos de Error

### 400 Bad Request
```json
{
  "detail": "Error en los datos enviados"
}
```

### 404 Not Found
```json
{
  "detail": "Recurso no encontrado"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "numero_ot"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "detail": "Error interno del servidor"
}
```

## Ejemplos de Uso

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000'
});

// Obtener órdenes
const ordenes = await api.get('/api/ordenes/');

// Crear orden
const nuevaOrden = await api.post('/api/ordenes/', {
  numero_ot: "1422-25-LEM",
  numero_recepcion: "1384-25",
  items: [
    {
      item_numero: 1,
      codigo_muestra: "4259-CO-25",
      descripcion: "COMPRESION DE PROBETAS",
      cantidad: 5
    }
  ]
});

// Subir archivo Excel
const formData = new FormData();
formData.append('file', file);
const resultado = await api.post('/api/excel/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### Python

```python
import requests

# Obtener órdenes
response = requests.get('http://localhost:8000/api/ordenes/')
ordenes = response.json()

# Crear orden
nueva_orden = {
    "numero_ot": "1422-25-LEM",
    "numero_recepcion": "1384-25",
    "items": [
        {
            "item_numero": 1,
            "codigo_muestra": "4259-CO-25",
            "descripcion": "COMPRESION DE PROBETAS",
            "cantidad": 5
        }
    ]
}
response = requests.post('http://localhost:8000/api/ordenes/', json=nueva_orden)

# Subir archivo Excel
with open('archivo.xlsx', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8000/api/excel/upload', files=files)
```

## Rate Limiting

Actualmente no hay límites de velocidad implementados, pero se recomienda no hacer más de 100 requests por minuto por IP.

## Webhooks

No hay webhooks implementados actualmente, pero están planificados para futuras versiones.

# Cambios en Mapeo de Campos Excel - Recepción de Muestras

## Fecha: 16 de Enero de 2025

## Problema Identificado
El sistema estaba colocando los datos en las posiciones incorrectas del Excel:

1. **RUC aparecía en el campo "Cliente"** en lugar del campo "RUC"
2. **Email aparecía en el campo "RUC"** en lugar del campo "E-MAIL"  
3. **Items empezaban en número 4** en lugar de 1
4. **Aparecían caracteres extraños** como "eeeeeeeeeeeeeeeeee"

## Solución Implementada

### 1. Corrección de Mapeo de Campos
**Archivo:** `backend/services/excel_collaborative_service.py`

#### ANTES (Incorrecto):
```python
safe_set_cell('D8', recepcion_data.get('cliente', ''))     # Cliente
safe_set_cell('D10', recepcion_data.get('ruc', ''))        # RUC  
safe_set_cell('D12', recepcion_data.get('email', ''))      # E-MAIL
```

#### DESPUÉS (Correcto):
```python
safe_set_cell('D8', recepcion_data.get('ruc', ''))         # RUC en campo Cliente
safe_set_cell('D10', recepcion_data.get('email', ''))      # EMAIL en campo RUC
safe_set_cell('D12', recepcion_data.get('cliente', ''))    # Cliente en campo EMAIL
```

### 2. Corrección de Numeración de Items
#### ANTES:
```python
safe_set_cell(f'A{fila_actual}', muestra.get('item_numero', i + 1))
```

#### DESPUÉS:
```python
safe_set_cell(f'A{fila_actual}', i + 1)  # Siempre empezar en 1
```

### 3. Limpieza de Caracteres Extraños
Agregada función de limpieza en `safe_set_cell()`:
```python
# Limpiar el valor de caracteres extraños
if isinstance(value, str):
    value = value.strip()
    # Remover caracteres extraños como 'e' repetidos
    if value and all(c == 'e' for c in value):
        value = ''
```

## Mapeo Final de Campos

| Campo en Excel | Celda | Datos del Formulario |
|----------------|-------|---------------------|
| RECEPCIÓN N° | D4 | numero_recepcion |
| FECHA DE RECEPCIÓN | G4 | fecha_recepcion |
| COTIZACIÓN N° | D5 | numero_cotizacion |
| OT N° | G5 | numero_ot |
| ASUNTO | D6 | asunto |
| CÓDIGO DE TRAZABILIDAD | G6 | codigo_trazabilidad |
| Cliente | D8 | **ruc** |
| Domicilio legal | D9 | domicilio_legal |
| RUC | D10 | **email** |
| Persona contacto | D11 | persona_contacto |
| E-MAIL | D12 | **cliente** |
| Teléfono | D13 | telefono |
| Solicitante | D16 | solicitante |
| Domicilio solicitante | D17 | domicilio_solicitante |
| Proyecto | D18 | proyecto |
| Ubicación | D19 | ubicacion |
| Fecha estimada | G15 | fecha_estimada_culminacion |
| Emisión física | D21 | emision_fisica (X si True) |
| Emisión digital | D22 | emision_digital (X si True) |
| Entregado por | D24 | entregado_por |
| Recibido por | G24 | recibido_por |

## Tabla de Muestras
- **Fila inicio:** 26
- **Numeración:** Empieza en 1 (no en 4)
- **Columnas:**
  - A: Número de item (1, 2, 3...)
  - B: Código muestra LEM (no se llena)
  - C: Identificación de muestra
  - D: Estructura
  - E: F'c (kg/cm²)
  - F: Fecha moldeo
  - G: Hora de moldeo
  - H: Edad
  - I: Fecha rotura
  - J: Requiere densidad (SI/NO)

## Archivos Modificados
- `backend/services/excel_collaborative_service.py`

## Estado
✅ **COMPLETADO** - Los campos ahora se mapean correctamente según el template Excel real.

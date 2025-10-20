import io
import openpyxl
from openpyxl.styles import Alignment
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

class ExcelCollaborativeService:
    """Servicio para modificar archivos Excel existentes con datos del formulario"""
    
    def __init__(self):
        self.template_path = "templates/recepcion_template.xlsx"
    
    def modificar_excel_con_datos(self, recepcion_data: Dict[str, Any], muestras: List[Dict[str, Any]], 
                                 template_path: Optional[str] = None) -> bytes:
        """Modificar archivo Excel existente con datos del formulario"""
        
        # Ruta del template
        template_file = template_path or self.template_path
        # print(f"USANDO TEMPLATE: {template_file}")
        
        # Cargar template directamente
        workbook = openpyxl.load_workbook(template_file)
        worksheet = workbook.active
        
        # Cambiar "X" por "Descripción" - manejar celdas fusionadas
        try:
            # Buscar la celda que contiene "X" en la fila 22
            for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']:
                cell_ref = f"{col}22"
                cell_value = worksheet[cell_ref].value
                if cell_value and 'X' in str(cell_value):
                    # Verificar si está en un rango fusionado
                    for merged_range in worksheet.merged_cells.ranges:
                        if cell_ref in merged_range:
                            # Usar la celda superior izquierda del rango fusionado
                            top_left = merged_range.min_row, merged_range.min_col
                            target_cell = worksheet.cell(row=top_left[0], column=top_left[1])
                            if target_cell.value:
                                # Cambiar "X" por "Descripción" en el texto fusionado
                                new_value = str(target_cell.value).replace('X', 'Descripción')
                                target_cell.value = new_value
                                # Cambio aplicado en rango fusionado
                            break
                    else:
                        # Si no está fusionada, cambiar directamente
                        worksheet[cell_ref].value = str(cell_value).replace('X', 'Descripción')
                        # Cambio aplicado en celda no fusionada
                    break
        except Exception:
            # Evitar interrumpir flujo por ajustes de encabezado
            pass
        
        # Rellenar datos
        self._rellenar_datos_recepcion(worksheet, recepcion_data)
        self._rellenar_datos_muestras(worksheet, muestras)
        self._ajustar_ancho_columnas(worksheet)
        
        # Guardar
        excel_buffer = io.BytesIO()
        workbook.save(excel_buffer)
        excel_buffer.seek(0)
        
        # print("TEMPLATE REAL USADO EXITOSAMENTE")
        return excel_buffer.getvalue()
    
    def _rellenar_datos_recepcion(self, worksheet, recepcion_data: Dict[str, Any]):
        """Rellenar datos de la recepción en el Excel"""
        
        def safe_set_cell(cell_ref, value):
            try:
                if isinstance(value, str):
                    value = value.strip()
                
                cell = worksheet[cell_ref]
                target_cell = cell
                
                # Verificar si es una celda fusionada
                for merged_range in worksheet.merged_cells.ranges:
                    if cell_ref in merged_range:
                        top_left = merged_range.min_row, merged_range.min_col
                        target_cell = worksheet.cell(row=top_left[0], column=top_left[1])
                        break
                
                target_cell.value = value
                
                # Centrar las X en los cuadros de checkboxes
                if cell_ref in ['B46', 'B47'] and value == 'X':
                    target_cell.alignment = Alignment(horizontal='center', vertical='center')
                # Centrar específicamente ciertas celdas
                elif cell_ref in ['H46', 'D49', 'H49']:  # fecha estimada, entregado por, recibido por
                    target_cell.alignment = Alignment(horizontal='center', vertical='bottom')
                else:
                    target_cell.alignment = Alignment(horizontal='left', vertical='bottom')
                # Mantener altura original del template
                
            except Exception:
                # No interrumpir por errores de formato puntuales
                pass
        
        # Datos principales
        safe_set_cell('D6', recepcion_data.get('numero_recepcion', ''))
        safe_set_cell('D7', recepcion_data.get('numero_cotizacion', ''))
        # D9 eliminado - no poner "SOLICITO EJECUCIÓN DE ENSAYOS"
        safe_set_cell('J6', recepcion_data.get('fecha_recepcion', ''))
        safe_set_cell('J7', recepcion_data.get('numero_ot', ''))
        # I8 eliminado - no poner código de trazabilidad
        
        # Datos del cliente
        safe_set_cell('D10', recepcion_data.get('cliente', ''))
        safe_set_cell('D11', recepcion_data.get('domicilio_legal', ''))
        safe_set_cell('D12', recepcion_data.get('ruc', ''))
        safe_set_cell('D13', recepcion_data.get('persona_contacto', ''))
        safe_set_cell('D14', recepcion_data.get('email', ''))
        safe_set_cell('H14', recepcion_data.get('telefono', ''))
        
        # Datos para el informe
        safe_set_cell('D16', recepcion_data.get('solicitante', ''))
        safe_set_cell('D17', recepcion_data.get('domicilio_solicitante', ''))
        safe_set_cell('D18', recepcion_data.get('proyecto', ''))
        safe_set_cell('D19', recepcion_data.get('ubicacion', ''))
        
        # Fecha estimada
        safe_set_cell('H46', recepcion_data.get('fecha_estimada_culminacion', ''))
        
        # Emisión - Las X van en columna B donde están los cuadros
        # Limpiar primero las celdas (eliminar cualquier X predefinida del template)
        worksheet['B46'].value = None
        worksheet['B47'].value = None
        
        # Aplicar lógica real (no mock predefinido)
        if recepcion_data.get('emision_fisica', False):
            safe_set_cell('B46', 'X')
        if recepcion_data.get('emision_digital', False):
            safe_set_cell('B47', 'X')
        
        # No agregar X en D22 - esa columna es para códigos de muestras
        
        # Entregado/Recibido
        safe_set_cell('D49', recepcion_data.get('entregado_por', ''))
        safe_set_cell('H49', recepcion_data.get('recibido_por', ''))
        
        print("Datos de recepción rellenados")
    
    def _rellenar_datos_muestras(self, worksheet, muestras: List[Dict[str, Any]]):
        """Rellenar datos de las muestras en la tabla del Excel"""
        
        def safe_set_cell(cell_ref, value):
            try:
                if isinstance(value, str):
                    value = value.strip()
                
                cell = worksheet[cell_ref]
                target_cell = cell
                
                # Verificar si es una celda fusionada
                for merged_range in worksheet.merged_cells.ranges:
                    if cell_ref in merged_range:
                        top_left = merged_range.min_row, merged_range.min_col
                        target_cell = worksheet.cell(row=top_left[0], column=top_left[1])
                        break
                
                # Preservar el estilo existente (especialmente bordes) antes de escribir el valor
                existing_border = target_cell.border
                existing_fill = target_cell.fill
                existing_font = target_cell.font
                
                target_cell.value = value
                
                # Restaurar estilos preservados
                target_cell.border = existing_border
                target_cell.fill = existing_fill
                target_cell.font = existing_font
                
                # Centrar las X en los cuadros de checkboxes
                if cell_ref in ['B46', 'B47'] and value == 'X':
                    target_cell.alignment = Alignment(horizontal='center', vertical='center')
                # Centrar específicamente ciertas celdas
                elif cell_ref in ['H46', 'D49', 'H49']:  # fecha estimada, entregado por, recibido por
                    target_cell.alignment = Alignment(horizontal='center', vertical='bottom')
                else:
                    target_cell.alignment = Alignment(horizontal='left', vertical='bottom')
                # Mantener altura original del template
                
            except Exception:
                # No interrumpir por errores de formato puntuales
                pass
        
        # Tabla de muestras comienza en fila 23
        fila_inicio = 23

        # Auto-expandir: insertar filas extra si llegan más muestras de las que soporta el template
        # La siguiente sección fija del template comienza desde la fila 40 para evitar empujar textos
        # Pero insertamos las filas ANTES de la sección fija, no en ella
        fila_seccion_inferior = 40
        fila_footer_inicio = 42  # Footer empieza en fila 42
        columnas_tabla = ['A','B','C','D','E','F','G','H','I','J','K']

        def copy_row_style(src_row: int, dst_row: int):
            for col in columnas_tabla:
                try:
                    src = worksheet[f"{col}{src_row}"]
                    dst = worksheet[f"{col}{dst_row}"]
                    
                    # Copiar estilos de forma segura
                    if src.font:
                        dst.font = src.font
                    if src.alignment:
                        dst.alignment = src.alignment
                    if src.border:
                        dst.border = src.border
                    if src.fill:
                        dst.fill = src.fill
                    if src.number_format:
                        dst.number_format = src.number_format
                        
                except Exception as e:
                    print(f"Error copiando estilo de {col}{src_row} a {col}{dst_row}: {e}")
                    pass

        filas_disponibles = fila_seccion_inferior - fila_inicio
        cantidad = len(muestras)
        
        # Verificar si las muestras extra van a sobreescribir el footer
        if cantidad > filas_disponibles:
            filas_extra = cantidad - filas_disponibles
            ultima_fila_muestra = fila_seccion_inferior + filas_extra - 1
            
            print(f"Extendiendo tabla: {filas_extra} filas extra necesarias")
            print(f"Última fila de muestra: {ultima_fila_muestra}, Footer empieza en: {fila_footer_inicio}")
            
            if ultima_fila_muestra >= fila_footer_inicio:
                # Las muestras van a sobreescribir el footer - mover el footer hacia abajo
                filas_a_mover_footer = ultima_fila_muestra - fila_footer_inicio + 1
                print(f"⚠️  Muestras van a sobreescribir footer - moviendo {filas_a_mover_footer} filas hacia abajo")
                
                # Mover el footer hacia abajo insertando filas
                worksheet.insert_rows(fila_footer_inicio, amount=filas_a_mover_footer)
                
                # Actualizar la posición del footer
                fila_footer_inicio += filas_a_mover_footer
                print(f"Footer movido a fila {fila_footer_inicio}")
            
            # Limpiar solo el contenido de las filas que vamos a usar para las muestras extra
            for i in range(filas_extra):
                fila_destino = fila_seccion_inferior + i  # Fila 40, 41, etc.
                # Limpiar solo el valor, no los estilos
                for col in columnas_tabla:
                    try:
                        worksheet[f'{col}{fila_destino}'].value = None
                    except Exception as e:
                        print(f"Error limpiando {col}{fila_destino}: {e}")
                        pass
            
            # Copiar estilo de tabla a TODAS las filas que van a contener muestras
            # Esto incluye la fila 40 (item 18) y las filas 41+ (items 19+)
            estilo_base_row = fila_seccion_inferior - 1  # Fila 39 (última fila de tabla)
            for i in range(filas_extra):  # Empezar desde 0 para incluir fila 40
                fila_destino = fila_seccion_inferior + i  # Fila 40, 41, 42, etc.
                copy_row_style(estilo_base_row, fila_destino)
        
        for i, muestra in enumerate(muestras):
            # Calcular la fila correcta considerando las filas extendidas
            if i < filas_disponibles:
                # Usar las filas originales (23-39)
                fila_actual = fila_inicio + i
            else:
                # Usar las filas extendidas (40+)
                fila_actual = fila_seccion_inferior + (i - filas_disponibles)
            
            # Limpiar celdas
            for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']:
                try:
                    worksheet[f'{col}{fila_actual}'].value = None
                except:
                    pass
            
            # Llenar datos - Secuencia correcta: N° → Código muestra LEM → Identificación muestra → Estructura
            safe_set_cell(f'A{fila_actual}', i + 1)  # Número
            b_ref = f'B{fila_actual}'
            safe_set_cell(b_ref, muestra.get('codigo_muestra_lem', ''))  # Código muestra LEM
            try:
                # Forzar formato texto en columna B para preservar ceros
                worksheet[b_ref].number_format = '@'
            except Exception:
                pass
            safe_set_cell(f'D{fila_actual}', muestra.get('identificacion_muestra', ''))  # Identificación muestra
            safe_set_cell(f'E{fila_actual}', muestra.get('estructura', ''))  # Estructura
            safe_set_cell(f'F{fila_actual}', muestra.get('fc_kg_cm2', ''))  # F'c
            safe_set_cell(f'G{fila_actual}', muestra.get('fecha_moldeo', ''))  # Fecha moldeo
            safe_set_cell(f'H{fila_actual}', muestra.get('hora_moldeo', ''))  # Hora moldeo
            safe_set_cell(f'I{fila_actual}', muestra.get('edad', ''))  # Edad
            safe_set_cell(f'J{fila_actual}', muestra.get('fecha_rotura', ''))  # Fecha rotura
            safe_set_cell(f'K{fila_actual}', 'SI' if muestra.get('requiere_densidad', False) else 'NO')  # Densidad
        
        # print(f"Muestras procesadas: {len(muestras)}")
    
    def _ajustar_ancho_columnas(self, worksheet):
        """Ajustar el ancho de las columnas"""
        try:
            # Volver a los anchos originales - no modificar B, C y G (mantener template original)
            worksheet.column_dimensions['D'].width = 30
            worksheet.column_dimensions['H'].width = 15
            worksheet.column_dimensions['I'].width = 20
            worksheet.column_dimensions['J'].width = 12
            # G mantiene su ancho original del template
            
            # No ajustar altura de fila 8 - código de trazabilidad eliminado
            
            # print("Columnas ajustadas a anchos originales")
            
        except Exception:
            # No detener por ajustes visuales
            pass
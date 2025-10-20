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
        
        # FOOTER COMPLETAMENTE FLEXIBLE - se mueve según la cantidad de items
        # Calcular dónde debe empezar el footer dinámicamente
        cantidad = len(muestras)
        fila_footer_inicio = fila_inicio + cantidad + 1  # +1 para la línea delgada después del último item
        
        print(f"🔧 Footer flexible: {cantidad} items, footer empieza en fila {fila_footer_inicio}")
        
        columnas_tabla = ['A','B','C','D','E','F','G','H','I','J','K']

        def apply_table_style_to_row(row_num: int):
            """Aplicar estilo de tabla simple a una fila"""
            from openpyxl.styles import Border, Side, Alignment, Font
            
            # Crear borde simple para tabla
            thin_border = Border(
                left=Side(style='thin'),
                right=Side(style='thin'),
                top=Side(style='thin'),
                bottom=Side(style='thin')
            )
            
            # Crear fuente simple
            simple_font = Font(name='Arial', size=10)
            
            # Aplicar estilo a todas las columnas de la tabla
            for col in columnas_tabla:
                try:
                    cell = worksheet[f'{col}{row_num}']
                    # Aplicar todos los estilos
                    cell.border = thin_border
                    cell.alignment = Alignment(horizontal='left', vertical='bottom')
                    cell.font = simple_font
                    print(f"✅ Estilo aplicado a {col}{row_num}")
                except Exception as e:
                    print(f"❌ Error aplicando estilo a {col}{row_num}: {e}")
                    pass
            
            # COPIAR LA ALTURA DE LA FILA DE REFERENCIA (fila 39 - último item original)
            try:
                fila_referencia = 39  # Última fila de item original
                altura_original = worksheet.row_dimensions[fila_referencia].height
                if altura_original:
                    worksheet.row_dimensions[row_num].height = altura_original
                    print(f"📏 Altura copiada de fila {fila_referencia} ({altura_original}) a fila {row_num}")
                else:
                    # Si no hay altura definida, usar una altura estándar
                    worksheet.row_dimensions[row_num].height = 15.0
                    print(f"📏 Altura estándar aplicada a fila {row_num}: 15.0")
            except Exception as e:
                print(f"❌ Error copiando altura a fila {row_num}: {e}")
                # Aplicar altura estándar como fallback
                try:
                    worksheet.row_dimensions[row_num].height = 15.0
                    print(f"📏 Altura fallback aplicada a fila {row_num}: 15.0")
                except:
                    pass

        # PRIMERO: DESFUSIONAR CELDAS EN LAS FILAS QUE VAN A CONTENER ITEMS
        print(f"🔧 Desfusionando celdas en filas que van a contener items (23 a {fila_inicio + cantidad - 1})")
        for fila_desfusionar in range(fila_inicio, fila_inicio + cantidad):
            # Obtener todos los rangos fusionados que afectan esta fila
            merged_ranges_to_remove = []
            for merged_range in worksheet.merged_cells.ranges:
                if merged_range.min_row <= fila_desfusionar <= merged_range.max_row:
                    merged_ranges_to_remove.append(merged_range)
            
            # Remover los rangos fusionados
            for merged_range in merged_ranges_to_remove:
                worksheet.unmerge_cells(str(merged_range))
                print(f"🔧 Desfusionado rango {merged_range} que afectaba fila {fila_desfusionar}")
        
        # SEGUNDO: MOVER EL FOOTER PRESERVANDO SU ESTRUCTURA ORIGINAL
        if cantidad > 17:  # Si hay más de 17 items, mover el footer
            # El footer original empieza en fila 42, lo movemos a la nueva posición
            fila_footer_original = 42
            filas_a_mover = fila_footer_inicio - fila_footer_original
            
            if filas_a_mover > 0:
                print(f"🔄 Moviendo footer {filas_a_mover} filas hacia abajo (de {fila_footer_original} a {fila_footer_inicio})")
                
                # COPIAR EL FOOTER COMPLETO ANTES DE MOVERLO
                footer_data = {}
                footer_styles = {}
                footer_merged_ranges = []
                
                # Guardar datos y estilos del footer original (filas 42-60)
                for row in range(fila_footer_original, 61):  # Guardar hasta fila 60
                    for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']:
                        try:
                            cell_ref = f'{col}{row}'
                            cell = worksheet[cell_ref]
                            footer_data[cell_ref] = cell.value
                            # Guardar estilos importantes
                            footer_styles[cell_ref] = {
                                'border': cell.border,
                                'fill': cell.fill,
                                'font': cell.font,
                                'alignment': cell.alignment
                            }
                        except:
                            pass
                
                # Guardar rangos fusionados del footer
                for merged_range in worksheet.merged_cells.ranges:
                    if merged_range.min_row >= fila_footer_original:
                        footer_merged_ranges.append(merged_range)
                
                # Mover el footer
                worksheet.insert_rows(fila_footer_original, amount=filas_a_mover)
                
                # RESTAURAR EL FOOTER EN SU NUEVA POSICIÓN
                for row in range(fila_footer_inicio, fila_footer_inicio + 19):  # Restaurar 19 filas del footer
                    for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']:
                        try:
                            original_row = row - filas_a_mover
                            original_cell_ref = f'{col}{original_row}'
                            new_cell_ref = f'{col}{row}'
                            
                            if original_cell_ref in footer_data:
                                worksheet[new_cell_ref].value = footer_data[original_cell_ref]
                                
                                # Restaurar estilos
                                if original_cell_ref in footer_styles:
                                    styles = footer_styles[original_cell_ref]
                                    worksheet[new_cell_ref].border = styles['border']
                                    worksheet[new_cell_ref].fill = styles['fill']
                                    worksheet[new_cell_ref].font = styles['font']
                                    worksheet[new_cell_ref].alignment = styles['alignment']
                        except Exception as e:
                            print(f"⚠️  Error restaurando {col}{row}: {e}")
                            pass
                
                # RESTAURAR RANGOS FUSIONADOS DEL FOOTER
                for merged_range in footer_merged_ranges:
                    try:
                        # Calcular nuevo rango fusionado
                        new_min_row = merged_range.min_row + filas_a_mover
                        new_max_row = merged_range.max_row + filas_a_mover
                        new_min_col = merged_range.min_col
                        new_max_col = merged_range.max_col
                        
                        # Crear nuevo rango fusionado
                        new_range = f"{worksheet.cell(row=new_min_row, column=new_min_col).coordinate}:{worksheet.cell(row=new_max_row, column=new_max_col).coordinate}"
                        worksheet.merge_cells(new_range)
                        print(f"🔧 Restaurado rango fusionado: {new_range}")
                    except Exception as e:
                        print(f"⚠️  Error restaurando rango fusionado: {e}")
                        pass
                
                print(f"✅ Footer movido y restaurado exitosamente")
            
            # Aplicar estilo de tabla a TODAS las filas que van a contener muestras
            for i in range(cantidad):
                fila_actual = fila_inicio + i
                if fila_actual >= 40:  # Solo aplicar estilo a filas 40+
                    print(f"Aplicando estilo de tabla a fila {fila_actual}")
                    apply_table_style_to_row(fila_actual)
        
        for i, muestra in enumerate(muestras):
            # SIMPLIFICADO - cada item va en su fila secuencial
            fila_actual = fila_inicio + i  # Fila 23, 24, 25... hasta 23+cantidad-1
            
            print(f"📝 Procesando item {i+1} en fila {fila_actual}")
            
            # Las celdas ya fueron limpiadas antes del bucle
            
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
        
            print(f"✅ Item {i+1} completado en fila {fila_actual}")
        
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
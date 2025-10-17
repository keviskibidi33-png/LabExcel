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
        print(f"USANDO TEMPLATE: {template_file}")
        
        # Cargar template directamente
        workbook = openpyxl.load_workbook(template_file)
        worksheet = workbook.active
        
        # Cambiar "X" por "Descripción"
        if worksheet['C22'].value == 'X':
            worksheet['C22'].value = 'Descripción'
        
        # Rellenar datos
        self._rellenar_datos_recepcion(worksheet, recepcion_data)
        self._rellenar_datos_muestras(worksheet, muestras)
        self._ajustar_ancho_columnas(worksheet)
        
        # Guardar
        excel_buffer = io.BytesIO()
        workbook.save(excel_buffer)
        excel_buffer.seek(0)
        
        print("TEMPLATE REAL USADO EXITOSAMENTE")
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
                target_cell.alignment = Alignment(horizontal='left', vertical='bottom')
                worksheet.row_dimensions[target_cell.row].height = 20
                
            except Exception as e:
                print(f"Error en celda {cell_ref}: {e}")
        
        # Datos principales
        safe_set_cell('D6', recepcion_data.get('numero_recepcion', ''))
        safe_set_cell('D7', recepcion_data.get('numero_cotizacion', ''))
        safe_set_cell('D9', recepcion_data.get('asunto', ''))
        safe_set_cell('J6', recepcion_data.get('fecha_recepcion', ''))
        safe_set_cell('J7', recepcion_data.get('numero_ot', ''))
        safe_set_cell('I8', recepcion_data.get('codigo_trazabilidad', ''))
        
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
        safe_set_cell('G15', recepcion_data.get('fecha_estimada_culminacion', ''))
        
        # Emisión
        if recepcion_data.get('emision_fisica', False):
            safe_set_cell('D21', 'X')
        if recepcion_data.get('emision_digital', False):
            safe_set_cell('D22', 'X')
        
        # Entregado/Recibido
        safe_set_cell('D24', recepcion_data.get('entregado_por', ''))
        safe_set_cell('H24', recepcion_data.get('recibido_por', ''))
        
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
                
                target_cell.value = value
                target_cell.alignment = Alignment(horizontal='left', vertical='bottom')
                worksheet.row_dimensions[target_cell.row].height = 20
                
            except Exception as e:
                print(f"Error en celda {cell_ref}: {e}")
        
        # Tabla de muestras comienza en fila 26
        fila_inicio = 26
        
        for i, muestra in enumerate(muestras):
            fila_actual = fila_inicio + i
            
            # Limpiar celdas
            for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']:
                try:
                    worksheet[f'{col}{fila_actual}'].value = None
                except:
                    pass
            
            # Llenar datos
            safe_set_cell(f'A{fila_actual}', i + 1)  # Número
            safe_set_cell(f'C{fila_actual}', muestra.get('identificacion_muestra', ''))  # Descripción
            safe_set_cell(f'D{fila_actual}', muestra.get('estructura', ''))  # Estructura
            safe_set_cell(f'E{fila_actual}', muestra.get('fc_kg_cm2', ''))  # F'c
            safe_set_cell(f'F{fila_actual}', muestra.get('fecha_moldeo', ''))  # Fecha moldeo
            safe_set_cell(f'G{fila_actual}', muestra.get('hora_moldeo', ''))  # Hora moldeo
            safe_set_cell(f'H{fila_actual}', muestra.get('edad', ''))  # Edad
            safe_set_cell(f'I{fila_actual}', muestra.get('fecha_rotura', ''))  # Fecha rotura
            safe_set_cell(f'J{fila_actual}', 'SI' if muestra.get('requiere_densidad', False) else 'NO')  # Densidad
        
        print(f"Muestras procesadas: {len(muestras)}")
    
    def _ajustar_ancho_columnas(self, worksheet):
        """Ajustar el ancho de las columnas"""
        try:
            worksheet.column_dimensions['D'].width = 35
            worksheet.column_dimensions['H'].width = 15
            worksheet.column_dimensions['I'].width = 20
            worksheet.column_dimensions['J'].width = 15
            worksheet.column_dimensions['C'].width = 30
            worksheet.column_dimensions['G'].width = 20
            
            # Ajustar altura de la fila 21 para los encabezados
            worksheet.row_dimensions[21].height = 30
            
            print("Columnas ajustadas")
            
        except Exception as e:
            print(f"Error ajustando columnas: {e}")
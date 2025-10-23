import io
from copy import copy
from typing import List, Dict, Any, Optional

import openpyxl
from openpyxl.styles import Alignment, Border, Font

class OTExcelService:
    """Servicio para generar archivos Excel de Órdenes de Trabajo"""
    
    # Constantes para el template
    TEMPLATE_PATH = "templates/orden_trabajo_template.xlsx"
    FILA_INICIO_ITEMS = 10
    
    def __init__(self):
        self.template_path = self.TEMPLATE_PATH
    
    def generar_excel_ot(self, ot_data: Dict[str, Any], items: List[Dict[str, Any]]) -> bytes:
        """Generar Excel para orden de trabajo"""
        try:
            print(f"Intentando cargar template: {self.template_path}")
            
            # Cargar template
            workbook = openpyxl.load_workbook(self.template_path, data_only=False, keep_vba=False)
            worksheet = workbook.active
            
            print("Template cargado exitosamente")
            
            # Verificar rangos fusionados
            merged_ranges = list(worksheet.merged_cells.ranges)
            print(f"Rangos fusionados encontrados: {len(merged_ranges)}")
            if merged_ranges:
                print("Advertencia: El template aún tiene fusiones")
            
            # Rellenar datos
            self._rellenar_datos_ot(worksheet, ot_data)
            self._rellenar_datos_items(worksheet, items)
            
            # Guardar en memoria
            excel_buffer = io.BytesIO()
            workbook.save(excel_buffer)
            excel_buffer.seek(0)
            
            print("Excel generado exitosamente")
            return excel_buffer.getvalue()
            
        except Exception as e:
            print(f"Error generando Excel: {e}")
            raise e
    
    def _rellenar_datos_ot(self, worksheet, ot_data: Dict[str, Any]):
        """Rellenar datos de la orden de trabajo en el Excel"""
        
        def safe_set_cell(cell_ref, value):
            try:
                if isinstance(value, str):
                    value = value.strip()
                if value is None or value == '':
                    return
                
                # Escribir directamente en la celda
                worksheet[cell_ref].value = value
                print(f"Escrito '{value}' en {cell_ref}")
                
            except Exception as e:
                print(f"Error escribiendo en {cell_ref}: {e}")
                pass
        
        # Datos principales
        safe_set_cell('B6', ot_data.get('numero_ot', ''))
        safe_set_cell('F6', ot_data.get('numero_recepcion', ''))
        
        # Fechas y plazos - CORREGIDAS
        safe_set_cell('C31', ot_data.get('fecha_recepcion', ''))  # Columna C
        safe_set_cell('C32', ot_data.get('plazo_entrega_dias', ''))  # Columna C
        
        # Fechas programadas
        safe_set_cell('E31', ot_data.get('fecha_inicio_programado', ''))
        safe_set_cell('E32', ot_data.get('fecha_fin_programado', ''))
        
        # Fechas reales
        safe_set_cell('G31', ot_data.get('fecha_inicio_real', ''))
        safe_set_cell('G32', ot_data.get('fecha_fin_real', ''))
        
        # Variaciones
        safe_set_cell('I31', ot_data.get('variacion_inicio', ''))
        safe_set_cell('I32', ot_data.get('variacion_fin', ''))
        
        # Duración real - CORREGIDA
        safe_set_cell('E33', ot_data.get('duracion_real_dias', ''))  # Columna D
        
        # Observaciones
        safe_set_cell('C34', ot_data.get('observaciones', ''))
        
        # Responsables - CORREGIDAS
        safe_set_cell('C38', ot_data.get('aperturada_por', ''))  # Columna C para pedro
        safe_set_cell('H38', ot_data.get('designada_a', ''))  # Columna H para erick
        
        print("Datos de OT rellenados")
    
    def _rellenar_datos_items(self, worksheet, items: List[Dict[str, Any]]):
        """Rellenar datos de los items en la tabla"""
        
        def safe_set_cell(cell_ref, value):
            try:
                if isinstance(value, str):
                    value = value.strip()
                if value is None or value == '':
                    return
                
                worksheet[cell_ref].value = value
                print(f"Item escrito '{value}' en {cell_ref}")
                
            except Exception as e:
                print(f"Error escribiendo item en {cell_ref}: {e}")
                pass
        
        # Columnas: A=ÍTEM, C=CÓDIGO, E=DESCRIPCIÓN, I=CANTIDAD
        columnas_tabla = ['A', 'B', 'D', 'I']
        fila_inicio = 10
        
        for indice, item in enumerate(items):
            fila_actual = fila_inicio + indice
            
            safe_set_cell(f'A{fila_actual}', item.get('item_numero') or indice + 1)
            safe_set_cell(f'B{fila_actual}', item.get('codigo_muestra', ''))
            safe_set_cell(f'D{fila_actual}', item.get('descripcion', ''))
            safe_set_cell(f'I{fila_actual}', item.get('cantidad', ''))
        
        print("Datos de items rellenados")
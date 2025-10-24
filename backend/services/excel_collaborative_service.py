import io
from typing import List, Dict, Any, Optional
import openpyxl
from openpyxl.styles import Alignment, Border, Side

class ExcelCollaborativeService:
    """Servicio optimizado para modificar archivos Excel con datos del formulario"""
    
    # Constantes
    TEMPLATE_PATH = "templates/recepcion_template.xlsx"
    FILA_INICIO_MUESTRAS = 23
    FILA_FOOTER_ORIGINAL = 42
    
    def __init__(self):
        self.template_path = self.TEMPLATE_PATH
    
    def modificar_excel_con_datos(self, recepcion_data: Dict[str, Any], muestras: List[Dict[str, Any]], 
                                 template_path: Optional[str] = None) -> bytes:
        """Función principal optimizada para generar Excel"""
        
        # Cargar template
        template_file = template_path or self.template_path
        workbook = openpyxl.load_workbook(template_file)
        worksheet = workbook.active
        
        # Guardar número de items
        total_items = len(muestras)
        self._total_items = total_items
        
        # Rellenar datos
        self._rellenar_datos_recepcion(worksheet, recepcion_data)
        self._rellenar_datos_muestras(worksheet, muestras)
        
        # Aplicar lógica dinámica según número de items
        if total_items >= 40:
            self._aplicar_optimizaciones_completas(worksheet, total_items)
        elif total_items > 17:
            self._aplicar_optimizaciones_basicas(worksheet, total_items)
        else:
            print(f"Manteniendo template original para {total_items} items")
        
        # Generar Excel
        excel_buffer = io.BytesIO()
        workbook.save(excel_buffer)
        excel_buffer.seek(0)
        return excel_buffer.getvalue()
    
    def _safe_set_cell(self, worksheet, cell_ref: str, value: Any) -> None:
        """Función única optimizada para establecer valores en celdas"""
        try:
            if isinstance(value, str):
                value = value.strip()
            
            cell = worksheet[cell_ref]
            target_cell = cell
            
            # Manejar celdas fusionadas
            for merged_range in worksheet.merged_cells.ranges:
                if cell_ref in merged_range:
                    top_left = merged_range.min_row, merged_range.min_col
                    target_cell = worksheet.cell(row=top_left[0], column=top_left[1])
                    break
            
            target_cell.value = value
            
            # Aplicar alineación según contexto
            if cell_ref in ['H46', 'D49', 'H49'] and self._total_items > 17:
                target_cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
                worksheet.row_dimensions[target_cell.row].height = max(30, worksheet.row_dimensions[target_cell.row].height)
            elif cell_ref in ['B46', 'B47'] and value == 'X':
                target_cell.alignment = Alignment(horizontal='center', vertical='center')
            else:
                target_cell.alignment = Alignment(horizontal='left', vertical='bottom')
                
        except Exception as e:
            print(f"Error en celda {cell_ref}: {e}")
    
    def _rellenar_datos_recepcion(self, worksheet, recepcion_data: Dict[str, Any]):
        """Rellenar datos de la recepción"""
        # Datos principales
        self._safe_set_cell(worksheet, 'D6', recepcion_data.get('numero_recepcion', ''))
        self._safe_set_cell(worksheet, 'D7', recepcion_data.get('numero_cotizacion', ''))
        self._safe_set_cell(worksheet, 'J6', recepcion_data.get('fecha_recepcion', ''))
        self._safe_set_cell(worksheet, 'J7', recepcion_data.get('numero_ot', ''))
        
        # Datos del cliente
        self._safe_set_cell(worksheet, 'D10', recepcion_data.get('cliente', ''))
        self._safe_set_cell(worksheet, 'D11', recepcion_data.get('domicilio_legal', ''))
        self._safe_set_cell(worksheet, 'D12', recepcion_data.get('ruc', ''))
        self._safe_set_cell(worksheet, 'D13', recepcion_data.get('persona_contacto', ''))
        self._safe_set_cell(worksheet, 'D14', recepcion_data.get('email', ''))
        self._safe_set_cell(worksheet, 'H14', recepcion_data.get('telefono', ''))
        
        # Datos del solicitante
        self._safe_set_cell(worksheet, 'D16', recepcion_data.get('solicitante', ''))
        self._safe_set_cell(worksheet, 'D17', recepcion_data.get('domicilio_solicitante', ''))
        self._safe_set_cell(worksheet, 'D18', recepcion_data.get('proyecto', ''))
        self._safe_set_cell(worksheet, 'D19', recepcion_data.get('ubicacion', ''))
        
        # Fecha estimada y otros campos
        self._safe_set_cell(worksheet, 'H46', recepcion_data.get('fecha_estimada_culminacion', ''))
        self._safe_set_cell(worksheet, 'D49', recepcion_data.get('entregado_por', ''))
        self._safe_set_cell(worksheet, 'H49', recepcion_data.get('recibido_por', ''))
        
        # Emisión
        if recepcion_data.get('emision_fisica', False):
            self._safe_set_cell(worksheet, 'B46', 'X')
        if recepcion_data.get('emision_digital', False):
            self._safe_set_cell(worksheet, 'B47', 'X')
    
    def _rellenar_datos_muestras(self, worksheet, muestras: List[Dict[str, Any]]):
        """Rellenar datos de las muestras"""
        fila_inicio = self.FILA_INICIO_MUESTRAS
        
        for indice, muestra in enumerate(muestras):
            fila_actual = fila_inicio + indice
            item_numero = indice + 1
            
            # Datos de la muestra
            self._safe_set_cell(worksheet, f'A{fila_actual}', item_numero)
            self._safe_set_cell(worksheet, f'B{fila_actual}', muestra.get('codigo_muestra_lem', ''))
            self._safe_set_cell(worksheet, f'D{fila_actual}', muestra.get('identificacion_muestra', ''))
            self._safe_set_cell(worksheet, f'E{fila_actual}', muestra.get('estructura', ''))
            self._safe_set_cell(worksheet, f'F{fila_actual}', muestra.get('fc_kg_cm2', ''))
            self._safe_set_cell(worksheet, f'G{fila_actual}', muestra.get('fecha_moldeo', ''))
            self._safe_set_cell(worksheet, f'H{fila_actual}', muestra.get('hora_moldeo', ''))
            self._safe_set_cell(worksheet, f'I{fila_actual}', muestra.get('edad', ''))
            self._safe_set_cell(worksheet, f'J{fila_actual}', muestra.get('fecha_rotura', ''))
            self._safe_set_cell(worksheet, f'K{fila_actual}', 'SI' if muestra.get('requiere_densidad', False) else 'NO')
    
    def _aplicar_optimizaciones_completas(self, worksheet, total_items: int):
        """Aplicar todas las optimizaciones para 40+ items"""
        print(f"Aplicando optimizaciones completas para {total_items} items")
        
        # Insertar filas si es necesario
        footer_row = self._find_footer_row(worksheet)
        if total_items > 17:
            footer_row = self._asegurar_capacidad_items(worksheet, footer_row, total_items)
        
        # Aplicar fusiones y optimizaciones
        self._fusionar_celdas_footer(worksheet)
        self._mover_elementos_footer(worksheet, footer_row)
    
    def _aplicar_optimizaciones_basicas(self, worksheet, total_items: int):
        """Aplicar optimizaciones básicas para 18-39 items"""
        print(f"Aplicando optimizaciones básicas para {total_items} items")
        
        footer_row = self._find_footer_row(worksheet)
        self._fusionar_celdas_footer(worksheet)
        self._mover_elementos_footer(worksheet, footer_row)
    
    def _find_footer_row(self, worksheet) -> int:
        """Encontrar la fila del footer"""
        for row in range(40, worksheet.max_row + 1):
            valor = worksheet.cell(row=row, column=1).value
            if isinstance(valor, str) and ("Entregado por:" in valor or "Recibido por:" in valor):
                return row
        return 70  # Fallback
    
    def _asegurar_capacidad_items(self, worksheet, footer_row: int, total_items: int) -> int:
        """Asegurar que hay suficiente espacio para los items"""
        capacidad_actual = footer_row - self.FILA_INICIO_MUESTRAS
        if total_items <= capacidad_actual:
            return footer_row
        
        filas_extra = total_items - capacidad_actual
        for i in range(filas_extra):
            worksheet.insert_rows(footer_row - 1, amount=1)
            footer_row += 1
        
        return footer_row
    
    def _fusionar_celdas_footer(self, worksheet):
        """Fusionar celdas del footer para evitar texto cortado"""
        footer_row = self._find_footer_row(worksheet)
        
        try:
            if f'A{footer_row}:B{footer_row}' not in [r.coord for r in worksheet.merged_cells.ranges]:
                worksheet.merge_cells(f'A{footer_row}:B{footer_row}')
            if f'F{footer_row}:G{footer_row}' not in [r.coord for r in worksheet.merged_cells.ranges]:
                worksheet.merge_cells(f'F{footer_row}:G{footer_row}')
            
            worksheet.row_dimensions[footer_row].height = 30
            worksheet.cell(row=footer_row, column=1).alignment = Alignment(horizontal='left', vertical='center', wrap_text=True)
            worksheet.cell(row=footer_row, column=6).alignment = Alignment(horizontal='left', vertical='center', wrap_text=True)
        except Exception as e:
            print(f"Error fusionando footer: {e}")
    
    def _mover_elementos_footer(self, worksheet, footer_row: int):
        """Mover elementos del footer dinámicamente"""
        try:
            nueva_fila_obligatorio = footer_row - 5
            nueva_fila_nota = footer_row - 4
            
            # Buscar y mover elementos
            for row in range(1, min(worksheet.max_row + 1, 100)):  # Límite para evitar bucles
                for col in range(1, min(worksheet.max_column + 1, 12)):
                    celda = worksheet.cell(row=row, column=col)
                    if isinstance(celda.value, str):
                        if "(1) OBLIGATORIO" in celda.value:
                            valor_original = celda.value
                            celda.value = ""
                            worksheet.cell(row=nueva_fila_obligatorio, column=col).value = valor_original
                        elif "Nota:" in celda.value:
                            valor_original = celda.value
                            celda.value = ""
                            worksheet.cell(row=nueva_fila_nota, column=col).value = valor_original
        except Exception as e:
            print(f"Error moviendo elementos del footer: {e}")

"""
Servicio para modificar archivos Excel existentes con datos del formulario
Usa OpenPyXL para cargar templates existentes y rellenarlos con datos
"""

import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
from openpyxl.utils import get_column_letter
import io
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

class ExcelCollaborativeService:
    """Servicio para modificar archivos Excel existentes con datos del formulario"""
    
    def __init__(self):
        self.template_path = "templates/recepcion_template.xlsx"
    
    def modificar_excel_con_datos(self, recepcion_data: Dict[str, Any], muestras: List[Dict[str, Any]], 
                                 template_path: Optional[str] = None) -> bytes:
        """
        Modificar archivo Excel existente con datos del formulario
        
        Args:
            recepcion_data: Datos de la recepción
            muestras: Lista de muestras de concreto
            template_path: Ruta del template Excel (opcional)
            
        Returns:
            bytes: Contenido del Excel modificado
        """
        
        try:
            # Usar template_path si se proporciona, sino usar el por defecto
            template_file = template_path or self.template_path
            
            print(f"Cargando template: {template_file}")
            
            # Verificar que el archivo existe
            if not os.path.exists(template_file):
                print(f"Template no encontrado: {template_file}")
                return self._crear_excel_ultra_simple(recepcion_data, muestras)
            
            # Cargar el workbook existente
            workbook = openpyxl.load_workbook(template_file)
            worksheet = workbook.active
            
            print("Template cargado exitosamente, rellenando datos...")
            
            # Rellenar datos de la recepción
            self._rellenar_datos_recepcion(worksheet, recepcion_data)
            
            # Rellenar datos de las muestras
            self._rellenar_datos_muestras(worksheet, muestras)
            
            # Guardar en memoria
            excel_buffer = io.BytesIO()
            workbook.save(excel_buffer)
            excel_buffer.seek(0)
            
            print("Excel generado exitosamente con template real")
            return excel_buffer.getvalue()
            
        except Exception as e:
            print(f"Error modificando Excel con template: {e}")
            # Fallback a Excel simple
            return self._crear_excel_ultra_simple(recepcion_data, muestras)
    
    def _rellenar_datos_recepcion(self, worksheet, recepcion_data: Dict[str, Any]):
        """Rellenar datos de la recepción en el Excel según el template real"""
        
        def safe_set_cell(cell_ref, value):
            """Establecer valor en celda de manera segura, evitando celdas fusionadas"""
            try:
                # Limpiar el valor de caracteres extraños
                if isinstance(value, str):
                    value = value.strip()
                    # Remover caracteres extraños como 'e' repetidos
                    if value and all(c == 'e' for c in value):
                        value = ''
                
                cell = worksheet[cell_ref]
                if hasattr(cell, 'value') and not hasattr(cell, 'coordinate'):
                    # Es una celda fusionada, buscar la celda principal
                    for merged_range in worksheet.merged_cells.ranges:
                        if cell_ref in merged_range:
                            # Usar la celda superior izquierda del rango fusionado
                            top_left = merged_range.min_row, merged_range.min_col
                            worksheet.cell(row=top_left[0], column=top_left[1], value=value)
                            return
                else:
                    # Celda normal
                    worksheet[cell_ref] = value
            except Exception as e:
                print(f"Error estableciendo celda {cell_ref}: {e}")
        
        try:
            # Datos principales de la recepción - CORREGIDOS según las imágenes
            safe_set_cell('D4', recepcion_data.get('numero_recepcion', ''))  # RECEPCIÓN N°
            safe_set_cell('G4', recepcion_data.get('fecha_recepcion', ''))   # FECHA DE RECEPCIÓN
            safe_set_cell('D5', recepcion_data.get('numero_cotizacion', '')) # COTIZACIÓN N°
            safe_set_cell('G5', recepcion_data.get('numero_ot', ''))         # OT N°
            safe_set_cell('D6', recepcion_data.get('asunto', ''))            # ASUNTO
            safe_set_cell('G6', recepcion_data.get('codigo_trazabilidad', '')) # CÓDIGO DE TRAZABILIDAD
            
            # Datos del cliente - CORREGIDOS según las imágenes
            # El RUC va en el campo "Cliente" y el nombre del cliente va en otro lugar
            safe_set_cell('D8', recepcion_data.get('ruc', ''))               # RUC en campo Cliente
            safe_set_cell('D9', recepcion_data.get('domicilio_legal', ''))   # Domicilio legal
            safe_set_cell('D10', recepcion_data.get('email', ''))            # EMAIL en campo RUC
            safe_set_cell('D11', recepcion_data.get('persona_contacto', '')) # Persona contacto
            safe_set_cell('D12', recepcion_data.get('cliente', ''))          # Cliente en campo EMAIL
            safe_set_cell('D13', recepcion_data.get('telefono', ''))         # Teléfono
            
            # Datos para el informe
            safe_set_cell('D16', recepcion_data.get('solicitante', ''))      # Solicitante
            safe_set_cell('D17', recepcion_data.get('domicilio_solicitante', '')) # Domicilio legal
            safe_set_cell('D18', recepcion_data.get('proyecto', ''))         # Proyecto
            safe_set_cell('D19', recepcion_data.get('ubicacion', ''))        # Ubicación
            
            # Fecha estimada de culminación
            safe_set_cell('G15', recepcion_data.get('fecha_estimada_culminacion', ''))
            
            # Emisión física/digital (marcar checkboxes)
            if recepcion_data.get('emision_fisica', False):
                safe_set_cell('D21', 'X')  # Marcar checkbox físico
            
            if recepcion_data.get('emision_digital', False):
                safe_set_cell('D22', 'X')  # Marcar checkbox digital
            
            # Entregado por
            safe_set_cell('D24', recepcion_data.get('entregado_por', ''))
            
            # Recibido por
            safe_set_cell('G24', recepcion_data.get('recibido_por', ''))
            
            print("Datos de recepción rellenados correctamente")
            
        except Exception as e:
            print(f"Error rellenando datos de recepción: {e}")
    
    def _rellenar_datos_muestras(self, worksheet, muestras: List[Dict[str, Any]]):
        """Rellenar datos de las muestras en la tabla del Excel"""
        
        def safe_set_cell(cell_ref, value):
            """Establecer valor en celda de manera segura, evitando celdas fusionadas"""
            try:
                cell = worksheet[cell_ref]
                if hasattr(cell, 'value') and not hasattr(cell, 'coordinate'):
                    # Es una celda fusionada, buscar la celda principal
                    for merged_range in worksheet.merged_cells.ranges:
                        if cell_ref in merged_range:
                            # Usar la celda superior izquierda del rango fusionado
                            top_left = merged_range.min_row, merged_range.min_col
                            worksheet.cell(row=top_left[0], column=top_left[1], value=value)
                            return
                else:
                    # Celda normal
                    worksheet[cell_ref] = value
            except Exception as e:
                print(f"Error estableciendo celda {cell_ref}: {e}")
        
        try:
            # La tabla de muestras comienza aproximadamente en la fila 26
            # Ajustar según la posición real en tu template
            fila_inicio = 26
            
            for i, muestra in enumerate(muestras):
                fila_actual = fila_inicio + i
                
                # N° (número de item) - CORREGIDO para que empiece en 1
                safe_set_cell(f'A{fila_actual}', i + 1)  # Siempre empezar en 1
                
                # Código muestra LEM (columna sombreada - no llenar según instrucciones)
                # safe_set_cell(f'B{fila_actual}', muestra.get('codigo_muestra', ''))
                
                # Código (identificación de muestra)
                safe_set_cell(f'C{fila_actual}', muestra.get('identificacion_muestra', ''))
                
                # Estructura
                safe_set_cell(f'D{fila_actual}', muestra.get('estructura', ''))
                
                # F'c (kg/cm²)
                safe_set_cell(f'E{fila_actual}', muestra.get('fc_kg_cm2', ''))
                
                # Fecha moldeo
                safe_set_cell(f'F{fila_actual}', muestra.get('fecha_moldeo', ''))
                
                # Hora de moldeo
                safe_set_cell(f'G{fila_actual}', muestra.get('hora_moldeo', ''))
                
                # Edad
                safe_set_cell(f'H{fila_actual}', muestra.get('edad', ''))
                
                # Fecha rotura
                safe_set_cell(f'I{fila_actual}', muestra.get('fecha_rotura', ''))
                
                # Se requiere Densidad concreto SI/NO
                requiere_densidad = muestra.get('requiere_densidad', False)
                safe_set_cell(f'J{fila_actual}', 'SI' if requiere_densidad else 'NO')
            
            print(f"Datos de {len(muestras)} muestras rellenados correctamente")
            
        except Exception as e:
            print(f"Error rellenando datos de muestras: {e}")
    
    def _crear_excel_ultra_simple(self, recepcion_data: Dict[str, Any], muestras: List[Dict[str, Any]]) -> bytes:
        """Crear un Excel ultra-simple que garantice funcionar"""
        
        try:
            workbook = openpyxl.Workbook()
            worksheet = workbook.active
            worksheet.title = "Recepción de Muestra"
            
            # Solo datos básicos sin estilos complicados
            worksheet['A1'] = "RECEPCIÓN DE MUESTRA CILÍNDRICAS DE CONCRETO"
            worksheet['A3'] = f"Número OT: {recepcion_data.get('numero_ot', '')}"
            worksheet['A4'] = f"Número Recepción: {recepcion_data.get('numero_recepcion', '')}"
            worksheet['A5'] = f"Cliente: {recepcion_data.get('cliente', '')}"
            worksheet['A6'] = f"Proyecto: {recepcion_data.get('proyecto', '')}"
            worksheet['A7'] = f"Fecha Recepción: {recepcion_data.get('fecha_recepcion', '')}"
            
            # Muestras
            worksheet['A9'] = "MUESTRAS:"
            fila = 10
            
            for i, muestra in enumerate(muestras):
                worksheet[f'A{fila}'] = f"Muestra {i+1}: {muestra.get('codigo_muestra', '')} - {muestra.get('estructura', '')}"
                fila += 1
            
            # Guardar en memoria
            excel_buffer = io.BytesIO()
            workbook.save(excel_buffer)
            excel_buffer.seek(0)
            
            print("Excel ultra-simple creado exitosamente")
            return excel_buffer.getvalue()
            
        except Exception as e:
            print(f"Error en Excel ultra-simple: {e}")
            raise e
    
    def _crear_excel_minimo(self, recepcion_data: Dict[str, Any], muestras: List[Dict[str, Any]]) -> bytes:
        """Crear un Excel mínimo en caso de error"""
        
        workbook = openpyxl.Workbook()
        worksheet = workbook.active
        worksheet.title = "Recepción de Muestra"
        
        # Título simple
        worksheet['A1'] = "RECEPCIÓN DE MUESTRA CILÍNDRICAS DE CONCRETO"
        worksheet['A1'].font = Font(name='Arial', size=14, bold=True)
        
        # Datos básicos
        fila = 3
        worksheet[f'A{fila}'] = f"Número OT: {recepcion_data.get('numero_ot', '')}"
        fila += 1
        worksheet[f'A{fila}'] = f"Número Recepción: {recepcion_data.get('numero_recepcion', '')}"
        fila += 1
        worksheet[f'A{fila}'] = f"Cliente: {recepcion_data.get('cliente', '')}"
        fila += 1
        worksheet[f'A{fila}'] = f"Proyecto: {recepcion_data.get('proyecto', '')}"
        fila += 1
        worksheet[f'A{fila}'] = f"Fecha Recepción: {recepcion_data.get('fecha_recepcion', '')}"
        
        # Muestras
        fila += 2
        worksheet[f'A{fila}'] = "MUESTRAS:"
        fila += 1
        
        for i, muestra in enumerate(muestras):
            worksheet[f'A{fila}'] = f"Muestra {i+1}: {muestra.get('codigo_muestra', '')} - {muestra.get('estructura', '')}"
            fila += 1
        
        # Guardar en memoria
        excel_buffer = io.BytesIO()
        workbook.save(excel_buffer)
        excel_buffer.seek(0)
        
        return excel_buffer.getvalue()
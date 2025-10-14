"""
Validador para archivos Excel de órdenes de trabajo
"""

import pandas as pd
from typing import Dict, List, Tuple, Any
import re
from datetime import datetime

class ExcelValidator:
    def __init__(self):
        self.required_fields = {
            'orden': ['numero_ot', 'numero_recepcion'],
            'items': ['item_numero', 'codigo_muestra', 'descripcion', 'cantidad']
        }
        
        self.field_patterns = {
            'numero_ot': r'^\d{4}-\d{2}-[A-Z]{3}$',  # Ejemplo: 1422-25-LEM
            'numero_recepcion': r'^\d{4}-\d{2}$',     # Ejemplo: 1384-25
            'codigo_muestra': r'^\d{4}-[A-Z]{2}-\d{2}$'  # Ejemplo: 4259-CO-25
        }
    
    def validate_excel_file(self, file_path: str) -> Dict[str, Any]:
        """
        Validar archivo Excel completo
        Retorna diccionario con resultado de validación
        """
        try:
            df = pd.read_excel(file_path, sheet_name=0, header=None)
            
            validation_result = {
                'is_valid': True,
                'errors': [],
                'warnings': [],
                'data': {},
                'stats': {}
            }
            
            # Validar estructura básica
            structure_errors = self._validate_structure(df)
            validation_result['errors'].extend(structure_errors)
            
            # Extraer y validar datos de orden
            orden_data, orden_errors = self._extract_and_validate_orden(df)
            validation_result['data']['orden'] = orden_data
            validation_result['errors'].extend(orden_errors)
            
            # Extraer y validar items
            items_data, items_errors = self._extract_and_validate_items(df)
            validation_result['data']['items'] = items_data
            validation_result['errors'].extend(items_errors)
            
            # Generar estadísticas
            validation_result['stats'] = self._generate_stats(df, items_data)
            
            # Determinar si es válido
            validation_result['is_valid'] = len(validation_result['errors']) == 0
            
            return validation_result
            
        except Exception as e:
            return {
                'is_valid': False,
                'errors': [f'Error leyendo archivo: {str(e)}'],
                'warnings': [],
                'data': {},
                'stats': {}
            }
    
    def _validate_structure(self, df: pd.DataFrame) -> List[str]:
        """Validar estructura básica del archivo"""
        errors = []
        
        # Verificar que tenga suficientes filas
        if len(df) < 10:
            errors.append('El archivo debe tener al menos 10 filas')
        
        # Verificar que tenga suficientes columnas
        if len(df.columns) < 8:
            errors.append('El archivo debe tener al menos 8 columnas')
        
        # Verificar presencia de encabezados clave
        required_headers = ['ORDEN DE TRABAJO', 'N° OT', 'ÍTEM']
        found_headers = []
        
        for i in range(min(10, len(df))):
            for j in range(min(5, len(df.columns))):
                cell_value = str(df.iloc[i, j]).strip().upper()
                for header in required_headers:
                    if header in cell_value and header not in found_headers:
                        found_headers.append(header)
        
        for header in required_headers:
            if header not in found_headers:
                errors.append(f'No se encontró el encabezado requerido: {header}')
        
        return errors
    
    def _extract_and_validate_orden(self, df: pd.DataFrame) -> Tuple[Dict[str, Any], List[str]]:
        """Extraer y validar datos de la orden"""
        orden_data = {}
        errors = []
        
        # Buscar número OT
        ot_found = False
        for i in range(len(df)):
            for j in range(len(df.columns)):
                cell_value = str(df.iloc[i, j]).strip()
                if 'N° OT:' in cell_value or 'N° OT' in cell_value:
                    # Extraer número OT del texto
                    ot_match = re.search(r'(\d{4}-\d{2}-[A-Z]{3})', cell_value)
                    if ot_match:
                        orden_data['numero_ot'] = ot_match.group(1)
                        ot_found = True
                        break
            if ot_found:
                break
        
        if not ot_found:
            errors.append('No se encontró el número de OT en el formato correcto')
        
        # Buscar número de recepción
        recepcion_found = False
        for i in range(len(df)):
            for j in range(len(df.columns)):
                cell_value = str(df.iloc[i, j]).strip()
                if 'N° RECEPCIÓN:' in cell_value or 'N° RECEPCIÓN' in cell_value:
                    # Extraer número de recepción
                    rec_match = re.search(r'(\d{4}-\d{2})', cell_value)
                    if rec_match:
                        orden_data['numero_recepcion'] = rec_match.group(1)
                        recepcion_found = True
                        break
            if recepcion_found:
                break
        
        if not recepcion_found:
            errors.append('No se encontró el número de recepción en el formato correcto')
        
        # Validar formatos
        if 'numero_ot' in orden_data:
            if not re.match(self.field_patterns['numero_ot'], orden_data['numero_ot']):
                errors.append(f'Formato de número OT inválido: {orden_data["numero_ot"]}')
        
        if 'numero_recepcion' in orden_data:
            if not re.match(self.field_patterns['numero_recepcion'], orden_data['numero_recepcion']):
                errors.append(f'Formato de número de recepción inválido: {orden_data["numero_recepcion"]}')
        
        return orden_data, errors
    
    def _extract_and_validate_items(self, df: pd.DataFrame) -> Tuple[List[Dict[str, Any]], List[str]]:
        """Extraer y validar items de la orden"""
        items = []
        errors = []
        
        # Buscar sección de items (desde fila 8 hasta encontrar fechas)
        start_row = 8
        end_row = len(df)
        
        for i in range(start_row, len(df)):
            if pd.notna(df.iloc[i, 0]) and "FECHA DE RECEPCIÓN" in str(df.iloc[i, 0]):
                end_row = i
                break
        
        # Procesar items
        for i in range(start_row, end_row):
            if (pd.notna(df.iloc[i, 0]) and 
                str(df.iloc[i, 0]).strip().isdigit() and
                pd.notna(df.iloc[i, 1]) and 
                str(df.iloc[i, 1]).strip()):
                
                item_data = {
                    'item_numero': int(df.iloc[i, 0]),
                    'codigo_muestra': str(df.iloc[i, 1]).strip(),
                    'descripcion': str(df.iloc[i, 3]).strip() if pd.notna(df.iloc[i, 3]) else "",
                    'cantidad': int(df.iloc[i, 7]) if pd.notna(df.iloc[i, 7]) else 1,
                    'especificacion': str(df.iloc[i, 8]).strip() if pd.notna(df.iloc[i, 8]) else ""
                }
                
                # Validar item
                item_errors = self._validate_item(item_data)
                if item_errors:
                    errors.extend([f"Item {item_data['item_numero']}: {error}" for error in item_errors])
                else:
                    items.append(item_data)
        
        if not items:
            errors.append('No se encontraron items válidos en la orden')
        
        return items, errors
    
    def _validate_item(self, item: Dict[str, Any]) -> List[str]:
        """Validar un item individual"""
        errors = []
        
        # Validar campos requeridos
        for field in self.required_fields['items']:
            if field not in item or not item[field]:
                errors.append(f'Campo requerido faltante: {field}')
        
        # Validar formato de código de muestra
        if 'codigo_muestra' in item:
            if not re.match(self.field_patterns['codigo_muestra'], item['codigo_muestra']):
                errors.append(f'Formato de código de muestra inválido: {item["codigo_muestra"]}')
        
        # Validar cantidad
        if 'cantidad' in item:
            if not isinstance(item['cantidad'], int) or item['cantidad'] <= 0:
                errors.append(f'Cantidad debe ser un número entero positivo: {item["cantidad"]}')
        
        return errors
    
    def _generate_stats(self, df: pd.DataFrame, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generar estadísticas del archivo"""
        return {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'total_items': len(items),
            'total_cantidad': sum(item.get('cantidad', 0) for item in items),
            'file_size_kb': 0,  # Se calculará en el servicio principal
            'validation_timestamp': datetime.now().isoformat()
        }

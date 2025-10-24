import io
from copy import copy
from typing import List, Dict, Any, Optional

import openpyxl
from openpyxl.styles import Alignment, Border, Font

class ExcelCollaborativeService:
    """Servicio para modificar archivos Excel existentes con datos del formulario"""
    
    # Constantes para el template
    TEMPLATE_PATH = "templates/recepcion_template.xlsx"
    FILA_INICIO_MUESTRAS = 23
    FILA_FOOTER_ORIGINAL = 42
    MAX_ITEMS_SIN_EXPANSION = 17
    ALTURA_FILA_57 = 30.0
    ALTURA_FILA_ESTANDAR = 15.0
    
    def __init__(self):
        self.template_path = self.TEMPLATE_PATH
    
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
                # Aplicar wrap_text para campos de texto largo
                elif cell_ref in ['H46', 'D49', 'H49']:  # fecha estimada, entregado por, recibido por
                    target_cell.alignment = Alignment(horizontal='center', vertical='bottom', wrap_text=True)
                else:
                    target_cell.alignment = Alignment(horizontal='left', vertical='bottom', wrap_text=True)
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
        """Rellenar datos de las muestras manteniendo el footer en su posición."""

        def safe_set_cell(cell_ref: str, value: Any) -> None:
            try:
                if isinstance(value, str):
                    value = value.strip()

                cell = worksheet[cell_ref]
                destino = cell

                for merged_range in worksheet.merged_cells.ranges:
                    if cell_ref in merged_range:
                        destino = worksheet.cell(row=merged_range.min_row, column=merged_range.min_col)
                        break

                borde = destino.border
                relleno = destino.fill
                fuente = destino.font
                alineacion = destino.alignment

                destino.value = value
                destino.border = borde
                destino.fill = relleno
                destino.font = fuente
                destino.alignment = alineacion
            except Exception:
                pass

        columnas_tabla = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']

        fila_inicio = self.FILA_INICIO_MUESTRAS
        total_items = len(muestras)
        altura_item = worksheet.row_dimensions[fila_inicio].height or self.ALTURA_FILA_ESTANDAR

        footer_row = self._find_footer_row(worksheet)
        if not footer_row:
            raise ValueError("No se encontró el footer en la plantilla original")

        footer_row = self._asegurar_capacidad_items(worksheet, footer_row, total_items)
        self._unmerge_item_area(worksheet, footer_row)

        for indice, muestra in enumerate(muestras):
            fila_actual = fila_inicio + indice
            worksheet.row_dimensions[fila_actual].height = altura_item

            safe_set_cell(f'A{fila_actual}', muestra.get('item_numero') or indice + 1)
            codigo_ref = f'B{fila_actual}'
            safe_set_cell(codigo_ref, muestra.get('codigo_muestra_lem', ''))
            try:
                worksheet[codigo_ref].number_format = '@'
            except Exception:
                pass
            safe_set_cell(f'D{fila_actual}', muestra.get('identificacion_muestra', ''))
            safe_set_cell(f'E{fila_actual}', muestra.get('estructura', ''))
            safe_set_cell(f'F{fila_actual}', muestra.get('fc_kg_cm2', ''))
            safe_set_cell(f'G{fila_actual}', muestra.get('fecha_moldeo', ''))
            safe_set_cell(f'H{fila_actual}', muestra.get('hora_moldeo', ''))
            safe_set_cell(f'I{fila_actual}', muestra.get('edad', ''))
            safe_set_cell(f'J{fila_actual}', muestra.get('fecha_rotura', ''))
            safe_set_cell(f'K{fila_actual}', 'SI' if muestra.get('requiere_densidad', False) else 'NO')
            self._merge_item_row(worksheet, fila_actual)

        self._limpiar_filas_restantes(worksheet, fila_inicio + total_items, footer_row, columnas_tabla)
        self._eliminar_segunda_linea_web(worksheet)
    
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

    def _asegurar_capacidad_items(self, worksheet, footer_row: int, total_items: int) -> int:
        capacidad_actual = footer_row - self.FILA_INICIO_MUESTRAS
        if total_items <= capacidad_actual:
            return footer_row

        filas_extra = total_items - capacidad_actual
        fila_patron = footer_row - 2
        fila_separador = footer_row - 1

        worksheet.insert_rows(fila_separador, amount=filas_extra)

        for offset in range(filas_extra):
            fila_destino = fila_separador + offset
            self._copiar_estilo_fila(worksheet, fila_patron, fila_destino)
            self._clonar_fusiones_fila(worksheet, fila_patron, fila_destino)

        return footer_row + filas_extra

    def _copiar_estilo_fila(self, worksheet, fila_origen: int, fila_destino: int) -> None:
        worksheet.row_dimensions[fila_destino].height = worksheet.row_dimensions[fila_origen].height

        columnas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
        for columna in columnas:
            celda_origen = worksheet[f'{columna}{fila_origen}']
            celda_destino = worksheet[f'{columna}{fila_destino}']
            celda_destino.value = None
            celda_destino.font = copy(celda_origen.font)
            celda_destino.border = copy(celda_origen.border)
            celda_destino.fill = copy(celda_origen.fill)
            celda_destino.number_format = celda_origen.number_format
            celda_destino.protection = copy(celda_origen.protection)
            celda_destino.alignment = copy(celda_origen.alignment)
        self._merge_item_row(worksheet, fila_destino)

    def _clonar_fusiones_fila(self, worksheet, fila_origen: int, fila_destino: int) -> None:
        rangos_existentes = {r.coord for r in worksheet.merged_cells.ranges}

        for rango in list(worksheet.merged_cells.ranges):
            if rango.min_row == rango.max_row == fila_origen:
                celda_inicio = worksheet.cell(row=fila_destino, column=rango.min_col)
                celda_fin = worksheet.cell(row=fila_destino, column=rango.max_col)
                coord = f"{celda_inicio.coordinate}:{celda_fin.coordinate}"
                if coord not in rangos_existentes:
                    worksheet.merge_cells(coord)
                    rangos_existentes.add(coord)
        
        # Asegurar bordes después de clonar fusiones
        from openpyxl.styles import Border, Side
        thin_border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )
        
        # Aplicar bordes a todas las celdas de la fila destino
        for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']:
            try:
                worksheet[f'{col}{fila_destino}'].border = thin_border
            except Exception:
                pass

    def _limpiar_filas_restantes(self, worksheet, fila_inicio_libre: int, fila_footer: int, columnas: List[str]) -> None:
        """Limpiar filas restantes manteniendo el formato correcto"""
        for fila in range(fila_inicio_libre, fila_footer):
            # Solo limpiar si no es una fila crítica del footer
            if fila < fila_footer - 5:  # No limpiar las últimas 5 filas del footer
                for columna in columnas:
                    referencia = f'{columna}{fila}'
                    try:
                        celda = worksheet[referencia]
                        destino = celda
                        for rango in worksheet.merged_cells.ranges:
                            if referencia in rango:
                                destino = worksheet.cell(row=rango.min_row, column=rango.min_col)
                                break
                        destino.value = ""
                    except Exception:
                        continue
                self._merge_item_row(worksheet, fila)

    def _find_footer_row(self, worksheet) -> Optional[int]:
        for fila in range(1, worksheet.max_row + 1):
            valor = worksheet.cell(row=fila, column=1).value
            if isinstance(valor, str) and '(1) OBLIGATORIO' in valor:
                return fila
        return None

    def _unmerge_item_area(self, worksheet, footer_row: int) -> None:
        inicio = self.FILA_INICIO_MUESTRAS
        fin = footer_row - 1
        to_unmerge = []
        for rango in list(worksheet.merged_cells.ranges):
            if rango.max_row >= inicio and rango.min_row <= fin:
                to_unmerge.append(rango.coord)
        for coord in to_unmerge:
            worksheet.unmerge_cells(coord)

    @staticmethod
    def _merge_item_row(worksheet, fila: int) -> None:
        coord = f"B{fila}:C{fila}"
        for rango in worksheet.merged_cells.ranges:
            if rango.coord == coord:
                return
        worksheet.merge_cells(coord)
        
        # Asegurar que los bordes se mantengan después de la fusión
        from openpyxl.styles import Border, Side
        thin_border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )
        
        # Aplicar bordes a todas las celdas de la fila
        for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']:
            try:
                worksheet[f'{col}{fila}'].border = thin_border
            except Exception:
                pass

    def _eliminar_segunda_linea_web(self, worksheet) -> None:
        """Elimina el texto duplicado con la información de Web en el footer, pero mantiene la información de contacto."""

        ocurrencias = 0
        for row in range(1, worksheet.max_row + 1):
            valor = worksheet.cell(row=row, column=1).value
            if isinstance(valor, str) and "Web: www.geofal.com.pe" in valor:
                ocurrencias += 1
                if ocurrencias >= 2:
                    # Solo eliminar si es realmente duplicado, no la información de contacto principal
                    celda = worksheet.cell(row=row, column=1)
                    coordenada = celda.coordinate
                    celda_destino = celda
                    for merged_range in worksheet.merged_cells.ranges:
                        if coordenada in merged_range:
                            celda_destino = worksheet.cell(row=merged_range.min_row, column=merged_range.min_col)
                            break
                    # Verificar si es realmente un duplicado antes de eliminar
                    if "Web: www.geofal.com.pe" in str(celda_destino.value) and ocurrencias > 1:
                        celda_destino.value = ""
                    break





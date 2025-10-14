"""
Servicio para procesamiento de archivos Excel
Maneja importación, exportación y generación de plantillas
"""

import pandas as pd
import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
from openpyxl.utils.dataframe import dataframe_to_rows
from io import BytesIO
import tempfile
import os
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from models import OrdenTrabajo, ItemOrden
from schemas import OrdenTrabajoCreate, ItemOrdenCreate

class ExcelService:
    def __init__(self):
        self.template_path = "templates/orden_trabajo_template.xlsx"
    
    def procesar_archivo_excel(self, contenido: bytes, db: Session) -> OrdenTrabajo:
        """Procesar archivo Excel subido y crear orden de trabajo"""
        try:
            # Leer archivo Excel
            df = pd.read_excel(BytesIO(contenido), sheet_name=0, header=None)
            
            # Extraer datos de la orden
            orden_data = self._extraer_datos_orden(df)
            
            # Extraer items
            items_data = self._extraer_items(df)
            
            # Crear orden en base de datos
            orden = OrdenTrabajo(**orden_data)
            db.add(orden)
            db.flush()  # Para obtener el ID
            
            # Crear items
            for item_data in items_data:
                item = ItemOrden(orden_id=orden.id, **item_data)
                db.add(item)
            
            db.commit()
            db.refresh(orden)
            
            return orden
            
        except Exception as e:
            db.rollback()
            raise Exception(f"Error procesando archivo Excel: {str(e)}")
    
    def _extraer_datos_orden(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Extraer datos de la orden desde el DataFrame"""
        datos = {}
        
        # Buscar número OT (fila 5, columna 0)
        if len(df) > 5 and pd.notna(df.iloc[5, 0]):
            datos['numero_ot'] = str(df.iloc[5, 0]).strip()
        
        # Buscar número recepción (fila 5, columna 5)
        if len(df) > 5 and pd.notna(df.iloc[5, 5]):
            datos['numero_recepcion'] = str(df.iloc[5, 5]).strip()
        
        # Buscar referencia (fila 5, columna 7)
        if len(df) > 5 and pd.notna(df.iloc[5, 7]):
            datos['referencia'] = str(df.iloc[5, 7]).strip()
        
        # Buscar fechas
        for i in range(len(df)):
            if pd.notna(df.iloc[i, 0]) and "FECHA DE RECEPCIÓN" in str(df.iloc[i, 0]):
                if pd.notna(df.iloc[i, 2]):
                    try:
                        datos['fecha_recepcion'] = pd.to_datetime(df.iloc[i, 2])
                    except:
                        pass
                break
        
        # Buscar plazo de entrega
        for i in range(len(df)):
            if pd.notna(df.iloc[i, 0]) and "PLAZO DE ENTREGA" in str(df.iloc[i, 0]):
                if pd.notna(df.iloc[i, 2]):
                    try:
                        datos['plazo_entrega_dias'] = int(df.iloc[i, 2])
                    except:
                        pass
                break
        
        # Buscar observaciones
        for i in range(len(df)):
            if pd.notna(df.iloc[i, 0]) and "OBSERVACIONES" in str(df.iloc[i, 0]):
                if pd.notna(df.iloc[i, 1]):
                    datos['observaciones'] = str(df.iloc[i, 1]).strip()
                break
        
        # Buscar aperturada por
        for i in range(len(df)):
            if pd.notna(df.iloc[i, 0]) and "O/T APERTURADA POR" in str(df.iloc[i, 0]):
                if pd.notna(df.iloc[i, 2]):
                    datos['aperturada_por'] = str(df.iloc[i, 2]).strip()
                break
        
        # Buscar designada a
        for i in range(len(df)):
            if pd.notna(df.iloc[i, 0]) and "OT DESIGADA A" in str(df.iloc[i, 0]):
                if pd.notna(df.iloc[i, 2]):
                    datos['designada_a'] = str(df.iloc[i, 2]).strip()
                break
        
        return datos
    
    def _extraer_items(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Extraer items de la orden desde el DataFrame"""
        items = []
        
        # Buscar la sección de items (desde fila 8 hasta encontrar fechas)
        for i in range(8, len(df)):
            if pd.notna(df.iloc[i, 0]) and "FECHA DE RECEPCIÓN" in str(df.iloc[i, 0]):
                break
            
            # Verificar si hay datos en las columnas de item
            if (pd.notna(df.iloc[i, 0]) and str(df.iloc[i, 0]).strip().isdigit() and
                pd.notna(df.iloc[i, 1]) and str(df.iloc[i, 1]).strip()):
                
                item_data = {
                    'item_numero': int(df.iloc[i, 0]),
                    'codigo_muestra': str(df.iloc[i, 1]).strip(),
                    'descripcion': str(df.iloc[i, 3]).strip() if pd.notna(df.iloc[i, 3]) else "",
                    'cantidad': int(df.iloc[i, 7]) if pd.notna(df.iloc[i, 7]) else 1,
                    'especificacion': str(df.iloc[i, 8]).strip() if pd.notna(df.iloc[i, 8]) else ""
                }
                items.append(item_data)
        
        return items
    
    def generar_plantilla_excel(self, orden: OrdenTrabajo) -> str:
        """Generar plantilla Excel prellenada para una orden"""
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Orden de Trabajo"
        
        # Configurar estilos
        header_font = Font(bold=True, size=12)
        title_font = Font(bold=True, size=14)
        border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )
        
        # Encabezado
        ws['A1'] = "ORDEN DE TRABAJO"
        ws['A1'].font = title_font
        ws.merge_cells('A1:J1')
        
        # Información de la orden
        ws['A3'] = "CÓDIGO:"
        ws['B3'] = orden.codigo_laboratorio
        ws['A4'] = "VERSIÓN:"
        ws['B4'] = orden.version
        ws['A5'] = "FECHA:"
        ws['B5'] = datetime.now().strftime("%d/%m/%Y")
        ws['A6'] = "PÁGINA:"
        ws['B6'] = "1 de 1"
        
        # Datos principales
        ws['A8'] = f"N° OT: {orden.numero_ot}"
        ws['E8'] = f"N° RECEPCIÓN: {orden.numero_recepcion}"
        ws['G8'] = f"REFERENCIA: {orden.referencia or '-'}"
        
        # Encabezados de tabla
        ws['A10'] = "ÍTEM"
        ws['B10'] = "CÓDIGO DE MUESTRA"
        ws['D10'] = "DESCRIPCIÓN"
        ws['H10'] = "CANTIDAD"
        
        # Aplicar estilos a encabezados
        for cell in ['A10', 'B10', 'D10', 'H10']:
            ws[cell].font = header_font
            ws[cell].border = border
        
        # Llenar items
        row = 11
        for item in orden.items:
            ws[f'A{row}'] = item.item_numero
            ws[f'B{row}'] = item.codigo_muestra
            ws[f'D{row}'] = item.descripcion
            ws[f'H{row}'] = item.cantidad
            if item.especificacion:
                ws[f'I{row}'] = item.especificacion
            
            # Aplicar bordes
            for col in ['A', 'B', 'D', 'H', 'I']:
                ws[f'{col}{row}'].border = border
            
            row += 1
        
        # Sección de fechas y plazos
        fecha_row = row + 2
        ws[f'A{fecha_row}'] = "FECHA DE RECEPCIÓN:"
        ws[f'C{fecha_row}'] = orden.fecha_recepcion.strftime("%d/%m/%Y") if orden.fecha_recepcion else ""
        ws[f'E{fecha_row}'] = "INICIO PROGRAMADO:"
        ws[f'G{fecha_row}'] = orden.fecha_inicio_programado.strftime("%d/%m/%Y") if orden.fecha_inicio_programado else ""
        
        ws[f'A{fecha_row+1}'] = "PLAZO DE ENTREGA (DIAS):"
        ws[f'C{fecha_row+1}'] = orden.plazo_entrega_dias or ""
        ws[f'E{fecha_row+1}'] = "FIN PROGRAMADO:"
        ws[f'G{fecha_row+1}'] = orden.fecha_fin_programado.strftime("%d/%m/%Y") if orden.fecha_fin_programado else ""
        
        # Observaciones
        obs_row = fecha_row + 3
        ws[f'A{obs_row}'] = "OBSERVACIONES:"
        if orden.observaciones:
            ws[f'B{obs_row}'] = orden.observaciones
        
        # Responsables
        resp_row = obs_row + 3
        ws[f'A{resp_row}'] = "O/T APERTURADA POR:"
        ws[f'C{resp_row}'] = orden.aperturada_por or ""
        ws[f'E{resp_row}'] = "OT DESIGNADA A:"
        ws[f'G{resp_row}'] = orden.designada_a or ""
        
        # Ajustar ancho de columnas
        ws.column_dimensions['A'].width = 8
        ws.column_dimensions['B'].width = 20
        ws.column_dimensions['C'].width = 15
        ws.column_dimensions['D'].width = 30
        ws.column_dimensions['E'].width = 18
        ws.column_dimensions['F'].width = 15
        ws.column_dimensions['G'].width = 15
        ws.column_dimensions['H'].width = 10
        ws.column_dimensions['I'].width = 15
        
        # Guardar archivo temporal
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        wb.save(temp_file.name)
        temp_file.close()
        
        return temp_file.name
    
    def exportar_ordenes(self, orden_ids: List[int], db: Session) -> str:
        """Exportar múltiples órdenes a un archivo Excel"""
        ordenes = db.query(OrdenTrabajo).filter(OrdenTrabajo.id.in_(orden_ids)).all()
        
        if not ordenes:
            raise Exception("No se encontraron órdenes para exportar")
        
        wb = openpyxl.Workbook()
        
        # Crear hoja de resumen
        ws_resumen = wb.active
        ws_resumen.title = "Resumen Órdenes"
        
        # Encabezados del resumen
        headers = ["ID", "N° OT", "N° RECEPCIÓN", "REFERENCIA", "FECHA CREACIÓN", 
                  "ESTADO", "ITEMS", "APERTURADA POR", "DESIGNADA A"]
        
        for col, header in enumerate(headers, 1):
            ws_resumen.cell(row=1, column=col, value=header)
            ws_resumen.cell(row=1, column=col).font = Font(bold=True)
        
        # Llenar datos del resumen
        for row, orden in enumerate(ordenes, 2):
            ws_resumen.cell(row=row, column=1, value=orden.id)
            ws_resumen.cell(row=row, column=2, value=orden.numero_ot)
            ws_resumen.cell(row=row, column=3, value=orden.numero_recepcion)
            ws_resumen.cell(row=row, column=4, value=orden.referencia or "")
            ws_resumen.cell(row=row, column=5, value=orden.fecha_creacion.strftime("%d/%m/%Y"))
            ws_resumen.cell(row=row, column=6, value=orden.estado)
            ws_resumen.cell(row=row, column=7, value=len(orden.items))
            ws_resumen.cell(row=row, column=8, value=orden.aperturada_por or "")
            ws_resumen.cell(row=row, column=9, value=orden.designada_a or "")
        
        # Crear hoja para cada orden
        for orden in ordenes:
            ws = wb.create_sheet(title=f"OT-{orden.numero_ot}")
            self._llenar_hoja_orden(ws, orden)
        
        # Guardar archivo temporal
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        wb.save(temp_file.name)
        temp_file.close()
        
        return temp_file.name
    
    def _llenar_hoja_orden(self, ws, orden: OrdenTrabajo):
        """Llenar una hoja con los datos de una orden específica"""
        # Implementar llenado de hoja individual
        # Similar a generar_plantilla_excel pero para exportación
        pass

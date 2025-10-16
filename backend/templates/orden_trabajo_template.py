"""
Generador de plantilla Excel para órdenes de trabajo
Replica exactamente el diseño del PDF original
"""

import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
from openpyxl.utils import get_column_letter
from datetime import datetime
import tempfile
import os

class OrdenTrabajoTemplate:
    def __init__(self):
        self.wb = None
        self.ws = None
        
    def crear_plantilla_vacia(self):
        """Crear plantilla Excel vacía basada en el diseño del PDF"""
        self.wb = openpyxl.Workbook()
        self.ws = self.wb.active
        self.ws.title = "Orden de Trabajo"
        
        # Configurar estilos
        self._configurar_estilos()
        
        # Crear estructura del formulario
        self._crear_encabezado()
        self._crear_datos_principales()
        self._crear_tabla_items()
        self._crear_seccion_fechas()
        self._crear_observaciones()
        self._crear_responsables()
        
        # Ajustar formato
        self._ajustar_formato()
        
        return self.wb
    
    def _configurar_estilos(self):
        """Configurar estilos para el documento"""
        self.estilos = {
            'titulo_principal': Font(name='Arial', size=14, bold=True),
            'titulo_seccion': Font(name='Arial', size=12, bold=True),
            'texto_normal': Font(name='Arial', size=10),
            'texto_pequeno': Font(name='Arial', size=9),
            'borde_completo': Border(
                left=Side(style='thin'),
                right=Side(style='thin'),
                top=Side(style='thin'),
                bottom=Side(style='thin')
            ),
            'borde_superior': Border(top=Side(style='thin')),
            'borde_inferior': Border(bottom=Side(style='thin')),
            'centrado': Alignment(horizontal='center', vertical='center'),
            'izquierda': Alignment(horizontal='left', vertical='center'),
            'relleno_gris': PatternFill(start_color='D3D3D3', end_color='D3D3D3', fill_type='solid')
        }
    
    def _crear_encabezado(self):
        """Crear encabezado del documento"""
        # Título principal
        self.ws['A1'] = "ORDEN DE TRABAJO"
        self.ws['A1'].font = self.estilos['titulo_principal']
        self.ws['A1'].alignment = self.estilos['centrado']
        self.ws.merge_cells('A1:J1')
        
        # Información del documento
        self.ws['A3'] = "CÓDIGO:"
        self.ws['B3'] = "F-LEM-P-02.01"
        self.ws['A4'] = "VERSIÓN:"
        self.ws['B4'] = "03"
        self.ws['A5'] = "FECHA:"
        self.ws['B5'] = datetime.now().strftime("%d/%m/%Y")
        self.ws['A6'] = "PÁGINA:"
        self.ws['B6'] = "1 de 1"
        
        # Aplicar estilos
        for cell in ['A3', 'A4', 'A5', 'A6']:
            self.ws[cell].font = self.estilos['texto_normal']
        for cell in ['B3', 'B4', 'B5', 'B6']:
            self.ws[cell].font = self.estilos['texto_normal']
    
    def _crear_datos_principales(self):
        """Crear sección de datos principales"""
        # Línea de separación
        self.ws['A7'] = ""
        
        # Datos principales
        self.ws['A8'] = "N° OT:"
        self.ws['B8'] = ""  # Campo editable
        self.ws['E8'] = "N° RECEPCIÓN:"
        self.ws['F8'] = ""  # Campo editable
        self.ws['H8'] = "REFERENCIA:"
        self.ws['I8'] = ""  # Campo editable
        
        # Nota sobre referencia
        self.ws['A9'] = "(Completar solo si el requerimiento proviene del área de Ingeniería)"
        self.ws.merge_cells('A9:J9')
        self.ws['A9'].font = self.estilos['texto_pequeno']
        self.ws['A9'].alignment = self.estilos['izquierda']
        
        # Aplicar estilos
        for cell in ['A8', 'E8', 'H8']:
            self.ws[cell].font = self.estilos['texto_normal']
        for cell in ['B8', 'F8', 'I8']:
            self.ws[cell].font = self.estilos['texto_normal']
            self.ws[cell].border = self.estilos['borde_inferior']
    
    def _crear_tabla_items(self):
        """Crear tabla de items"""
        # Encabezados de la tabla
        self.ws['A11'] = "ÍTEM"
        self.ws['B11'] = "CÓDIGO DE MUESTRA"
        self.ws['D11'] = "DESCRIPCIÓN"
        self.ws['H11'] = "CANTIDAD"
        
        # Aplicar estilos a encabezados
        for cell in ['A11', 'B11', 'D11', 'H11']:
            self.ws[cell].font = self.estilos['titulo_seccion']
            self.ws[cell].alignment = self.estilos['centrado']
            self.ws[cell].border = self.estilos['borde_completo']
            self.ws[cell].fill = self.estilos['relleno_gris']
        
        # Crear filas para items (máximo 20 items)
        for i in range(12, 32):  # Filas 12 a 31
            self.ws[f'A{i}'] = i - 11  # Número de item
            self.ws[f'A{i}'].font = self.estilos['texto_normal']
            self.ws[f'A{i}'].alignment = self.estilos['centrado']
            self.ws[f'A{i}'].border = self.estilos['borde_completo']
            
            # Campos editables
            for col in ['B', 'D', 'H']:
                self.ws[f'{col}{i}'].border = self.estilos['borde_completo']
                self.ws[f'{col}{i}'].font = self.estilos['texto_normal']
    
    def _crear_seccion_fechas(self):
        """Crear sección de fechas y plazos"""
        row = 33
        
        # Fecha de recepción
        self.ws[f'A{row}'] = "FECHA DE RECEPCIÓN:"
        self.ws[f'C{row}'] = ""  # Campo editable
        self.ws[f'E{row}'] = "INICIO PROGRAMADO:"
        self.ws[f'G{row}'] = ""  # Campo editable
        self.ws[f'I{row}'] = "INICIO REAL:"
        self.ws[f'J{row}'] = ""  # Campo editable
        
        row += 1
        
        # Plazo de entrega
        self.ws[f'A{row}'] = "PLAZO DE ENTREGA (DIAS):"
        self.ws[f'C{row}'] = ""  # Campo editable
        self.ws[f'E{row}'] = "FIN PROGRAMADO:"
        self.ws[f'G{row}'] = ""  # Campo editable
        self.ws[f'I{row}'] = "FIN REAL:"
        self.ws[f'J{row}'] = ""  # Campo editable
        
        row += 1
        
        # Variaciones
        self.ws[f'A{row}'] = "VARIACIÓN DE INICIO:"
        self.ws[f'C{row}'] = ""  # Campo editable
        self.ws[f'E{row}'] = "VARIACIÓN DE FIN:"
        self.ws[f'G{row}'] = ""  # Campo editable
        self.ws[f'I{row}'] = "DURACIÓN REAL DE EJECUCIÓN (DIAS):"
        self.ws[f'J{row}'] = ""  # Campo editable
        
        # Aplicar estilos
        for r in range(33, 36):
            for cell in [f'A{r}', f'E{r}', f'I{r}']:
                self.ws[cell].font = self.estilos['texto_normal']
            for cell in [f'C{r}', f'G{r}', f'J{r}']:
                self.ws[cell].font = self.estilos['texto_normal']
                self.ws[cell].border = self.estilos['borde_inferior']
    
    def _crear_observaciones(self):
        """Crear sección de observaciones"""
        row = 37
        
        self.ws[f'A{row}'] = "OBSERVACIONES:"
        self.ws[f'A{row}'].font = self.estilos['texto_normal']
        
        # Crear área de texto para observaciones (3 filas)
        for i in range(row + 1, row + 4):
            self.ws.merge_cells(f'A{i}:J{i}')
            self.ws[f'A{i}'].border = self.estilos['borde_completo']
            self.ws[f'A{i}'].alignment = self.estilos['izquierda']
            self.ws[f'A{i}'].font = self.estilos['texto_normal']
    
    def _crear_responsables(self):
        """Crear sección de responsables"""
        row = 42
        
        self.ws[f'A{row}'] = "O/T APERTURADA POR:"
        self.ws[f'C{row}'] = ""  # Campo editable
        self.ws[f'E{row}'] = "OT DESIGNADA A:"
        self.ws[f'G{row}'] = ""  # Campo editable
        self.ws[f'I{row}'] = "(Colocar el nombre de los técnicos)"
        
        # Aplicar estilos
        for cell in [f'A{row}', f'E{row}']:
            self.ws[cell].font = self.estilos['texto_normal']
        for cell in [f'C{row}', f'G{row}']:
            self.ws[cell].font = self.estilos['texto_normal']
            self.ws[cell].border = self.estilos['borde_inferior']
        self.ws[f'I{row}'].font = self.estilos['texto_pequeno']
    
    def _ajustar_formato(self):
        """Ajustar formato general del documento"""
        # Ajustar ancho de columnas
        column_widths = {
            'A': 8,   # Ítem
            'B': 20,  # Código muestra
            'C': 15,  # Fechas
            'D': 30,  # Descripción
            'E': 18,  # Etiquetas
            'F': 15,  # Valores
            'G': 15,  # Valores
            'H': 10,  # Cantidad
            'I': 20,  # Referencia/Responsables
            'J': 15   # Valores adicionales
        }
        
        for col, width in column_widths.items():
            self.ws.column_dimensions[col].width = width
        
        # Ajustar altura de filas
        for row in range(1, 50):
            self.ws.row_dimensions[row].height = 20
    
    def guardar_plantilla(self, ruta_archivo=None):
        """Guardar la plantilla en un archivo"""
        if ruta_archivo is None:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
            ruta_archivo = temp_file.name
            temp_file.close()
        
        self.wb.save(ruta_archivo)
        return ruta_archivo

def crear_plantilla_orden_trabajo():
    """Función principal para crear la plantilla"""
    template = OrdenTrabajoTemplate()
    wb = template.crear_plantilla_vacia()
    ruta = template.guardar_plantilla()
    return ruta

if __name__ == "__main__":
    # Crear plantilla de ejemplo
    ruta_plantilla = crear_plantilla_orden_trabajo()
    print(f"Plantilla creada en: {ruta_plantilla}")

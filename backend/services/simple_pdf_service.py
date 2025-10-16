"""
Servicio simple para generación de PDF usando ReportLab
Diseño más fácil y visual como Visual Basic
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
import io
from typing import List, Dict, Any
from datetime import datetime

class SimplePDFService:
    """Servicio simple para generar PDFs con diseño visual"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_styles()
    
    def setup_styles(self):
        """Configurar estilos visuales"""
        # Título principal
        self.styles.add(ParagraphStyle(
            name='Titulo',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            textColor=colors.black
        ))
        
        # Sección
        self.styles.add(ParagraphStyle(
            name='Seccion',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceAfter=10,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold',
            textColor=colors.white,
            backColor=colors.darkblue,
            borderPadding=8
        ))
        
        # Campo
        self.styles.add(ParagraphStyle(
            name='Campo',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=4,
            alignment=TA_LEFT,
            fontName='Helvetica',
            leftIndent=20
        ))
        
        # Etiqueta
        self.styles.add(ParagraphStyle(
            name='Etiqueta',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=4,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold',
            textColor=colors.darkblue
        ))
    
    def generar_pdf_recepcion(self, recepcion_data: Dict[str, Any], muestras: List[Dict[str, Any]]) -> bytes:
        """Generar PDF del formulario de recepción"""
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        story = []
        
        # Título
        story.append(Paragraph("RECEPCIÓN DE MUESTRA CILÍNDRICAS DE CONCRETO", self.styles['Titulo']))
        story.append(Spacer(1, 20))
        
        # Información Principal
        story.append(Paragraph("INFORMACIÓN PRINCIPAL", self.styles['Seccion']))
        story.extend(self._crear_campos([
            ("Número OT", recepcion_data.get('numero_ot', '')),
            ("Número Recepción", recepcion_data.get('numero_recepcion', '')),
            ("Número Cotización", recepcion_data.get('numero_cotizacion', '')),
            ("Código Trazabilidad", recepcion_data.get('codigo_trazabilidad', '')),
            ("Asunto", recepcion_data.get('asunto', ''))
        ]))
        story.append(Spacer(1, 15))
        
        # Cliente
        story.append(Paragraph("INFORMACIÓN DEL CLIENTE", self.styles['Seccion']))
        story.extend(self._crear_campos([
            ("Cliente", recepcion_data.get('cliente', '')),
            ("Domicilio Legal", recepcion_data.get('domicilio_legal', '')),
            ("RUC", recepcion_data.get('ruc', '')),
            ("Persona Contacto", recepcion_data.get('persona_contacto', '')),
            ("Email", recepcion_data.get('email', '')),
            ("Teléfono", recepcion_data.get('telefono', ''))
        ]))
        story.append(Spacer(1, 15))
        
        # Solicitante
        story.append(Paragraph("INFORMACIÓN DEL SOLICITANTE", self.styles['Seccion']))
        story.extend(self._crear_campos([
            ("Solicitante", recepcion_data.get('solicitante', '')),
            ("Domicilio Solicitante", recepcion_data.get('domicilio_solicitante', '')),
            ("Proyecto", recepcion_data.get('proyecto', '')),
            ("Ubicación", recepcion_data.get('ubicacion', ''))
        ]))
        story.append(Spacer(1, 15))
        
        # Tabla de Muestras
        story.append(Paragraph("MUESTRAS DE CONCRETO", self.styles['Seccion']))
        story.extend(self._crear_tabla_muestras(muestras))
        story.append(Spacer(1, 15))
        
        # Fechas y Emisión
        story.append(Paragraph("FECHAS Y EMISIÓN", self.styles['Seccion']))
        story.extend(self._crear_campos([
            ("Fecha Recepción", recepcion_data.get('fecha_recepcion', '')),
            ("Fecha Estimada Culminación", recepcion_data.get('fecha_estimada_culminacion', '')),
            ("Emisión Física", "Sí" if recepcion_data.get('emision_fisica', False) else "No"),
            ("Emisión Digital", "Sí" if recepcion_data.get('emision_digital', False) else "No")
        ]))
        story.append(Spacer(1, 15))
        
        # Responsables
        story.append(Paragraph("RESPONSABLES", self.styles['Seccion']))
        story.extend(self._crear_campos([
            ("Entregado por", recepcion_data.get('entregado_por', '')),
            ("Recibido por", recepcion_data.get('recibido_por', ''))
        ]))
        story.append(Spacer(1, 20))
        
        # Pie de página
        story.append(Paragraph("INFORMACIÓN DEL LABORATORIO", self.styles['Seccion']))
        story.extend(self._crear_campos([
            ("Código Laboratorio", recepcion_data.get('codigo_laboratorio', 'F-LEM-P-01.02')),
            ("Versión", recepcion_data.get('version', '07')),
            ("Fecha de Generación", datetime.now().strftime('%d/%m/%Y %H:%M:%S'))
        ]))
        
        # Construir PDF
        doc.build(story)
        
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content
    
    def _crear_campos(self, campos: List[tuple]) -> List:
        """Crear lista de campos con etiqueta y valor"""
        elements = []
        for etiqueta, valor in campos:
            elements.append(Paragraph(f"<b>{etiqueta}:</b> {valor}", self.styles['Campo']))
        return elements
    
    def _crear_tabla_muestras(self, muestras: List[Dict[str, Any]]) -> List:
        """Crear tabla de muestras"""
        elements = []
        
        # Encabezados
        headers = [
            'Item', 'Código', 'Identificación', 'Estructura', 
            'Fc (kg/cm²)', 'Fecha Moldeo', 'Hora', 'Edad', 
            'Fecha Rotura', 'Densidad'
        ]
        
        # Datos
        data = [headers]
        for muestra in muestras:
            row = [
                str(muestra.get('item_numero', '')),
                muestra.get('codigo_muestra', ''),
                muestra.get('identificacion_muestra', ''),
                muestra.get('estructura', ''),
                str(muestra.get('fc_kg_cm2', '')),
                muestra.get('fecha_moldeo', ''),
                muestra.get('hora_moldeo', ''),
                str(muestra.get('edad', '')),
                muestra.get('fecha_rotura', ''),
                'Sí' if muestra.get('requiere_densidad', False) else 'No'
            ]
            data.append(row)
        
        # Crear tabla
        table = Table(data, colWidths=[0.8*cm, 1.5*cm, 1.5*cm, 1.2*cm, 1.2*cm, 1.5*cm, 1*cm, 0.8*cm, 1.5*cm, 1*cm])
        table.setStyle(TableStyle([
            # Encabezados
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Datos
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            
            # Alternar colores de filas
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
        ]))
        
        elements.append(table)
        return elements

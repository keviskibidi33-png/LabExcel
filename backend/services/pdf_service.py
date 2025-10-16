"""
Servicio para generación de PDF del formulario de recepción de muestras
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from typing import List, Optional
import io
import os
from datetime import datetime

class PDFService:
    """Servicio para generar PDFs del formulario de recepción de muestras"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Configurar estilos personalizados para el PDF"""
        # Estilo para el título principal
        self.styles.add(ParagraphStyle(
            name='TituloPrincipal',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para subtítulos
        self.styles.add(ParagraphStyle(
            name='Subtitulo',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceAfter=10,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para texto normal
        self.styles.add(ParagraphStyle(
            name='TextoNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            alignment=TA_LEFT,
            fontName='Helvetica'
        ))
        
        # Estilo para etiquetas de campos
        self.styles.add(ParagraphStyle(
            name='Etiqueta',
            parent=self.styles['Normal'],
            fontSize=9,
            spaceAfter=2,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold'
        ))
    
    def generar_pdf_recepcion(self, recepcion_data: dict, muestras: List[dict]) -> bytes:
        """
        Generar PDF del formulario de recepción de muestras
        
        Args:
            recepcion_data: Datos de la recepción
            muestras: Lista de muestras de concreto
            
        Returns:
            bytes: Contenido del PDF generado
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        # Construir el contenido del PDF
        story = []
        
        # Título principal
        story.append(Paragraph("RECEPCIÓN DE MUESTRA CILÍNDRICAS DE CONCRETO", self.styles['TituloPrincipal']))
        story.append(Spacer(1, 20))
        
        # Información principal
        story.extend(self._crear_seccion_informacion_principal(recepcion_data))
        story.append(Spacer(1, 15))
        
        # Información del cliente
        story.extend(self._crear_seccion_cliente(recepcion_data))
        story.append(Spacer(1, 15))
        
        # Información del solicitante
        story.extend(self._crear_seccion_solicitante(recepcion_data))
        story.append(Spacer(1, 15))
        
        # Tabla de muestras
        story.extend(self._crear_tabla_muestras(muestras))
        story.append(Spacer(1, 15))
        
        # Fechas y emisión
        story.extend(self._crear_seccion_fechas_emision(recepcion_data))
        story.append(Spacer(1, 15))
        
        # Responsables
        story.extend(self._crear_seccion_responsables(recepcion_data))
        story.append(Spacer(1, 20))
        
        # Pie de página con información del laboratorio
        story.extend(self._crear_pie_pagina(recepcion_data))
        
        # Construir el PDF
        doc.build(story)
        
        # Obtener el contenido del buffer
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content
    
    def _crear_seccion_informacion_principal(self, data: dict) -> List:
        """Crear sección de información principal"""
        elements = []
        
        # Tabla con información principal
        info_data = [
            ['Número OT:', data.get('numero_ot', '')],
            ['Número Recepción:', data.get('numero_recepcion', '')],
            ['Número Cotización:', data.get('numero_cotizacion', '')],
            ['Código Trazabilidad:', data.get('codigo_trazabilidad', '')],
            ['Asunto:', data.get('asunto', '')]
        ]
        
        table = Table(info_data, colWidths=[3*cm, 8*cm])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        elements.append(table)
        return elements
    
    def _crear_seccion_cliente(self, data: dict) -> List:
        """Crear sección de información del cliente"""
        elements = []
        
        elements.append(Paragraph("INFORMACIÓN DEL CLIENTE", self.styles['Subtitulo']))
        
        cliente_data = [
            ['Cliente:', data.get('cliente', '')],
            ['Domicilio Legal:', data.get('domicilio_legal', '')],
            ['RUC:', data.get('ruc', '')],
            ['Persona Contacto:', data.get('persona_contacto', '')],
            ['Email:', data.get('email', '')],
            ['Teléfono:', data.get('telefono', '')]
        ]
        
        table = Table(cliente_data, colWidths=[3*cm, 8*cm])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        elements.append(table)
        return elements
    
    def _crear_seccion_solicitante(self, data: dict) -> List:
        """Crear sección de información del solicitante"""
        elements = []
        
        elements.append(Paragraph("INFORMACIÓN DEL SOLICITANTE", self.styles['Subtitulo']))
        
        solicitante_data = [
            ['Solicitante:', data.get('solicitante', '')],
            ['Domicilio Solicitante:', data.get('domicilio_solicitante', '')],
            ['Proyecto:', data.get('proyecto', '')],
            ['Ubicación:', data.get('ubicacion', '')]
        ]
        
        table = Table(solicitante_data, colWidths=[3*cm, 8*cm])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        elements.append(table)
        return elements
    
    def _crear_tabla_muestras(self, muestras: List[dict]) -> List:
        """Crear tabla de muestras de concreto"""
        elements = []
        
        elements.append(Paragraph("MUESTRAS DE CONCRETO", self.styles['Subtitulo']))
        
        # Encabezados de la tabla
        headers = [
            'Item', 'Código Muestra', 'Identificación', 'Estructura', 
            'Fc (kg/cm²)', 'Fecha Moldeo', 'Hora Moldeo', 'Edad (días)', 
            'Fecha Rotura', 'Requiere Densidad'
        ]
        
        # Datos de las muestras
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
        table = Table(data, colWidths=[0.8*cm, 2*cm, 2*cm, 1.5*cm, 1.5*cm, 1.5*cm, 1.2*cm, 1*cm, 1.5*cm, 1.5*cm])
        table.setStyle(TableStyle([
            # Estilo para encabezados
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Estilo para datos
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        elements.append(table)
        return elements
    
    def _crear_seccion_fechas_emision(self, data: dict) -> List:
        """Crear sección de fechas y emisión"""
        elements = []
        
        elements.append(Paragraph("FECHAS Y EMISIÓN", self.styles['Subtitulo']))
        
        fechas_data = [
            ['Fecha Recepción:', data.get('fecha_recepcion', '')],
            ['Fecha Estimada Culminación:', data.get('fecha_estimada_culminacion', '')],
            ['Emisión Física:', 'Sí' if data.get('emision_fisica', False) else 'No'],
            ['Emisión Digital:', 'Sí' if data.get('emision_digital', False) else 'No']
        ]
        
        table = Table(fechas_data, colWidths=[3*cm, 8*cm])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        elements.append(table)
        return elements
    
    def _crear_seccion_responsables(self, data: dict) -> List:
        """Crear sección de responsables"""
        elements = []
        
        elements.append(Paragraph("RESPONSABLES", self.styles['Subtitulo']))
        
        responsables_data = [
            ['Entregado por:', data.get('entregado_por', '')],
            ['Recibido por:', data.get('recibido_por', '')]
        ]
        
        table = Table(responsables_data, colWidths=[3*cm, 8*cm])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        elements.append(table)
        return elements
    
    def _crear_pie_pagina(self, data: dict) -> List:
        """Crear pie de página con información del laboratorio"""
        elements = []
        
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("INFORMACIÓN DEL LABORATORIO", self.styles['Subtitulo']))
        
        lab_data = [
            ['Código Laboratorio:', data.get('codigo_laboratorio', 'F-LEM-P-01.02')],
            ['Versión:', data.get('version', '07')],
            ['Fecha de Creación:', datetime.now().strftime('%d/%m/%Y %H:%M:%S')]
        ]
        
        table = Table(lab_data, colWidths=[3*cm, 8*cm])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        elements.append(table)
        return elements

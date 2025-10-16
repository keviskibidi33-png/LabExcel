"""
Servicio para generación de PDF usando HTML/CSS (como Visual Basic)
Usa Jinja2 + WeasyPrint para crear PDFs de forma visual
"""

from jinja2 import Template
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
import io
from typing import List, Dict, Any

class HTMLPDFService:
    """Servicio para generar PDFs usando HTML/CSS (más fácil que ReportLab)"""
    
    def __init__(self):
        self.font_config = FontConfiguration()
    
    def generar_pdf_recepcion(self, recepcion_data: Dict[str, Any], muestras: List[Dict[str, Any]]) -> bytes:
        """
        Generar PDF del formulario de recepción usando HTML/CSS
        
        Args:
            recepcion_data: Datos de la recepción
            muestras: Lista de muestras de concreto
            
        Returns:
            bytes: Contenido del PDF generado
        """
        
        # Template HTML (como Visual Basic pero para web)
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Recepción de Muestra</title>
            <style>
                @page {
                    size: A4;
                    margin: 2cm;
                }
                
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #000;
                }
                
                .header {
                    text-align: center;
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                }
                
                .section {
                    margin-bottom: 20px;
                }
                
                .section-title {
                    font-size: 14px;
                    font-weight: bold;
                    background-color: #f0f0f0;
                    padding: 8px;
                    margin-bottom: 10px;
                    border-left: 4px solid #007bff;
                }
                
                .form-row {
                    display: flex;
                    margin-bottom: 8px;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 5px;
                }
                
                .form-label {
                    font-weight: bold;
                    width: 200px;
                    min-width: 200px;
                }
                
                .form-value {
                    flex: 1;
                    border-bottom: 1px dotted #999;
                    min-height: 20px;
                }
                
                .table-container {
                    margin-top: 15px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 10px;
                }
                
                th, td {
                    border: 1px solid #000;
                    padding: 6px;
                    text-align: center;
                }
                
                th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                }
                
                .checkbox {
                    display: inline-block;
                    width: 15px;
                    height: 15px;
                    border: 1px solid #000;
                    margin-right: 5px;
                    text-align: center;
                    line-height: 13px;
                }
                
                .checked {
                    background-color: #000;
                    color: white;
                }
                
                .footer {
                    margin-top: 30px;
                    font-size: 10px;
                    text-align: center;
                    border-top: 1px solid #ddd;
                    padding-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                RECEPCIÓN DE MUESTRA CILÍNDRICAS DE CONCRETO
            </div>
            
            <!-- Información Principal -->
            <div class="section">
                <div class="section-title">INFORMACIÓN PRINCIPAL</div>
                <div class="form-row">
                    <div class="form-label">Número OT:</div>
                    <div class="form-value">{{ recepcion.numero_ot }}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Número Recepción:</div>
                    <div class="form-value">{{ recepcion.numero_recepcion }}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Número Cotización:</div>
                    <div class="form-value">{{ recepcion.numero_cotizacion or '' }}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Código Trazabilidad:</div>
                    <div class="form-value">{{ recepcion.codigo_trazabilidad or '' }}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Asunto:</div>
                    <div class="form-value">{{ recepcion.asunto }}</div>
                </div>
            </div>
            
            <!-- Información del Cliente -->
            <div class="section">
                <div class="section-title">INFORMACIÓN DEL CLIENTE</div>
                <div class="form-row">
                    <div class="form-label">Cliente:</div>
                    <div class="form-value">{{ recepcion.cliente }}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Domicilio Legal:</div>
                    <div class="form-value">{{ recepcion.domicilio_legal }}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">RUC:</div>
                    <div class="form-value">{{ recepcion.ruc }}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Persona Contacto:</div>
                    <div class="form-value">{{ recepcion.persona_contacto }}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Email:</div>
                    <div class="form-value">{{ recepcion.email }}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Teléfono:</div>
                    <div class="form-value">{{ recepcion.telefono }}</div>
                </div>
            </div>
            
            <!-- Información del Solicitante -->
            <div class="section">
                <div class="section-title">INFORMACIÓN DEL SOLICITANTE</div>
                <div class="form-row">
                    <div class="form-label">Solicitante:</div>
                    <div class="form-value">{{ recepcion.solicitante }}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Domicilio Solicitante:</div>
                    <div class="form-value">{{ recepcion.domicilio_solicitante }}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Proyecto:</div>
                    <div class="form-value">{{ recepcion.proyecto }}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Ubicación:</div>
                    <div class="form-value">{{ recepcion.ubicacion }}</div>
                </div>
            </div>
            
            <!-- Tabla de Muestras -->
            <div class="section">
                <div class="section-title">MUESTRAS DE CONCRETO</div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Código Muestra</th>
                                <th>Identificación</th>
                                <th>Estructura</th>
                                <th>Fc (kg/cm²)</th>
                                <th>Fecha Moldeo</th>
                                <th>Hora Moldeo</th>
                                <th>Edad (días)</th>
                                <th>Fecha Rotura</th>
                                <th>Requiere Densidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for muestra in muestras %}
                            <tr>
                                <td>{{ muestra.item_numero }}</td>
                                <td>{{ muestra.codigo_muestra }}</td>
                                <td>{{ muestra.identificacion_muestra }}</td>
                                <td>{{ muestra.estructura }}</td>
                                <td>{{ muestra.fc_kg_cm2 }}</td>
                                <td>{{ muestra.fecha_moldeo }}</td>
                                <td>{{ muestra.hora_moldeo or '' }}</td>
                                <td>{{ muestra.edad }}</td>
                                <td>{{ muestra.fecha_rotura }}</td>
                                <td>
                                    <span class="checkbox {% if muestra.requiere_densidad %}checked{% endif %}">
                                        {% if muestra.requiere_densidad %}✓{% endif %}
                                    </span>
                                </td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Fechas y Emisión -->
            <div class="section">
                <div class="section-title">FECHAS Y EMISIÓN</div>
                <div class="form-row">
                    <div class="form-label">Fecha Recepción:</div>
                    <div class="form-value">{{ recepcion.fecha_recepcion or '' }}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Fecha Estimada Culminación:</div>
                    <div class="form-value">{{ recepcion.fecha_estimada_culminacion or '' }}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Emisión Física:</div>
                    <div class="form-value">
                        <span class="checkbox {% if recepcion.emision_fisica %}checked{% endif %}">
                            {% if recepcion.emision_fisica %}✓{% endif %}
                        </span>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-label">Emisión Digital:</div>
                    <div class="form-value">
                        <span class="checkbox {% if recepcion.emision_digital %}checked{% endif %}">
                            {% if recepcion.emision_digital %}✓{% endif %}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Responsables -->
            <div class="section">
                <div class="section-title">RESPONSABLES</div>
                <div class="form-row">
                    <div class="form-label">Entregado por:</div>
                    <div class="form-value">{{ recepcion.entregado_por or '' }}</div>
                </div>
                <div class="form-row">
                    <div class="form-label">Recibido por:</div>
                    <div class="form-value">{{ recepcion.recibido_por or '' }}</div>
                </div>
            </div>
            
            <!-- Pie de página -->
            <div class="footer">
                <p><strong>Código Laboratorio:</strong> {{ recepcion.codigo_laboratorio or 'F-LEM-P-01.02' }} | 
                   <strong>Versión:</strong> {{ recepcion.version or '07' }} | 
                   <strong>Generado:</strong> {{ fecha_actual }}</p>
            </div>
        </body>
        </html>
        """
        
        # Renderizar el template con los datos
        template = Template(html_template)
        html_content = template.render(
            recepcion=recepcion_data,
            muestras=muestras,
            fecha_actual=self._get_current_date()
        )
        
        # Convertir HTML a PDF
        html_doc = HTML(string=html_content)
        pdf_bytes = html_doc.write_pdf(font_config=self.font_config)
        
        return pdf_bytes
    
    def _get_current_date(self) -> str:
        """Obtener fecha actual formateada"""
        from datetime import datetime
        return datetime.now().strftime('%d/%m/%Y %H:%M:%S')

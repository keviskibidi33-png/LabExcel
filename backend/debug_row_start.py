#!/usr/bin/env python3
"""
Script para debuggear por qué los items no inician en fila 23
"""

import openpyxl
from services.excel_collaborative_service import ExcelCollaborativeService

def test_excel_generation():
    """Probar generación de Excel con datos de muestra"""
    
    # Datos de prueba
    recepcion_data = {
        'numero_recepcion': 'REC-TEST-001',
        'numero_cotizacion': 'COT-TEST-001',
        'numero_ot': 'OT-TEST-001',
        'cliente': 'Cliente Test',
        'domicilio_legal': 'Dirección Test',
        'ruc': '12345678901',
        'persona_contacto': 'Contacto Test',
        'email': 'test@example.com',
        'telefono': '123456789',
        'solicitante': 'Solicitante Test',
        'domicilio_solicitante': 'Domicilio Test',
        'proyecto': 'Proyecto Test',
        'ubicacion': 'Ubicación Test',
        'fecha_recepcion': '17/10/2025',
        'fecha_estimada_culminacion': '19/10/2025',
        'emision_fisica': False,
        'emision_digital': True,
        'entregado_por': 'Entregado Test',
        'recibido_por': 'Recibido Test'
    }
    
    muestras = [
        {
            'item_numero': 1,
            'codigo_muestra': 'M001',
            'identificacion_muestra': 'Muestra Test 1',
            'estructura': 'Viga',
            'fc_kg_cm2': 280,
            'fecha_moldeo': '15/10/2025',
            'hora_moldeo': '10:00',
            'edad': 7,
            'fecha_rotura': '22/10/2025',
            'requiere_densidad': False
        },
        {
            'item_numero': 2,
            'codigo_muestra': 'M002',
            'identificacion_muestra': 'Muestra Test 2',
            'estructura': 'Columna',
            'fc_kg_cm2': 300,
            'fecha_moldeo': '16/10/2025',
            'hora_moldeo': '11:00',
            'edad': 6,
            'fecha_rotura': '22/10/2025',
            'requiere_densidad': True
        }
    ]
    
    print("=== PRUEBA DE GENERACIÓN DE EXCEL ===")
    print(f"Fila de inicio esperada: 23")
    print(f"Número de muestras: {len(muestras)}")
    print()
    
    try:
        # Crear servicio
        service = ExcelCollaborativeService()
        
        # Generar Excel
        excel_data = service.modificar_excel_con_datos(recepcion_data, muestras)
        
        # Guardar archivo de prueba
        with open('test_output.xlsx', 'wb') as f:
            f.write(excel_data)
        
        print("✅ Excel generado exitosamente")
        print("📁 Archivo guardado como: test_output.xlsx")
        
        # Verificar contenido
        workbook = openpyxl.load_workbook('test_output.xlsx')
        worksheet = workbook.active
        
        print("\n=== VERIFICACIÓN DE FILAS ===")
        
        # Verificar filas 23, 24, 25, 26
        for row in [23, 24, 25, 26]:
            print(f"\nFila {row}:")
            for col in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']:
                cell_value = worksheet[f'{col}{row}'].value
                if cell_value is not None:
                    print(f"  {col}{row}: '{cell_value}'")
        
        workbook.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_excel_generation()

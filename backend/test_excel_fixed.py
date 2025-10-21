#!/usr/bin/env python3
"""
Test del servicio Excel con limpieza de rangos fusionados problemáticos
"""

import sys
import os

# Agregar el directorio backend al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_excel_fixed():
    """Probar servicio Excel con limpieza de rangos problemáticos"""
    
    try:
        print("Probando servicio Excel con limpieza de rangos fusionados...")
        
        from services.excel_collaborative_service import ExcelCollaborativeService
        
        service = ExcelCollaborativeService()
        
        # Datos de recepción
        recepcion_data = {
            'numero_ot': 'OT-TEST-FIXED',
            'numero_recepcion': 'REC-TEST-FIXED',
            'cliente': 'Test Client',
            'emision_fisica': True,
            'emision_digital': False,
            'entregado_por': 'Test Entregado',
            'recibido_por': 'Test Recibido'
        }
        
        # Crear 5 muestras para prueba
        muestras = []
        for i in range(1, 6):
            muestra = {
                'item_numero': i,
                'codigo_muestra_lem': f'LEM{i:03d}',
                'identificacion_muestra': f'Muestra {i}',
                'estructura': 'Columna',
                'fc_kg_cm2': '250',
                'fecha_moldeo': '10/10/2025',
                'hora_moldeo': '08:00',
                'edad': '7',
                'fecha_rotura': '17/10/2025',
                'requiere_densidad': True
            }
            muestras.append(muestra)
        
        print(f"Generando Excel con {len(muestras)} muestras...")
        excel_data = service.modificar_excel_con_datos(recepcion_data, muestras)
        
        if excel_data and len(excel_data) > 0:
            print(f"Excel generado exitosamente: {len(excel_data)} bytes")
            
            # Guardar archivo para probar
            with open("test_output_fixed.xlsx", "wb") as f:
                f.write(excel_data)
            print("Archivo guardado como: test_output_fixed.xlsx")
            print("Puedes abrir este archivo para verificar que no hay errores de Excel")
            
            return True
        else:
            print("Error: Excel no generado")
            return False
            
    except Exception as e:
        print(f"Error en servicio Excel: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_excel_fixed()
    if success:
        print("Test EXITOSO - Excel generado sin errores")
    else:
        print("Test FALLIDO")

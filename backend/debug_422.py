"""
Script para debuggear el error 422 en la creación de recepciones
"""

import requests
import json
from datetime import datetime

def test_recepcion_creation():
    """Probar la creación de recepción con datos de ejemplo"""
    
    # Datos de ejemplo que deberían funcionar
    test_data = {
        "numero_ot": f"OT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "numero_recepcion": f"REC-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "numero_cotizacion": "COT-001",
        "codigo_trazabilidad": "TRZ-001",
        "asunto": "Recepción de muestra de concreto",
        "cliente": "Cliente de Prueba",
        "domicilio_legal": "Av. Principal 123",
        "ruc": "12345678901",
        "persona_contacto": "Juan Pérez",
        "email": "juan@cliente.com",
        "telefono": "987654321",
        "solicitante": "Ing. María García",
        "domicilio_solicitante": "Av. Secundaria 456",
        "proyecto": "Proyecto de Prueba",
        "ubicacion": "Lima, Perú",
        "fecha_recepcion": "16/01/2025",
        "fecha_estimada_culminacion": "20/01/2025",
        "emision_fisica": True,
        "emision_digital": True,
        "entregado_por": "Carlos López",
        "recibido_por": "Ana Martínez",
        "codigo_laboratorio": "LAB-001",
        "version": "1.0",
        "muestras": [
            {
                "item_numero": 1,
                "codigo_muestra": "M-001",
                "identificacion_muestra": "ID-001",
                "estructura": "Viga",
                "fc_kg_cm2": 280,
                "fecha_moldeo": "15/01/2025",
                "hora_moldeo": "10:30",
                "edad": 10,
                "fecha_rotura": "25/01/2025",
                "requiere_densidad": True
            }
        ]
    }
    
    print("=== DATOS DE PRUEBA ===")
    print(json.dumps(test_data, indent=2, ensure_ascii=False))
    print()
    
    try:
        # Probar endpoint de debug primero
        print("=== PROBANDO ENDPOINT DEBUG ===")
        debug_response = requests.post(
            "http://localhost:8000/api/debug/ordenes/",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {debug_response.status_code}")
        print(f"Response: {debug_response.text}")
        print()
        
        # Probar endpoint real
        print("=== PROBANDO ENDPOINT REAL ===")
        real_response = requests.post(
            "http://localhost:8000/api/ordenes/",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {real_response.status_code}")
        print(f"Response: {real_response.text}")
        
        if real_response.status_code == 422:
            print("\n=== ERROR 422 DETALLADO ===")
            try:
                error_detail = real_response.json()
                print(json.dumps(error_detail, indent=2, ensure_ascii=False))
            except:
                print("No se pudo parsear el error como JSON")
        
    except requests.exceptions.ConnectionError:
        print("ERROR: No se puede conectar al backend en http://localhost:8000")
        print("Asegúrate de que el backend esté corriendo")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_recepcion_creation()

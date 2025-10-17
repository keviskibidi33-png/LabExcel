"""
Script para capturar y analizar los datos que envía el frontend
"""

import json
from datetime import datetime

def analyze_frontend_data():
    """Analizar los datos típicos que envía el frontend"""
    
    # Datos típicos que podría estar enviando el frontend
    frontend_data_examples = [
        {
            "name": "Datos completos válidos",
            "data": {
                "numero_ot": "OT-20250116001",
                "numero_recepcion": "REC-20250116001", 
                "numero_cotizacion": "COT-001",
                "codigo_trazabilidad": "TRZ-001",
                "asunto": "Recepción de muestra cilíndrica",
                "cliente": "Constructora ABC S.A.C.",
                "domicilio_legal": "Av. Principal 123, Lima",
                "ruc": "20123456789",
                "persona_contacto": "Juan Pérez",
                "email": "juan@constructora.com",
                "telefono": "987654321",
                "solicitante": "Ing. María García",
                "domicilio_solicitante": "Av. Secundaria 456",
                "proyecto": "Edificio Residencial",
                "ubicacion": "Lima, Perú",
                "fecha_recepcion": "16/01/2025",
                "fecha_estimada_culminacion": "20/01/2025",
                "emision_fisica": True,
                "emision_digital": True,
                "entregado_por": "Carlos López",
                "recibido_por": "Ana Martínez",
                "codigo_laboratorio": "F-LEM-P-01.02",
                "version": "07",
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
        },
        {
            "name": "Datos con campos faltantes",
            "data": {
                "numero_ot": "OT-20250116002",
                "numero_recepcion": "REC-20250116002",
                "asunto": "Recepción de muestra",
                "cliente": "Cliente Test",
                "domicilio_legal": "Dirección test",
                "ruc": "12345678901",
                "persona_contacto": "Contacto test",
                "email": "test@test.com",
                "telefono": "987654321",
                "solicitante": "Solicitante test",
                "domicilio_solicitante": "Domicilio test",
                "proyecto": "Proyecto test",
                "ubicacion": "Ubicación test",
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
        },
        {
            "name": "Datos con errores de validación",
            "data": {
                "numero_ot": "",  # Campo requerido vacío
                "numero_recepcion": "REC-001",
                "asunto": "Test",
                "cliente": "Cliente",
                "domicilio_legal": "Dirección",
                "ruc": "123",  # RUC muy corto
                "persona_contacto": "Contacto",
                "email": "email-invalido",  # Email inválido
                "telefono": "123",  # Teléfono muy corto
                "solicitante": "Solicitante",
                "domicilio_solicitante": "Domicilio",
                "proyecto": "Proyecto",
                "ubicacion": "Ubicación",
                "fecha_recepcion": "2025-01-16",  # Formato de fecha incorrecto
                "muestras": [
                    {
                        "item_numero": 0,  # Número de item inválido
                        "codigo_muestra": "",  # Código vacío
                        "identificacion_muestra": "ID-001",
                        "estructura": "Viga",
                        "fc_kg_cm2": -10,  # Valor negativo
                        "fecha_moldeo": "2025-01-15",  # Formato incorrecto
                        "hora_moldeo": "25:70",  # Hora inválida
                        "edad": 0,  # Edad inválida
                        "fecha_rotura": "2025-01-25",  # Formato incorrecto
                        "requiere_densidad": True
                    }
                ]
            }
        }
    ]
    
    print("=== ANÁLISIS DE DATOS DEL FRONTEND ===")
    print()
    
    for example in frontend_data_examples:
        print(f"--- {example['name']} ---")
        data = example['data']
        
        # Verificar campos requeridos
        required_fields = [
            'numero_ot', 'numero_recepcion', 'asunto', 'cliente', 
            'domicilio_legal', 'ruc', 'persona_contacto', 'email', 
            'telefono', 'solicitante', 'domicilio_solicitante', 
            'proyecto', 'ubicacion'
        ]
        
        missing_fields = []
        for field in required_fields:
            if field not in data or not data[field]:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"❌ Campos faltantes: {missing_fields}")
        else:
            print("✅ Todos los campos requeridos presentes")
        
        # Verificar validaciones específicas
        errors = []
        
        # Validar RUC
        if 'ruc' in data:
            ruc = str(data['ruc'])
            if not ruc.isdigit() or len(ruc) < 8 or len(ruc) > 20:
                errors.append(f"RUC inválido: {ruc}")
        
        # Validar email
        if 'email' in data:
            email = data['email']
            if '@' not in email or '.' not in email.split('@')[-1]:
                errors.append(f"Email inválido: {email}")
        
        # Validar teléfono
        if 'telefono' in data:
            telefono = str(data['telefono'])
            if len(telefono) < 7 or len(telefono) > 20:
                errors.append(f"Teléfono inválido: {telefono}")
        
        # Validar fechas
        date_fields = ['fecha_recepcion', 'fecha_estimada_culminacion']
        for field in date_fields:
            if field in data and data[field]:
                date_str = data[field]
                if not date_str.count('/') == 2 or len(date_str.split('/')) != 3:
                    errors.append(f"Formato de fecha inválido en {field}: {date_str}")
        
        # Validar muestras
        if 'muestras' in data:
            for i, muestra in enumerate(data['muestras']):
                if 'item_numero' in muestra and muestra['item_numero'] < 1:
                    errors.append(f"Muestra {i+1}: item_numero debe ser >= 1")
                if 'fc_kg_cm2' in muestra and muestra['fc_kg_cm2'] <= 0:
                    errors.append(f"Muestra {i+1}: fc_kg_cm2 debe ser > 0")
                if 'edad' in muestra and (muestra['edad'] < 1 or muestra['edad'] > 365):
                    errors.append(f"Muestra {i+1}: edad debe estar entre 1 y 365 días")
        
        if errors:
            print("❌ Errores de validación:")
            for error in errors:
                print(f"   - {error}")
        else:
            print("✅ Validaciones pasadas")
        
        print()

if __name__ == "__main__":
    analyze_frontend_data()

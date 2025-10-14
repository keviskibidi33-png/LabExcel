"""
Script para insertar datos reales en la base de datos PostgreSQL
"""

import psycopg2
from datetime import datetime
import os

# Configuración de la base de datos
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'laboratorio_db',
    'user': 'laboratorio_user',
    'password': 'laboratorio_password_2025'
}

def connect_db():
    """Conectar a la base de datos"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Error conectando a la base de datos: {e}")
        return None

def create_tables(conn):
    """Crear las tablas si no existen"""
    cursor = conn.cursor()
    
    # Crear tabla de órdenes de trabajo
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ordenes_trabajo (
            id SERIAL PRIMARY KEY,
            numero_ot VARCHAR(50) NOT NULL,
            numero_recepcion VARCHAR(50) NOT NULL,
            referencia VARCHAR(100),
            codigo_laboratorio VARCHAR(50),
            version VARCHAR(10),
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_recepcion DATE,
            fecha_inicio_programado DATE,
            fecha_inicio_real DATE,
            fecha_fin_programado DATE,
            fecha_fin_real DATE,
            plazo_entrega_dias INTEGER,
            duracion_real_dias INTEGER,
            observaciones TEXT,
            aperturada_por VARCHAR(100),
            designada_a VARCHAR(100),
            estado VARCHAR(20) DEFAULT 'PENDIENTE'
        )
    """)
    
    # Crear tabla de items de orden
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS items_orden (
            id SERIAL PRIMARY KEY,
            orden_id INTEGER REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
            item_numero INTEGER NOT NULL,
            codigo_muestra VARCHAR(50) NOT NULL,
            descripcion TEXT,
            cantidad INTEGER,
            especificacion TEXT
        )
    """)
    
    conn.commit()
    print("Tablas creadas correctamente")

def insert_real_data(conn):
    """Insertar datos reales basados en el archivo CSV"""
    cursor = conn.cursor()
    
    # Datos de la orden de trabajo real
    orden_data = {
        'numero_ot': '1422-25-LEM',
        'numero_recepcion': '1384-25',
        'referencia': 'MEGAMINTAJE',
        'codigo_laboratorio': 'F-LEM-P-01.02',
        'version': '07',
        'fecha_recepcion': '2025-10-07',
        'fecha_inicio_programado': '2025-10-07',
        'fecha_fin_programado': '2025-10-09',
        'plazo_entrega_dias': 2,
        'observaciones': 'RECEPCIÓN DE MUESTRA CILÍNDRICAS DE CONCRETO - SUMINISTRO, TRANSPORTE Y MONTAJE DE ESTRUCTURAS METÁLICAS PARA NAVE INDUSTRIAL Y EDIFICIO ET01 / ALS HUB',
        'aperturada_por': 'ROBERTH POTOCINO YARANGA',
        'designada_a': 'LABORATORIO LEM',
        'estado': 'EN_PROCESO'
    }
    
    # Insertar la orden
    cursor.execute("""
        INSERT INTO ordenes_trabajo (
            numero_ot, numero_recepcion, referencia, codigo_laboratorio, version,
            fecha_creacion, fecha_recepcion, fecha_inicio_programado, fecha_fin_programado,
            plazo_entrega_dias, observaciones, aperturada_por, designada_a, estado
        ) VALUES (
            %(numero_ot)s, %(numero_recepcion)s, %(referencia)s, %(codigo_laboratorio)s, %(version)s,
            CURRENT_TIMESTAMP, %(fecha_recepcion)s, %(fecha_inicio_programado)s, %(fecha_fin_programado)s,
            %(plazo_entrega_dias)s, %(observaciones)s, %(aperturada_por)s, %(designada_a)s, %(estado)s
        ) RETURNING id
    """, orden_data)
    
    orden_id = cursor.fetchone()[0]
    print(f"Orden insertada con ID: {orden_id}")
    
    # Datos de los items reales
    items_data = [
        {
            'item_numero': 1,
            'codigo_muestra': '4259-CO-25',
            'descripcion': 'MEGA.E1C3-07 - LOSA.2DO NIVEL - E1/C3',
            'cantidad': 1,
            'especificacion': 'F\'c: 280 kg/cm2, Fecha moldeo: 27/09/25, Edad: 10 días'
        },
        {
            'item_numero': 2,
            'codigo_muestra': '4260-CO-25',
            'descripcion': 'MEGA.E1C3-08 - LOSA.2DO NIVEL - E1/C3',
            'cantidad': 1,
            'especificacion': 'F\'c: 280 kg/cm2, Fecha moldeo: 27/09/25, Edad: 10 días'
        },
        {
            'item_numero': 3,
            'codigo_muestra': '4261-CO-25',
            'descripcion': 'MEGA.A1C1-13 - LOSA COLABORANTE',
            'cantidad': 1,
            'especificacion': 'F\'c: 280 kg/cm2, Fecha moldeo: 05/09/25, Edad: 32 días'
        },
        {
            'item_numero': 4,
            'codigo_muestra': '4262-CO-25',
            'descripcion': 'MEGA.A1C1-14 - LOSA COLABORANTE',
            'cantidad': 1,
            'especificacion': 'F\'c: 280 kg/cm2, Fecha moldeo: 05/09/25, Edad: 32 días'
        },
        {
            'item_numero': 5,
            'codigo_muestra': '4263-CO-25',
            'descripcion': 'MEGA.A1C1-15 - LOSA COLABORANTE',
            'cantidad': 1,
            'especificacion': 'F\'c: 280 kg/cm2, Fecha moldeo: 05/09/25, Edad: 32 días'
        }
    ]
    
    # Insertar los items
    for item in items_data:
        cursor.execute("""
            INSERT INTO items_orden (
                orden_id, item_numero, codigo_muestra, descripcion, cantidad, especificacion
            ) VALUES (
                %s, %s, %s, %s, %s, %s
            )
        """, (
            orden_id,
            item['item_numero'],
            item['codigo_muestra'],
            item['descripcion'],
            item['cantidad'],
            item['especificacion']
        ))
    
    # Insertar una segunda orden de ejemplo
    orden_data_2 = {
        'numero_ot': '1423-25-LEM',
        'numero_recepcion': '1385-25',
        'referencia': 'CONCRETO ESTRUCTURAL',
        'codigo_laboratorio': 'F-LEM-P-02.01',
        'version': '03',
        'fecha_recepcion': '2025-10-08',
        'fecha_inicio_programado': '2025-10-08',
        'fecha_fin_programado': '2025-10-10',
        'plazo_entrega_dias': 2,
        'observaciones': 'Pruebas de resistencia a compresión de probetas cilíndricas',
        'aperturada_por': 'CARLOS MENDEZ',
        'designada_a': 'MARIA GONZALEZ',
        'estado': 'PENDIENTE'
    }
    
    cursor.execute("""
        INSERT INTO ordenes_trabajo (
            numero_ot, numero_recepcion, referencia, codigo_laboratorio, version,
            fecha_creacion, fecha_recepcion, fecha_inicio_programado, fecha_fin_programado,
            plazo_entrega_dias, observaciones, aperturada_por, designada_a, estado
        ) VALUES (
            %(numero_ot)s, %(numero_recepcion)s, %(referencia)s, %(codigo_laboratorio)s, %(version)s,
            CURRENT_TIMESTAMP, %(fecha_recepcion)s, %(fecha_inicio_programado)s, %(fecha_fin_programado)s,
            %(plazo_entrega_dias)s, %(observaciones)s, %(aperturada_por)s, %(designada_a)s, %(estado)s
        ) RETURNING id
    """, orden_data_2)
    
    orden_id_2 = cursor.fetchone()[0]
    print(f"Segunda orden insertada con ID: {orden_id_2}")
    
    # Items para la segunda orden
    items_data_2 = [
        {
            'item_numero': 1,
            'codigo_muestra': '4270-CO-25',
            'descripcion': 'RESISTENCIA A COMPRESION',
            'cantidad': 6,
            'especificacion': 'C-7 M-2'
        }
    ]
    
    for item in items_data_2:
        cursor.execute("""
            INSERT INTO items_orden (
                orden_id, item_numero, codigo_muestra, descripcion, cantidad, especificacion
            ) VALUES (
                %s, %s, %s, %s, %s, %s
            )
        """, (
            orden_id_2,
            item['item_numero'],
            item['codigo_muestra'],
            item['descripcion'],
            item['cantidad'],
            item['especificacion']
        ))
    
    conn.commit()
    print("Datos reales insertados correctamente")

def main():
    """Función principal"""
    print("Conectando a la base de datos...")
    conn = connect_db()
    
    if not conn:
        print("No se pudo conectar a la base de datos")
        return
    
    try:
        print("Creando tablas...")
        create_tables(conn)
        
        print("Insertando datos reales...")
        insert_real_data(conn)
        
        print("¡Datos reales insertados exitosamente!")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()

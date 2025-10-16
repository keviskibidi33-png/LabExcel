#!/usr/bin/env python3
"""
Script de migración para cambiar de 'ordenes_trabajo' a 'recepcion' y 'items_orden' a 'muestras_concreto'
Siguiendo buenas prácticas de migración de base de datos
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import OperationalError
from datetime import datetime

# Configuración de la base de datos
DATABASE_URL = "postgresql://postgres:password@localhost:5432/geocreator"

def get_engine():
    """Crear engine de SQLAlchemy"""
    return create_engine(DATABASE_URL)

def check_table_exists(engine, table_name):
    """Verificar si una tabla existe"""
    try:
        inspector = inspect(engine)
        return table_name in inspector.get_table_names()
    except:
        return False

def check_column_exists(engine, table_name, column_name):
    """Verificar si una columna existe en una tabla"""
    try:
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        return column_name in columns
    except:
        return False

def execute_sql(engine, sql, description):
    """Ejecutar SQL con manejo de errores"""
    try:
        with engine.connect() as conn:
            conn.execute(text(sql))
            conn.commit()
            print(f"OK {description}")
            return True
    except Exception as e:
        print(f"Error en {description}: {e}")
        return False

def backup_existing_data(engine):
    """Crear backup de datos existentes"""
    print("Creando backup de datos existentes...")
    
    backup_queries = [
        ("CREATE TABLE IF NOT EXISTS ordenes_trabajo_backup AS SELECT * FROM ordenes_trabajo", "Backup de ordenes_trabajo"),
        ("CREATE TABLE IF NOT EXISTS items_orden_backup AS SELECT * FROM items_orden", "Backup de items_orden")
    ]
    
    for sql, description in backup_queries:
        if check_table_exists(engine, "ordenes_trabajo") or check_table_exists(engine, "items_orden"):
            execute_sql(engine, sql, description)

def create_recepcion_table(engine):
    """Crear tabla recepcion con todas las columnas necesarias"""
    print("Creando tabla recepcion...")
    
    create_recepcion_sql = """
    CREATE TABLE IF NOT EXISTS recepcion (
        id SERIAL PRIMARY KEY,
        numero_ot VARCHAR(50) UNIQUE NOT NULL,
        numero_recepcion VARCHAR(50) NOT NULL,
        numero_cotizacion VARCHAR(50),
        codigo_trazabilidad VARCHAR(100),
        asunto VARCHAR(200) NOT NULL,
        cliente VARCHAR(200) NOT NULL,
        domicilio_legal VARCHAR(300) NOT NULL,
        ruc VARCHAR(20) NOT NULL,
        persona_contacto VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        telefono VARCHAR(20) NOT NULL,
        solicitante VARCHAR(200) NOT NULL,
        domicilio_solicitante VARCHAR(300) NOT NULL,
        proyecto VARCHAR(200) NOT NULL,
        ubicacion VARCHAR(200) NOT NULL,
        fecha_recepcion TIMESTAMP,
        fecha_estimada_culminacion TIMESTAMP,
        emision_fisica BOOLEAN DEFAULT FALSE,
        emision_digital BOOLEAN DEFAULT FALSE,
        entregado_por VARCHAR(100),
        recibido_por VARCHAR(100),
        codigo_laboratorio VARCHAR(20) DEFAULT 'F-LEM-P-01.02',
        version VARCHAR(10) DEFAULT '07',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP,
        fecha_inicio_programado TIMESTAMP,
        fecha_inicio_real TIMESTAMP,
        fecha_fin_programado TIMESTAMP,
        fecha_fin_real TIMESTAMP,
        plazo_entrega_dias INTEGER,
        duracion_real_dias INTEGER,
        observaciones TEXT,
        aperturada_por VARCHAR(100),
        designada_a VARCHAR(100),
        estado VARCHAR(20) DEFAULT 'PENDIENTE'
    );
    """
    
    return execute_sql(engine, create_recepcion_sql, "Crear tabla recepcion")

def create_muestras_concreto_table(engine):
    """Crear tabla muestras_concreto"""
    print("Creando tabla muestras_concreto...")
    
    create_muestras_sql = """
    CREATE TABLE IF NOT EXISTS muestras_concreto (
        id SERIAL PRIMARY KEY,
        recepcion_id INTEGER NOT NULL REFERENCES recepcion(id) ON DELETE CASCADE,
        item_numero INTEGER NOT NULL,
        codigo_muestra VARCHAR(50) NOT NULL,
        identificacion_muestra VARCHAR(50) NOT NULL,
        estructura VARCHAR(100) NOT NULL,
        fc_kg_cm2 FLOAT NOT NULL,
        fecha_moldeo VARCHAR(20) NOT NULL,
        hora_moldeo VARCHAR(10),
        edad INTEGER NOT NULL,
        fecha_rotura VARCHAR(20) NOT NULL,
        requiere_densidad BOOLEAN DEFAULT FALSE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP
    );
    """
    
    return execute_sql(engine, create_muestras_sql, "Crear tabla muestras_concreto")

def migrate_data_from_ordenes_trabajo(engine):
    """Migrar datos de ordenes_trabajo a recepcion"""
    if not check_table_exists(engine, "ordenes_trabajo"):
        print("Tabla ordenes_trabajo no existe, saltando migración de datos")
        return True
    
    print("Migrando datos de ordenes_trabajo a recepcion...")
    
    # Verificar si ya hay datos en recepcion
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM recepcion"))
        count = result.scalar()
        if count > 0:
            print("La tabla recepcion ya tiene datos, saltando migración")
            return True
    
    migrate_sql = """
    INSERT INTO recepcion (
        numero_ot, numero_recepcion, numero_cotizacion, codigo_trazabilidad,
        asunto, cliente, domicilio_legal, ruc, persona_contacto, email, telefono,
        solicitante, domicilio_solicitante, proyecto, ubicacion,
        fecha_recepcion, fecha_estimada_culminacion, emision_fisica, emision_digital,
        entregado_por, recibido_por, codigo_laboratorio, version,
        fecha_creacion, fecha_inicio_programado, fecha_inicio_real,
        fecha_fin_programado, fecha_fin_real, plazo_entrega_dias, duracion_real_dias,
        observaciones, aperturada_por, designada_a, estado
    )
    SELECT 
        numero_ot, numero_recepcion, numero_cotizacion, codigo_trazabilidad,
        asunto, cliente, domicilio_legal, ruc, persona_contacto, email, telefono,
        solicitante, domicilio_solicitante, proyecto, ubicacion,
        fecha_recepcion, fecha_estimada_culminacion, 
        CASE WHEN emision_fisica = 'true' THEN TRUE ELSE FALSE END,
        CASE WHEN emision_digital = 'true' THEN TRUE ELSE FALSE END,
        entregado_por, recibido_por, codigo_laboratorio, version,
        fecha_creacion, fecha_inicio_programado, fecha_inicio_real,
        fecha_fin_programado, fecha_fin_real, plazo_entrega_dias, duracion_real_dias,
        observaciones, aperturada_por, designada_a, estado
    FROM ordenes_trabajo;
    """
    
    return execute_sql(engine, migrate_sql, "Migrar datos de ordenes_trabajo")

def migrate_data_from_items_orden(engine):
    """Migrar datos de items_orden a muestras_concreto"""
    if not check_table_exists(engine, "items_orden"):
        print("Tabla items_orden no existe, saltando migración de datos")
        return True
    
    print("Migrando datos de items_orden a muestras_concreto...")
    
    # Verificar si ya hay datos en muestras_concreto
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM muestras_concreto"))
        count = result.scalar()
        if count > 0:
            print("La tabla muestras_concreto ya tiene datos, saltando migración")
            return True
    
    migrate_sql = """
    INSERT INTO muestras_concreto (
        recepcion_id, item_numero, codigo_muestra, identificacion_muestra,
        estructura, fc_kg_cm2, fecha_moldeo, hora_moldeo, edad, fecha_rotura,
        requiere_densidad
    )
    SELECT 
        r.id, io.item_numero, io.codigo_muestra, io.identificacion_muestra,
        io.estructura, io.fc_kg_cm2, io.fecha_moldeo, io.hora_moldeo, 
        io.edad, io.fecha_rotura,
        CASE WHEN io.requiere_densidad = 'true' THEN TRUE ELSE FALSE END
    FROM items_orden io
    JOIN recepcion r ON r.numero_ot = (
        SELECT numero_ot FROM ordenes_trabajo WHERE id = io.orden_id
    );
    """
    
    return execute_sql(engine, migrate_sql, "Migrar datos de items_orden")

def create_indexes(engine):
    """Crear índices para optimizar consultas"""
    print("Creando índices...")
    
    indexes = [
        ("CREATE INDEX IF NOT EXISTS idx_recepcion_numero_ot ON recepcion(numero_ot)", "Indice en numero_ot"),
        ("CREATE INDEX IF NOT EXISTS idx_recepcion_numero_recepcion ON recepcion(numero_recepcion)", "Indice en numero_recepcion"),
        ("CREATE INDEX IF NOT EXISTS idx_recepcion_estado ON recepcion(estado)", "Indice en estado"),
        ("CREATE INDEX IF NOT EXISTS idx_muestras_recepcion_id ON muestras_concreto(recepcion_id)", "Indice en recepcion_id"),
        ("CREATE INDEX IF NOT EXISTS idx_muestras_codigo ON muestras_concreto(codigo_muestra)", "Indice en codigo_muestra")
    ]
    
    for sql, description in indexes:
        execute_sql(engine, sql, description)

def main():
    """Ejecutar migración completa"""
    print("Iniciando migración a sistema de recepción de muestras...")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        engine = get_engine()
        
        # Verificar conexión
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Conexión a la base de datos exitosa")
        
        # Paso 1: Crear backup
        backup_existing_data(engine)
        
        # Paso 2: Crear nuevas tablas
        if not create_recepcion_table(engine):
            print("Error creando tabla recepcion")
            return False
            
        if not create_muestras_concreto_table(engine):
            print("Error creando tabla muestras_concreto")
            return False
        
        # Paso 3: Migrar datos
        if not migrate_data_from_ordenes_trabajo(engine):
            print("Error migrando datos de ordenes_trabajo")
            return False
            
        if not migrate_data_from_items_orden(engine):
            print("Error migrando datos de items_orden")
            return False
        
        # Paso 4: Crear índices
        create_indexes(engine)
        
        print("\nMigración completada exitosamente!")
        print("Resumen:")
        
        # Mostrar estadísticas
        with engine.connect() as conn:
            recepcion_count = conn.execute(text("SELECT COUNT(*) FROM recepcion")).scalar()
            muestras_count = conn.execute(text("SELECT COUNT(*) FROM muestras_concreto")).scalar()
            
            print(f"   - Recepciones migradas: {recepcion_count}")
            print(f"   - Muestras migradas: {muestras_count}")
        
        return True
        
    except Exception as e:
        print(f"Error durante la migración: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

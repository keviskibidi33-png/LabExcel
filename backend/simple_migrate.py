#!/usr/bin/env python3
"""
Script simple para migrar la base de datos
"""

import os
from sqlalchemy import create_engine, text, inspect

# Configuración de la base de datos
DATABASE_URL = "postgresql://postgres:password@localhost:5432/geocreator"

def get_engine():
    """Crear engine de SQLAlchemy"""
    return create_engine(DATABASE_URL)

def check_column_exists(engine, table_name, column_name):
    """Verificar si una columna existe en una tabla"""
    try:
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        return column_name in columns
    except:
        return False

def add_column_if_not_exists(engine, table_name, column_name, column_definition):
    """Agregar una columna si no existe"""
    if not check_column_exists(engine, table_name, column_name):
        try:
            with engine.connect() as conn:
                sql = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
                conn.execute(text(sql))
                conn.commit()
                print(f"Columna {column_name} agregada a {table_name}")
        except Exception as e:
            print(f"Error agregando columna {column_name}: {e}")
    else:
        print(f"Columna {column_name} ya existe en {table_name}")

def main():
    """Ejecutar migración de la base de datos"""
    print("Iniciando migración de base de datos...")
    
    try:
        engine = get_engine()
        
        # Verificar conexión
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Conexión a la base de datos exitosa")
        
        # Nuevas columnas para ordenes_trabajo
        ordenes_trabajo_columns = [
            ("numero_cotizacion", "VARCHAR(50)"),
            ("codigo_trazabilidad", "VARCHAR(100)"),
            ("asunto", "VARCHAR(200)"),
            ("cliente", "VARCHAR(200)"),
            ("domicilio_legal", "VARCHAR(300)"),
            ("ruc", "VARCHAR(20)"),
            ("persona_contacto", "VARCHAR(100)"),
            ("email", "VARCHAR(100)"),
            ("telefono", "VARCHAR(20)"),
            ("solicitante", "VARCHAR(200)"),
            ("domicilio_solicitante", "VARCHAR(300)"),
            ("proyecto", "VARCHAR(200)"),
            ("ubicacion", "VARCHAR(200)"),
            ("fecha_estimada_culminacion", "TIMESTAMP"),
            ("emision_fisica", "VARCHAR(10) DEFAULT 'false'"),
            ("emision_digital", "VARCHAR(10) DEFAULT 'false'"),
            ("entregado_por", "VARCHAR(100)"),
            ("recibido_por", "VARCHAR(100)")
        ]
        
        print("\nAgregando columnas a ordenes_trabajo...")
        for column_name, column_definition in ordenes_trabajo_columns:
            add_column_if_not_exists(engine, "ordenes_trabajo", column_name, column_definition)
        
        # Nuevas columnas para items_orden
        items_orden_columns = [
            ("identificacion_muestra", "VARCHAR(50)"),
            ("estructura", "VARCHAR(100)"),
            ("fc_kg_cm2", "FLOAT"),
            ("fecha_moldeo", "VARCHAR(20)"),
            ("hora_moldeo", "VARCHAR(10)"),
            ("edad", "INTEGER"),
            ("fecha_rotura", "VARCHAR(20)"),
            ("requiere_densidad", "VARCHAR(10) DEFAULT 'false'")
        ]
        
        print("\nAgregando columnas a items_orden...")
        for column_name, column_definition in items_orden_columns:
            add_column_if_not_exists(engine, "items_orden", column_name, column_definition)
        
        print("\nMigración completada exitosamente!")
        
    except Exception as e:
        print(f"Error durante la migración: {e}")

if __name__ == "__main__":
    main()

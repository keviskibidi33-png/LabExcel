#!/usr/bin/env python3
"""
Script simple para migrar a sistema de recepcion
"""

import os
from sqlalchemy import create_engine, text, inspect

# Configuracion de la base de datos
DATABASE_URL = "postgresql://laboratorio_user:laboratorio_password_2025@localhost:5432/laboratorio_db"

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

def main():
    """Ejecutar migracion completa"""
    print("Iniciando migracion a sistema de recepcion de muestras...")
    
    try:
        engine = get_engine()
        
        # Verificar conexion
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Conexion a la base de datos exitosa")
        
        # Crear tabla recepcion
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
        
        if not execute_sql(engine, create_recepcion_sql, "Crear tabla recepcion"):
            return False
        
        # Crear tabla muestras_concreto
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
        
        if not execute_sql(engine, create_muestras_sql, "Crear tabla muestras_concreto"):
            return False
        
        # Crear indices
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_recepcion_numero_ot ON recepcion(numero_ot)",
            "CREATE INDEX IF NOT EXISTS idx_recepcion_numero_recepcion ON recepcion(numero_recepcion)",
            "CREATE INDEX IF NOT EXISTS idx_recepcion_estado ON recepcion(estado)",
            "CREATE INDEX IF NOT EXISTS idx_muestras_recepcion_id ON muestras_concreto(recepcion_id)",
            "CREATE INDEX IF NOT EXISTS idx_muestras_codigo ON muestras_concreto(codigo_muestra)"
        ]
        
        for index_sql in indexes:
            execute_sql(engine, index_sql, "Crear indice")
        
        print("Migracion completada exitosamente!")
        
        # Mostrar estadisticas
        with engine.connect() as conn:
            recepcion_count = conn.execute(text("SELECT COUNT(*) FROM recepcion")).scalar()
            muestras_count = conn.execute(text("SELECT COUNT(*) FROM muestras_concreto")).scalar()
            
            print(f"Recepciones: {recepcion_count}")
            print(f"Muestras: {muestras_count}")
        
        return True
        
    except Exception as e:
        print(f"Error durante la migracion: {e}")
        return False

if __name__ == "__main__":
    main()

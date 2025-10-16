#!/usr/bin/env python3
"""
Script para probar la conexion a la base de datos
"""

import os
from sqlalchemy import create_engine, text

# Configuracion de la base de datos
DATABASE_URL = "postgresql://laboratorio_user:laboratorio_password_2025@localhost:5432/laboratorio_db"

def test_connection():
    """Probar conexion a la base de datos"""
    try:
        print("Probando conexion a la base de datos...")
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("Conexion exitosa!")
            return True
            
    except Exception as e:
        print(f"Error de conexion: {e}")
        return False

if __name__ == "__main__":
    test_connection()

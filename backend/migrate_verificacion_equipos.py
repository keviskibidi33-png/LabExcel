"""
Script de migración para agregar columnas de equipos y nota a la tabla verificacion_muestras
"""

from sqlalchemy import text
from database import engine, SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrar_tabla_verificacion():
    """
    Agrega las columnas de equipos y nota a la tabla verificacion_muestras
    """
    db = SessionLocal()
    try:
        # Verificar si las columnas ya existen
        with engine.connect() as conn:
            # Obtener columnas existentes
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'verificacion_muestras'
            """))
            columnas_existentes = [row[0] for row in result]
            
            logger.info(f"Columnas existentes: {columnas_existentes}")
            
            # Columnas a agregar
            columnas_nuevas = {
                'equipo_bernier': 'VARCHAR(50)',
                'equipo_lainas_1': 'VARCHAR(50)',
                'equipo_lainas_2': 'VARCHAR(50)',
                'equipo_escuadra': 'VARCHAR(50)',
                'equipo_balanza': 'VARCHAR(50)',
                'nota': 'VARCHAR(500)'
            }
            
            # Agregar columnas que no existen
            for columna, tipo in columnas_nuevas.items():
                if columna not in columnas_existentes:
                    try:
                        conn.execute(text(f"""
                            ALTER TABLE verificacion_muestras 
                            ADD COLUMN {columna} {tipo} NULL
                        """))
                        conn.commit()
                        logger.info(f"✅ Columna '{columna}' agregada exitosamente")
                    except Exception as e:
                        logger.error(f"❌ Error agregando columna '{columna}': {str(e)}")
                        conn.rollback()
                else:
                    logger.info(f"⏭️  Columna '{columna}' ya existe, omitiendo")
            
            logger.info("✅ Migración completada")
            
    except Exception as e:
        logger.error(f"❌ Error en la migración: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("🚀 Iniciando migración de tabla verificacion_muestras...")
    migrar_tabla_verificacion()
    logger.info("✅ Migración finalizada")


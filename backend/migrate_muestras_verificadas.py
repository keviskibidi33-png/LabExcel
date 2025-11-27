"""
Script de migración para agregar columnas nuevas a la tabla muestras_verificadas
"""

from sqlalchemy import text
from database import engine, SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrar_tabla_muestras_verificadas():
    """
    Agrega las columnas nuevas a la tabla muestras_verificadas
    """
    db = SessionLocal()
    try:
        # Verificar si las columnas ya existen
        with engine.connect() as conn:
            # Obtener columnas existentes
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'muestras_verificadas'
            """))
            columnas_existentes = [row[0] for row in result]
            
            logger.info(f"Columnas existentes: {columnas_existentes}")
            
            # Columnas nuevas a agregar (según el modelo actualizado)
            columnas_nuevas = {
                'codigo_lem': 'VARCHAR(50)',
                'tolerancia_porcentaje': 'FLOAT',
                'aceptacion_diametro': 'VARCHAR(20)',
                'perpendicularidad_sup1': 'BOOLEAN',
                'perpendicularidad_sup2': 'BOOLEAN',
                'perpendicularidad_inf1': 'BOOLEAN',
                'perpendicularidad_inf2': 'BOOLEAN',
                'perpendicularidad_medida': 'BOOLEAN',
                'planitud_medida': 'BOOLEAN',
                'planitud_superior_aceptacion': 'VARCHAR(20)',
                'planitud_inferior_aceptacion': 'VARCHAR(20)',
                'planitud_depresiones_aceptacion': 'VARCHAR(20)',
                'accion_realizar': 'VARCHAR(200)',
                'conformidad': 'VARCHAR(50)',
                'longitud_1_mm': 'FLOAT',
                'longitud_2_mm': 'FLOAT',
                'longitud_3_mm': 'FLOAT',
                'masa_muestra_aire_g': 'FLOAT',
                'pesar': 'VARCHAR(20)'
            }
            
            # Agregar columnas que no existen
            for columna, tipo in columnas_nuevas.items():
                if columna not in columnas_existentes:
                    try:
                        conn.execute(text(f"""
                            ALTER TABLE muestras_verificadas 
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
    logger.info("🚀 Iniciando migración de tabla muestras_verificadas...")
    migrar_tabla_muestras_verificadas()
    logger.info("✅ Migración finalizada")


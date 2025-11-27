"""
Script de migración para actualizar codigo_lem en registros existentes
Usa codigo_cliente como valor por defecto cuando codigo_lem es NULL
"""

from sqlalchemy import text
from database import engine, SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrar_codigo_lem_datos():
    """
    Actualiza codigo_lem usando codigo_cliente como fallback para registros existentes
    """
    db = SessionLocal()
    try:
        with engine.connect() as conn:
            # Actualizar registros donde codigo_lem es NULL pero codigo_cliente tiene valor
            result = conn.execute(text("""
                UPDATE muestras_verificadas 
                SET codigo_lem = codigo_cliente 
                WHERE codigo_lem IS NULL AND codigo_cliente IS NOT NULL
            """))
            conn.commit()
            registros_actualizados = result.rowcount
            logger.info(f"✅ {registros_actualizados} registros actualizados con codigo_cliente")
            
            # Actualizar registros donde ambos son NULL a cadena vacía
            result2 = conn.execute(text("""
                UPDATE muestras_verificadas 
                SET codigo_lem = '' 
                WHERE codigo_lem IS NULL
            """))
            conn.commit()
            registros_vacios = result2.rowcount
            logger.info(f"✅ {registros_vacios} registros actualizados con cadena vacía")
            
            logger.info("✅ Migración de datos completada")
            
    except Exception as e:
        logger.error(f"❌ Error en la migración: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("🚀 Iniciando migración de datos codigo_lem...")
    migrar_codigo_lem_datos()
    logger.info("✅ Migración finalizada")


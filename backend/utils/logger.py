"""
Sistema de logging centralizado
"""
import logging
import sys
from typing import Optional
from config import settings


class Logger:
    """Logger centralizado para la aplicación"""
    
    _loggers = {}
    
    @classmethod
    def get_logger(cls, name: str) -> logging.Logger:
        """Obtener o crear un logger"""
        if name not in cls._loggers:
            logger = logging.getLogger(name)
            logger.setLevel(getattr(logging, settings.log_level.upper()))
            
            # Evitar duplicar handlers
            if not logger.handlers:
                handler = logging.StreamHandler(sys.stdout)
                formatter = logging.Formatter(settings.log_format)
                handler.setFormatter(formatter)
                logger.addHandler(handler)
            
            cls._loggers[name] = logger
        
        return cls._loggers[name]
    
    @classmethod
    def setup_file_logging(cls, log_file: str = "app.log"):
        """Configurar logging a archivo"""
        file_handler = logging.FileHandler(log_file)
        formatter = logging.Formatter(settings.log_format)
        file_handler.setFormatter(formatter)
        
        # Agregar a todos los loggers existentes
        for logger in cls._loggers.values():
            logger.addHandler(file_handler)


# Loggers específicos
app_logger = Logger.get_logger("app")
db_logger = Logger.get_logger("database")
excel_logger = Logger.get_logger("excel")
pdf_logger = Logger.get_logger("pdf")
api_logger = Logger.get_logger("api")

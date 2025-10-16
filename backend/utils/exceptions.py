"""
Excepciones personalizadas del sistema
"""
from typing import Optional, Dict, Any


class BaseAppException(Exception):
    """Excepción base de la aplicación"""
    
    def __init__(
        self, 
        message: str, 
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(BaseAppException):
    """Error de validación de datos"""
    pass


class DatabaseError(BaseAppException):
    """Error de base de datos"""
    pass


class FileProcessingError(BaseAppException):
    """Error en procesamiento de archivos"""
    pass


class ExcelProcessingError(FileProcessingError):
    """Error específico en procesamiento de Excel"""
    pass


class PDFGenerationError(FileProcessingError):
    """Error específico en generación de PDF"""
    pass


class RecepcionNotFoundError(BaseAppException):
    """Error cuando no se encuentra una recepción"""
    pass


class DuplicateRecepcionError(BaseAppException):
    """Error cuando se intenta crear una recepción duplicada"""
    pass

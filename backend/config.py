"""
Configuración centralizada del sistema
"""
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuración de la aplicación"""
    
    # Aplicación
    app_name: str = "Sistema de Gestión Excel - Laboratorio"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Base de datos
    database_url: str = "postgresql://postgres:postgres@localhost:5432/laboratorio_db"
    
    # CORS
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:3002",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:5173"
    ]
    
    # Archivos
    upload_dir: str = "uploads"
    templates_dir: str = "templates"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Instancia global de configuración
settings = Settings()

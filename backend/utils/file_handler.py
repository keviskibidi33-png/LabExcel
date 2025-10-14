"""
Manejador de archivos para el sistema
"""

import os
import shutil
import tempfile
from pathlib import Path
from typing import Optional, List
import uuid
from datetime import datetime

class FileHandler:
    def __init__(self, base_path: str = "uploads"):
        self.base_path = Path(base_path)
        self.temp_path = Path("temp")
        self.archivos_path = Path("archivos")
        
        # Crear directorios si no existen
        self.base_path.mkdir(exist_ok=True)
        self.temp_path.mkdir(exist_ok=True)
        self.archivos_path.mkdir(exist_ok=True)
    
    def save_uploaded_file(self, file_content: bytes, filename: str) -> str:
        """Guardar archivo subido y retornar ruta"""
        # Generar nombre único
        file_id = str(uuid.uuid4())
        file_extension = Path(filename).suffix
        unique_filename = f"{file_id}{file_extension}"
        
        # Ruta completa
        file_path = self.base_path / unique_filename
        
        # Guardar archivo
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        return str(file_path)
    
    def create_temp_file(self, content: bytes, suffix: str = '.xlsx') -> str:
        """Crear archivo temporal"""
        temp_file = tempfile.NamedTemporaryFile(
            delete=False, 
            suffix=suffix, 
            dir=self.temp_path
        )
        temp_file.write(content)
        temp_file.close()
        
        return temp_file.name
    
    def cleanup_temp_file(self, file_path: str) -> bool:
        """Limpiar archivo temporal"""
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
                return True
        except Exception:
            pass
        return False
    
    def cleanup_old_files(self, max_age_hours: int = 24) -> int:
        """Limpiar archivos antiguos"""
        cleaned_count = 0
        current_time = datetime.now().timestamp()
        max_age_seconds = max_age_hours * 3600
        
        # Limpiar archivos temporales
        for file_path in self.temp_path.iterdir():
            if file_path.is_file():
                file_age = current_time - file_path.stat().st_mtime
                if file_age > max_age_seconds:
                    try:
                        file_path.unlink()
                        cleaned_count += 1
                    except Exception:
                        pass
        
        return cleaned_count
    
    def get_file_info(self, file_path: str) -> Optional[dict]:
        """Obtener información de un archivo"""
        try:
            path = Path(file_path)
            if not path.exists():
                return None
            
            stat = path.stat()
            return {
                'filename': path.name,
                'size': stat.st_size,
                'size_mb': round(stat.st_size / (1024 * 1024), 2),
                'created': datetime.fromtimestamp(stat.st_ctime),
                'modified': datetime.fromtimestamp(stat.st_mtime),
                'extension': path.suffix.lower()
            }
        except Exception:
            return None
    
    def validate_file_type(self, filename: str, allowed_extensions: List[str] = None) -> bool:
        """Validar tipo de archivo"""
        if allowed_extensions is None:
            allowed_extensions = ['.xlsx', '.xls']
        
        file_extension = Path(filename).suffix.lower()
        return file_extension in allowed_extensions
    
    def validate_file_size(self, file_path: str, max_size_mb: int = 10) -> bool:
        """Validar tamaño de archivo"""
        try:
            file_size = Path(file_path).stat().st_size
            max_size_bytes = max_size_mb * 1024 * 1024
            return file_size <= max_size_bytes
        except Exception:
            return False
    
    def copy_to_archivos(self, source_path: str, orden_id: int) -> str:
        """Copiar archivo a directorio de archivos organizados"""
        # Crear directorio para la orden
        orden_dir = self.archivos_path / f"orden_{orden_id}"
        orden_dir.mkdir(exist_ok=True)
        
        # Generar nombre de archivo
        source_file = Path(source_path)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        new_filename = f"OT_{orden_id}_{timestamp}{source_file.suffix}"
        
        # Ruta destino
        dest_path = orden_dir / new_filename
        
        # Copiar archivo
        shutil.copy2(source_path, dest_path)
        
        return str(dest_path)
    
    def list_archivos_orden(self, orden_id: int) -> List[dict]:
        """Listar archivos de una orden específica"""
        orden_dir = self.archivos_path / f"orden_{orden_id}"
        
        if not orden_dir.exists():
            return []
        
        archivos = []
        for file_path in orden_dir.iterdir():
            if file_path.is_file():
                file_info = self.get_file_info(str(file_path))
                if file_info:
                    archivos.append({
                        'path': str(file_path),
                        'name': file_info['filename'],
                        'size_mb': file_info['size_mb'],
                        'created': file_info['created'],
                        'modified': file_info['modified']
                    })
        
        return sorted(archivos, key=lambda x: x['modified'], reverse=True)

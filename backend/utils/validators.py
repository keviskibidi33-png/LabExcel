"""
Validadores personalizados para el sistema
"""
import re
from datetime import datetime
from typing import Optional, List
from utils.exceptions import ValidationError


class DataValidator:
    """Validador de datos del sistema"""
    
    # Patrones de validación
    RUC_PATTERN = re.compile(r'^\d{8,20}$')  # RUC puede tener entre 8 y 20 dígitos
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    PHONE_PATTERN = re.compile(r'^[\+]?[1-9][\d]{0,15}$')
    DATE_PATTERN = re.compile(r'^\d{2}/\d{2}/\d{4}$')
    TIME_PATTERN = re.compile(r'^\d{2}:\d{2}$')
    
    @classmethod
    def validate_ruc(cls, ruc: str) -> bool:
        """Validar formato de RUC peruano"""
        if not ruc:
            return True  # RUC es opcional
        return bool(cls.RUC_PATTERN.match(ruc))
    
    @classmethod
    def validate_email(cls, email: str) -> bool:
        """Validar formato de email"""
        if not email:
            return True  # Email es opcional
        return bool(cls.EMAIL_PATTERN.match(email))
    
    @classmethod
    def validate_phone(cls, phone: str) -> bool:
        """Validar formato de teléfono"""
        if not phone:
            return True  # Teléfono es opcional
        return bool(cls.PHONE_PATTERN.match(phone))
    
    @classmethod
    def validate_date_format(cls, date_str: str) -> bool:
        """Validar formato de fecha DD/MM/YYYY"""
        if not date_str:
            return True  # Fecha es opcional
        return bool(cls.DATE_PATTERN.match(date_str))
    
    @classmethod
    def validate_time_format(cls, time_str: str) -> bool:
        """Validar formato de hora HH:MM"""
        if not time_str:
            return True  # Hora es opcional
        return bool(cls.TIME_PATTERN.match(time_str))
    
    @classmethod
    def validate_date_value(cls, date_str: str) -> bool:
        """Validar que la fecha sea válida"""
        if not date_str:
            return True
        
        try:
            datetime.strptime(date_str, '%d/%m/%Y')
            return True
        except ValueError:
            return False
    
    @classmethod
    def validate_time_value(cls, time_str: str) -> bool:
        """Validar que la hora sea válida"""
        if not time_str:
            return True
        
        try:
            datetime.strptime(time_str, '%H:%M')
            return True
        except ValueError:
            return False
    
    @classmethod
    def validate_muestras(cls, muestras: List[dict]) -> List[str]:
        """Validar lista de muestras"""
        errors = []
        
        if not muestras:
            errors.append("Debe agregar al menos una muestra")
            return errors
        
        for i, muestra in enumerate(muestras):
            # Los campos de muestra son opcionales, solo validar formatos si están presentes
            
            # Validar fecha de moldeo
            fecha_moldeo = muestra.get('fecha_moldeo')
            if fecha_moldeo and fecha_moldeo.strip() and not cls.validate_date_value(fecha_moldeo):
                errors.append(f"Muestra {i+1}: Fecha de moldeo inválida")
            
            # Validación de hora de moldeo eliminada para permitir cualquier texto
        
        return errors
    
    @classmethod
    def validate_recepcion_data(cls, data: dict) -> List[str]:
        """Validar datos completos de recepción"""
        errors = []
        
        # Solo validar campos mínimos requeridos
        required_fields = [
            'numero_ot', 'numero_recepcion'
        ]
        
        for field in required_fields:
            if not data.get(field):
                errors.append(f"Campo '{field}' es requerido")
        
        # Validar formatos solo si los campos tienen contenido
        if data.get('ruc') and data['ruc'].strip() and not cls.validate_ruc(data['ruc']):
            errors.append("RUC debe tener entre 8 y 20 dígitos")
        
        if data.get('email') and data['email'].strip() and not cls.validate_email(data['email']):
            errors.append("Formato de email inválido")
        
        if data.get('telefono') and data['telefono'].strip() and not cls.validate_phone(data['telefono']):
            errors.append("Formato de teléfono inválido")
        
        if data.get('fecha_recepcion') and data['fecha_recepcion'].strip() and not cls.validate_date_value(data['fecha_recepcion']):
            errors.append("Fecha de recepción inválida")
        
        if data.get('fecha_estimada_culminacion') and data['fecha_estimada_culminacion'].strip() and not cls.validate_date_value(data['fecha_estimada_culminacion']):
            errors.append("Fecha estimada de culminación inválida")
        
        # Validar muestras
        muestras_errors = cls.validate_muestras(data.get('muestras', []))
        errors.extend(muestras_errors)
        
        return errors

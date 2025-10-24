/**
 * Utilidades de validación
 */
import { VALIDATION_PATTERNS, MESSAGES } from '../constants';
import { ValidationError } from '../types';

export class FormValidator {
  /**
   * Validar formato de fecha DD/MM/YYYY
   */
  static validateDate(date: string): ValidationError | null {
    if (!date) return null;
    
    if (!VALIDATION_PATTERNS.DATE.test(date)) {
      return {
        field: 'date',
        message: 'Formato de fecha inválido. Use DD/MM/YYYY'
      };
    }
    
    // Validar que la fecha sea real
    const [day, month, year] = date.split('/').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    if (
      dateObj.getDate() !== day ||
      dateObj.getMonth() !== month - 1 ||
      dateObj.getFullYear() !== year
    ) {
      return {
        field: 'date',
        message: 'Fecha inválida'
      };
    }
    
    return null;
  }
  
  /**
   * Validar formato de hora HH:MM
   */
  static validateTime(time: string): ValidationError | null {
    if (!time) return null;
    
    if (!VALIDATION_PATTERNS.TIME.test(time)) {
      return {
        field: 'time',
        message: 'Formato de hora inválido. Use HH:MM'
      };
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return {
        field: 'time',
        message: 'Hora inválida'
      };
    }
    
    return null;
  }
  
  /**
   * Validar RUC peruano
   */
  static validateRUC(ruc: string): ValidationError | null {
    if (!ruc) return null;
    
    if (!VALIDATION_PATTERNS.RUC.test(ruc)) {
      return {
        field: 'ruc',
        message: 'RUC debe tener 11 dígitos'
      };
    }
    
    return null;
  }
  
  /**
   * Validar email
   */
  static validateEmail(email: string): ValidationError | null {
    if (!email) return null;
    
    if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
      return {
        field: 'email',
        message: 'Formato de email inválido'
      };
    }
    
    return null;
  }
  
  /**
   * Validar teléfono
   */
  static validatePhone(phone: string): ValidationError | null {
    if (!phone) return null;
    
    if (!VALIDATION_PATTERNS.PHONE.test(phone)) {
      return {
        field: 'phone',
        message: 'Formato de teléfono inválido'
      };
    }
    
    return null;
  }
  
  /**
   * Validar campo requerido
   */
  static validateRequired(value: any, fieldName: string): ValidationError | null {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return {
        field: fieldName,
        message: `${fieldName} es requerido`
      };
    }
    
    return null;
  }
  
  /**
   * Validar número positivo
   */
  static validatePositiveNumber(value: number, fieldName: string): ValidationError | null {
    if (value === undefined || value === null) {
      return {
        field: fieldName,
        message: `${fieldName} es requerido`
      };
    }
    
    if (typeof value !== 'number' || value <= 0) {
      return {
        field: fieldName,
        message: `${fieldName} debe ser un número positivo`
      };
    }
    
    return null;
  }
  
  /**
   * Validar lista de muestras
   */
  static validateMuestras(muestras: any[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!muestras || muestras.length === 0) {
      errors.push({
        field: 'muestras',
        message: 'Debe agregar al menos una muestra'
      });
      return errors;
    }
    
    muestras.forEach((muestra, index) => {
      const prefix = `muestras[${index}]`;
      
      // Validar campos requeridos
      const requiredFields = [
        'codigo_muestra',
        'identificacion_muestra',
        'estructura'
      ];
      
      requiredFields.forEach(field => {
        const error = this.validateRequired(muestra[field], field);
        if (error) {
          errors.push({
            field: `${prefix}.${field}`,
            message: error.message
          });
        }
      });
      
      // Validar fc_kg_cm2
      const fcError = this.validatePositiveNumber(muestra.fc_kg_cm2, 'fc_kg_cm2');
      if (fcError) {
        errors.push({
          field: `${prefix}.fc_kg_cm2`,
          message: fcError.message
        });
      }
      
      // Validar edad
      const edadError = this.validatePositiveNumber(muestra.edad, 'edad');
      if (edadError) {
        errors.push({
          field: `${prefix}.edad`,
          message: edadError.message
        });
      }
      
      // Validar fecha de moldeo
      if (muestra.fecha_moldeo) {
        const dateError = this.validateDate(muestra.fecha_moldeo);
        if (dateError) {
          errors.push({
            field: `${prefix}.fecha_moldeo`,
            message: dateError.message
          });
        }
      }
      
      // Validar hora de moldeo (ahora acepta cualquier texto)
      // No se valida formato específico, permite cualquier carácter
    });
    
    return errors;
  }
  
  /**
   * Validar datos completos de recepción
   */
  static validateRecepcionData(data: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Validar campos requeridos
    const requiredFields = [
      'numero_ot',
      'numero_recepcion',
      'cliente',
      'proyecto',
      'fecha_recepcion'
    ];
    
    requiredFields.forEach(field => {
      const error = this.validateRequired(data[field], field);
      if (error) {
        errors.push(error);
      }
    });
    
    // Validar formatos específicos
    if (data.ruc) {
      const rucError = this.validateRUC(data.ruc);
      if (rucError) errors.push(rucError);
    }
    
    if (data.email) {
      const emailError = this.validateEmail(data.email);
      if (emailError) errors.push(emailError);
    }
    
    if (data.telefono) {
      const phoneError = this.validatePhone(data.telefono);
      if (phoneError) errors.push(phoneError);
    }
    
    if (data.fecha_recepcion) {
      const dateError = this.validateDate(data.fecha_recepcion);
      if (dateError) errors.push(dateError);
    }
    
    if (data.fecha_estimada_culminacion) {
      const dateError = this.validateDate(data.fecha_estimada_culminacion);
      if (dateError) errors.push(dateError);
    }
    
    // Validar muestras
    const muestrasErrors = this.validateMuestras(data.muestras);
    errors.push(...muestrasErrors);
    
    return errors;
  }
}

/**
 * Utilidades de formato
 */
export class Formatter {
  /**
   * Formatear fecha a DD/MM/YYYY
   */
  static formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  /**
   * Formatear hora a HH:MM
   */
  static formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  /**
   * Obtener números fijos predefinidos
   */
  static getFixedNumbers() {
    return {
      numero_ot: "1422",
      numero_recepcion: "1384"
    };
  }
}

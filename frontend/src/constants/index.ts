/**
 * Constantes de la aplicación
 */

// Configuración de la API
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const;

// Patrones de validación
export const VALIDATION_PATTERNS = {
  DATE: /^\d{2}\/\d{2}\/\d{4}$/,
  TIME: /^\d{2}:\d{2}$/,
  RUC: /^\d{11}$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
} as const;

// Valores por defecto
export const DEFAULT_VALUES = {
  FC_KG_CM2: 210,
  EDAD: 28,
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: 'HH:MM',
} as const;

// Mensajes de la aplicación
export const MESSAGES = {
  SUCCESS: {
    RECEPCION_CREATED: 'Recepción creada exitosamente',
    PDF_DOWNLOADED: 'PDF descargado exitosamente',
    EXCEL_DOWNLOADED: 'Excel descargado exitosamente',
    FORM_CLEARED: 'Formulario limpiado',
  },
  ERROR: {
    VALIDATION_FAILED: 'Error de validación en el formulario',
    RECEPCION_CREATE_FAILED: 'Error al crear la recepción',
    PDF_DOWNLOAD_FAILED: 'Error al descargar PDF',
    EXCEL_DOWNLOAD_FAILED: 'Error al descargar Excel',
    NETWORK_ERROR: 'Error de conexión con el servidor',
    UNKNOWN_ERROR: 'Error inesperado',
  },
  WARNING: {
    CLEAR_FORM_CONFIRM: '¿Está seguro de que desea limpiar todos los campos?',
    NO_SAMPLES: 'Debe agregar al menos una muestra',
  },
} as const;

// Configuración de formularios
export const FORM_CONFIG = {
  MAX_SAMPLES: 50,
  MIN_SAMPLES: 1,
  DEBOUNCE_DELAY: 300,
} as const;

// Rutas de la aplicación
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  ORDENES: '/ordenes',
  NUEVA_ORDEN: '/nueva-orden',
  UPLOAD_EXCEL: '/upload-excel',
  EXPORT_EXCEL: '/export-excel',
} as const;

// Tipos de archivo permitidos
export const ALLOWED_FILE_TYPES = {
  EXCEL: ['.xlsx', '.xls'],
  PDF: ['.pdf'],
} as const;

// Configuración de la tabla
export const TABLE_CONFIG = {
  PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

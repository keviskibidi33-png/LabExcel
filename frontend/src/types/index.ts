/**
 * Tipos TypeScript para la aplicación
 */

// Tipos de datos de la recepción
export interface RecepcionMuestraData {
  id?: number;
  numero_ot: string;
  numero_recepcion: string;
  numero_cotizacion: string;
  codigo_trazabilidad: string;
  asunto: string;
  cliente: string;
  domicilio_legal: string;
  ruc: string;
  persona_contacto: string;
  email: string;
  telefono: string;
  solicitante: string;
  domicilio_solicitante: string;
  proyecto: string;
  ubicacion: string;
  fecha_recepcion: string;
  fecha_estimada_culminacion: string;
  emision_fisica: boolean;
  emision_digital: boolean;
  entregado_por: string;
  recibido_por: string;
  codigo_laboratorio: string;
  version: string;
  muestras: MuestraConcretoData[];
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

// Tipos de datos de muestra
export interface MuestraConcretoData {
  id?: number;
  item_numero: number;
  codigo_muestra: string;
  identificacion_muestra: string;
  estructura: string;
  fc_kg_cm2: number;
  fecha_moldeo: string;
  hora_moldeo: string;
  edad: number;
  fecha_rotura: string;
  requiere_densidad: boolean;
  recepcion_id?: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

// Tipos para formularios
export interface OrdenFormData extends Omit<RecepcionMuestraData, 'id' | 'fecha_creacion' | 'fecha_actualizacion'> {}

// Tipos para API
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Tipos para validación
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

// Tipos para archivos
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// Tipos para paginación
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para filtros
export interface RecepcionFilters {
  cliente?: string;
  proyecto?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  numero_ot?: string;
}

// Tipos para estadísticas
export interface DashboardStats {
  total_recepciones: number;
  recepciones_mes: number;
  muestras_pendientes: number;
  muestras_completadas: number;
}

// Tipos para configuración
export interface AppConfig {
  apiUrl: string;
  version: string;
  environment: 'development' | 'production' | 'test';
}

// Tipos para notificaciones
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

// Tipos para componentes
export interface TableColumn<T = any> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// Tipos para hooks
export interface UseFormReturn<T> {
  data: T;
  errors: FormErrors;
  isValid: boolean;
  isSubmitting: boolean;
  setData: (data: Partial<T>) => void;
  setError: (field: string, message: string) => void;
  clearError: (field: string) => void;
  clearErrors: () => void;
  validate: () => boolean;
  submit: () => Promise<void>;
  reset: () => void;
}

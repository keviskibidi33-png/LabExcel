import axios from 'axios'
import { mockApiService } from './mockApi'
import { databaseService } from './databaseService'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para manejar errores y usar mock cuando el backend no esté disponible
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    // Si es un error de conexión, usar datos mock
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      console.log('Backend no disponible, usando datos mock')
      return Promise.reject({ useMock: true, originalError: error })
    }
    return Promise.reject(error)
  }
)

// Tipos de datos
export interface OrdenTrabajo {
  id: number
  numero_ot: string
  numero_recepcion: string
  referencia?: string
  codigo_laboratorio: string
  version: string
  fecha_creacion: string
  fecha_recepcion?: string
  fecha_inicio_programado?: string
  fecha_inicio_real?: string
  fecha_fin_programado?: string
  fecha_fin_real?: string
  plazo_entrega_dias?: number
  duracion_real_dias?: number
  observaciones?: string
  aperturada_por?: string
  designada_a?: string
  estado: string
  items: ItemOrden[]
}

export interface ItemOrden {
  id: number
  item_numero: number
  codigo_muestra: string
  descripcion: string
  cantidad: number
  especificacion?: string
}

export interface RecepcionMuestraCreate {
  numero_ot: string
  numero_recepcion: string
  numero_cotizacion?: string
  // codigo_trazabilidad eliminado
  // asunto eliminado
  cliente: string
  domicilio_legal: string
  ruc: string
  persona_contacto: string
  email: string
  telefono: string
  solicitante: string
  domicilio_solicitante: string
  proyecto: string
  ubicacion: string
  fecha_recepcion?: string
  fecha_estimada_culminacion?: string
  emision_fisica: boolean
  emision_digital: boolean
  entregado_por?: string
  recibido_por?: string
  codigo_laboratorio?: string
  version?: string
  fecha_inicio_programado?: string
  fecha_inicio_real?: string
  fecha_fin_programado?: string
  fecha_fin_real?: string
  plazo_entrega_dias?: number
  duracion_real_dias?: number
  observaciones?: string
  aperturada_por?: string
  designada_a?: string
  estado?: string
  muestras: MuestraConcretoCreate[]
}

export interface MuestraConcretoCreate {
  item_numero: number
  codigo_muestra: string
  identificacion_muestra: string
  estructura: string
  fc_kg_cm2: number
  fecha_moldeo: string
  hora_moldeo?: string
  edad: number
  fecha_rotura: string
  requiere_densidad: boolean
}

export interface DashboardStats {
  total_ordenes: number
  ordenes_pendientes: number
  ordenes_completadas: number
  total_items: number
  ordenes_recientes: OrdenTrabajo[]
}

// Función helper para manejar errores y usar datos reales de la base de datos
const handleApiCall = async <T>(apiCall: () => Promise<T>, dbCall: () => Promise<T>): Promise<T> => {
  try {
    return await apiCall()
  } catch (error: any) {
    if (error.useMock) {
      console.log('Backend no disponible, usando datos reales de la base de datos')
      return await dbCall()
    }
    throw error
  }
}

// Funciones de API
export const apiService = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    return handleApiCall(
      async () => {
        const response = await api.get('/api/dashboard/stats')
        return response.data
      },
      () => databaseService.getDashboardStats()
    )
  },

  // Órdenes
  getOrdenes: async (skip = 0, limit = 100): Promise<OrdenTrabajo[]> => {
    return handleApiCall(
      async () => {
        const response = await api.get(`/api/ordenes/?skip=${skip}&limit=${limit}`)
        return response.data
      },
      () => databaseService.getOrdenes(skip, limit)
    )
  },

  getOrden: async (id: number): Promise<OrdenTrabajo> => {
    return handleApiCall(
      async () => {
        const response = await api.get(`/api/ordenes/${id}`)
        return response.data
      },
      () => databaseService.getOrden(id)
    )
  },

  createOrden: async (orden: RecepcionMuestraCreate): Promise<RecepcionMuestraCreate> => {
    return handleApiCall(
      async () => {
        console.log('Enviando datos al backend:', orden)
        const response = await api.post('/api/ordenes/', orden)
        console.log('Recepción creada exitosamente:', response.data)
        return response.data
      },
      () => databaseService.createOrden(orden)
    )
  },

  updateOrden: async (id: number, orden: Partial<OrdenTrabajoCreate>): Promise<OrdenTrabajo> => {
    return handleApiCall(
      async () => {
        const response = await api.put(`/api/ordenes/${id}`, orden)
        return response.data
      },
      () => databaseService.updateOrden(id, orden)
    )
  },

  deleteOrden: async (id: number): Promise<void> => {
    return handleApiCall(
      async () => {
        await api.delete(`/api/ordenes/${id}`)
      },
      () => databaseService.deleteOrden(id)
    )
  },

  // Excel
  uploadExcel: async (file: File): Promise<{ message: string; orden_id: number }> => {
    return handleApiCall(
      async () => {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await api.post('/api/excel/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        return response.data
      },
      () => mockApiService.uploadExcel(file)
    )
  },

  downloadTemplate: async (ordenId: number): Promise<Blob> => {
    return handleApiCall(
      async () => {
        const response = await api.get(`/api/excel/template/${ordenId}`, {
          responseType: 'blob',
        })
        return response.data
      },
      () => mockApiService.downloadTemplate(ordenId)
    )
  },

  exportOrdenes: async (ordenIds: number[]): Promise<Blob> => {
    return handleApiCall(
      async () => {
        const response = await api.post('/api/excel/export', { orden_ids: ordenIds }, {
          responseType: 'blob',
        })
        return response.data
      },
      () => mockApiService.exportOrdenes(ordenIds)
    )
  },

  // Nuevas funciones para PDF y Excel
  downloadPDF: async (recepcionId: number): Promise<Blob> => {
    const response = await api.get(`/api/ordenes/${recepcionId}/pdf`, {
      responseType: 'blob'
    })
    return response.data
  },

  downloadExcel: async (recepcionId: number): Promise<Blob> => {
    const response = await api.get(`/api/ordenes/${recepcionId}/excel`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Búsqueda
  searchOrdenes: async (termino: string): Promise<OrdenTrabajo[]> => {
    return handleApiCall(
      async () => {
        const response = await api.get(`/api/ordenes/search?q=${encodeURIComponent(termino)}`)
        return response.data
      },
      () => databaseService.searchOrdenes(termino)
    )
  },
}

// Función helper para descargar archivos
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Exportar funciones individuales para facilitar el uso
export const { 
  getOrdenes, 
  getOrden, 
  createOrden, 
  updateOrden, 
  deleteOrden,
  uploadExcel,
  downloadTemplate,
  exportOrdenes,
  downloadPDF,
  downloadExcel
} = apiService
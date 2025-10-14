import { OrdenTrabajo, ItemOrden, OrdenTrabajoCreate, DashboardStats } from './api'

// Datos mock para desarrollo
const mockOrdenes: OrdenTrabajo[] = [
  {
    id: 1,
    numero_ot: "1422-25-LEM",
    numero_recepcion: "1384-25",
    referencia: "MEGAMINTAJE",
    codigo_laboratorio: "F-LEM-P-02.01",
    version: "03",
    fecha_creacion: "2025-01-08T00:00:00Z",
    fecha_recepcion: "2025-10-07T00:00:00Z",
    fecha_inicio_programado: "2025-10-07T00:00:00Z",
    fecha_fin_programado: "2025-10-09T00:00:00Z",
    plazo_entrega_dias: 3,
    observaciones: "Orden de trabajo para pruebas de compresión",
    aperturada_por: "ANGELA PAREDES",
    designada_a: "DAVID MEJORADA",
    estado: "EN_PROCESO",
    items: [
      {
        id: 1,
        item_numero: 1,
        codigo_muestra: "4259-CO-25",
        descripcion: "COMPRESION DE PROBETAS",
        cantidad: 5,
        especificacion: "C-6 M-1"
      },
      {
        id: 2,
        item_numero: 2,
        codigo_muestra: "4263-CO-25",
        descripcion: "COMPRESION DE PROBETAS",
        cantidad: 3,
        especificacion: "C-6 M-1"
      }
    ]
  },
  {
    id: 2,
    numero_ot: "1423-25-LEM",
    numero_recepcion: "1385-25",
    referencia: "CONCRETO",
    codigo_laboratorio: "F-LEM-P-02.02",
    version: "01",
    fecha_creacion: "2025-01-09T00:00:00Z",
    fecha_recepcion: "2025-10-08T00:00:00Z",
    fecha_inicio_programado: "2025-10-08T00:00:00Z",
    fecha_fin_programado: "2025-10-10T00:00:00Z",
    plazo_entrega_dias: 2,
    observaciones: "Pruebas de resistencia a compresión",
    aperturada_por: "CARLOS MENDEZ",
    designada_a: "MARIA GONZALEZ",
    estado: "PENDIENTE",
    items: [
      {
        id: 3,
        item_numero: 1,
        codigo_muestra: "4270-CO-25",
        descripcion: "RESISTENCIA A COMPRESION",
        cantidad: 6,
        especificacion: "C-7 M-2"
      }
    ]
  }
]

// Simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const mockApiService = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    await delay(500)
    return {
      total_ordenes: mockOrdenes.length,
      ordenes_pendientes: mockOrdenes.filter(o => o.estado === 'PENDIENTE').length,
      ordenes_completadas: mockOrdenes.filter(o => o.estado === 'COMPLETADA').length,
      total_items: mockOrdenes.reduce((sum, o) => sum + o.items.length, 0),
      ordenes_recientes: mockOrdenes.slice(0, 5)
    }
  },

  // Órdenes
  getOrdenes: async (skip = 0, limit = 100): Promise<OrdenTrabajo[]> => {
    await delay(300)
    return mockOrdenes.slice(skip, skip + limit)
  },

  getOrden: async (id: number): Promise<OrdenTrabajo> => {
    await delay(200)
    const orden = mockOrdenes.find(o => o.id === id)
    if (!orden) {
      throw new Error('Orden no encontrada')
    }
    return orden
  },

  createOrden: async (orden: OrdenTrabajoCreate): Promise<OrdenTrabajo> => {
    await delay(400)
    const newOrden: OrdenTrabajo = {
      id: mockOrdenes.length + 1,
      ...orden,
      fecha_creacion: new Date().toISOString(),
      estado: orden.estado || 'PENDIENTE',
      items: orden.items.map((item, index) => ({
        id: mockOrdenes.length * 10 + index + 1,
        ...item
      }))
    }
    mockOrdenes.push(newOrden)
    return newOrden
  },

  updateOrden: async (id: number, orden: Partial<OrdenTrabajoCreate>): Promise<OrdenTrabajo> => {
    await delay(300)
    const index = mockOrdenes.findIndex(o => o.id === id)
    if (index === -1) {
      throw new Error('Orden no encontrada')
    }
    mockOrdenes[index] = { ...mockOrdenes[index], ...orden }
    return mockOrdenes[index]
  },

  deleteOrden: async (id: number): Promise<void> => {
    await delay(200)
    const index = mockOrdenes.findIndex(o => o.id === id)
    if (index === -1) {
      throw new Error('Orden no encontrada')
    }
    mockOrdenes.splice(index, 1)
  },

  // Excel
  uploadExcel: async (file: File): Promise<{ message: string; orden_id: number }> => {
    await delay(1000)
    return {
      message: `Archivo ${file.name} procesado correctamente`,
      orden_id: mockOrdenes.length + 1
    }
  },

  downloadTemplate: async (ordenId: number): Promise<Blob> => {
    await delay(500)
    // Crear un blob mock con contenido de Excel
    const content = `ORDEN DE TRABAJO DE LABORATORIO\nCÓDIGO: F-LEM-P-02.01\nVERSIÓN: 03\nFECHA: ${new Date().toLocaleDateString()}\nPÁGINA: 1 de 1\n\nN OT: ${ordenId}\nN RECEPCIÓN: ${ordenId}\nREFERENCIA: -`
    return new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  },

  exportOrdenes: async (ordenIds: number[]): Promise<Blob> => {
    await delay(800)
    const content = `EXPORTACIÓN DE ÓRDENES\nIDs: ${ordenIds.join(', ')}\nFecha: ${new Date().toLocaleDateString()}`
    return new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  },

  // Búsqueda
  searchOrdenes: async (termino: string): Promise<OrdenTrabajo[]> => {
    await delay(300)
    const terminoLower = termino.toLowerCase()
    return mockOrdenes.filter(orden => 
      orden.numero_ot.toLowerCase().includes(terminoLower) ||
      orden.numero_recepcion.toLowerCase().includes(terminoLower) ||
      orden.referencia?.toLowerCase().includes(terminoLower) ||
      orden.aperturada_por?.toLowerCase().includes(terminoLower) ||
      orden.designada_a?.toLowerCase().includes(terminoLower)
    )
  },
}

import { OrdenTrabajo, ItemOrden, OrdenTrabajoCreate, DashboardStats } from './api'

// Configuración de la base de datos
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'laboratorio_db',
  user: 'laboratorio_user',
  password: 'laboratorio_password_2025'
}

// Función para ejecutar consultas SQL
async function executeQuery(query: string, params: any[] = []): Promise<any[]> {
  try {
    // Usar una API proxy para ejecutar consultas SQL
    const response = await fetch('http://localhost:3001/api/db/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, params })
    })
    
    if (!response.ok) {
      throw new Error(`Error en consulta: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error ejecutando consulta:', error)
    throw error
  }
}

export const databaseService = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const [ordenesResult, itemsResult] = await Promise.all([
        executeQuery(`
          SELECT 
            COUNT(*) as total_ordenes,
            COUNT(CASE WHEN estado = 'PENDIENTE' THEN 1 END) as ordenes_pendientes,
            COUNT(CASE WHEN estado = 'COMPLETADA' THEN 1 END) as ordenes_completadas
          FROM ordenes_trabajo
        `),
        executeQuery('SELECT COUNT(*) as total_items FROM items_orden')
      ])

      const ordenesRecientes = await executeQuery(`
        SELECT * FROM ordenes_trabajo 
        ORDER BY fecha_creacion DESC 
        LIMIT 5
      `)

      return {
        total_ordenes: ordenesResult[0]?.total_ordenes || 0,
        ordenes_pendientes: ordenesResult[0]?.ordenes_pendientes || 0,
        ordenes_completadas: ordenesResult[0]?.ordenes_completadas || 0,
        total_items: itemsResult[0]?.total_items || 0,
        ordenes_recientes: ordenesRecientes
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      // Retornar datos por defecto si hay error
      return {
        total_ordenes: 0,
        ordenes_pendientes: 0,
        ordenes_completadas: 0,
        total_items: 0,
        ordenes_recientes: []
      }
    }
  },

  // Órdenes
  getOrdenes: async (skip = 0, limit = 100): Promise<OrdenTrabajo[]> => {
    try {
      const ordenes = await executeQuery(`
        SELECT * FROM ordenes_trabajo 
        ORDER BY fecha_creacion DESC 
        LIMIT $1 OFFSET $2
      `, [limit, skip])

      // Obtener items para cada orden
      const ordenesConItems = await Promise.all(
        ordenes.map(async (orden) => {
          const items = await executeQuery(`
            SELECT * FROM items_orden 
            WHERE orden_id = $1 
            ORDER BY item_numero
          `, [orden.id])
          
          return {
            ...orden,
            items: items
          }
        })
      )

      return ordenesConItems
    } catch (error) {
      console.error('Error obteniendo órdenes:', error)
      return []
    }
  },

  getOrden: async (id: number): Promise<OrdenTrabajo> => {
    try {
      const [ordenResult, itemsResult] = await Promise.all([
        executeQuery('SELECT * FROM ordenes_trabajo WHERE id = $1', [id]),
        executeQuery('SELECT * FROM items_orden WHERE orden_id = $1 ORDER BY item_numero', [id])
      ])

      if (ordenResult.length === 0) {
        throw new Error('Orden no encontrada')
      }

      return {
        ...ordenResult[0],
        items: itemsResult
      }
    } catch (error) {
      console.error('Error obteniendo orden:', error)
      throw error
    }
  },

  createOrden: async (orden: OrdenTrabajoCreate): Promise<OrdenTrabajo> => {
    try {
      // Crear la orden
      const ordenResult = await executeQuery(`
        INSERT INTO ordenes_trabajo (
          numero_ot, numero_recepcion, referencia, codigo_laboratorio, version,
          fecha_recepcion, fecha_inicio_programado, fecha_inicio_real,
          fecha_fin_programado, fecha_fin_real, plazo_entrega_dias,
          duracion_real_dias, observaciones, aperturada_por, designada_a, estado
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *
      `, [
        orden.numero_ot, orden.numero_recepcion, orden.referencia,
        orden.codigo_laboratorio, orden.version, orden.fecha_recepcion,
        orden.fecha_inicio_programado, orden.fecha_inicio_real,
        orden.fecha_fin_programado, orden.fecha_fin_real, orden.plazo_entrega_dias,
        orden.duracion_real_dias, orden.observaciones, orden.aperturada_por,
        orden.designada_a, orden.estado || 'PENDIENTE'
      ])

      const nuevaOrden = ordenResult[0]

      // Crear los items
      const items = await Promise.all(
        orden.items.map(async (item) => {
          const itemResult = await executeQuery(`
            INSERT INTO items_orden (
              orden_id, item_numero, codigo_muestra, descripcion, cantidad, especificacion
            ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
          `, [
            nuevaOrden.id, item.item_numero, item.codigo_muestra,
            item.descripcion, item.cantidad, item.especificacion
          ])
          return itemResult[0]
        })
      )

      return {
        ...nuevaOrden,
        items: items
      }
    } catch (error) {
      console.error('Error creando orden:', error)
      throw error
    }
  },

  updateOrden: async (id: number, orden: Partial<OrdenTrabajoCreate>): Promise<OrdenTrabajo> => {
    try {
      // Actualizar la orden
      const campos = Object.keys(orden).filter(key => key !== 'items')
      const valores = campos.map(key => orden[key as keyof OrdenTrabajoCreate])
      const setClause = campos.map((key, index) => `${key} = $${index + 2}`).join(', ')

      if (setClause) {
        await executeQuery(`
          UPDATE ordenes_trabajo 
          SET ${setClause} 
          WHERE id = $1
        `, [id, ...valores])
      }

      // Si hay items, actualizarlos también
      if (orden.items) {
        // Eliminar items existentes
        await executeQuery('DELETE FROM items_orden WHERE orden_id = $1', [id])
        
        // Crear nuevos items
        await Promise.all(
          orden.items.map(async (item) => {
            await executeQuery(`
              INSERT INTO items_orden (
                orden_id, item_numero, codigo_muestra, descripcion, cantidad, especificacion
              ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              id, item.item_numero, item.codigo_muestra,
              item.descripcion, item.cantidad, item.especificacion
            ])
          })
        )
      }

      return await databaseService.getOrden(id)
    } catch (error) {
      console.error('Error actualizando orden:', error)
      throw error
    }
  },

  deleteOrden: async (id: number): Promise<void> => {
    try {
      // Eliminar items primero
      await executeQuery('DELETE FROM items_orden WHERE orden_id = $1', [id])
      // Eliminar la orden
      await executeQuery('DELETE FROM ordenes_trabajo WHERE id = $1', [id])
    } catch (error) {
      console.error('Error eliminando orden:', error)
      throw error
    }
  },

  // Búsqueda
  searchOrdenes: async (termino: string): Promise<OrdenTrabajo[]> => {
    try {
      const ordenes = await executeQuery(`
        SELECT * FROM ordenes_trabajo 
        WHERE numero_ot ILIKE $1 
           OR numero_recepcion ILIKE $1 
           OR referencia ILIKE $1 
           OR aperturada_por ILIKE $1 
           OR designada_a ILIKE $1
        ORDER BY fecha_creacion DESC
      `, [`%${termino}%`])

      // Obtener items para cada orden
      const ordenesConItems = await Promise.all(
        ordenes.map(async (orden) => {
          const items = await executeQuery(`
            SELECT * FROM items_orden 
            WHERE orden_id = $1 
            ORDER BY item_numero
          `, [orden.id])
          
          return {
            ...orden,
            items: items
          }
        })
      )

      return ordenesConItems
    } catch (error) {
      console.error('Error buscando órdenes:', error)
      return []
    }
  }
}

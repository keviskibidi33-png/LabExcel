import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'

export default function OrdenDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: orden, isLoading, error } = useQuery(
    ['orden', id],
    () => apiService.getOrden(Number(id)),
    {
      enabled: !!id,
      onError: (error: any) => {
        toast.error(`Error cargando orden: ${error.message}`)
      }
    }
  )

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'COMPLETADA':
        return 'bg-green-100 text-green-800'
      case 'EN_PROGRESO':
        return 'bg-yellow-100 text-yellow-800'
      case 'PENDIENTE':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'COMPLETADA':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'EN_PROGRESO':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />
      case 'PENDIENTE':
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-600" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="card">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-3 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !orden) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Error cargando orden
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          No se pudo cargar la orden solicitada
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/ordenes')}
            className="btn-primary"
          >
            Volver a Órdenes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/ordenes')}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Volver
          </button>
          <div className="flex items-center">
            {getEstadoIcon(orden.estado)}
            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(orden.estado)}`}>
              {orden.estado}
            </span>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">
          Orden de Trabajo {orden.numero_ot}
        </h1>
        <p className="mt-2 text-gray-600">
          N° Recepción: {orden.numero_recepcion}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalles de la orden */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información General
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Número OT</label>
                <p className="text-sm text-gray-900">{orden.numero_ot}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Número Recepción</label>
                <p className="text-sm text-gray-900">{orden.numero_recepcion}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Referencia</label>
                <p className="text-sm text-gray-900">{orden.referencia || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Código Laboratorio</label>
                <p className="text-sm text-gray-900">{orden.codigo_laboratorio}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Versión</label>
                <p className="text-sm text-gray-900">{orden.version}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Plazo de Entrega</label>
                <p className="text-sm text-gray-900">
                  {orden.plazo_entrega_dias ? `${orden.plazo_entrega_dias} días` : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Items de la orden */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Items de la Orden ({orden.items?.length || 0})
            </h2>
            {orden.items && orden.items.length > 0 ? (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Item</th>
                      <th className="table-header">Código Muestra</th>
                      <th className="table-header">Descripción</th>
                      <th className="table-header">Cantidad</th>
                      <th className="table-header">Especificación</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orden.items.map((item) => (
                      <tr key={item.id}>
                        <td className="table-cell font-medium">{item.item_numero}</td>
                        <td className="table-cell">{item.codigo_muestra}</td>
                        <td className="table-cell">{item.descripcion}</td>
                        <td className="table-cell">{item.cantidad}</td>
                        <td className="table-cell">{item.especificacion || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay items
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Esta orden no tiene items asociados
                </p>
              </div>
            )}
          </div>

          {/* Observaciones */}
          {orden.observaciones && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Observaciones
              </h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {orden.observaciones}
              </p>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Fechas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Fechas
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Creación</p>
                  <p className="text-sm text-gray-500">
                    {new Date(orden.fecha_creacion).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
              {orden.fecha_recepcion && (
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Recepción</p>
                    <p className="text-sm text-gray-500">
                      {new Date(orden.fecha_recepcion).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              )}
              {orden.fecha_inicio_programado && (
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Inicio Programado</p>
                    <p className="text-sm text-gray-500">
                      {new Date(orden.fecha_inicio_programado).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              )}
              {orden.fecha_fin_programado && (
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Fin Programado</p>
                    <p className="text-sm text-gray-500">
                      {new Date(orden.fecha_fin_programado).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Responsables */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Responsables
            </h3>
            <div className="space-y-3">
              {orden.aperturada_por && (
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Aperturada por</p>
                    <p className="text-sm text-gray-500">{orden.aperturada_por}</p>
                  </div>
                </div>
              )}
              {orden.designada_a && (
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Designada a</p>
                    <p className="text-sm text-gray-500">{orden.designada_a}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Acciones
            </h3>
            <div className="space-y-3">
              <button className="btn-primary w-full">
                Descargar Plantilla Excel
              </button>
              <button className="btn-secondary w-full">
                Editar Orden
              </button>
              <button className="btn-danger w-full">
                Eliminar Orden
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

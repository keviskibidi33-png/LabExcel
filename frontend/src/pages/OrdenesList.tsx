import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { 
  DocumentTextIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'

export default function OrdenesList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrdenes, setSelectedOrdenes] = useState<number[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [ordenToDelete, setOrdenToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteMultipleModal, setShowDeleteMultipleModal] = useState(false)

  const queryClient = useQueryClient()

  const { data: ordenes, isLoading, refetch } = useQuery(
    'ordenes',
    () => apiService.getOrdenes(),
    {
      onError: (error: any) => {
        toast.error(`Error cargando recepciones de muestra: ${error.message}`)
      }
    }
  )

  // Mutación para eliminar una orden
  const deleteOrdenMutation = useMutation(apiService.deleteOrden, {
    onSuccess: () => {
      queryClient.invalidateQueries('ordenes')
      toast.success('Recepción de muestra eliminada exitosamente')
      setShowDeleteModal(false)
      setOrdenToDelete(null)
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar recepción de muestra: ${error.message}`)
    },
    onSettled: () => {
      setIsDeleting(false)
    }
  })

  // Mutación para eliminar múltiples recepciones
  const deleteMultipleMutation = useMutation(
    async (ids: number[]) => {
      const deletePromises = ids.map(id => apiService.deleteOrden(id))
      await Promise.all(deletePromises)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ordenes')
        toast.success(`${selectedOrdenes.length} recepciones eliminadas exitosamente`)
        setSelectedOrdenes([])
        setShowDeleteMultipleModal(false)
      },
      onError: (error: any) => {
        toast.error(`Error al eliminar recepciones: ${error.message}`)
      },
      onSettled: () => {
        setIsDeleting(false)
      }
    }
  )

  const filteredOrdenes = ordenes?.filter(orden =>
    orden.numero_ot.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.numero_recepcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.referencia?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleSelectOrden = (ordenId: number) => {
    setSelectedOrdenes(prev =>
      prev.includes(ordenId)
        ? prev.filter(id => id !== ordenId)
        : [...prev, ordenId]
    )
  }

  const handleSelectAll = () => {
    if (selectedOrdenes.length === filteredOrdenes.length) {
      setSelectedOrdenes([])
    } else {
      setSelectedOrdenes(filteredOrdenes.map(orden => orden.id))
    }
  }

  // Función para eliminar una orden individual
  const handleDeleteOrden = (ordenId: number) => {
    setOrdenToDelete(ordenId)
    setShowDeleteModal(true)
  }

  // Función para confirmar eliminación individual
  const confirmDeleteOrden = async () => {
    if (ordenToDelete) {
      setIsDeleting(true)
      deleteOrdenMutation.mutate(ordenToDelete)
    }
  }

  // Función para eliminar múltiples recepciones
  const handleDeleteMultiple = async () => {
    if (selectedOrdenes.length === 0) return
    setShowDeleteMultipleModal(true)
  }

  // Función para confirmar eliminación múltiple
  const confirmDeleteMultiple = async () => {
    setIsDeleting(true)
    deleteMultipleMutation.mutate([...selectedOrdenes])
  }

  // Función para cancelar eliminación
  const cancelDelete = () => {
    setShowDeleteModal(false)
    setOrdenToDelete(null)
  }

  // Función para cancelar eliminación múltiple
  const cancelDeleteMultiple = () => {
    setShowDeleteMultipleModal(false)
  }

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

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recepción de Muestra Cilíndricas de Concreto</h1>
            <p className="mt-2 text-gray-600">
              Gestiona las recepciones de muestra cilíndricas de concreto del laboratorio
            </p>
          </div>
          <Link
            to="/nueva-orden"
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
                      Nueva Recepción de Muestra
          </Link>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número OT, recepción o referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {filteredOrdenes.length} recepciones de muestra encontradas
            </span>
            {selectedOrdenes.length > 0 && (
              <>
                <span className="text-sm text-primary-600">
                  {selectedOrdenes.length} seleccionadas
                </span>
                <button
                  onClick={handleDeleteMultiple}
                  disabled={isDeleting}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Eliminar Seleccionadas
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lista de recepciones */}
      <div className="card">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header w-12">
                  <input
                    type="checkbox"
                    checked={selectedOrdenes.length === filteredOrdenes.length && filteredOrdenes.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="table-header">N° OT</th>
                <th className="table-header">N° Recepción</th>
                <th className="table-header">Referencia</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Items</th>
                <th className="table-header">Fecha</th>
                <th className="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrdenes.map((orden) => (
                <tr key={orden.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <input
                      type="checkbox"
                      checked={selectedOrdenes.includes(orden.id)}
                      onChange={() => handleSelectOrden(orden.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="table-cell font-medium text-primary-600">
                    {orden.numero_ot}
                  </td>
                  <td className="table-cell">{orden.numero_recepcion}</td>
                  <td className="table-cell">
                    {orden.referencia || '-'}
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(orden.estado)}`}>
                      {orden.estado}
                    </span>
                  </td>
                  <td className="table-cell">
                    {orden.items?.length || 0}
                  </td>
                  <td className="table-cell">
                    {new Date(orden.fecha_creacion).toLocaleDateString('es-ES')}
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <Link
                        to={`/ordenes/${orden.id}`}
                        className="p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                        title="Ver detalles de la recepción"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <button
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                        title="Editar recepción"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOrden(orden.id)}
                        disabled={isDeleting}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        title="Eliminar recepción"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredOrdenes.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No se encontraron recepciones de muestra' : 'No hay recepciones de muestra'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza creando una nueva recepción de muestra'
                }
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <Link
                    to="/nueva-orden"
                    className="btn-primary"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Crear Primera Recepción de Muestra
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para eliminación individual */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="px-6 py-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  ¿Eliminar Recepción?
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Esta acción eliminará permanentemente la recepción seleccionada y todos sus datos asociados. 
                  <span className="font-medium text-red-600"> Esta acción no se puede deshacer.</span>
                </p>
              </div>

              {/* Información adicional */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" />
                  <span>
                    Se eliminarán también todas las muestras asociadas a esta recepción.
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteOrden}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminación múltiple */}
      {showDeleteMultipleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="px-6 py-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  ¿Eliminar {selectedOrdenes.length} Recepciones?
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Esta acción eliminará permanentemente <span className="font-medium text-red-600">{selectedOrdenes.length}</span> recepciones seleccionadas y todos sus datos asociados. 
                  <span className="font-medium text-red-600"> Esta acción no se puede deshacer.</span>
                </p>
              </div>

              {/* Información adicional */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" />
                  <span>
                    Se eliminarán también todas las muestras asociadas a estas recepciones.
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteMultiple}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteMultiple}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Eliminar {selectedOrdenes.length}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

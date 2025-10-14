import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { 
  DocumentTextIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'

export default function OrdenesList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrdenes, setSelectedOrdenes] = useState<number[]>([])

  const { data: ordenes, isLoading, refetch } = useQuery(
    'ordenes',
    () => apiService.getOrdenes(),
    {
      onError: (error: any) => {
        toast.error(`Error cargando órdenes: ${error.message}`)
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
            <h1 className="text-3xl font-bold text-gray-900">Órdenes de Trabajo</h1>
            <p className="mt-2 text-gray-600">
              Gestiona las órdenes de trabajo del laboratorio
            </p>
          </div>
          <Link
            to="/upload"
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Orden
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
              {filteredOrdenes.length} órdenes encontradas
            </span>
            {selectedOrdenes.length > 0 && (
              <span className="text-sm text-primary-600">
                {selectedOrdenes.length} seleccionadas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lista de órdenes */}
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
                        className="text-primary-600 hover:text-primary-900"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
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
                {searchTerm ? 'No se encontraron órdenes' : 'No hay órdenes'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza creando una nueva orden de trabajo'
                }
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <Link
                    to="/upload"
                    className="btn-primary"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Crear Primera Orden
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

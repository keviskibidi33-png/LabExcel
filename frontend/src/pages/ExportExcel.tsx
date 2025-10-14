import { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  CloudArrowDownIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { apiService, downloadFile } from '../services/api'
import toast from 'react-hot-toast'

export default function ExportExcel() {
  const [selectedOrdenes, setSelectedOrdenes] = useState<number[]>([])
  const [isExporting, setIsExporting] = useState(false)

  const { data: ordenes, isLoading } = useQuery(
    'ordenes',
    () => apiService.getOrdenes(),
    {
      onError: (error: any) => {
        toast.error(`Error cargando órdenes: ${error.message}`)
      }
    }
  )

  const handleSelectOrden = (ordenId: number) => {
    setSelectedOrdenes(prev =>
      prev.includes(ordenId)
        ? prev.filter(id => id !== ordenId)
        : [...prev, ordenId]
    )
  }

  const handleSelectAll = () => {
    if (selectedOrdenes.length === ordenes?.length) {
      setSelectedOrdenes([])
    } else {
      setSelectedOrdenes(ordenes?.map(orden => orden.id) || [])
    }
  }

  const handleExport = async () => {
    if (selectedOrdenes.length === 0) {
      toast.error('Selecciona al menos una orden para exportar')
      return
    }

    setIsExporting(true)
    try {
      const blob = await apiService.exportOrdenes(selectedOrdenes)
      const filename = `export_ordenes_${new Date().toISOString().split('T')[0]}.xlsx`
      downloadFile(blob, filename)
      toast.success(`Exportación completada: ${filename}`)
    } catch (error: any) {
      toast.error(`Error exportando: ${error.message}`)
    } finally {
      setIsExporting(false)
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
        <h1 className="text-3xl font-bold text-gray-900">Exportar a Excel</h1>
        <p className="mt-2 text-gray-600">
          Selecciona las órdenes que deseas exportar a un archivo Excel
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de órdenes */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Seleccionar Órdenes
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {ordenes?.length || 0} órdenes disponibles
                </span>
                <span className="text-sm text-primary-600">
                  {selectedOrdenes.length} seleccionadas
                </span>
              </div>
            </div>

            {ordenes && ordenes.length > 0 ? (
              <div className="space-y-2">
                {/* Selector global */}
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={selectedOrdenes.length === ordenes.length && ordenes.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Seleccionar todas las órdenes
                  </span>
                </div>

                {/* Lista de órdenes */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {ordenes.map((orden) => (
                    <div
                      key={orden.id}
                      className={`flex items-center p-3 rounded-lg border ${
                        selectedOrdenes.includes(orden.id)
                          ? 'border-primary-200 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedOrdenes.includes(orden.id)}
                        onChange={() => handleSelectOrden(orden.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {orden.numero_ot}
                            </p>
                            <p className="text-sm text-gray-500">
                              Recepción: {orden.numero_recepcion}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(orden.estado)}`}>
                              {orden.estado}
                            </span>
                            <span className="text-xs text-gray-500">
                              {orden.items?.length || 0} items
                            </span>
                          </div>
                        </div>
                        {orden.referencia && (
                          <p className="text-xs text-gray-500 mt-1">
                            Ref: {orden.referencia}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay órdenes
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No hay órdenes disponibles para exportar
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel de exportación */}
        <div className="space-y-6">
          {/* Resumen de selección */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Resumen de Exportación
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Órdenes seleccionadas:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedOrdenes.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total items:</span>
                <span className="text-sm font-medium text-gray-900">
                  {ordenes
                    ?.filter(orden => selectedOrdenes.includes(orden.id))
                    .reduce((total, orden) => total + (orden.items?.length || 0), 0) || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Formato:</span>
                <span className="text-sm font-medium text-gray-900">Excel (.xlsx)</span>
              </div>
            </div>
          </div>

          {/* Opciones de exportación */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Opciones de Exportación
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="incluir-items"
                  defaultChecked
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="incluir-items" className="ml-2 text-sm text-gray-700">
                  Incluir items de las órdenes
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="incluir-fechas"
                  defaultChecked
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="incluir-fechas" className="ml-2 text-sm text-gray-700">
                  Incluir fechas y plazos
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="incluir-observaciones"
                  defaultChecked
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="incluir-observaciones" className="ml-2 text-sm text-gray-700">
                  Incluir observaciones
                </label>
              </div>
            </div>
          </div>

          {/* Botón de exportación */}
          <div className="card">
            <button
              onClick={handleExport}
              disabled={selectedOrdenes.length === 0 || isExporting}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <CloudArrowDownIcon className="h-5 w-5 mr-2" />
                  Exportar a Excel
                </>
              )}
            </button>
            
            {selectedOrdenes.length === 0 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Selecciona al menos una orden para exportar
              </p>
            )}
          </div>

          {/* Órdenes seleccionadas */}
          {selectedOrdenes.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Órdenes Seleccionadas
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {ordenes
                  ?.filter(orden => selectedOrdenes.includes(orden.id))
                  .map((orden) => (
                    <div key={orden.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-900">{orden.numero_ot}</span>
                      <button
                        onClick={() => handleSelectOrden(orden.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

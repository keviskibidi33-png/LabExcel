import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface OT {
  id: number;
  numero_ot: string;
  numero_recepcion: string;
  estado: string;
  fecha_creacion: string;
  fecha_recepcion?: string;
  plazo_entrega_dias?: number;
}

const OTList: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDownloadingExcel, setIsDownloadingExcel] = useState<number | null>(null);

  // Obtener lista de OT
  const { data: ots, isLoading, error } = useQuery<OT[]>('ordenes-trabajo', async () => {
    const response = await fetch('/api/ot/');
    if (!response.ok) throw new Error('Error al cargar órdenes de trabajo');
    return response.json();
  });

  // Eliminar OT
  const deleteOTMutation = useMutation(async (otId: number) => {
    const response = await fetch(`/api/ot/${otId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar orden de trabajo');
  }, {
    onSuccess: () => {
      toast.success('Orden de trabajo eliminada exitosamente');
      queryClient.invalidateQueries('ordenes-trabajo');
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar orden de trabajo: ${error.message}`);
    }
  });

  const handleDelete = (otId: number, numeroOT: string) => {
    if (window.confirm(`¿Está seguro de que desea eliminar la orden de trabajo ${numeroOT}?`)) {
      deleteOTMutation.mutate(otId);
    }
  };

  const handleDownloadExcel = async (otId: number) => {
    setIsDownloadingExcel(otId);
    try {
      const response = await fetch(`/api/ot/${otId}/excel`);
      if (!response.ok) throw new Error('Error al descargar Excel');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OT-${otId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Excel descargado exitosamente');
    } catch (error) {
      console.error('Error descargando Excel:', error);
      toast.error('Error al descargar Excel');
    } finally {
      setIsDownloadingExcel(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-lg">Error al cargar las recepciones de muestra</div>
        <div className="text-gray-600 mt-2">Por favor, intente nuevamente</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Orden de Trabajo</h1>
        <Link
          to="/ot/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          + Nueva Orden de Trabajo
        </Link>
      </div>

      {!ots || ots.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No hay órdenes de trabajo registradas</div>
          <Link
            to="/ot/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Crear Primera Orden de Trabajo
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° OT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Origen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plazo (días)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ots.map((ot) => (
                  <tr key={ot.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ot.numero_ot}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ot.numero_recepcion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ot.estado === 'PENDIENTE' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : ot.estado === 'EN_PROGRESO'
                          ? 'bg-blue-100 text-blue-800'
                          : ot.estado === 'COMPLETADA'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ot.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ot.fecha_creacion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ot.plazo_entrega_dias || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/ot/${ot.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          👁️
                        </Link>
                        <button
                          onClick={() => handleDownloadExcel(ot.id)}
                          disabled={isDownloadingExcel === ot.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Descargar Excel"
                        >
                          {isDownloadingExcel === ot.id ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            '📊'
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(ot.id, ot.numero_ot)}
                          disabled={deleteOTMutation.isLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OTList;

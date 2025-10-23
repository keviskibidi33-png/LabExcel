import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface ItemOT {
  id: number;
  item_numero: number;
  codigo_muestra: string;
  descripcion: string;
  cantidad: number;
}

interface OT {
  id: number;
  numero_ot: string;
  numero_recepcion: string;
  items: ItemOT[];
  fecha_recepcion?: string;
  plazo_entrega_dias?: number;
  fecha_inicio_programado?: string;
  fecha_fin_programado?: string;
  fecha_inicio_real?: string;
  fecha_fin_real?: string;
  variacion_inicio?: number;
  variacion_fin?: number;
  duracion_real_dias?: number;
  observaciones?: string;
  aperturada_por?: string;
  designada_a?: string;
  estado: string;
  fecha_creacion: string;
}

const OTDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  // Obtener detalles de la OT
  const { data: ot, isLoading, error } = useQuery<OT>(['ot', id], async () => {
    const response = await fetch(`/api/ot/${id}`);
    if (!response.ok) throw new Error('Error al cargar orden de trabajo');
    return response.json();
  });

  const handleDownloadExcel = async () => {
    if (!ot) return;
    setIsDownloadingExcel(true);
    try {
      const response = await fetch(`/api/ot/${ot.id}/excel`);
      if (!response.ok) throw new Error('Error al descargar Excel');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OT-${ot.numero_ot}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Excel descargado exitosamente');
    } catch (error) {
      console.error('Error descargando Excel:', error);
      toast.error('Error al descargar Excel');
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !ot) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-lg">Error al cargar la orden de trabajo</div>
        <div className="text-gray-600 mt-2">La orden de trabajo no existe o ha sido eliminada</div>
        <Link
          to="/ot"
          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orden de Trabajo: {ot.numero_ot}</h1>
          <p className="text-gray-600">N° Recepción: {ot.numero_recepcion}</p>
        </div>
        <div className="flex space-x-4">
          <Link
            to="/ot"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            ← Volver
          </Link>
          <button
            onClick={handleDownloadExcel}
            disabled={isDownloadingExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            {isDownloadingExcel ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando...
              </>
            ) : (
              <>
                📊 Descargar Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Estado */}
      <div className="mb-6">
        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
          ot.estado === 'PENDIENTE' 
            ? 'bg-yellow-100 text-yellow-800'
            : ot.estado === 'EN_PROGRESO'
            ? 'bg-blue-100 text-blue-800'
            : ot.estado === 'COMPLETADA'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          Estado: {ot.estado}
        </span>
      </div>


        {/* Fechas y Plazos */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Fechas y Plazos</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600">Fecha de Recepción:</label>
              <p className="text-gray-900">{formatDate(ot.fecha_recepcion)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Plazo de Entrega (días):</label>
              <p className="text-gray-900">{ot.plazo_entrega_dias || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Inicio Programado:</label>
              <p className="text-gray-900">{formatDate(ot.fecha_inicio_programado)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Fin Programado:</label>
              <p className="text-gray-900">{formatDate(ot.fecha_fin_programado)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Inicio Real:</label>
              <p className="text-gray-900">{formatDate(ot.fecha_inicio_real)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Fin Real:</label>
              <p className="text-gray-900">{formatDate(ot.fecha_fin_real)}</p>
            </div>
          </div>
        </div>

        {/* Variaciones y Duración */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Variaciones y Duración</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600">Variación de Inicio:</label>
              <p className="text-gray-900">{ot.variacion_inicio || 0} días</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Variación de Fin:</label>
              <p className="text-gray-900">{ot.variacion_fin || 0} días</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Duración Real de Ejecución:</label>
              <p className="text-gray-900">{ot.duracion_real_dias || 0} días</p>
            </div>
          </div>
        </div>

      {/* Items */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Items de la Orden de Trabajo</h3>
        {ot.items && ot.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ítem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código de Muestra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ot.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.item_numero}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.codigo_muestra || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.descripcion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.cantidad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay items registrados</p>
        )}
      </div>

      {/* Observaciones y Responsables */}
      {(ot.observaciones || ot.aperturada_por || ot.designada_a) && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Adicional</h3>
          <div className="space-y-3">
            {ot.observaciones && (
              <div>
                <label className="block text-sm font-medium text-gray-600">Observaciones:</label>
                <p className="text-gray-900">{ot.observaciones}</p>
              </div>
            )}
            {ot.aperturada_por && (
              <div>
                <label className="block text-sm font-medium text-gray-600">O/T Aperturada por:</label>
                <p className="text-gray-900">{ot.aperturada_por}</p>
              </div>
            )}
            {ot.designada_a && (
              <div>
                <label className="block text-sm font-medium text-gray-600">OT Designada a:</label>
                <p className="text-gray-900">{ot.designada_a}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OTDetail;

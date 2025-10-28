import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface VerificacionMuestra {
  id: number;
  numero_verificacion: string;
  codigo_documento: string;
  version: string;
  fecha_documento: string;
  pagina: string;
  verificado_por?: string;
  fecha_verificacion?: string;
  cliente?: string;
  fecha_creacion: string;
  archivo_excel?: string;
  muestras_verificadas: any[];
}

const VerificacionMuestrasList: React.FC = () => {
  const [verificaciones, setVerificaciones] = useState<VerificacionMuestra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarVerificaciones();
  }, []);

  const cargarVerificaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/verificacion/');
      
      if (response.ok) {
        try {
          const data = await response.json();
          setVerificaciones(data);
        } catch (jsonError) {
          console.log('Respuesta no es JSON válido, pero la operación fue exitosa');
          setVerificaciones([]);
        }
      } else {
        try {
          const errorData = await response.json();
          setError(`Error ${response.status}: ${errorData.detail || 'Error desconocido'}`);
        } catch (jsonError) {
          // Si no se puede parsear como JSON, usar el status text
          setError(`Error ${response.status}: ${response.statusText || 'Error desconocido'}`);
        }
      }
    } catch (err) {
      console.error('Error cargando verificaciones:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const eliminarVerificacion = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta verificación?')) {
      return;
    }

    try {
      const response = await fetch(`/api/verificacion/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setVerificaciones(prev => prev.filter(v => v.id !== id));
        alert('Verificación eliminada exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (err) {
      alert('Error eliminando verificación');
    }
  };

  const generarExcel = async (id: number) => {
    try {
      const response = await fetch(`/api/verificacion/${id}/generar-excel`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        alert('Excel generado exitosamente');
        // Recargar la lista para actualizar el estado
        cargarVerificaciones();
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (err) {
      alert('Error generando Excel');
    }
  };

  const descargarExcel = async (id: number) => {
    try {
      const response = await fetch(`/api/verificacion/${id}/descargar-excel`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verificacion_${id}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error descargando Excel');
      }
    } catch (err) {
      alert('Error descargando Excel');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Cargando verificaciones...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Verificaciones de Muestras Cilíndricas
            </h1>
            <Link
              to="/verificacion/nueva"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Nueva Verificación
            </Link>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
            <div className="text-red-600 text-lg font-medium mb-2">
              ⚠️ Error cargando verificaciones
            </div>
            <div className="text-red-700 mb-4">{error}</div>
            <button
              onClick={cargarVerificaciones}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Verificaciones de Muestras Cilíndricas
          </h1>
          <Link
            to="/verificacion/nueva"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Nueva Verificación
          </Link>
        </div>

        {verificaciones.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg mb-4">
              No hay verificaciones registradas
            </div>
            <Link
              to="/verificacion/nueva"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Crear Primera Verificación
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Verificación
                  </th>
                  <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verificado por
                  </th>
                  <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Verificación
                  </th>
                  <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Muestras
                  </th>
                  <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Excel
                  </th>
                  <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {verificaciones.map((verificacion) => (
                  <tr key={verificacion.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {verificacion.numero_verificacion}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {verificacion.cliente || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {verificacion.verificado_por || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {verificacion.fecha_verificacion || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {verificacion.muestras_verificadas?.length || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(verificacion.fecha_creacion).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {verificacion.archivo_excel ? (
                        <span className="text-green-600">✓ Generado</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/verificacion/${verificacion.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() => generarExcel(verificacion.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Generar Excel"
                        >
                          Generar Excel
                        </button>
                        {verificacion.archivo_excel && (
                          <button
                            onClick={() => descargarExcel(verificacion.id)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Descargar Excel"
                          >
                            Descargar
                          </button>
                        )}
                        <button
                          onClick={() => eliminarVerificacion(verificacion.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificacionMuestrasList;

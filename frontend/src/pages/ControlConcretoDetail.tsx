import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface ProbetaConcreto {
  id: number;
  item_numero: number;
  orden_trabajo: string;
  codigo_muestra: string;
  codigo_muestra_cliente: string;
  fecha_rotura: string;
  servicios_adicionales: string;
  fc_kg_cm2: number | null;
  nota: string;
  status_ensayado: string;
}

interface ControlConcreto {
  id: number;
  numero_control: string;
  codigo_documento: string;
  version: string;
  fecha_documento: string;
  pagina: string;
  fecha_creacion: string;
  archivo_excel: string | null;
  probetas: ProbetaConcreto[];
}

const ControlConcretoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [control, setControl] = useState<ControlConcreto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generandoExcel, setGenerandoExcel] = useState(false);

  useEffect(() => {
    if (id) {
      cargarControl(parseInt(id));
    }
  }, [id]);

  const cargarControl = async (controlId: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/concreto/control/${controlId}`);
      setControl(response.data);
    } catch (error) {
      console.error('Error cargando control:', error);
      setError('Error cargando control de concreto');
    } finally {
      setLoading(false);
    }
  };

  const generarExcel = async () => {
    if (!control) return;
    
    try {
      setGenerandoExcel(true);
      const response = await api.post(`/api/concreto/generar-excel/${control.id}`, {}, {
        responseType: 'blob'
      });
      
      // Descargar archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `control_concreto_${control.numero_control}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Recargar control para actualizar estado
      cargarControl(control.id);
    } catch (error) {
      console.error('Error generando Excel:', error);
      alert('Error generando archivo Excel');
    } finally {
      setGenerandoExcel(false);
    }
  };

  const eliminarControl = async () => {
    if (!control) return;
    
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el control ${control.numero_control}?`)) {
      return;
    }

    try {
      await api.delete(`/api/concreto/control/${control.id}`);
      alert('Control eliminado exitosamente');
      navigate('/concreto');
    } catch (error) {
      console.error('Error eliminando control:', error);
      alert('Error eliminando control');
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ROTURADO':
        return 'bg-green-100 text-green-800';
      case 'EN PROCESO':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELADO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando control de concreto...</p>
        </div>
      </div>
    );
  }

  if (error || !control) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">{error || 'Control no encontrado'}</p>
          <button
            onClick={() => navigate('/concreto')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Volver a la Lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{control.numero_control}</h1>
              <p className="mt-2 text-gray-600">
                Control de Concreto - {control.probetas.length} probetas
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={generarExcel}
                disabled={generandoExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {generandoExcel ? 'Generando...' : '📊 Generar Excel'}
              </button>
              <button
                onClick={() => navigate('/concreto')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                ← Volver
              </button>
              <button
                onClick={eliminarControl}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del Control */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Control</h3>
              
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Número de Control</dt>
                  <dd className="text-sm text-gray-900">{control.numero_control}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Código Documento</dt>
                  <dd className="text-sm text-gray-900">{control.codigo_documento}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Versión</dt>
                  <dd className="text-sm text-gray-900">{control.version}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha Documento</dt>
                  <dd className="text-sm text-gray-900">{control.fecha_documento}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Página</dt>
                  <dd className="text-sm text-gray-900">{control.pagina}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha Creación</dt>
                  <dd className="text-sm text-gray-900">{formatearFecha(control.fecha_creacion)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Archivo Excel</dt>
                  <dd className="text-sm">
                    {control.archivo_excel ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Generado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        ⏳ Pendiente
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Lista de Probetas */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Probetas ({control.probetas.length})
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código Muestra
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        F'C
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Rotura
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {control.probetas.map((probeta) => (
                      <tr key={probeta.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {probeta.item_numero}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{probeta.codigo_muestra}</div>
                          {probeta.orden_trabajo && (
                            <div className="text-sm text-gray-500">{probeta.orden_trabajo}</div>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {probeta.codigo_muestra_cliente || '-'}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {probeta.fc_kg_cm2 ? `${probeta.fc_kg_cm2} kg/cm²` : '-'}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {probeta.fecha_rotura || '-'}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(probeta.status_ensayado)}`}>
                            {probeta.status_ensayado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlConcretoDetail;

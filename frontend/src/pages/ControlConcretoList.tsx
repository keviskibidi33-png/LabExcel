import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import DeleteModal from '../components/DeleteModal';

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

const ControlConcretoList: React.FC = () => {
  const navigate = useNavigate();
  const [controles, setControles] = useState<ControlConcreto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [controlToDelete, setControlToDelete] = useState<{id: number, numero: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    cargarControles();
  }, []);

  const cargarControles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/concreto/controles');
      setControles(response.data);
    } catch (error) {
      console.error('Error cargando controles:', error);
      setError('Error cargando controles de concreto');
    } finally {
      setLoading(false);
    }
  };

  const generarExcel = async (controlId: number, numeroControl: string) => {
    try {
      const response = await api.post(`/api/concreto/generar-excel/${controlId}`, {}, {
        responseType: 'blob'
      });
      
      // Descargar archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `control_concreto_${numeroControl}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Recargar lista para actualizar estado
      cargarControles();
    } catch (error) {
      console.error('Error generando Excel:', error);
      alert('Error generando archivo Excel');
    }
  };

  const handleDeleteControl = (controlId: number, numeroControl: string) => {
    setControlToDelete({id: controlId, numero: numeroControl});
    setShowDeleteModal(true);
  };

  const confirmDeleteControl = async () => {
    if (!controlToDelete) return;

    setIsDeleting(true);
    try {
      await api.delete(`/api/concreto/control/${controlToDelete.id}`);
      alert('Control eliminado exitosamente');
      cargarControles();
      setShowDeleteModal(false);
      setControlToDelete(null);
    } catch (error) {
      console.error('Error eliminando control:', error);
      alert('Error eliminando control');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setControlToDelete(null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando controles de concreto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={cargarControles}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Control de Concreto</h1>
              <p className="mt-2 text-gray-600">
                Gestiona los controles de probetas de concreto
              </p>
            </div>
            <button
              onClick={() => navigate('/concreto/nuevo')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              + Nuevo Control
            </button>
          </div>
        </div>

        {controles.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay controles de concreto</h3>
            <p className="text-gray-600 mb-6">
              Comienza creando tu primer control de probetas de concreto
            </p>
            <button
              onClick={() => navigate('/concreto/nuevo')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Crear Primer Control
            </button>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Controles de Concreto ({controles.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Control
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Probetas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Creación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Archivo Excel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {controles.map((control) => (
                    <tr key={control.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {control.numero_control}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {control.id}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {control.codigo_documento}
                        </div>
                        <div className="text-sm text-gray-500">
                          v{control.version} - {control.fecha_documento}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {control.probetas.length} probetas
                        </div>
                        <div className="text-sm text-gray-500">
                          {control.probetas.filter(p => p.status_ensayado === 'ROTURADO').length} roturadas
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearFecha(control.fecha_creacion)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {control.archivo_excel ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ Generado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            ⏳ Pendiente
                          </span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => generarExcel(control.id, control.numero_control)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Generar Excel"
                        >
                          📊 Excel
                        </button>
                        <button
                          onClick={() => navigate(`/concreto/${control.id}`)}
                          className="text-green-600 hover:text-green-900"
                          title="Ver Detalles"
                        >
                          👁️ Ver
                        </button>
                        <button
                          onClick={() => handleDeleteControl(control.id, control.numero_control)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación para eliminación */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDeleteControl}
        isDeleting={isDeleting}
        title="¿Eliminar Control?"
        message="Esta acción eliminará permanentemente el control seleccionado y todos sus datos asociados."
        additionalInfo="Se eliminarán también todas las probetas asociadas a este control."
      />
    </div>
  );
};

export default ControlConcretoList;

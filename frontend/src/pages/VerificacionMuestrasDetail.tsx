import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import DeleteModal from '../components/DeleteModal';

interface MuestraVerificada {
  id: number;
  item_numero: number;
  codigo_cliente: string;
  tipo_testigo: string;
  diametro_1_mm?: number;
  diametro_2_mm?: number;
  tolerancia_porcentaje?: number;
  cumple_tolerancia?: boolean;
  perpendicularidad_p1?: boolean;
  perpendicularidad_p2?: boolean;
  perpendicularidad_p3?: boolean;
  perpendicularidad_p4?: boolean;
  perpendicularidad_cumple?: boolean;
  planitud_superior?: boolean;
  planitud_inferior?: boolean;
  planitud_depresiones?: boolean;
  accion_realizar?: string;
  conformidad_correccion?: boolean;
}

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
  muestras_verificadas: MuestraVerificada[];
}

const VerificacionMuestrasDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [verificacion, setVerificacion] = useState<VerificacionMuestra | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generandoExcel, setGenerandoExcel] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      cargarVerificacion(parseInt(id));
    }
  }, [id]);

  const cargarVerificacion = async (verificacionId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/verificacion/${verificacionId}`);
      
      if (response.ok) {
        const data = await response.json();
        setVerificacion(data);
      } else if (response.status === 404) {
        setError('Verificación no encontrada');
      } else {
        setError('Error cargando verificación');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const generarExcel = async () => {
    if (!verificacion) return;

    try {
      setGenerandoExcel(true);
      const response = await fetch(`/api/verificacion/${verificacion.id}/generar-excel`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        alert('Excel generado exitosamente');
        // Recargar la verificación para actualizar el estado
        cargarVerificacion(verificacion.id);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (err) {
      alert('Error generando Excel');
    } finally {
      setGenerandoExcel(false);
    }
  };

  const descargarExcel = async () => {
    if (!verificacion) return;

    try {
      const response = await fetch(`/api/verificacion/${verificacion.id}/descargar-excel`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verificacion_${verificacion.numero_verificacion}.xlsx`;
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

  const handleDeleteVerificacion = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteVerificacion = async () => {
    if (!verificacion) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/verificacion/${verificacion.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Verificación eliminada exitosamente');
        navigate('/verificacion');
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (err) {
      alert('Error eliminando verificación');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Cargando verificación...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !verificacion) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error || 'Verificación no encontrada'}</div>
            <Link
              to="/verificacion"
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Volver a la Lista
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Encabezado */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Verificación: {verificacion.numero_verificacion}
              </h1>
              <div className="text-sm text-gray-500">
                Creada el {new Date(verificacion.fecha_creacion).toLocaleDateString('es-PE')}
              </div>
            </div>
            <div className="flex space-x-2">
              <Link
                to="/verificacion"
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Volver
              </Link>
              <button
                onClick={generarExcel}
                disabled={generandoExcel}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {generandoExcel ? 'Generando...' : 'Generar Excel'}
              </button>
              {verificacion.archivo_excel && (
                <button
                  onClick={descargarExcel}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Descargar Excel
                </button>
              )}
              <button
                onClick={handleDeleteVerificacion}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Eliminar
              </button>
            </div>
          </div>

          {/* Información general */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Información del Documento</h3>
              <p><span className="font-medium">Código:</span> {verificacion.codigo_documento}</p>
              <p><span className="font-medium">Versión:</span> {verificacion.version}</p>
              <p><span className="font-medium">Fecha:</span> {verificacion.fecha_documento}</p>
              <p><span className="font-medium">Página:</span> {verificacion.pagina}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Verificador</h3>
              <p><span className="font-medium">Código:</span> {verificacion.verificado_por || '-'}</p>
              <p><span className="font-medium">Fecha:</span> {verificacion.fecha_verificacion || '-'}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Cliente</h3>
              <p>{verificacion.cliente || '-'}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Estado Excel</h3>
              {verificacion.archivo_excel ? (
                <span className="text-green-600 font-medium">✓ Generado</span>
              ) : (
                <span className="text-gray-400">No generado</span>
              )}
            </div>
          </div>

          {/* Tabla de muestras */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Muestras Verificadas ({verificacion.muestras_verificadas.length})
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N°
                    </th>
                    <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código Cliente
                    </th>
                    <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo Testigo
                    </th>
                    <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diámetro 1 (mm)
                    </th>
                    <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diámetro 2 (mm)
                    </th>
                    <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tolerancia %
                    </th>
                    <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cumple
                    </th>
                    <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Perp. P1-P4
                    </th>
                    <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Perp. Cumple
                    </th>
                    <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Planitud
                    </th>
                    <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-4 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conformidad
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {verificacion.muestras_verificadas.map((muestra) => (
                    <tr key={muestra.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {muestra.item_numero}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {muestra.codigo_cliente}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {muestra.tipo_testigo || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {muestra.diametro_1_mm || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {muestra.diametro_2_mm || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {muestra.tolerancia_porcentaje ? `${muestra.tolerancia_porcentaje.toFixed(2)}%` : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {muestra.cumple_tolerancia !== undefined ? (
                          <span className={`px-2 py-1 rounded text-xs ${
                            muestra.cumple_tolerancia 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {muestra.cumple_tolerancia ? '✓' : '✗'}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-1">
                          {[muestra.perpendicularidad_p1, muestra.perpendicularidad_p2, 
                            muestra.perpendicularidad_p3, muestra.perpendicularidad_p4].map((p, i) => (
                            <span key={i} className={`px-1 py-1 rounded text-xs ${
                              p === true ? 'bg-green-100 text-green-800' : 
                              p === false ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {p === true ? '✓' : p === false ? '✗' : '-'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {muestra.perpendicularidad_cumple !== undefined ? (
                          <span className={`px-2 py-1 rounded text-xs ${
                            muestra.perpendicularidad_cumple 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {muestra.perpendicularidad_cumple ? '✓' : '✗'}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div className={`text-xs px-2 py-1 rounded ${
                            muestra.planitud_superior === true ? 'bg-green-100 text-green-800' : 
                            muestra.planitud_superior === false ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'
                          }`}>
                            Sup: {muestra.planitud_superior === true ? '✓' : muestra.planitud_superior === false ? '✗' : '-'}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            muestra.planitud_inferior === true ? 'bg-green-100 text-green-800' : 
                            muestra.planitud_inferior === false ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'
                          }`}>
                            Inf: {muestra.planitud_inferior === true ? '✓' : muestra.planitud_inferior === false ? '✗' : '-'}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            muestra.planitud_depresiones === true ? 'bg-green-100 text-green-800' : 
                            muestra.planitud_depresiones === false ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'
                          }`}>
                            Dep: {muestra.planitud_depresiones === true ? '✓' : muestra.planitud_depresiones === false ? '✗' : '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {muestra.accion_realizar ? (
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {muestra.accion_realizar}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {muestra.conformidad_correccion !== undefined ? (
                          <span className={`px-2 py-1 rounded text-xs ${
                            muestra.conformidad_correccion 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {muestra.conformidad_correccion ? '✓' : '✗'}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen de patrones */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Patrones de Acción</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {verificacion.muestras_verificadas.map((muestra) => (
                <div key={muestra.id} className="bg-white p-3 rounded border">
                  <div className="font-medium text-sm text-gray-700">
                    Muestra {muestra.item_numero} - {muestra.codigo_cliente}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <div>Cumple: {muestra.cumple_tolerancia ? '✓' : '✗'}</div>
                    <div>Perp. Cumple: {muestra.perpendicularidad_cumple ? '✓' : '✗'}</div>
                    <div>Plan. Sup: {muestra.planitud_superior ? '✓' : '✗'}</div>
                    <div className="font-medium text-blue-600 mt-2">
                      Acción: {muestra.accion_realizar || 'No calculada'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación para eliminación */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDeleteVerificacion}
        isDeleting={isDeleting}
        title="¿Eliminar Verificación?"
        message="Esta acción eliminará permanentemente la verificación seleccionada y todos sus datos asociados."
        additionalInfo="Se eliminarán también todas las muestras verificadas asociadas a esta verificación."
      />
    </Layout>
  );
};

export default VerificacionMuestrasDetail;

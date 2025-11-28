import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import { toast } from 'react-hot-toast';

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

  // Ref para rastrear el último ID cargado
  const lastLoadedIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (id) {
      // Siempre recargar cuando cambia el ID
      const idNum = parseInt(id);
      if (lastLoadedIdRef.current !== id) {
        lastLoadedIdRef.current = id;
        cargarVerificacion(idNum);
      } else {
        // Si es el mismo ID pero venimos de otra página, también recargar
        // Esto es útil cuando volvemos desde el formulario de edición
        const navigationState = (window.history.state && window.history.state.usr) || {};
        if (navigationState.fromEdit) {
          cargarVerificacion(idNum);
        }
      }
    }
  }, [id]);

  // Recargar cuando se vuelve a esta página desde otra (por ejemplo, después de editar)
  useEffect(() => {
    const handleFocus = () => {
      if (id && lastLoadedIdRef.current === id) {
        // Recargar si ya habíamos cargado este ID antes
        cargarVerificacion(parseInt(id));
      }
    };
    
    // Recargar cuando la ventana recibe foco
    window.addEventListener('focus', handleFocus);
    
    // También recargar cuando la página se vuelve visible
    const handleVisibilityChange = () => {
      if (!document.hidden && id && lastLoadedIdRef.current === id) {
        cargarVerificacion(parseInt(id));
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
        await response.json();
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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    if (!verificacion) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!verificacion) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/verificacion/${verificacion.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Verificación eliminada exitosamente');
        navigate('/verificacion');
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (err) {
      alert('Error eliminando verificación');
    }
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="card">
            {/* Encabezado Mobile-First */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <Link
                  to="/verificacion"
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <span className="text-sm md:text-base">← Volver</span>
                </Link>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/verificacion/${verificacion.id}/editar`)}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm md:text-base"
                  >
                    <span className="hidden sm:inline">Editar</span>
                    <span className="sm:hidden">✏️</span>
                  </button>
                  <button
                    onClick={generarExcel}
                    disabled={generandoExcel}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors text-sm md:text-base"
                  >
                    <span className="hidden sm:inline">{generandoExcel ? 'Generando...' : 'Generar Excel'}</span>
                    <span className="sm:hidden">{generandoExcel ? '...' : 'Excel'}</span>
                  </button>
                  {verificacion.archivo_excel && (
                    <button
                      onClick={descargarExcel}
                      className="px-3 md:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-sm md:text-base"
                    >
                      <span className="hidden sm:inline">Descargar</span>
                      <span className="sm:hidden">↓</span>
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    className="px-3 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-sm md:text-base"
                  >
                    <span className="hidden sm:inline">Eliminar</span>
                    <span className="sm:hidden">🗑️</span>
                  </button>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Verificación: {verificacion.numero_verificacion}
              </h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Creada el {new Date(verificacion.fecha_creacion).toLocaleDateString('es-PE')}
              </div>
            </div>

            {/* Información general */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Información del Documento</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium text-gray-900 dark:text-gray-100">Código:</span> <span className="text-gray-600 dark:text-gray-400">{verificacion.codigo_documento}</span></p>
                  <p><span className="font-medium text-gray-900 dark:text-gray-100">Versión:</span> <span className="text-gray-600 dark:text-gray-400">{verificacion.version}</span></p>
                  <p><span className="font-medium text-gray-900 dark:text-gray-100">Fecha:</span> <span className="text-gray-600 dark:text-gray-400">{verificacion.fecha_documento}</span></p>
                  <p><span className="font-medium text-gray-900 dark:text-gray-100">Página:</span> <span className="text-gray-600 dark:text-gray-400">{verificacion.pagina}</span></p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Verificador</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium text-gray-900 dark:text-gray-100">Código:</span> <span className="text-gray-600 dark:text-gray-400">{verificacion.verificado_por || '-'}</span></p>
                  <p><span className="font-medium text-gray-900 dark:text-gray-100">Fecha:</span> <span className="text-gray-600 dark:text-gray-400">{verificacion.fecha_verificacion || '-'}</span></p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cliente</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{verificacion.cliente || '-'}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Estado Excel</h3>
                {verificacion.archivo_excel ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">✓ Generado</span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">No generado</span>
                )}
              </div>
            </div>

            {/* Tabla de muestras */}
            <div className="mb-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Muestras Verificadas ({verificacion.muestras_verificadas.length})
              </h3>
              
              {/* Mobile: Cards */}
              <div className="block md:hidden space-y-4">
                {verificacion.muestras_verificadas.map((muestra) => (
                  <div key={muestra.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Item #{muestra.item_numero}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        muestra.conformidad_correccion === true ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        muestra.conformidad_correccion === false ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                      }`}>
                        {muestra.conformidad_correccion === true ? '✓ Conforme' : muestra.conformidad_correccion === false ? '✗ No conforme' : '-'}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div><span className="text-gray-500 dark:text-gray-400">Cliente:</span> <span className="text-gray-900 dark:text-gray-100">{muestra.codigo_cliente}</span></div>
                      <div><span className="text-gray-500 dark:text-gray-400">Tipo:</span> <span className="text-gray-900 dark:text-gray-100">{muestra.tipo_testigo || '-'}</span></div>
                      <div><span className="text-gray-500 dark:text-gray-400">Diámetros:</span> <span className="text-gray-900 dark:text-gray-100">{muestra.diametro_1_mm || '-'} / {muestra.diametro_2_mm || '-'} mm</span></div>
                      {muestra.accion_realizar && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-xs">
                          <span className="font-medium text-blue-900 dark:text-blue-300">Acción: </span>
                          <span className="text-blue-800 dark:text-blue-200">{muestra.accion_realizar}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop: Table */}
              <div className="hidden md:block overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        N°
                      </th>
                      <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Código Cliente
                      </th>
                      <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tipo Testigo
                      </th>
                      <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Diámetro 1 (mm)
                      </th>
                      <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Diámetro 2 (mm)
                      </th>
                      <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tolerancia %
                      </th>
                      <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cumple
                      </th>
                      <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Perp. P1-P4
                      </th>
                      <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Perp. Cumple
                      </th>
                      <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Planitud
                      </th>
                      <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acción
                      </th>
                      <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Conformidad
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {verificacion.muestras_verificadas.map((muestra) => (
                    <tr key={muestra.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {muestra.item_numero}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {muestra.codigo_cliente}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {muestra.tipo_testigo || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {muestra.diametro_1_mm || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {muestra.diametro_2_mm || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {muestra.tolerancia_porcentaje ? `${muestra.tolerancia_porcentaje.toFixed(2)}%` : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {muestra.cumple_tolerancia !== undefined ? (
                          <span className={`px-2 py-1 rounded text-xs ${
                            muestra.cumple_tolerancia 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {muestra.cumple_tolerancia ? '✓' : '✗'}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex space-x-1">
                          {[muestra.perpendicularidad_p1, muestra.perpendicularidad_p2, 
                            muestra.perpendicularidad_p3, muestra.perpendicularidad_p4].map((p, i) => (
                            <span key={i} className={`px-1 py-1 rounded text-xs ${
                              p === true ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 
                              p === false ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                            }`}>
                              {p === true ? '✓' : p === false ? '✗' : '-'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {muestra.perpendicularidad_cumple !== undefined ? (
                          <span className={`px-2 py-1 rounded text-xs ${
                            muestra.perpendicularidad_cumple 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {muestra.perpendicularidad_cumple ? '✓' : '✗'}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="space-y-1">
                          <div className={`text-xs px-2 py-1 rounded ${
                            muestra.planitud_superior === true ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 
                            muestra.planitud_superior === false ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}>
                            Sup: {muestra.planitud_superior === true ? '✓' : muestra.planitud_superior === false ? '✗' : '-'}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            muestra.planitud_inferior === true ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 
                            muestra.planitud_inferior === false ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}>
                            Inf: {muestra.planitud_inferior === true ? '✓' : muestra.planitud_inferior === false ? '✗' : '-'}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            muestra.planitud_depresiones === true ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 
                            muestra.planitud_depresiones === false ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}>
                            Dep: {muestra.planitud_depresiones === true ? '✓' : muestra.planitud_depresiones === false ? '✗' : '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {muestra.accion_realizar ? (
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {muestra.accion_realizar}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {muestra.conformidad_correccion !== undefined ? (
                          <span className={`px-2 py-1 rounded text-xs ${
                            muestra.conformidad_correccion 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
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
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Resumen de Patrones de Acción</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {verificacion.muestras_verificadas.map((muestra) => (
                  <div key={muestra.id} className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                    <div className="font-medium text-sm text-gray-700 dark:text-gray-300">
                      Muestra {muestra.item_numero} - {muestra.codigo_cliente}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <div>Cumple: {muestra.cumple_tolerancia ? '✓' : '✗'}</div>
                      <div>Perp. Cumple: {muestra.perpendicularidad_cumple ? '✓' : '✗'}</div>
                      <div>Plan. Sup: {muestra.planitud_superior ? '✓' : '✗'}</div>
                      <div className="font-medium text-blue-600 dark:text-blue-400 mt-2">
                        Acción: {muestra.accion_realizar || 'No calculada'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
        }}
        onConfirm={confirmDelete}
        title="¿Eliminar Verificación?"
        message="¿Está seguro de que desea eliminar esta verificación? Esta acción eliminará permanentemente la verificación y todos sus datos asociados."
        itemName={verificacion ? `Verificación: ${verificacion.numero_verificacion}` : undefined}
        isLoading={isDeleting}
      />
    </Layout>
  );
};

export default VerificacionMuestrasDetail;

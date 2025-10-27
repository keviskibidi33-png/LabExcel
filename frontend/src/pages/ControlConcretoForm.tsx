import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface ProbetaConcreto {
  item_numero: number;
  orden_trabajo: string;
  codigo_muestra: string;
  codigo_muestra_cliente: string;
  fecha_rotura: string;
  elemento: string;
  fc_kg_cm2: number | null;
  status_ensayado: string;
}


const ControlConcretoForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    numero_control: '',
    codigo_documento: 'F-LEM-P-01.09',
    version: '04',
    fecha_documento: new Date().toLocaleDateString('es-ES'),
    pagina: '1 de 1'
  });

  const [probetas, setProbetas] = useState<ProbetaConcreto[]>([]);
  const [busquedaRecepcion, setBusquedaRecepcion] = useState('');
  const [datosCliente, setDatosCliente] = useState<any>(null);

  // Estados para búsqueda inteligente
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [createdControlId, setCreatedControlId] = useState<number | null>(null);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  useEffect(() => {
    // Generar número de control automático
    const numeroControl = `CC-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    setFormData(prev => ({ ...prev, numero_control: numeroControl }));
  }, []);

  const agregarProbeta = () => {
    const nuevaProbeta: ProbetaConcreto = {
      item_numero: probetas.length + 1,
      orden_trabajo: '',
      codigo_muestra: '',
      codigo_muestra_cliente: '',
      fecha_rotura: '',
      elemento: '',
      fc_kg_cm2: null,
      status_ensayado: 'PENDIENTE'
    };
    setProbetas([...probetas, nuevaProbeta]);
  };

  const eliminarProbeta = (index: number) => {
    const nuevasProbetas = probetas.filter((_, i) => i !== index);
    // Renumerar items
    const probetasRenumeradas = nuevasProbetas.map((probeta, i) => ({
      ...probeta,
      item_numero: i + 1
    }));
    setProbetas(probetasRenumeradas);
  };

  const actualizarProbeta = (index: number, campo: keyof ProbetaConcreto, valor: any) => {
    const nuevasProbetas = [...probetas];
    nuevasProbetas[index] = { ...nuevasProbetas[index], [campo]: valor };
    setProbetas(nuevasProbetas);
  };

  const buscarDatosCliente = async (numeroRecepcion: string) => {
    if (!numeroRecepcion.trim()) return;
    
    setBuscandoCliente(true);
    try {
      const response = await api.post('/api/concreto/buscar-recepcion', {
        numero_recepcion: numeroRecepcion
      });
      
      if (response.data.encontrado) {
        setDatosCliente(response.data.datos_cliente);
        
        // Si hay probetas en la respuesta, reemplazar las probetas actuales
        if (response.data.probetas && response.data.probetas.length > 0) {
          setProbetas(response.data.probetas);
        } else {
          // Si no hay probetas, aplicar datos encontrados a las probetas existentes
          setProbetas(prevProbetas => 
            prevProbetas.map(probeta => ({
              ...probeta,
              orden_trabajo: response.data.datos_cliente.orden_trabajo || probeta.orden_trabajo,
              nota: response.data.datos_cliente.nota || probeta.nota,
              status_ensayado: response.data.datos_cliente.status_ensayado || probeta.status_ensayado
            }))
          );
        }
      } else {
        setDatosCliente(null);
        setProbetas([]); // Limpiar probetas si no se encuentra la recepción
      }
    } catch (error) {
      console.error('Error buscando datos del cliente:', error);
    } finally {
      setBuscandoCliente(false);
    }
  };

  const manejarBusquedaRecepcion = (numeroRecepcion: string) => {
    setBusquedaRecepcion(numeroRecepcion);
    if (numeroRecepcion.length >= 3) { // Buscar cuando tenga al menos 3 caracteres
      buscarDatosCliente(numeroRecepcion);
    }
  };

  const enviarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        probetas: probetas
      };

      console.log('Datos que se envían al backend:', JSON.stringify(dataToSend, null, 2));
      console.log('Probetas:', JSON.stringify(probetas, null, 2));

      const response = await api.post('/api/concreto/control', dataToSend);
      
      if (response.data.id) {
        setCreatedControlId(response.data.id);
        alert(`Control de concreto creado exitosamente (ID: ${response.data.id})`);
      }
    } catch (error) {
      console.error('Error creando control de concreto:', error);
      alert('Error creando control de concreto');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!createdControlId) return;
    setIsDownloadingExcel(true);
    try {
      const response = await api.post(`/api/concreto/generar-excel/${createdControlId}`, {}, {
        responseType: 'blob'
      });
      
      // Descargar archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `control_concreto_${formData.numero_control}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      alert('Excel descargado exitosamente');
    } catch (error) {
      console.error('Error descargando Excel:', error);
      alert('Error descargando Excel');
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Control de Concreto</h1>
            <p className="mt-1 text-sm text-gray-600">
              Crear nuevo control de probetas de concreto con búsqueda inteligente
            </p>
          </div>

          <form onSubmit={enviarFormulario} className="p-6 space-y-6">
            {/* Información del Control */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Número de Control</label>
                <input
                  type="text"
                  value={formData.numero_control}
                  onChange={(e) => setFormData({...formData, numero_control: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Código Documento</label>
                <input
                  type="text"
                  value={formData.codigo_documento}
                  onChange={(e) => setFormData({...formData, codigo_documento: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Versión</label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({...formData, version: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha Documento</label>
                <input
                  type="text"
                  value={formData.fecha_documento}
                  onChange={(e) => setFormData({...formData, fecha_documento: e.target.value})}
                  placeholder="DD/MM/YYYY"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Búsqueda por Número de Recepción */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-3">🔍 Búsqueda por Número de Recepción</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">RECEPCIÓN N°:</label>
                  <input
                    type="text"
                    value={busquedaRecepcion}
                    onChange={(e) => manejarBusquedaRecepcion(e.target.value)}
                    placeholder="Ej: 1384-25"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ingresa el número de recepción para cargar automáticamente las probetas
                  </p>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => buscarDatosCliente(busquedaRecepcion)}
                    disabled={buscandoCliente || !busquedaRecepcion.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {buscandoCliente ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </div>
              
              {datosCliente && (
                <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-md">
                  <p className="text-sm text-green-800">
                    ✅ Recepción encontrada y probetas cargadas automáticamente
                  </p>
                  {datosCliente.cliente && (
                    <div className="mt-2 text-sm text-green-700">
                      <p><strong>Cliente:</strong> {datosCliente.cliente}</p>
                      {datosCliente.proyecto && <p><strong>Proyecto:</strong> {datosCliente.proyecto}</p>}
                      {datosCliente.ubicacion && <p><strong>Ubicación:</strong> {datosCliente.ubicacion}</p>}
                      <p><strong>Probetas cargadas:</strong> {probetas.length}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lista de Probetas */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Probetas de Concreto</h3>
                <button
                  type="button"
                  onClick={agregarProbeta}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  + Agregar Probeta
                </button>
              </div>

              {probetas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay probetas agregadas. Haz clic en "Agregar Probeta" para comenzar.
                </div>
              ) : (
                <div className="space-y-4">
                  {probetas.map((probeta, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">Probeta #{probeta.item_numero}</h4>
                        <button
                          type="button"
                          onClick={() => eliminarProbeta(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Orden de Trabajo</label>
                          <input
                            type="text"
                            value={probeta.orden_trabajo}
                            onChange={(e) => actualizarProbeta(index, 'orden_trabajo', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Código de Muestra *</label>
                          <input
                            type="text"
                            value={probeta.codigo_muestra}
                            onChange={(e) => actualizarProbeta(index, 'codigo_muestra', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Cliente</label>
                          <input
                            type="text"
                            value={probeta.codigo_muestra_cliente}
                            onChange={(e) => actualizarProbeta(index, 'codigo_muestra_cliente', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Fecha Rotura</label>
                          <input
                            type="text"
                            value={probeta.fecha_rotura}
                            onChange={(e) => actualizarProbeta(index, 'fecha_rotura', e.target.value)}
                            placeholder="DD/MM/YYYY"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Elemento</label>
                          <select
                            value={probeta.elemento}
                            onChange={(e) => actualizarProbeta(index, 'elemento', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Seleccionar elemento</option>
                            <option value="4in x 8in">4in x 8in</option>
                            <option value="6in x 12in">6in x 12in</option>
                            <option value="cubos">Cubos</option>
                            <option value="viga">Viga</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">F'C (kg/cm²)</label>
                          <input
                            type="number"
                            value={probeta.fc_kg_cm2 || ''}
                            onChange={(e) => actualizarProbeta(index, 'fc_kg_cm2', e.target.value ? parseFloat(e.target.value) : null)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status Ensayado</label>
                          <select
                            value={probeta.status_ensayado}
                            onChange={(e) => actualizarProbeta(index, 'status_ensayado', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="PENDIENTE">PENDIENTE</option>
                            <option value="ROTURADO">ROTURADO</option>
                            <option value="EN PROCESO">EN PROCESO</option>
                            <option value="CANCELADO">CANCELADO</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/concreto')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || probetas.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Control'}
              </button>
            </div>

            {/* Sección de Éxito y Descarga */}
            {createdControlId && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      ✅ Control de concreto creado exitosamente (ID: {createdControlId})
                    </h3>
                    <div className="mt-2">
                      <button
                        onClick={handleDownloadExcel}
                        disabled={isDownloadingExcel}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {isDownloadingExcel ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Descargando...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Descargar Excel
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ControlConcretoForm;

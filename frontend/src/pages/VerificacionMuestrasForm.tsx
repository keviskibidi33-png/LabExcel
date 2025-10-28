import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

interface MuestraVerificada {
  item_numero: number;
  codigo_cliente: string;
  tipo_testigo: string;
  diametro_1_mm?: number;
  diametro_2_mm?: number;
  perpendicularidad_p1?: boolean;
  perpendicularidad_p2?: boolean;
  perpendicularidad_p3?: boolean;
  perpendicularidad_p4?: boolean;
  perpendicularidad_cumple?: boolean;
  planitud_superior?: boolean;
  planitud_inferior?: boolean;
  planitud_depresiones?: boolean;
  conformidad_correccion?: boolean;
}

interface VerificacionData {
  numero_verificacion: string;
  codigo_documento: string;
  version: string;
  fecha_documento: string;
  pagina: string;
  verificado_por?: string;
  fecha_verificacion?: string;
  cliente?: string;
  muestras_verificadas: MuestraVerificada[];
}

// Función utilitaria para calcular patrón de planitud
const calcularPatronPlanitud = (superior: boolean, inferior: boolean, depresiones: boolean): string => {
  const clave = `${superior ? 'C' : 'N'}${inferior ? 'C' : 'N'}${depresiones ? 'C' : 'N'}`;
  const patrones: Record<string, string> = {
    'NCC': 'NEOPRENO CARA INFERIOR',      // NO CUMPLE + CUMPLE + CUMPLE
    'CNC': 'NEOPRENO CARA SUPERIOR',      // CUMPLE + NO CUMPLE + CUMPLE
    'CCC': '-',                           // CUMPLE + CUMPLE + CUMPLE
    'NNC': 'NEOPRENO CARA INFERIOR E SUPERIOR', // NO CUMPLE + NO CUMPLE + CUMPLE
    'NNN': 'CAPEO'                        // NO CUMPLE + NO CUMPLE + NO CUMPLE
  };
  return patrones[clave] || `ERROR: Patrón no reconocido (${clave})`;
};

const VerificacionMuestrasForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verificacionData, setVerificacionData] = useState<VerificacionData>({
    numero_verificacion: '',
    codigo_documento: 'F-LEM-P',
    version: '02',
    fecha_documento: (() => {
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      return `${day}/${month}/${year}`;
    })(),
    pagina: '1 de 1',
    verificado_por: '',
    fecha_verificacion: '',
    cliente: '',
    muestras_verificadas: []
  });

  const [nuevaMuestra, setNuevaMuestra] = useState<MuestraVerificada>({
    item_numero: 1,
    codigo_cliente: '',
    tipo_testigo: '',
    diametro_1_mm: undefined,
    diametro_2_mm: undefined,
    perpendicularidad_p1: undefined,
    perpendicularidad_p2: undefined,
    perpendicularidad_p3: undefined,
    perpendicularidad_p4: undefined,
    perpendicularidad_cumple: undefined,
    planitud_superior: undefined,
    planitud_inferior: undefined,
    planitud_depresiones: undefined,
    conformidad_correccion: undefined
  });

  const [calculos, setCalculos] = useState<{[key: number]: {
    tolerancia_porcentaje?: number;
    cumple_tolerancia?: boolean;
    accion_realizar?: string;
  }}>({});

  // Calcular fórmula de diámetros
  const calcularFormula = async (diametro1: number, diametro2: number, tipoTestigo: string) => {
    try {
      const response = await fetch('/api/verificacion/calcular-formula', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diametro_1_mm: diametro1,
          diametro_2_mm: diametro2,
          tipo_testigo: tipoTestigo
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      }
    } catch (error) {
      console.error('Error calculando fórmula:', error);
    }
    return null;
  };

  // Calcular patrón de acción
  const calcularPatron = async (planitudSuperior: boolean, planitudInferior: boolean, planitudDepresiones: boolean) => {
    try {
      const response = await fetch('/api/verificacion/calcular-patron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planitud_superior: planitudSuperior,
          planitud_inferior: planitudInferior,
          planitud_depresiones: planitudDepresiones
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      }
    } catch (error) {
      console.error('Error calculando patrón:', error);
    }
    return null;
  };

  // Agregar nueva muestra
  const agregarMuestra = () => {
    if (!nuevaMuestra.codigo_cliente.trim()) {
      alert('Por favor ingrese el código del cliente');
      return;
    }

    // Validar que el tipo de testigo esté ingresado
    if (!nuevaMuestra.tipo_testigo.trim()) {
      alert('Por favor ingrese el tipo de testigo');
      return;
    }

    const muestra = {
      ...nuevaMuestra,
      item_numero: verificacionData.muestras_verificadas.length + 1
    };

    setVerificacionData(prev => ({
      ...prev,
      muestras_verificadas: [...prev.muestras_verificadas, muestra]
    }));

    // Calcular fórmulas y patrones localmente
    if (muestra.diametro_1_mm && muestra.diametro_2_mm) {
      // Calcular tolerancia localmente
      const diferencia = Math.abs(muestra.diametro_1_mm - muestra.diametro_2_mm);
      const toleranciaPorcentaje = (diferencia / muestra.diametro_1_mm) * 100;
      const cumpleTolerancia = toleranciaPorcentaje <= 2.0;
      

      // Calcular patrón si tenemos todos los datos de planitud
      let accionRealizar = null;
      if (muestra.planitud_superior !== undefined && 
          muestra.planitud_inferior !== undefined && 
          muestra.planitud_depresiones !== undefined) {
        accionRealizar = calcularPatronPlanitud(
          muestra.planitud_superior,
          muestra.planitud_inferior,
          muestra.planitud_depresiones
        );
      }
      
      // Guardar cálculos
      setCalculos(prev => ({
        ...prev,
        [muestra.item_numero]: {
          tolerancia_porcentaje: toleranciaPorcentaje,
          cumple_tolerancia: cumpleTolerancia,
          accion_realizar: accionRealizar
        }
      }));
    }

    // Resetear formulario
    setNuevaMuestra({
      item_numero: verificacionData.muestras_verificadas.length + 2,
      codigo_cliente: '',
      tipo_testigo: '',
      diametro_1_mm: undefined,
      diametro_2_mm: undefined,
      perpendicularidad_p1: undefined,
      perpendicularidad_p2: undefined,
      perpendicularidad_p3: undefined,
      perpendicularidad_p4: undefined,
      perpendicularidad_cumple: undefined,
      planitud_superior: undefined,
      planitud_inferior: undefined,
      planitud_depresiones: undefined,
      conformidad_correccion: undefined
    });
  };

  // Eliminar muestra
  const eliminarMuestra = (index: number) => {
    setVerificacionData(prev => ({
      ...prev,
      muestras_verificadas: prev.muestras_verificadas.filter((_, i) => i !== index)
    }));
  };

  // Guardar verificación
  const guardarVerificacion = async () => {
    if (!verificacionData.numero_verificacion.trim()) {
      alert('Por favor ingrese el número de verificación');
      return;
    }

    if (verificacionData.muestras_verificadas.length === 0) {
      alert('Por favor agregue al menos una muestra');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/verificacion/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificacionData),
      });

      if (response.ok) {
        try {
          const result = await response.json();
          alert('Verificación guardada exitosamente');
          navigate('/verificacion');
        } catch (jsonError) {
          console.log('Respuesta no es JSON válido, pero la operación fue exitosa');
          alert('Verificación guardada exitosamente');
          navigate('/verificacion');
        }
      } else {
        try {
          const error = await response.json();
          alert(`Error: ${error.detail || 'Error desconocido'}`);
        } catch (jsonError) {
          const errorText = await response.text();
          alert(`Error ${response.status}: ${errorText || 'Error desconocido'}`);
        }
      }
    } catch (error) {
      console.error('Error guardando verificación:', error);
      alert('Error guardando verificación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Verificación de Muestras Cilíndricas de Concreto
        </h1>

        {/* Información general */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Verificación *
            </label>
            <input
              type="text"
              value={verificacionData.numero_verificacion}
              onChange={(e) => setVerificacionData(prev => ({
                ...prev,
                numero_verificacion: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: VER-2024-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verificado por
            </label>
            <input
              type="text"
              value={verificacionData.verificado_por || ''}
              onChange={(e) => setVerificacionData(prev => ({
                ...prev,
                verificado_por: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Código del verificador"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Verificación
            </label>
            <input
              type="text"
              value={verificacionData.fecha_verificacion || ''}
              onChange={(e) => setVerificacionData(prev => ({
                ...prev,
                fecha_verificacion: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="dd/mm/aaaa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <input
              type="text"
              value={verificacionData.cliente || ''}
              onChange={(e) => setVerificacionData(prev => ({
                ...prev,
                cliente: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del cliente"
            />
          </div>
        </div>

        {/* Formulario para nueva muestra */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Nueva Muestra</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código Cliente *
              </label>
              <input
                type="text"
                value={nuevaMuestra.codigo_cliente}
                onChange={(e) => setNuevaMuestra(prev => ({
                  ...prev,
                  codigo_cliente: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Código del cliente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Testigo (MANUAL)
              </label>
              <input
                type="text"
                value={nuevaMuestra.tipo_testigo || ''}
                onChange={(e) => setNuevaMuestra(prev => ({
                  ...prev,
                  tipo_testigo: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 30x15, 20x10, Diamantin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diámetro 1 (mm) (FORMULA)
              </label>
              <input
                type="number"
                step="0.01"
                value={nuevaMuestra.diametro_1_mm || ''}
                onChange={(e) => setNuevaMuestra(prev => ({
                  ...prev,
                  diametro_1_mm: e.target.value ? parseFloat(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder=""
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diámetro 2 (mm) (FORMULA)
              </label>
              <input
                type="number"
                step="0.01"
                value={nuevaMuestra.diametro_2_mm || ''}
                onChange={(e) => setNuevaMuestra(prev => ({
                  ...prev,
                  diametro_2_mm: e.target.value ? parseFloat(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder=""
              />
            </div>
          </div>

          {/* Resultado de la fórmula */}
          {nuevaMuestra.diametro_1_mm && nuevaMuestra.diametro_2_mm && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Resultado de la fórmula:</span>
                  <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">ΔΦ &gt;2% (mm):</span>
                    <span className="font-mono text-sm bg-white px-2 py-1 border rounded">
                      {(() => {
                        const diametro1 = nuevaMuestra.diametro_1_mm!;
                        const diametro2 = nuevaMuestra.diametro_2_mm!;
                        const diferencia = Math.abs(diametro1 - diametro2);
                        const toleranciaPorcentaje = (diferencia / diametro1) * 100;
                        return toleranciaPorcentaje.toFixed(2);
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Cumple:</span>
                    <span className={`text-lg font-bold ${
                      (() => {
                        const diametro1 = nuevaMuestra.diametro_1_mm!;
                        const diametro2 = nuevaMuestra.diametro_2_mm!;
                        const diferencia = Math.abs(diametro1 - diametro2);
                        const toleranciaPorcentaje = (diferencia / diametro1) * 100;
                        return toleranciaPorcentaje <= 2.0;
                      })() ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(() => {
                        const diametro1 = nuevaMuestra.diametro_1_mm!;
                        const diametro2 = nuevaMuestra.diametro_2_mm!;
                        const diferencia = Math.abs(diametro1 - diametro2);
                        const toleranciaPorcentaje = (diferencia / diametro1) * 100;
                        return toleranciaPorcentaje <= 2.0 ? '✓' : '✗';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Tolerancia: 2% (Testigo 30x15cm = 3mm, Testigo 20x10cm = 2mm)
              </div>
            </div>
          )}


          {/* PERPENDICULARIDAD MANUAL */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 bg-gray-100 p-2 rounded border">
              PERPENDICULARIDAD MANUAL
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Perpendicularidad P1 (MANUAL)
                </label>
              <select
                value={nuevaMuestra.perpendicularidad_p1 === undefined ? '' : nuevaMuestra.perpendicularidad_p1 ? 'true' : 'false'}
                onChange={(e) => setNuevaMuestra(prev => ({
                  ...prev,
                  perpendicularidad_p1: e.target.value === '' ? undefined : e.target.value === 'true'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar</option>
                <option value="true">✓</option>
                <option value="false">✗</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perpendicularidad P2 (MANUAL)
              </label>
              <select
                value={nuevaMuestra.perpendicularidad_p2 === undefined ? '' : nuevaMuestra.perpendicularidad_p2 ? 'true' : 'false'}
                onChange={(e) => setNuevaMuestra(prev => ({
                  ...prev,
                  perpendicularidad_p2: e.target.value === '' ? undefined : e.target.value === 'true'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar</option>
                <option value="true">✓</option>
                <option value="false">✗</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perpendicularidad P3 (MANUAL)
              </label>
              <select
                value={nuevaMuestra.perpendicularidad_p3 === undefined ? '' : nuevaMuestra.perpendicularidad_p3 ? 'true' : 'false'}
                onChange={(e) => setNuevaMuestra(prev => ({
                  ...prev,
                  perpendicularidad_p3: e.target.value === '' ? undefined : e.target.value === 'true'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar</option>
                <option value="true">✓</option>
                <option value="false">✗</option>
              </select>
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Perpendicularidad P4 (MANUAL)
                </label>
                <select
                  value={nuevaMuestra.perpendicularidad_p4 === undefined ? '' : nuevaMuestra.perpendicularidad_p4 ? 'true' : 'false'}
                  onChange={(e) => setNuevaMuestra(prev => ({
                    ...prev,
                    perpendicularidad_p4: e.target.value === '' ? undefined : e.target.value === 'true'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="true">✓</option>
                  <option value="false">✗</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MEDIDA &lt;0.5° (MANUAL)
                </label>
                <select
                  value={nuevaMuestra.perpendicularidad_cumple === undefined ? '' : nuevaMuestra.perpendicularidad_cumple ? 'true' : 'false'}
                  onChange={(e) => setNuevaMuestra(prev => ({
                    ...prev,
                    perpendicularidad_cumple: e.target.value === '' ? undefined : e.target.value === 'true'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="true">✓</option>
                  <option value="false">✗</option>
                </select>
              </div>
            </div>
          </div>

          {/* PLANITUD MANUAL CON PATRON Y RESULTADO EN ACCION A REALIZAR */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 bg-gray-100 p-2 rounded border">
              PLANITUD MANUAL CON PATRON Y RESULTADO EN ACCION A REALIZAR
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Planitud Superior (PATRON)
                </label>
              <select
                value={nuevaMuestra.planitud_superior === undefined ? '' : nuevaMuestra.planitud_superior ? 'true' : 'false'}
                onChange={(e) => setNuevaMuestra(prev => ({
                  ...prev,
                  planitud_superior: e.target.value === '' ? undefined : e.target.value === 'true'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar</option>
                <option value="true">✓</option>
                <option value="false">✗</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planitud Inferior (PATRON)
              </label>
              <select
                value={nuevaMuestra.planitud_inferior === undefined ? '' : nuevaMuestra.planitud_inferior ? 'true' : 'false'}
                onChange={(e) => setNuevaMuestra(prev => ({
                  ...prev,
                  planitud_inferior: e.target.value === '' ? undefined : e.target.value === 'true'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar</option>
                <option value="true">✓</option>
                <option value="false">✗</option>
              </select>
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depresiones (PATRON)
                </label>
                <select
                  value={nuevaMuestra.planitud_depresiones === undefined ? '' : nuevaMuestra.planitud_depresiones ? 'true' : 'false'}
                  onChange={(e) => setNuevaMuestra(prev => ({
                    ...prev,
                    planitud_depresiones: e.target.value === '' ? undefined : e.target.value === 'true'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="true">✓</option>
                  <option value="false">✗</option>
                </select>
              </div>
            </div>
          </div>

          {/* Resultado del patrón */}
          {nuevaMuestra.planitud_superior !== undefined && 
           nuevaMuestra.planitud_inferior !== undefined && 
           nuevaMuestra.planitud_depresiones !== undefined && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Acción a realizar (PATRON):</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">C. Superior:</span>
                    <span className={`text-sm font-bold ${
                      nuevaMuestra.planitud_superior ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {nuevaMuestra.planitud_superior ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">C. Inferior:</span>
                    <span className={`text-sm font-bold ${
                      nuevaMuestra.planitud_inferior ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {nuevaMuestra.planitud_inferior ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Depresiones:</span>
                    <span className={`text-sm font-bold ${
                      nuevaMuestra.planitud_depresiones ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {nuevaMuestra.planitud_depresiones ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm font-medium text-gray-700">Acción calculada: </span>
                <span className="text-sm font-bold text-blue-600">
                  {(() => {
                    // Patrón basado en la tabla: C. SUPERIOR, C. INFERIOR, Depresiones
                    const planitudSuperior = nuevaMuestra.planitud_superior!;
                    const planitudInferior = nuevaMuestra.planitud_inferior;
                    const depresiones = nuevaMuestra.planitud_depresiones;
                    
                    // Verificar que todos los campos estén completos
                    if (planitudInferior === undefined || depresiones === undefined) {
                      return "Completar todos los campos de planitud";
                    }
                    
                    // Aplicar la función de cálculo de patrón
                    return calcularPatronPlanitud(planitudSuperior, planitudInferior, depresiones);
                  })()}
                </span>
              </div>
            </div>
          )}

          {/* CONFORMIDAD CORRECCION MANUAL */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 bg-gray-100 p-2 rounded border">
              CONFORMIDAD CORRECCION MANUAL
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conformidad Corrección (MANUAL)
                </label>
                <select
                  value={nuevaMuestra.conformidad_correccion === undefined ? '' : nuevaMuestra.conformidad_correccion ? 'true' : 'false'}
                  onChange={(e) => setNuevaMuestra(prev => ({
                    ...prev,
                    conformidad_correccion: e.target.value === '' ? undefined : e.target.value === 'true'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="true">✓</option>
                  <option value="false">✗</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={agregarMuestra}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Agregar Muestra
            </button>
          </div>
        </div>

        {/* Tabla de muestras */}
        {verificacionData.muestras_verificadas.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Muestras Verificadas</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 border-b text-left">N°</th>
                    <th className="px-4 py-2 border-b text-left">Código Cliente</th>
                    <th className="px-4 py-2 border-b text-left">Tipo Testigo</th>
                    <th className="px-4 py-2 border-b text-left">Diámetro 1</th>
                    <th className="px-4 py-2 border-b text-left">Diámetro 2</th>
                    <th className="px-4 py-2 border-b text-left">Tolerancia %</th>
                    <th className="px-4 py-2 border-b text-left">Cumple</th>
                    <th className="px-4 py-2 border-b text-left">P1</th>
                    <th className="px-4 py-2 border-b text-left">P2</th>
                    <th className="px-4 py-2 border-b text-left">P3</th>
                    <th className="px-4 py-2 border-b text-left">P4</th>
                    <th className="px-4 py-2 border-b text-left">MEDIDA &lt;0.5°</th>
                    <th className="px-4 py-2 border-b text-left">Plan. Superior</th>
                    <th className="px-4 py-2 border-b text-left">Plan. Inferior</th>
                    <th className="px-4 py-2 border-b text-left">Depresiones</th>
                    <th className="px-4 py-2 border-b text-left">Acción</th>
                    <th className="px-4 py-2 border-b text-left">Conformidad</th>
                    <th className="px-4 py-2 border-b text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {verificacionData.muestras_verificadas.map((muestra, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-b">{muestra.item_numero}</td>
                      <td className="px-4 py-2 border-b">{muestra.codigo_cliente}</td>
                      <td className="px-4 py-2 border-b">{muestra.tipo_testigo || '-'}</td>
                      <td className="px-4 py-2 border-b">{muestra.diametro_1_mm || '-'}</td>
                      <td className="px-4 py-2 border-b">{muestra.diametro_2_mm || '-'}</td>
                      <td className="px-4 py-2 border-b">
                        {calculos[muestra.item_numero]?.tolerancia_porcentaje?.toFixed(2) || '-'}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {calculos[muestra.item_numero]?.cumple_tolerancia !== undefined 
                          ? (calculos[muestra.item_numero]?.cumple_tolerancia ? '✓' : '✗')
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-2 border-b">
                        {muestra.perpendicularidad_p1 !== undefined 
                          ? (muestra.perpendicularidad_p1 ? '✓' : '✗')
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-2 border-b">
                        {muestra.perpendicularidad_p2 !== undefined 
                          ? (muestra.perpendicularidad_p2 ? '✓' : '✗')
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-2 border-b">
                        {muestra.perpendicularidad_p3 !== undefined 
                          ? (muestra.perpendicularidad_p3 ? '✓' : '✗')
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-2 border-b">
                        {muestra.perpendicularidad_p4 !== undefined 
                          ? (muestra.perpendicularidad_p4 ? '✓' : '✗')
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-2 border-b">
                        {muestra.perpendicularidad_cumple !== undefined 
                          ? (muestra.perpendicularidad_cumple ? '✓' : '✗')
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-2 border-b">
                        {muestra.planitud_superior !== undefined 
                          ? (muestra.planitud_superior ? '✓' : '✗')
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-2 border-b">
                        {muestra.planitud_inferior !== undefined 
                          ? (muestra.planitud_inferior ? '✓' : '✗')
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-2 border-b">
                        {muestra.planitud_depresiones !== undefined 
                          ? (muestra.planitud_depresiones ? '✓' : '✗')
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-2 border-b">
                        {calculos[muestra.item_numero]?.accion_realizar || '-'}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {muestra.conformidad_correccion !== undefined 
                          ? (muestra.conformidad_correccion ? '✓' : '✗')
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-2 border-b">
                        <button
                          onClick={() => eliminarMuestra(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => navigate('/verificacion')}
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={guardarVerificacion}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Verificación'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificacionMuestrasForm;
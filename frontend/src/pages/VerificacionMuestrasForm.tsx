import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface MuestraVerificada {
  item_numero: number;
  codigo_lem: string;  // Nuevo: Código LEM
  tipo_testigo: string;
  diametro_1_mm?: number;
  diametro_2_mm?: number;
  tolerancia_porcentaje?: number;
  aceptacion_diametro?: string;  // Nuevo: "Cumple" o "No cumple"
  // Perpendicularidad - Nuevo formato
  perpendicularidad_sup1?: boolean;
  perpendicularidad_sup2?: boolean;
  perpendicularidad_inf1?: boolean;
  perpendicularidad_inf2?: boolean;
  perpendicularidad_medida?: boolean;
  // Planitud - Nuevo formato
  planitud_medida?: boolean;
  planitud_superior_aceptacion?: string;  // "Cumple" o "No cumple"
  planitud_inferior_aceptacion?: string;
  planitud_depresiones_aceptacion?: string;
  accion_realizar?: string;
  conformidad?: string;  // Nuevo: texto (ej: "Ensayar")
  // Longitud (L/D ≤1.75) - Nuevo
  longitud_1_mm?: number;
  longitud_2_mm?: number;
  longitud_3_mm?: number;
  // Masa - Nuevo
  masa_muestra_aire_g?: number;
  pesar?: string;  // Pesar / No pesar
  // Campos legacy para compatibilidad
  codigo_cliente?: string;
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
  equipo_bernier?: string;
  equipo_lainas_1?: string;
  equipo_lainas_2?: string;
  equipo_escuadra?: string;
  equipo_balanza?: string;
  nota?: string;
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

// Constantes
const DENSIDAD_CONCRETO = 1.4544; // g/cm³ - Valor que produce ~2000 g (coincide con Excel original)
const RATIO_LD_LIMITE = 1.75; // L/D ≤ 1.75 → "Pesar"

// Función para calcular Masa muestra aire, L/D y actualizar automáticamente "pesar"
const calcularMasaYLDYActualizarPesar = (muestra: MuestraVerificada) => {
  if (!muestra.diametro_1_mm || !muestra.diametro_2_mm) return;
  
  const diametroPromedioMm = (muestra.diametro_1_mm + muestra.diametro_2_mm) / 2;
  const longitudes = [
    muestra.longitud_1_mm,
    muestra.longitud_2_mm,
    muestra.longitud_3_mm
  ].filter((l): l is number => l !== undefined && l !== null);
  
  if (longitudes.length === 0) return;
  
  const longitudPromedioMm = longitudes.reduce((sum, l) => sum + l, 0) / longitudes.length;
  const ratioLD = longitudPromedioMm / diametroPromedioMm;
  
  // L/D ≤ 1.75 → "Pesar", L/D > 1.75 → "No pesar"
  muestra.pesar = ratioLD <= RATIO_LD_LIMITE ? "Pesar" : "No pesar";
  
  // Calcular masa: Masa = Densidad × Volumen, donde Volumen = π × r² × h
  const diametroPromedioCm = diametroPromedioMm / 10;
  const longitudPromedioCm = longitudPromedioMm / 10;
  const radioCm = diametroPromedioCm / 2;
  const volumenCm3 = Math.PI * Math.pow(radioCm, 2) * longitudPromedioCm;
  const masaGramos = DENSIDAD_CONCRETO * volumenCm3;
  
  muestra.masa_muestra_aire_g = Math.round(masaGramos);
};

// Función para formatear automáticamente fechas con barras
const formatearFechaInput = (value: string): string => {
  // Remover todos los caracteres que no sean números
  const soloNumeros = value.replace(/\D/g, '');
  
  // Aplicar formato DD/MM/YYYY
  if (soloNumeros.length <= 2) {
    return soloNumeros;
  } else if (soloNumeros.length <= 4) {
    return `${soloNumeros.slice(0, 2)}/${soloNumeros.slice(2)}`;
  } else {
    return `${soloNumeros.slice(0, 2)}/${soloNumeros.slice(2, 4)}/${soloNumeros.slice(4, 8)}`;
  }
};

const VerificacionMuestrasForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verificacionData, setVerificacionData] = useState<VerificacionData>({
    numero_verificacion: '',
    codigo_documento: 'F-LEM-P-01.12',
    version: '03',
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
    equipo_bernier: '',
    equipo_lainas_1: '',
    equipo_lainas_2: '',
    equipo_escuadra: '',
    equipo_balanza: '',
    nota: '',
    muestras_verificadas: []
  });

  // Función helper para crear una nueva muestra vacía
  const crearMuestraVacia = (itemNumero: number): MuestraVerificada => ({
    item_numero: itemNumero,
    codigo_lem: '',
    tipo_testigo: '',
    diametro_1_mm: undefined,
    diametro_2_mm: undefined,
    perpendicularidad_sup1: undefined,
    perpendicularidad_sup2: undefined,
    perpendicularidad_inf1: undefined,
    perpendicularidad_inf2: undefined,
    perpendicularidad_medida: undefined,
    planitud_medida: undefined,
    planitud_superior_aceptacion: undefined,
    planitud_inferior_aceptacion: undefined,
    planitud_depresiones_aceptacion: undefined,
    conformidad: undefined,
    longitud_1_mm: undefined,
    longitud_2_mm: undefined,
    longitud_3_mm: undefined,
    masa_muestra_aire_g: undefined,
    pesar: undefined
  });

  // Función helper para actualizar una muestra en el array
  const actualizarMuestra = (index: number, actualizacion: Partial<MuestraVerificada>) => {
    const nuevasMuestras = [...verificacionData.muestras_verificadas];
    const muestraActualizada = { ...nuevasMuestras[index], ...actualizacion };
    
    // Recalcular masa y L/D si cambian diámetros o longitudes
    if (actualizacion.diametro_1_mm !== undefined || 
        actualizacion.diametro_2_mm !== undefined ||
        actualizacion.longitud_1_mm !== undefined ||
        actualizacion.longitud_2_mm !== undefined ||
        actualizacion.longitud_3_mm !== undefined) {
      calcularMasaYLDYActualizarPesar(muestraActualizada);
    }
    
    nuevasMuestras[index] = muestraActualizada;
    setVerificacionData(prev => ({
      ...prev,
      muestras_verificadas: nuevasMuestras
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
          await response.json();
          alert('Verificación guardada exitosamente');
          navigate('/verificacion');
        } catch (jsonError) {
          // Respuesta no es JSON válido, pero la operación fue exitosa
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

        {/* Información general - ARRIBA */}
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
              onChange={(e) => {
                const valorFormateado = formatearFechaInput(e.target.value);
                setVerificacionData(prev => ({
                  ...prev,
                  fecha_verificacion: valorFormateado
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="dd/mm/aaaa"
              maxLength={10}
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

        {/* Tabla tipo Excel para ingresar muestras - EN MEDIO */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Muestras Verificadas</h3>
            <button
                onClick={() => {
                  const nuevaFila = crearMuestraVacia(verificacionData.muestras_verificadas.length + 1);
                  setVerificacionData(prev => ({
                    ...prev,
                    muestras_verificadas: [...prev.muestras_verificadas, nuevaFila]
                  }));
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                + Agregar Fila
              </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center sticky left-0 bg-gray-100 z-10 min-w-[40px]">N°</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center min-w-[120px]">Código LEM</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center min-w-[100px]">Tipo Testigo</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-blue-50 min-w-[90px]">Diámetro 1 (mm)</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-blue-50 min-w-[90px]">Diámetro 2 (mm)</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-blue-50 min-w-[80px]">ΔΦ 2%&gt;</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-blue-50 min-w-[90px]">Aceptación</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-yellow-50 min-w-[80px]">SUP 1</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-yellow-50 min-w-[80px]">SUP 2</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-yellow-50 min-w-[80px]">INF 1</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-yellow-50 min-w-[80px]">INF 2</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-yellow-50 min-w-[90px]">MEDIDA &lt;0.5°</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-green-50 min-w-[100px]">C. SUPERIOR</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-green-50 min-w-[100px]">C. INFERIOR</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-green-50 min-w-[100px]">DEPRESIONES</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-purple-50 min-w-[150px]">ACCIÓN</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center min-w-[100px]">Conformidad</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-blue-50 min-w-[90px]">Longitud 1</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-blue-50 min-w-[90px]">Longitud 2</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-blue-50 min-w-[90px]">Longitud 3</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-blue-50 min-w-[100px]">Masa (g)</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center bg-blue-50 min-w-[100px]">Pesar</th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center min-w-[60px]">Del</th>
                </tr>
              </thead>
              <tbody>
                {verificacionData.muestras_verificadas.length === 0 ? (
                  <tr>
                    <td colSpan={23} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      No hay muestras. Haz clic en "+ Agregar Fila" para comenzar.
                    </td>
                  </tr>
                ) : (
                  verificacionData.muestras_verificadas.map((muestra, index) => {
                    // Calcular valores automáticamente para esta muestra
                    let toleranciaPorcentaje: number | undefined;
                    let aceptacionDiametro: string = '';
                    let accionRealizar: string = '';
                    let masaCalculada: number | undefined;
                    let pesarCalculado: string = '';
                    let ratioLD: number | undefined;

                    // Calcular tolerancia y aceptación de diámetro
                    if (muestra.diametro_1_mm && muestra.diametro_2_mm) {
                      const diferencia = Math.abs(muestra.diametro_1_mm - muestra.diametro_2_mm);
                      toleranciaPorcentaje = (diferencia / muestra.diametro_1_mm) * 100;
                      aceptacionDiametro = toleranciaPorcentaje <= 2.0 ? 'Cumple' : 'No cumple';
                    }

                    // Calcular acción a realizar
                    const planitudSup = muestra.planitud_superior_aceptacion || 
                                      (muestra.planitud_superior !== undefined ? (muestra.planitud_superior ? 'Cumple' : 'No cumple') : null);
                    const planitudInf = muestra.planitud_inferior_aceptacion || 
                                      (muestra.planitud_inferior !== undefined ? (muestra.planitud_inferior ? 'Cumple' : 'No cumple') : null);
                    const planitudDep = muestra.planitud_depresiones_aceptacion || 
                                      (muestra.planitud_depresiones !== undefined ? (muestra.planitud_depresiones ? 'Cumple' : 'No cumple') : null);
                    
                    if (planitudSup && planitudInf && planitudDep) {
                      const supBool = planitudSup.toLowerCase() === 'cumple';
                      const infBool = planitudInf.toLowerCase() === 'cumple';
                      const depBool = planitudDep.toLowerCase() === 'cumple';
                      accionRealizar = calcularPatronPlanitud(supBool, infBool, depBool);
                    }

                    // Calcular masa y L/D (usar valores calculados de la muestra o recalcular)
                    if (muestra.diametro_1_mm && muestra.diametro_2_mm) {
                      const diametroPromedioMm = (muestra.diametro_1_mm + muestra.diametro_2_mm) / 2;
                      const longitudes = [
                        muestra.longitud_1_mm,
                        muestra.longitud_2_mm,
                        muestra.longitud_3_mm
                      ].filter((l): l is number => l !== undefined && l !== null);
                      
                      if (longitudes.length > 0) {
                        const longitudPromedioMm = longitudes.reduce((sum, l) => sum + l, 0) / longitudes.length;
                        ratioLD = longitudPromedioMm / diametroPromedioMm;
                        pesarCalculado = ratioLD <= RATIO_LD_LIMITE ? 'Pesar' : 'No pesar';
                        
                        // Calcular masa usando la misma fórmula
                        const diametroPromedioCm = diametroPromedioMm / 10;
                        const longitudPromedioCm = longitudPromedioMm / 10;
                        const radioCm = diametroPromedioCm / 2;
                        const volumenCm3 = Math.PI * Math.pow(radioCm, 2) * longitudPromedioCm;
                        masaCalculada = Math.round(DENSIDAD_CONCRETO * volumenCm3);
                      }
                    }

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-2 py-1 text-center text-sm sticky left-0 bg-white z-10">
                          {muestra.item_numero}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={muestra.codigo_lem || muestra.codigo_cliente || ''}
                            onChange={(e) => actualizarMuestra(index, {
                              codigo_lem: e.target.value,
                              codigo_cliente: e.target.value
                            })}
                            className="w-full px-1 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="1025-CO-25"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={muestra.tipo_testigo || ''}
                            onChange={(e) => actualizarMuestra(index, { tipo_testigo: e.target.value })}
                            className="w-full px-1 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="4in x 8in"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 bg-blue-50">
                          <input
                            type="number"
                            step="0.01"
                            value={muestra.diametro_1_mm || ''}
                            onChange={(e) => actualizarMuestra(index, {
                              diametro_1_mm: e.target.value ? parseFloat(e.target.value) : undefined
                            })}
                            className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="102.21"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 bg-blue-50">
                          <input
                            type="number"
                            step="0.01"
                            value={muestra.diametro_2_mm || ''}
                            onChange={(e) => actualizarMuestra(index, {
                              diametro_2_mm: e.target.value ? parseFloat(e.target.value) : undefined
                            })}
                            className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="102.32"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center text-xs bg-blue-50 font-mono">
                          {toleranciaPorcentaje !== undefined ? `${toleranciaPorcentaje.toFixed(2)}%` : ''}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center text-xs bg-blue-50">
                          {aceptacionDiametro}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 bg-yellow-50">
                          <select
                            value={muestra.perpendicularidad_sup1 === undefined ? '' : muestra.perpendicularidad_sup1 ? 'true' : 'false'}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : e.target.value === 'true';
                              actualizarMuestra(index, {
                                perpendicularidad_sup1: value,
                                perpendicularidad_p1: value
                              });
                            }}
                            className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            <option value="true">Cumple</option>
                            <option value="false">No cumple</option>
              </select>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 bg-yellow-50">
              <select
                            value={muestra.perpendicularidad_sup2 === undefined ? '' : muestra.perpendicularidad_sup2 ? 'true' : 'false'}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : e.target.value === 'true';
                              actualizarMuestra(index, {
                                perpendicularidad_sup2: value,
                                perpendicularidad_p2: value
                              });
                            }}
                            className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            <option value="true">Cumple</option>
                            <option value="false">No cumple</option>
              </select>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 bg-yellow-50">
              <select
                            value={muestra.perpendicularidad_inf1 === undefined ? '' : muestra.perpendicularidad_inf1 ? 'true' : 'false'}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : e.target.value === 'true';
                              actualizarMuestra(index, {
                                perpendicularidad_inf1: value,
                                perpendicularidad_p3: value
                              });
                            }}
                            className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            <option value="true">Cumple</option>
                            <option value="false">No cumple</option>
              </select>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 bg-yellow-50">
                          <select
                            value={muestra.perpendicularidad_inf2 === undefined ? '' : muestra.perpendicularidad_inf2 ? 'true' : 'false'}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : e.target.value === 'true';
                              actualizarMuestra(index, {
                                perpendicularidad_inf2: value,
                                perpendicularidad_p4: value
                              });
                            }}
                            className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            <option value="true">Cumple</option>
                            <option value="false">No cumple</option>
                          </select>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 bg-yellow-50">
                          <select
                            value={muestra.perpendicularidad_medida === undefined ? '' : muestra.perpendicularidad_medida ? 'true' : 'false'}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : e.target.value === 'true';
                              actualizarMuestra(index, {
                                perpendicularidad_medida: value,
                                perpendicularidad_cumple: value
                              });
                            }}
                            className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            <option value="true">Cumple</option>
                            <option value="false">No cumple</option>
                          </select>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 bg-green-50">
                          <select
                            value={muestra.planitud_superior_aceptacion || ''}
                            onChange={(e) => {
                              const valor = e.target.value || undefined;
                              actualizarMuestra(index, {
                                planitud_superior_aceptacion: valor,
                                planitud_superior: valor === 'Cumple' ? true : valor === 'No cumple' ? false : undefined
                              });
                            }}
                            className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            <option value="Cumple">Cumple</option>
                            <option value="No cumple">No cumple</option>
                          </select>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 bg-green-50">
                          <select
                            value={muestra.planitud_inferior_aceptacion || ''}
                            onChange={(e) => {
                              const valor = e.target.value || undefined;
                              actualizarMuestra(index, {
                                planitud_inferior_aceptacion: valor,
                                planitud_inferior: valor === 'Cumple' ? true : valor === 'No cumple' ? false : undefined
                              });
                            }}
                            className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            <option value="Cumple">Cumple</option>
                            <option value="No cumple">No cumple</option>
                          </select>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 bg-green-50">
                          <select
                            value={muestra.planitud_depresiones_aceptacion || ''}
                            onChange={(e) => {
                              const valor = e.target.value || undefined;
                              actualizarMuestra(index, {
                                planitud_depresiones_aceptacion: valor,
                                planitud_depresiones: valor === 'Cumple' ? true : valor === 'No cumple' ? false : undefined
                              });
                            }}
                            className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            <option value="Cumple">Cumple</option>
                            <option value="No cumple">No cumple</option>
                          </select>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center text-xs bg-purple-50 font-semibold">
                          {accionRealizar || '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={muestra.conformidad || ''}
                            onChange={(e) => actualizarMuestra(index, {
                              conformidad: e.target.value || undefined
                            })}
                            className="w-full px-1 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Ensayar"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 bg-blue-50">
                          <input
                            type="number"
                            step="0.01"
                            value={muestra.longitud_1_mm || ''}
                            onChange={(e) => actualizarMuestra(index, {
                              longitud_1_mm: e.target.value ? parseFloat(e.target.value) : undefined
                            })}
                            className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="150"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 bg-blue-50">
                          <input
                            type="number"
                            step="0.01"
                            value={muestra.longitud_2_mm || ''}
                            onChange={(e) => actualizarMuestra(index, {
                              longitud_2_mm: e.target.value ? parseFloat(e.target.value) : undefined
                            })}
                            className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="202.25"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 bg-blue-50">
                          <input
                            type="number"
                            step="0.01"
                            value={muestra.longitud_3_mm || ''}
                            onChange={(e) => actualizarMuestra(index, {
                              longitud_3_mm: e.target.value ? parseFloat(e.target.value) : undefined
                            })}
                            className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="150"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center text-xs bg-blue-50 font-mono font-semibold">
                          {masaCalculada || ''}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center text-xs bg-blue-50 font-semibold">
                          {pesarCalculado || muestra.pesar || ''}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <button
                            onClick={() => {
                              const nuevasMuestras = verificacionData.muestras_verificadas.filter((_, i) => i !== index);
                              // Renumerar items
                              nuevasMuestras.forEach((m, i) => {
                                m.item_numero = i + 1;
                              });
                              setVerificacionData(prev => ({
                                ...prev,
                                muestras_verificadas: nuevasMuestras
                              }));
                            }}
                            className="text-red-600 hover:text-red-800 text-xs px-2 py-1"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Equipos utilizados - ABAJO */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipos Utilizados</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Bernier
                </label>
                <select
                value={verificacionData.equipo_bernier || ''}
                onChange={(e) => setVerificacionData(prev => ({
                    ...prev,
                  equipo_bernier: e.target.value || undefined
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <option value="">-</option>
                <option value="EQP-0255">EQP-0255</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Lainas 1
                </label>
                <select
                value={verificacionData.equipo_lainas_1 || ''}
                onChange={(e) => setVerificacionData(prev => ({
                    ...prev,
                  equipo_lainas_1: e.target.value || undefined
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <option value="">-</option>
                <option value="EQP-0255">EQP-0255</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Lainas 2
                </label>
              <select
                value={verificacionData.equipo_lainas_2 || ''}
                onChange={(e) => setVerificacionData(prev => ({
                  ...prev,
                  equipo_lainas_2: e.target.value || undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-</option>
                <option value="EQP-0255">EQP-0255</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Escuadra
              </label>
              <select
                value={verificacionData.equipo_escuadra || ''}
                onChange={(e) => setVerificacionData(prev => ({
                  ...prev,
                  equipo_escuadra: e.target.value || undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-</option>
                <option value="EQP-0255">EQP-0255</option>
              </select>
            </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Balanza
                </label>
                <select
                value={verificacionData.equipo_balanza || ''}
                onChange={(e) => setVerificacionData(prev => ({
                    ...prev,
                  equipo_balanza: e.target.value || undefined
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <option value="">-</option>
                <option value="EQP-0255">EQP-0255</option>
                </select>
              </div>
            </div>
          </div>

        {/* Nota - ABAJO */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nota</h3>
          <textarea
            value={verificacionData.nota || ''}
            onChange={(e) => setVerificacionData(prev => ({
                    ...prev,
              nota: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingrese una nota adicional..."
            rows={2}
            maxLength={500}
          />
          </div>

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
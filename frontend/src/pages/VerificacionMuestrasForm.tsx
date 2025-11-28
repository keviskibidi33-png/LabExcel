import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { useAutoSave } from '../hooks/useAutoSave';
import { useAutoSaveDB } from '../hooks/useAutoSaveDB';
import { apiService } from '../services/api';

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
// Densidad del material en g/cm³ - Puede ajustarse según el material
// Ejemplo: 0.76165 g/cm³ para el ejemplo proporcionado (100mm x 200mm x 100mm = 1523.3 g)
const DENSIDAD_MATERIAL = 0.76165; // g/cm³ - Valor por defecto, puede ajustarse
const RATIO_LD_LIMITE = 1.75; // L/D ≤ 1.75 → "Pesar"

/**
 * Calcula la masa muestra aire usando la fórmula de volumen rectangular:
 * Masa (g) = (Longitud1 × Longitud2 × Longitud3 × Densidad) / 1000
 * 
 * Donde:
 * - Longitud1, Longitud2, Longitud3 están en milímetros
 * - Densidad está en gramos por centímetro cúbico (g/cm³)
 * - Se divide entre 1000 para convertir milímetros cúbicos a centímetros cúbicos
 * - El resultado se redondea a 1 decimal
 * 
 * IMPORTANTE: Las longitudes SOLO se usan para calcular masa.
 * La conformidad es independiente y NO valida longitudes ni masa.
 * La conformidad valida aspectos geométricos: Perpendicularidad, Planitud, Depresiones.
 * 
 * Ejemplo:
 * - Dimensiones: 100mm × 200mm × 100mm
 * - Densidad: 0.76165 g/cm³
 * - Volumen = 100 × 200 × 100 = 2,000,000 mm³ = 2,000 cm³
 * - Masa = 2,000 cm³ × 0.76165 g/cm³ = 1523.3 g
 */
const calcularMasaYLDYActualizarPesar = (muestra: MuestraVerificada, densidad: number = DENSIDAD_MATERIAL) => {
  // Validar que tengamos las tres longitudes
  if (!muestra.longitud_1_mm || !muestra.longitud_2_mm || !muestra.longitud_3_mm) {
    muestra.masa_muestra_aire_g = undefined;
    muestra.pesar = undefined;
    return;
  }
  
  // Calcular volumen en mm³: Longitud1 × Longitud2 × Longitud3
  const volumenMm3 = muestra.longitud_1_mm * muestra.longitud_2_mm * muestra.longitud_3_mm;
  
  // Convertir mm³ a cm³: dividir entre 1000
  // 1 cm³ = 1000 mm³
  const volumenCm3 = volumenMm3 / 1000;
  
  // Calcular masa: Volumen (cm³) × Densidad (g/cm³)
  const masaGramos = volumenCm3 * densidad;
  
  // Redondear a 1 decimal
  muestra.masa_muestra_aire_g = Math.round(masaGramos * 10) / 10;
  
  // Calcular ratio L/D si tenemos diámetros para determinar si se debe pesar
  if (muestra.diametro_1_mm && muestra.diametro_2_mm) {
    const diametroPromedioMm = (muestra.diametro_1_mm + muestra.diametro_2_mm) / 2;
    const longitudPromedioMm = (muestra.longitud_1_mm + muestra.longitud_2_mm + muestra.longitud_3_mm) / 3;
    const ratioLD = longitudPromedioMm / diametroPromedioMm;
    // L/D ≤ 1.75 → "Pesar", L/D > 1.75 → "No pesar"
    muestra.pesar = ratioLD <= RATIO_LD_LIMITE ? "Pesar" : "No pesar";
  }
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
  const { id: verificacionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!verificacionId;
  const STORAGE_KEY = isEditMode ? `verificacion-form-${verificacionId}` : 'verificacion-form-draft';
  
  // Cargar datos de la verificación existente si está en modo edición
  const { data: existingVerificacion, isLoading: isLoadingVerificacion } = useQuery(
    ['verificacion', verificacionId],
    () => apiService.getVerificacion(Number(verificacionId!)),
    {
      enabled: isEditMode && !!verificacionId,
      onError: (error: any) => {
        toast.error(`Error cargando verificación: ${error.message}`);
      }
    }
  );
  
  // Mutation para actualizar verificación
  const updateVerificacionMutation = useMutation(
    (data: any) => apiService.updateVerificacion(Number(verificacionId!), data),
    {
      onSuccess: async () => {
        // Invalidar todas las queries relacionadas
        queryClient.invalidateQueries(['verificacion', verificacionId]);
        queryClient.invalidateQueries(['verificacion']); // Invalidar también la lista
        
        // Esperar un momento para que el backend termine de guardar
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Forzar refetch antes de navegar
        await queryClient.refetchQueries(['verificacion', verificacionId]);
        
        toast.success('Verificación actualizada exitosamente');
        
        // Navegar de vuelta al detalle con estado para forzar recarga
        navigate(`/verificacion/${verificacionId}`, { 
          replace: true,
          state: { fromEdit: true }
        });
      },
      onError: (error: any) => {
        toast.error(`Error actualizando verificación: ${error.message}`);
      }
    }
  );
  
  // Cargar datos guardados desde localStorage o sessionStorage (si viene de borradores)
  const loadSavedData = (): Partial<VerificacionData> | null => {
    // Primero verificar si hay datos en sessionStorage (viene de la página de borradores)
    try {
      const sessionDraft = sessionStorage.getItem('loadDraft');
      if (sessionDraft) {
        const parsed = JSON.parse(sessionDraft);
        sessionStorage.removeItem('loadDraft'); // Limpiar después de usar
        if (parsed.data) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('Error cargando borrador de sessionStorage:', error);
    }

    // Si no hay en sessionStorage, cargar de localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('Error cargando datos guardados:', error);
    }
    return null;
  };

  const savedData = loadSavedData();
  
  // Función para obtener valores por defecto
  const getDefaultValues = (): VerificacionData => {
    // Si estamos editando y tenemos datos de la verificación existente
    if (isEditMode && existingVerificacion) {
      return {
        numero_verificacion: existingVerificacion.numero_verificacion || '',
        codigo_documento: existingVerificacion.codigo_documento || 'F-LEM-P-01.12',
        version: existingVerificacion.version || '03',
        fecha_documento: existingVerificacion.fecha_documento || (() => {
          const now = new Date();
          const day = now.getDate().toString().padStart(2, '0');
          const month = (now.getMonth() + 1).toString().padStart(2, '0');
          const year = now.getFullYear();
          return `${day}/${month}/${year}`;
        })(),
        pagina: existingVerificacion.pagina || '1 de 1',
        verificado_por: existingVerificacion.verificado_por || '',
        fecha_verificacion: existingVerificacion.fecha_verificacion || '',
        cliente: existingVerificacion.cliente || '',
        equipo_bernier: existingVerificacion.equipo_bernier || '',
        equipo_lainas_1: existingVerificacion.equipo_lainas_1 || '',
        equipo_lainas_2: existingVerificacion.equipo_lainas_2 || '',
        equipo_escuadra: existingVerificacion.equipo_escuadra || '',
        equipo_balanza: existingVerificacion.equipo_balanza || '',
        nota: existingVerificacion.nota || '',
        muestras_verificadas: existingVerificacion.muestras_verificadas?.map((m: any) => ({
          item_numero: m.item_numero,
          codigo_lem: m.codigo_lem || m.codigo_cliente || '',
          codigo_cliente: m.codigo_cliente || m.codigo_lem || '',
          tipo_testigo: m.tipo_testigo || '',
          diametro_1_mm: m.diametro_1_mm,
          diametro_2_mm: m.diametro_2_mm,
          tolerancia_porcentaje: m.tolerancia_porcentaje,
          aceptacion_diametro: m.aceptacion_diametro || (m.cumple_tolerancia !== undefined ? (m.cumple_tolerancia ? 'Cumple' : 'No cumple') : undefined),
          perpendicularidad_sup1: m.perpendicularidad_sup1 || m.perpendicularidad_p1,
          perpendicularidad_sup2: m.perpendicularidad_sup2 || m.perpendicularidad_p2,
          perpendicularidad_inf1: m.perpendicularidad_inf1 || m.perpendicularidad_p3,
          perpendicularidad_inf2: m.perpendicularidad_inf2 || m.perpendicularidad_p4,
          perpendicularidad_medida: m.perpendicularidad_medida || m.perpendicularidad_cumple,
          planitud_superior_aceptacion: m.planitud_superior_aceptacion || (m.planitud_superior !== undefined ? (m.planitud_superior ? 'Cumple' : 'No cumple') : undefined),
          planitud_inferior_aceptacion: m.planitud_inferior_aceptacion || (m.planitud_inferior !== undefined ? (m.planitud_inferior ? 'Cumple' : 'No cumple') : undefined),
          planitud_depresiones_aceptacion: m.planitud_depresiones_aceptacion || (m.planitud_depresiones !== undefined ? (m.planitud_depresiones ? 'Cumple' : 'No cumple') : undefined),
          accion_realizar: m.accion_realizar,
          conformidad: m.conformidad,
          longitud_1_mm: m.longitud_1_mm,
          longitud_2_mm: m.longitud_2_mm,
          longitud_3_mm: m.longitud_3_mm,
          masa_muestra_aire_g: m.masa_muestra_aire_g,
          pesar: m.pesar,
          // Campos legacy para compatibilidad
          perpendicularidad_p1: m.perpendicularidad_p1 || m.perpendicularidad_sup1,
          perpendicularidad_p2: m.perpendicularidad_p2 || m.perpendicularidad_sup2,
          perpendicularidad_p3: m.perpendicularidad_p3 || m.perpendicularidad_inf1,
          perpendicularidad_p4: m.perpendicularidad_p4 || m.perpendicularidad_inf2,
          perpendicularidad_cumple: m.perpendicularidad_cumple || m.perpendicularidad_medida,
          planitud_superior: m.planitud_superior,
          planitud_inferior: m.planitud_inferior,
          planitud_depresiones: m.planitud_depresiones,
          conformidad_correccion: m.conformidad_correccion
        })) || []
      };
    }
    
    // Si hay datos guardados, usarlos
    if (savedData) {
      return {
    ...savedData,
    muestras_verificadas: savedData.muestras_verificadas || []
      } as VerificacionData;
    }
    
    // Valores por defecto para nueva verificación
    return {
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
    };
  };

  const [verificacionData, setVerificacionData] = useState<VerificacionData>(getDefaultValues());

  // Ref para rastrear si ya se cargaron los datos iniciales
  const hasLoadedInitialData = useRef(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false); // Deshabilitado inicialmente
  
  // Ref para controlar si se está guardando manualmente (deshabilitar auto-guardado temporalmente)
  const isManualSaving = useRef(false);
  
  // Auto-guardado en base de datos para modo edición (definir ANTES del useEffect que carga datos)
  const { isSaving, lastSaved, hasUnsavedChanges, updateReference, skipNextSave } = useAutoSaveDB({
    data: verificacionData,
    enabled: isEditMode && !!verificacionId && autoSaveEnabled && !isManualSaving.current,
    debounceMs: 5000, // Aumentar debounce significativamente para evitar interferir con duplicaciones
    onSave: async (data) => {
      // No auto-guardar si se está guardando manualmente
      if (isManualSaving.current) {
        return;
      }
      const datosParaEnviar = transformarDatosParaBackend(data);
      if (datosParaEnviar.muestras_verificadas.length === 0) {
        console.warn('Auto-guardado cancelado: no hay muestras para guardar');
        return;
      }
      await apiService.updateVerificacion(Number(verificacionId!), datosParaEnviar);
      // NO invalidar el query en auto-guardado para evitar recargas que sobrescriban cambios locales
      // queryClient.invalidateQueries(['verificacion', verificacionId]);
    },
    onError: (error) => {
      console.error('Error auto-guardando:', error);
      // No mostrar toast para errores de auto-guardado para no molestar al usuario
    }
  });
  
  // Actualizar datos cuando se cargue la verificación existente (solo una vez al inicio)
  useEffect(() => {
    if (isEditMode && existingVerificacion && !hasLoadedInitialData.current) {
      // Deshabilitar auto-guardado mientras se cargan los datos iniciales
      setAutoSaveEnabled(false);
      const newData = {
        numero_verificacion: existingVerificacion.numero_verificacion || '',
        codigo_documento: existingVerificacion.codigo_documento || 'F-LEM-P-01.12',
        version: existingVerificacion.version || '03',
        fecha_documento: existingVerificacion.fecha_documento || (() => {
          const now = new Date();
          const day = now.getDate().toString().padStart(2, '0');
          const month = (now.getMonth() + 1).toString().padStart(2, '0');
          const year = now.getFullYear();
          return `${day}/${month}/${year}`;
        })(),
        pagina: existingVerificacion.pagina || '1 de 1',
        verificado_por: existingVerificacion.verificado_por || '',
        fecha_verificacion: existingVerificacion.fecha_verificacion || '',
        cliente: existingVerificacion.cliente || '',
        equipo_bernier: existingVerificacion.equipo_bernier || '',
        equipo_lainas_1: existingVerificacion.equipo_lainas_1 || '',
        equipo_lainas_2: existingVerificacion.equipo_lainas_2 || '',
        equipo_escuadra: existingVerificacion.equipo_escuadra || '',
        equipo_balanza: existingVerificacion.equipo_balanza || '',
        nota: existingVerificacion.nota || '',
        muestras_verificadas: existingVerificacion.muestras_verificadas?.map((m: any) => ({
          item_numero: m.item_numero,
          codigo_lem: m.codigo_lem || m.codigo_cliente || '',
          codigo_cliente: m.codigo_cliente || m.codigo_lem || '',
          tipo_testigo: m.tipo_testigo || '',
          diametro_1_mm: m.diametro_1_mm,
          diametro_2_mm: m.diametro_2_mm,
          tolerancia_porcentaje: m.tolerancia_porcentaje,
          aceptacion_diametro: m.aceptacion_diametro || (m.cumple_tolerancia !== undefined ? (m.cumple_tolerancia ? 'Cumple' : 'No cumple') : undefined),
          perpendicularidad_sup1: m.perpendicularidad_sup1 || m.perpendicularidad_p1,
          perpendicularidad_sup2: m.perpendicularidad_sup2 || m.perpendicularidad_p2,
          perpendicularidad_inf1: m.perpendicularidad_inf1 || m.perpendicularidad_p3,
          perpendicularidad_inf2: m.perpendicularidad_inf2 || m.perpendicularidad_p4,
          perpendicularidad_medida: m.perpendicularidad_medida || m.perpendicularidad_cumple,
          planitud_superior_aceptacion: m.planitud_superior_aceptacion || (m.planitud_superior !== undefined ? (m.planitud_superior ? 'Cumple' : 'No cumple') : undefined),
          planitud_inferior_aceptacion: m.planitud_inferior_aceptacion || (m.planitud_inferior !== undefined ? (m.planitud_inferior ? 'Cumple' : 'No cumple') : undefined),
          planitud_depresiones_aceptacion: m.planitud_depresiones_aceptacion || (m.planitud_depresiones !== undefined ? (m.planitud_depresiones ? 'Cumple' : 'No cumple') : undefined),
          accion_realizar: m.accion_realizar,
          conformidad: m.conformidad,
          longitud_1_mm: m.longitud_1_mm,
          longitud_2_mm: m.longitud_2_mm,
          longitud_3_mm: m.longitud_3_mm,
          masa_muestra_aire_g: m.masa_muestra_aire_g,
          pesar: m.pesar,
          // Campos legacy para compatibilidad
          perpendicularidad_p1: m.perpendicularidad_p1 || m.perpendicularidad_sup1,
          perpendicularidad_p2: m.perpendicularidad_p2 || m.perpendicularidad_sup2,
          perpendicularidad_p3: m.perpendicularidad_p3 || m.perpendicularidad_inf1,
          perpendicularidad_p4: m.perpendicularidad_p4 || m.perpendicularidad_inf2,
          perpendicularidad_cumple: m.perpendicularidad_cumple || m.perpendicularidad_medida,
          planitud_superior: m.planitud_superior,
          planitud_inferior: m.planitud_inferior,
          planitud_depresiones: m.planitud_depresiones,
          conformidad_correccion: m.conformidad_correccion
        })) || []
      };
      setVerificacionData(newData);
      hasLoadedInitialData.current = true;
      
      // Actualizar la referencia del auto-guardado para que no detecte cambios al cargar datos iniciales
      setTimeout(() => {
        if (updateReference) {
          updateReference(newData);
          skipNextSave();
        }
      }, 100);
      
      // Re-habilitar auto-guardado después de cargar los datos iniciales
      setTimeout(() => {
        setAutoSaveEnabled(true);
      }, 2000);
    }
  }, [existingVerificacion, isEditMode, updateReference, skipNextSave]);

  // Auto-guardado: localStorage para nuevas verificaciones, DB para edición
  const { clearDraft } = useAutoSave({
    storageKey: STORAGE_KEY,
    data: verificacionData,
    enabled: !isEditMode // Solo auto-guardar en localStorage para nuevas verificaciones
  });
  
  // Mostrar notificación si se cargó desde sessionStorage o localStorage
  useEffect(() => {
    if (savedData) {
      const sessionDraft = sessionStorage.getItem('loadDraft');
      if (sessionDraft) {
        toast.success('Borrador cargado. Puedes editarlo ahora.', {
          duration: 3000,
          icon: '💾'
        });
      } else {
        toast.success('Se encontró un borrador guardado. Se ha restaurado automáticamente.', {
          duration: 3000,
          icon: '💾'
        });
      }
    }
  }, []);

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
    
    // Recalcular masa y L/D si cambian longitudes o diámetros
    // La masa se calcula con la fórmula: (Long1 × Long2 × Long3 × Densidad) / 1000
    if (actualizacion.longitud_1_mm !== undefined ||
        actualizacion.longitud_2_mm !== undefined ||
        actualizacion.longitud_3_mm !== undefined ||
        actualizacion.diametro_1_mm !== undefined ||
        actualizacion.diametro_2_mm !== undefined) {
      calcularMasaYLDYActualizarPesar(muestraActualizada, DENSIDAD_MATERIAL);
    }
    
    nuevasMuestras[index] = muestraActualizada;
    setVerificacionData(prev => ({
      ...prev,
      muestras_verificadas: nuevasMuestras
    }));
  };


  // Función para convertir los datos antes de enviarlos al backend
  const transformarDatosParaBackend = (data: VerificacionData) => {
    return {
      ...data,
      muestras_verificadas: data.muestras_verificadas.map(muestra => {
        const muestraTransformada: any = { ...muestra };
        
        // Convertir planitud_superior_aceptacion (string) a planitud_superior (boolean)
        // El backend necesita los booleanos para calcular el patrón (CalculoPatronRequest)
        // IMPORTANTE: Siempre convertir los strings a booleanos para que el backend pueda usarlos
        if (muestra.planitud_superior_aceptacion) {
          // Convertir string a boolean para el cálculo del patrón
          muestraTransformada.planitud_superior = muestra.planitud_superior_aceptacion === 'Cumple';
        } else if (muestra.planitud_superior !== undefined) {
          // Ya es boolean, mantenerlo
          muestraTransformada.planitud_superior = muestra.planitud_superior;
        }
        // Si no hay valor, no establecer nada (undefined) para que el backend maneje el caso
        
        // Convertir planitud_inferior_aceptacion (string) a planitud_inferior (boolean)
        if (muestra.planitud_inferior_aceptacion) {
          muestraTransformada.planitud_inferior = muestra.planitud_inferior_aceptacion === 'Cumple';
        } else if (muestra.planitud_inferior !== undefined) {
          // Ya es boolean, mantenerlo
          muestraTransformada.planitud_inferior = muestra.planitud_inferior;
        }
        
        // Convertir planitud_depresiones_aceptacion (string) a planitud_depresiones (boolean)
        if (muestra.planitud_depresiones_aceptacion) {
          muestraTransformada.planitud_depresiones = muestra.planitud_depresiones_aceptacion === 'Cumple';
        } else if (muestra.planitud_depresiones !== undefined) {
          // Ya es boolean, mantenerlo
          muestraTransformada.planitud_depresiones = muestra.planitud_depresiones;
        }
        
        // Mantener los campos de aceptación string para que el backend los guarde en la BD
        
        return muestraTransformada;
      })
    };
  };

  // Guardar verificación
  const guardarVerificacion = async () => {
    if (!verificacionData.numero_verificacion.trim()) {
      toast.error('Por favor ingrese el número de verificación');
      return;
    }

    if (verificacionData.muestras_verificadas.length === 0) {
      toast.error('Por favor agregue al menos una muestra');
      return;
    }

    setLoading(true);
    try {
      // Transformar los datos antes de enviarlos
      const datosParaEnviar = transformarDatosParaBackend(verificacionData);
      
      if (isEditMode && verificacionId) {
        // Modo edición: actualizar verificación existente
        isManualSaving.current = true;
        setAutoSaveEnabled(false);
        try {
          await updateVerificacionMutation.mutateAsync(datosParaEnviar);
          // El toast y navegación se manejan en el onSuccess de la mutation
          // Invalidar query solo después de guardar manualmente para refrescar datos
          queryClient.invalidateQueries(['verificacion', verificacionId]);
        } finally {
          // Re-habilitar auto-guardado después de guardar
          setTimeout(() => {
            isManualSaving.current = false;
            setAutoSaveEnabled(true);
          }, 2000);
        }
      } else {
        // Modo creación: crear nueva verificación
      const response = await fetch('/api/verificacion/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify(datosParaEnviar),
      });

      if (response.ok) {
        clearDraft(); // Limpiar borrador guardado
        try {
          await response.json();
            toast.success('Verificación guardada exitosamente');
          navigate('/verificacion');
        } catch (jsonError) {
          // Respuesta no es JSON válido, pero la operación fue exitosa
            toast.success('Verificación guardada exitosamente');
          navigate('/verificacion');
        }
      } else {
        try {
          const error = await response.json();
            toast.error(`Error: ${error.detail || 'Error desconocido'}`);
        } catch (jsonError) {
          const errorText = await response.text();
            toast.error(`Error ${response.status}: ${errorText || 'Error desconocido'}`);
        }
      }
      }
    } catch (error: any) {
      console.error('Error guardando verificación:', error);
      toast.error(`Error guardando verificación: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras se carga la verificación existente
  if (isEditMode && isLoadingVerificacion) {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Cargando verificación...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'EDITAR VERIFICACIÓN DE MUESTRAS CILÍNDRICAS DE CONCRETO' : 'VERIFICACIÓN DE MUESTRAS CILÍNDRICAS DE CONCRETO'}
        </h1>
          {isEditMode && (
            <div className="flex items-center gap-2 text-sm">
              {isSaving && (
                <span className="flex items-center text-blue-600">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              )}
              {!isSaving && lastSaved && (
                <span className="text-green-600">
                  ✓ Guardado {new Date(lastSaved).toLocaleTimeString('es-PE')}
                </span>
              )}
              {!isSaving && hasUnsavedChanges && (
                <span className="text-orange-600">
                  ⚠ Cambios sin guardar
                </span>
              )}
            </div>
          )}
        </div>

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

                    // Calcular masa usando la fórmula de volumen rectangular:
                    // Masa (g) = (Longitud1 × Longitud2 × Longitud3 × Densidad) / 1000
                    // NOTA: Las longitudes SOLO se usan para calcular masa. La conformidad es independiente.
                    if (muestra.longitud_1_mm && muestra.longitud_2_mm && muestra.longitud_3_mm) {
                      // Calcular volumen en mm³: Longitud1 × Longitud2 × Longitud3
                      const volumenMm3 = muestra.longitud_1_mm * muestra.longitud_2_mm * muestra.longitud_3_mm;
                      
                      // Convertir mm³ a cm³: dividir entre 1000
                      const volumenCm3 = volumenMm3 / 1000;
                      
                      // Calcular masa: Volumen (cm³) × Densidad (g/cm³)
                      const masaGramos = volumenCm3 * DENSIDAD_MATERIAL;
                      
                      // Redondear a 1 decimal
                      masaCalculada = Math.round(masaGramos * 10) / 10;
                    }
                    
                    // Calcular ratio L/D si tenemos diámetros para determinar si se debe pesar
                    if (muestra.diametro_1_mm && muestra.diametro_2_mm && muestra.longitud_1_mm && muestra.longitud_2_mm && muestra.longitud_3_mm) {
                      const diametroPromedioMm = (muestra.diametro_1_mm + muestra.diametro_2_mm) / 2;
                      const longitudPromedioMm = (muestra.longitud_1_mm + muestra.longitud_2_mm + muestra.longitud_3_mm) / 3;
                      ratioLD = longitudPromedioMm / diametroPromedioMm;
                      pesarCalculado = ratioLD <= RATIO_LD_LIMITE ? 'Pesar' : 'No pesar';
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
                        {/* CONFORMIDAD: Campo independiente que NO valida longitudes ni masa.
                            Valida aspectos geométricos: Perpendicularidad, Planitud, Depresiones. */}
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={muestra.conformidad || ''}
                            onChange={(e) => actualizarMuestra(index, {
                              conformidad: e.target.value || undefined
                            })}
                            className="w-full px-1 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Ensayar"
                            title="Conformidad: Independiente de longitudes y masa. Valida aspectos geométricos."
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
                          {masaCalculada !== undefined ? masaCalculada.toFixed(1) : ''}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center text-xs bg-blue-50 font-semibold">
                          {pesarCalculado || muestra.pesar || ''}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={async () => {
                                // Duplicar el item actual - crear una copia profunda completa
                                const nuevaMuestra: MuestraVerificada = {
                                  item_numero: verificacionData.muestras_verificadas.length + 1,
                                  codigo_lem: muestra.codigo_lem || '',
                                  codigo_cliente: muestra.codigo_cliente || muestra.codigo_lem || '',
                                  tipo_testigo: muestra.tipo_testigo || '',
                                  diametro_1_mm: muestra.diametro_1_mm,
                                  diametro_2_mm: muestra.diametro_2_mm,
                                  tolerancia_porcentaje: muestra.tolerancia_porcentaje,
                                  aceptacion_diametro: muestra.aceptacion_diametro,
                                  perpendicularidad_sup1: muestra.perpendicularidad_sup1,
                                  perpendicularidad_sup2: muestra.perpendicularidad_sup2,
                                  perpendicularidad_inf1: muestra.perpendicularidad_inf1,
                                  perpendicularidad_inf2: muestra.perpendicularidad_inf2,
                                  perpendicularidad_medida: muestra.perpendicularidad_medida,
                                  planitud_medida: muestra.planitud_medida,
                                  planitud_superior_aceptacion: muestra.planitud_superior_aceptacion,
                                  planitud_inferior_aceptacion: muestra.planitud_inferior_aceptacion,
                                  planitud_depresiones_aceptacion: muestra.planitud_depresiones_aceptacion,
                                  accion_realizar: muestra.accion_realizar,
                                  conformidad: muestra.conformidad,
                                  longitud_1_mm: muestra.longitud_1_mm,
                                  longitud_2_mm: muestra.longitud_2_mm,
                                  longitud_3_mm: muestra.longitud_3_mm,
                                  masa_muestra_aire_g: muestra.masa_muestra_aire_g,
                                  pesar: muestra.pesar,
                                  // Campos legacy para compatibilidad
                                  perpendicularidad_p1: muestra.perpendicularidad_p1 || muestra.perpendicularidad_sup1,
                                  perpendicularidad_p2: muestra.perpendicularidad_p2 || muestra.perpendicularidad_sup2,
                                  perpendicularidad_p3: muestra.perpendicularidad_p3 || muestra.perpendicularidad_inf1,
                                  perpendicularidad_p4: muestra.perpendicularidad_p4 || muestra.perpendicularidad_inf2,
                                  perpendicularidad_cumple: muestra.perpendicularidad_cumple || muestra.perpendicularidad_medida,
                                  planitud_superior: muestra.planitud_superior,
                                  planitud_inferior: muestra.planitud_inferior,
                                  planitud_depresiones: muestra.planitud_depresiones,
                                  conformidad_correccion: muestra.conformidad_correccion
                                };
                                // Agregar la muestra duplicada al final
                                const nuevasMuestras = [...verificacionData.muestras_verificadas, nuevaMuestra];
                                // Renumerar todos los items
                                nuevasMuestras.forEach((m, i) => {
                                  m.item_numero = i + 1;
                                });
                                
                                const nuevoData = {
                                  ...verificacionData,
                                  muestras_verificadas: nuevasMuestras
                                };
                                
                                setVerificacionData(nuevoData);
                                
                                // Si estamos en modo edición, forzar guardado inmediato
                                if (isEditMode && verificacionId) {
                                  // Deshabilitar auto-guardado temporalmente para evitar conflictos
                                  isManualSaving.current = true;
                                  
                                  // Esperar un momento para que React actualice el estado
                                  setTimeout(async () => {
                                    try {
                                      const datosParaEnviar = transformarDatosParaBackend(nuevoData);
                                      
                                      // Guardar en el backend
                                      await apiService.updateVerificacion(Number(verificacionId), datosParaEnviar);
                                      
                                      // Actualizar la referencia del auto-guardado para que no detecte cambios
                                      if (updateReference) {
                                        updateReference(nuevoData);
                                      }
                                      
                                      // Invalidar queries para que se actualicen los datos
                                      queryClient.invalidateQueries(['verificacion', verificacionId]);
                                      queryClient.invalidateQueries(['verificacion']);
                                      
                                      toast.success('Item duplicado y guardado exitosamente', { duration: 2000 });
                                      
                                      // Recargar los datos de la verificación para reflejar los cambios
                                      setTimeout(() => {
                                        // Forzar recarga de datos
                                        queryClient.refetchQueries(['verificacion', verificacionId]);
                                      }, 500);
                                    } catch (error: any) {
                                      console.error('Error guardando item duplicado:', error);
                                      toast.error('Item duplicado, pero error al guardar. Intenta guardar manualmente.');
                                    } finally {
                                      // Re-habilitar auto-guardado después de un breve delay
                                      setTimeout(() => {
                                        isManualSaving.current = false;
                                      }, 1000);
                                    }
                                  }, 100);
                                } else {
                                  toast.success('Item duplicado exitosamente');
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1"
                              title="Duplicar item"
                            >
                              📋
                            </button>
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
                                toast.success('Item eliminado');
                            }}
                            className="text-red-600 hover:text-red-800 text-xs px-2 py-1"
                              title="Eliminar item"
                          >
                            ✕
                          </button>
                          </div>
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
            disabled={loading || (isEditMode && isSaving) || isLoadingVerificacion}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditMode ? 'Actualizando...' : 'Creando...'}
              </span>
            ) : (
              isEditMode ? 'Actualizar Verificación' : 'Crear Verificación'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificacionMuestrasForm;
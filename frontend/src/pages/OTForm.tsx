import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';

// Constantes
const DATE_FORMAT_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

interface ItemOT {
  item_numero: number;
  codigo_muestra: string;
  descripcion: string;
  cantidad: number;
}

interface OTFormData {
  numero_ot: string;
  numero_recepcion: string;
  items: ItemOT[];
  fecha_recepcion: string;
  plazo_entrega_dias: number;
  fecha_inicio_programado: string;
  fecha_fin_programado: string;
  fecha_inicio_real: string;
  fecha_fin_real: string;
  variacion_inicio: number;
  variacion_fin: number;
  duracion_real_dias: number;
  observaciones: string;
  aperturada_por: string;
  designada_a: string;
}

const OTForm: React.FC = () => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOTId, setCreatedOTId] = useState<number | null>(null);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  // Generar números únicos basados en timestamp y random
  const generateUniqueNumbers = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return {
      numero_ot: `OT-${year}${month}${day}-${timestamp}-${random}`,
      numero_recepcion: `REC-${year}${month}${day}-${timestamp}-${random}`
    };
  };

  const { register, control, handleSubmit, formState: { errors }, reset, getValues, setValue } = useForm<OTFormData>({
    defaultValues: {
      ...generateUniqueNumbers(),
      items: [{ 
        item_numero: 1, 
        codigo_muestra: '',
        descripcion: '', 
        cantidad: 1
      }],
      fecha_recepcion: new Date().toLocaleDateString('es-ES'),
      plazo_entrega_dias: 7,
      fecha_inicio_programado: '',
      fecha_fin_programado: '',
      fecha_inicio_real: '',
      fecha_fin_real: '',
      variacion_inicio: 0,
      variacion_fin: 0,
      duracion_real_dias: 0,
      observaciones: '',
      aperturada_por: '',
      designada_a: ''
    }
  });

  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: 'items'
  });

  const createOTMutation = useMutation(async (data: OTFormData) => {
    // Limpiar datos antes de enviar - versión simplificada
    const cleanData = {
      numero_ot: data.numero_ot,
      numero_recepcion: data.numero_recepcion,
      fecha_recepcion: data.fecha_recepcion,
      plazo_entrega_dias: parseInt(data.plazo_entrega_dias.toString()) || 0,
      fecha_inicio_programado: data.fecha_inicio_programado || null,
      fecha_fin_programado: data.fecha_fin_programado || null,
      fecha_inicio_real: data.fecha_inicio_real || null,
      fecha_fin_real: data.fecha_fin_real || null,
      variacion_inicio: parseInt(data.variacion_inicio.toString()) || 0,
      variacion_fin: parseInt(data.variacion_fin.toString()) || 0,
      duracion_real_dias: parseInt(data.duracion_real_dias.toString()) || 0,
      observaciones: data.observaciones || null,
      aperturada_por: data.aperturada_por || null,
      designada_a: data.designada_a || null,
      estado: data.estado || "PENDIENTE",
      codigo_laboratorio: "F-LEM-P-01.02",
      version: "07",
      items: data.items.map(item => ({
        item_numero: parseInt(item.item_numero.toString()),
        codigo_muestra: item.codigo_muestra || null,
        descripcion: item.descripcion,
        cantidad: parseInt(item.cantidad.toString())
      }))
    };

    console.log('Datos a enviar:', cleanData);
    
    const response = await fetch('/api/ot/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanData),
    });
    
    if (!response.ok) {
      let errorMessage = 'Error al crear orden de trabajo';
      try {
        const errorData = await response.json();
        console.error('Error del servidor completo:', errorData);
        
        // Manejar diferentes tipos de errores
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Errores de validación de Pydantic
            errorMessage = errorData.detail.map(err => {
              const field = err.loc ? err.loc.join('.') : 'campo';
              return `${field}: ${err.msg}`;
            }).join('\n');
          } else {
            errorMessage = errorData.detail;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (Array.isArray(errorData)) {
          // Errores de validación de Pydantic
          errorMessage = errorData.map(err => `${err.loc?.join('.')}: ${err.msg}`).join('\n');
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } catch (e) {
        console.error('Error al parsear respuesta del servidor:', e);
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  }, {
    onSuccess: () => {
      toast.success('Orden de trabajo creada exitosamente');
      queryClient.invalidateQueries('ordenes-trabajo');
    },
    onError: (error: any) => {
      toast.error(`Error al crear orden de trabajo: ${error.message}`);
    }
  });

  const validateDateFormat = (date: string, fieldName: string): boolean => {
    if (!DATE_FORMAT_REGEX.test(date)) {
      toast.error(`${fieldName} debe estar en formato DD/MM/YYYY`);
      return false;
    }
    return true;
  };

  const onSubmit = async (data: OTFormData) => {
    setIsSubmitting(true);
    try {
      // Validar formato de fechas principales
      if (!validateDateFormat(data.fecha_recepcion, 'La fecha de recepción')) return;
      if (data.fecha_inicio_programado && !validateDateFormat(data.fecha_inicio_programado, 'La fecha de inicio programado')) return;
      if (data.fecha_fin_programado && !validateDateFormat(data.fecha_fin_programado, 'La fecha de fin programado')) return;
      if (data.fecha_inicio_real && !validateDateFormat(data.fecha_inicio_real, 'La fecha de inicio real')) return;
      if (data.fecha_fin_real && !validateDateFormat(data.fecha_fin_real, 'La fecha de fin real')) return;
      
      // Validar que haya al menos un item
      if (data.items.length === 0) {
        toast.error('Debe agregar al menos un item');
        return;
      }
      
      // Generar números únicos para este envío
      const uniqueNumbers = generateUniqueNumbers();
      const dataWithUniqueNumbers = {
        ...data,
        numero_ot: uniqueNumbers.numero_ot,
        numero_recepcion: uniqueNumbers.numero_recepcion
      };
      
      const result = await createOTMutation.mutateAsync(dataWithUniqueNumbers);
      setCreatedOTId(((result as unknown) as any)?.id ?? null);
      toast.success('Orden de trabajo creada exitosamente');
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      toast.error('Error al crear la orden de trabajo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!createdOTId) return;
    setIsDownloadingExcel(true);
    try {
      const response = await fetch(`/api/ot/${createdOTId}/excel`);
      if (!response.ok) throw new Error('Error al descargar Excel');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OT-${createdOTId}.xlsx`;
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

  const addItem = () => {
    append({
      item_numero: fields.length + 1,
      codigo_muestra: '',
      descripcion: '',
      cantidad: 1
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const duplicateItem = (index: number) => {
    const source = getValues(`items.${index}`) as Partial<ItemOT>;
    const clone: ItemOT = {
      item_numero: index + 2,
      codigo_muestra: source?.codigo_muestra || '',
      descripcion: source?.descripcion || '',
      cantidad: source?.cantidad || 1,
    };
    insert(index + 1, clone);
    
    // Recalcular números de item
    const currentValues = getValues('items');
    const updatedItems = currentValues.map((item, idx) => ({
      ...item,
      item_numero: idx + 1
    }));
    
    updatedItems.forEach((item, idx) => {
      setValue(`items.${idx}`, item);
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Encabezado */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">ORDEN DE TRABAJO</h1>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-semibold">CÓDIGO:</span> F-LEM-P-01.02
          </div>
          <div>
            <span className="font-semibold">VERSIÓN:</span> 07
          </div>
          <div>
            <span className="font-semibold">FECHA:</span> {new Date().toLocaleDateString('es-ES')}
          </div>
          <div>
            <span className="font-semibold">PÁGINA:</span> 1 de 1
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos principales */}
        <div className="border border-gray-300 p-4 rounded-lg">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                N° OT:
              </label>
              <input
                type="text"
                {...register('numero_ot', { required: 'Número OT es requerido' })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.numero_ot ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: 1422-25"
              />
              {errors.numero_ot && (
                <p className="text-red-500 text-xs mt-1">{errors.numero_ot.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nº RECEPCIÓN:
              </label>
              <input
                type="text"
                {...register('numero_recepcion', { required: 'Número de recepción es requerido' })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.numero_recepcion ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: 1384-25"
              />
              {errors.numero_recepcion && (
                <p className="text-red-500 text-xs mt-1">{errors.numero_recepcion.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabla de items */}
        <div className="border border-gray-300 rounded-lg overflow-x-auto">
          <div className="min-w-[600px] bg-gray-100 grid grid-cols-4 gap-2 p-3 font-semibold text-xs sm:text-sm">
            <div className="col-span-1 text-center">ÍTEM</div>
            <div className="col-span-1 text-center">CÓDIGO DE MUESTRA</div>
            <div className="col-span-1 text-center">DESCRIPCIÓN</div>
            <div className="col-span-1 text-center">CANTIDAD</div>
          </div>
          
          {fields.map((field, index) => (
            <div key={field.id} className="min-w-[600px] grid grid-cols-4 gap-2 p-3 border-b border-gray-200">
              <div className="col-span-1 flex items-center justify-center">
                <span className="text-sm font-medium">{index + 1}</span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="ml-2 text-red-500 hover:text-red-700 text-xs"
                    title="Eliminar item"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => duplicateItem(index)}
                  className="ml-2 text-blue-500 hover:text-blue-700 text-xs"
                  title="Duplicar item"
                >
                  ⧉
                </button>
              </div>
              <div className="col-span-1">
                <input
                  type="text"
                  {...register(`items.${index}.codigo_muestra` as const)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Código muestra"
                />
              </div>
              <div className="col-span-1">
                <input
                  type="text"
                  {...register(`items.${index}.descripcion` as const, { 
                    required: 'Descripción es requerida' 
                  })}
                  className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    errors.items?.[index]?.descripcion ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Descripción del item"
                />
                {errors.items?.[index]?.descripcion && (
                  <p className="text-red-500 text-xs mt-1">{errors.items[index]?.descripcion?.message}</p>
                )}
              </div>
              <div className="col-span-1">
                <input
                  type="number"
                  {...register(`items.${index}.cantidad` as const, { 
                    required: 'Cantidad es requerida',
                    min: { value: 1, message: 'Cantidad debe ser mayor a 0' }
                  })}
                  className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    errors.items?.[index]?.cantidad ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1"
                />
                {errors.items?.[index]?.cantidad && (
                  <p className="text-red-500 text-xs mt-1">{errors.items[index]?.cantidad?.message}</p>
                )}
              </div>
            </div>
          ))}
          
          <div className="p-3">
            <button
              type="button"
              onClick={addItem}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              + Agregar Item
            </button>
          </div>
        </div>


        {/* Fechas y plazos */}
        <div className="border border-gray-300 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-4">FECHAS Y PLAZOS</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FECHA DE RECEPCIÓN:
              </label>
              <input
                type="text"
                {...register('fecha_recepcion', { required: 'Fecha de recepción es requerida' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PLAZO DE ENTREGA (DIAS):
              </label>
              <input
                type="number"
                {...register('plazo_entrega_dias', { required: 'Plazo de entrega es requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="7"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                INICIO PROGRAMADO:
              </label>
              <input
                type="text"
                {...register('fecha_inicio_programado')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FIN PROGRAMADO:
              </label>
              <input
                type="text"
                {...register('fecha_fin_programado')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DD/MM/YYYY"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                INICIO REAL:
              </label>
              <input
                type="text"
                {...register('fecha_inicio_real')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FIN REAL:
              </label>
              <input
                type="text"
                {...register('fecha_fin_real')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DD/MM/YYYY"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VARIACION DE INICIO:
              </label>
              <input
                type="number"
                {...register('variacion_inicio')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VARIACION DE FIN:
              </label>
              <input
                type="number"
                {...register('variacion_fin')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DURACION REAL DE EJECUCION (DIAS):
              </label>
              <input
                type="number"
                {...register('duracion_real_dias')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Observaciones y responsables */}
        <div className="border border-gray-300 p-4 rounded-lg">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OBSERVACIONES:
            </label>
            <textarea
              {...register('observaciones')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observaciones generales"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                O/T APERTURADA POR:
              </label>
              <input
                type="text"
                {...register('aperturada_por')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de quien aperturó la OT"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OT DESIGADA A:
              </label>
              <input
                type="text"
                {...register('designada_a')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de quien está designado"
              />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="pt-4 border-t border-gray-200">
          {/* Botones de descarga (solo se muestran después de crear la OT) */}
          {createdOTId && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                ✅ Orden de trabajo creada exitosamente (ID: {createdOTId})
              </h3>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  disabled={isDownloadingExcel}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloadingExcel ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generando Excel...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Descargar Excel
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Botones principales */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Está seguro de que desea limpiar todos los campos?')) {
                  reset();
                  setCreatedOTId(null);
                  toast.success('Formulario limpiado');
                }
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando...
                </span>
              ) : (
                'Crear Orden de Trabajo'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OTForm;

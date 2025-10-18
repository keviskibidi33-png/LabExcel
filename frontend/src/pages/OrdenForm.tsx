import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';

// Imports optimizados
import { createOrden, downloadPDF, downloadExcel } from '../services/api';
import { OrdenFormData, MuestraConcretoData } from '../types';
import { VALIDATION_PATTERNS, DEFAULT_VALUES, MESSAGES, FORM_CONFIG } from '../constants';
import { FormValidator, Formatter } from '../utils/validation';
import { getCurrentDate, getCurrentTime } from '../utils/dateUtils';

// Constantes
const DATE_FORMAT_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
const DEFAULT_FC_VALUE = 280;
const DEFAULT_EDAD_VALUE = 10;

interface ItemOrden {
  item_numero: number;
  codigo_muestra: string;
  codigo_muestra_lem: string;
  identificacion_muestra: string;
  estructura: string;
  fc_kg_cm2: number;
  fecha_moldeo: string;
  hora_moldeo?: string;
  edad: number;
  fecha_rotura: string;
  requiere_densidad: boolean;
}

interface OrdenFormData {
  numero_recepcion: string;
  numero_cotizacion?: string;
  numero_ot: string;
  // codigo_trazabilidad eliminado
  // asunto eliminado
  cliente: string;
  domicilio_legal: string;
  ruc: string;
  persona_contacto: string;
  email: string;
  telefono: string;
  solicitante: string;
  domicilio_solicitante: string;
  proyecto: string;
  ubicacion: string;
  muestras: ItemOrden[];
  fecha_recepcion: string;
  fecha_estimada_culminacion: string;
  emision_fisica: boolean;
  emision_digital: boolean;
  entregado_por: string;
  recibido_por: string;
}

const OrdenForm: React.FC = () => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRecepcionId, setCreatedRecepcionId] = useState<number | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
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

  const { register, control, handleSubmit, formState: { errors }, reset } = useForm<OrdenFormData>({
    defaultValues: {
      ...generateUniqueNumbers(),
      muestras: [{ 
        item_numero: 1, 
        codigo_muestra: '',
        codigo_muestra_lem: '', 
        identificacion_muestra: '', 
        estructura: '', 
        fc_kg_cm2: DEFAULT_FC_VALUE, 
        fecha_moldeo: '', 
        hora_moldeo: '', 
        edad: DEFAULT_EDAD_VALUE, 
        fecha_rotura: '', 
        requiere_densidad: false 
      }],
      fecha_recepcion: new Date().toLocaleDateString('es-ES'),
      fecha_estimada_culminacion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES'),
      // asunto eliminado
      emision_fisica: false,
      emision_digital: true,
      entregado_por: '',
      recibido_por: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'muestras'
  });

  const createOrdenMutation = useMutation(createOrden, {
    onSuccess: () => {
      toast.success('Orden de trabajo creada exitosamente');
      queryClient.invalidateQueries('ordenes');
      reset();
    },
    onError: (error: any) => {
      toast.error(`Error al crear orden: ${error.message}`);
    }
  });

  const validateDateFormat = (date: string, fieldName: string): boolean => {
    if (!DATE_FORMAT_REGEX.test(date)) {
      toast.error(`${fieldName} debe estar en formato DD/MM/YYYY`);
      return false;
    }
    return true;
  };

  const onSubmit = async (data: OrdenFormData) => {
    setIsSubmitting(true);
    try {
      // Validar formato de fechas principales
      if (!validateDateFormat(data.fecha_recepcion, 'La fecha de recepción')) return;
      if (!validateDateFormat(data.fecha_estimada_culminacion, 'La fecha estimada de culminación')) return;
      
      // Validar fechas de muestras
      for (const muestra of data.muestras) {
        if (muestra.fecha_moldeo && !validateDateFormat(muestra.fecha_moldeo, `La fecha de moldeo de la muestra ${muestra.item_numero}`)) return;
        if (muestra.fecha_rotura && !validateDateFormat(muestra.fecha_rotura, `La fecha de rotura de la muestra ${muestra.item_numero}`)) return;
      }
      
      // Validar que haya al menos una muestra
      if (data.muestras.length === 0) {
        toast.error('Debe agregar al menos una muestra');
        return;
      }
      
      // Generar números únicos para este envío
      const uniqueNumbers = generateUniqueNumbers();
      const dataWithUniqueNumbers = {
        ...data,
        numero_ot: uniqueNumbers.numero_ot,
        numero_recepcion: uniqueNumbers.numero_recepcion
      };
      
      const result = await createOrdenMutation.mutateAsync(dataWithUniqueNumbers);
      setCreatedRecepcionId(result.id);
      toast.success('Recepción creada exitosamente');
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      toast.error('Error al crear la recepción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!createdRecepcionId) return;
    setIsDownloadingPDF(true);
    try {
      const blob = await downloadPDF(createdRecepcionId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recepcion_${createdRecepcionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error descargando PDF:', error);
      toast.error('Error al descargar PDF');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!createdRecepcionId) return;
    setIsDownloadingExcel(true);
    try {
      const blob = await downloadExcel(createdRecepcionId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recepcion_${createdRecepcionId}.xlsx`;
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
      identificacion_muestra: '',
      estructura: '',
      fc_kg_cm2: DEFAULT_FC_VALUE,
      fecha_moldeo: '',
      hora_moldeo: '',
      edad: DEFAULT_EDAD_VALUE,
      fecha_rotura: '',
      requiere_densidad: false
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Encabezado */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">RECEPCIÓN DE MUESTRA CILÍNDRICAS DE CONCRETO</h1>
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
                RECEPCIÓN N°:
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                COTIZACIÓN N°:
              </label>
              <input
                type="text"
                {...register('numero_cotizacion')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: -"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OT N°:
              </label>
              <input
                type="text"
                {...register('numero_ot', { required: 'Número OT es requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 1422-25"
              />
              {errors.numero_ot && (
                <p className="text-red-500 text-xs mt-1">{errors.numero_ot.message}</p>
              )}
            </div>
          </div>
          
          {/* Campos eliminados: código de trazabilidad y asunto */}
        </div>

        {/* Tabla de muestras */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 grid grid-cols-12 gap-2 p-3 font-semibold text-sm">
            <div className="col-span-1 text-center">N°</div>
            <div className="col-span-2 text-center">CÓDIGO MUESTRA LEM</div>
            <div className="col-span-2 text-center">IDENTIFICACIÓN MUESTRA</div>
            <div className="col-span-1 text-center">ESTRUCTURA</div>
            <div className="col-span-1 text-center">F'c (kg/cm²)</div>
            <div className="col-span-1 text-center">FECHA MOLDEO</div>
            <div className="col-span-1 text-center">HORA MOLDEO</div>
            <div className="col-span-1 text-center">EDAD</div>
            <div className="col-span-1 text-center">FECHA ROTURA</div>
            <div className="col-span-1 text-center">DENSIDAD SI/NO</div>
          </div>
          
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 p-3 border-b border-gray-200">
              <div className="col-span-1 flex items-center justify-center">
                <span className="text-sm font-medium">{index + 1}</span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="ml-2 text-red-500 hover:text-red-700 text-xs"
                    title="Eliminar muestra"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  {...register(`muestras.${index}.codigo_muestra_lem` as const, { 
                    required: 'Código muestra LEM es requerido' 
                  })}
                  className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    errors.muestras?.[index]?.codigo_muestra_lem ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="4259-CO-25"
                />
                {errors.muestras?.[index]?.codigo_muestra_lem && (
                  <p className="text-red-500 text-xs mt-1">{errors.muestras[index]?.codigo_muestra_lem?.message}</p>
                )}
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  {...register(`muestras.${index}.identificacion_muestra` as const, { 
                    required: 'Identificación de muestra es requerida' 
                  })}
                  className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    errors.muestras?.[index]?.identificacion_muestra ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="MEGA.E1C3-07"
                />
                {errors.muestras?.[index]?.identificacion_muestra && (
                  <p className="text-red-500 text-xs mt-1">{errors.muestras[index]?.identificacion_muestra?.message}</p>
                )}
              </div>
              <div className="col-span-1">
                <input
                  type="text"
                  {...register(`muestras.${index}.estructura` as const, { 
                    required: 'Estructura es requerida' 
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="LOSA.2DO NIVEL - E1/C3"
                />
              </div>
              <div className="col-span-1">
                <input
                  type="number"
                  {...register(`muestras.${index}.fc_kg_cm2` as const, { 
                    required: 'F\'c es requerido' 
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="280"
                />
              </div>
              <div className="col-span-1">
                <input
                  type="text"
                  {...register(`muestras.${index}.fecha_moldeo` as const, { 
                    required: 'Fecha de moldeo es requerida' 
                  })}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-1">
                <input
                  type="time"
                  {...register(`muestras.${index}.hora_moldeo` as const)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-1">
                <input
                  type="number"
                  {...register(`muestras.${index}.edad` as const, { 
                    required: 'Edad es requerida' 
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="10"
                />
              </div>
              <div className="col-span-1">
                <input
                  type="text"
                  {...register(`muestras.${index}.fecha_rotura` as const, { 
                    required: 'Fecha de rotura es requerida' 
                  })}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-1">
                <select
                  {...register(`muestras.${index}.requiere_densidad` as const)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="false">NO</option>
                  <option value="true">SI</option>
                </select>
              </div>
            </div>
          ))}
          
          <div className="p-3">
            <button
              type="button"
              onClick={addItem}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              + Agregar Muestra
            </button>
          </div>
        </div>

        {/* Datos del Cliente */}
        <div className="border border-gray-300 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-4">DATOS PARA FACTURACIÓN Y PERSONA DE CONTACTO PARA EL ENVÍO DEL INFORME DE LABORATORIO</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente:
              </label>
              <input
                type="text"
                {...register('cliente', { required: 'Cliente es requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: SGCMM GROUP S.A.C."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUC:
              </label>
              <input
                type="text"
                {...register('ruc', { required: 'RUC es requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 20602960995"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domicilio Legal:
            </label>
            <textarea
              {...register('domicilio_legal', { required: 'Domicilio legal es requerido' })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dirección completa del cliente"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Persona Contacto:
              </label>
              <input
                type="text"
                {...register('persona_contacto', { required: 'Persona de contacto es requerida' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: ROBERTH POTOCINO YARANGA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail:
              </label>
              <input
                type="email"
                {...register('email', { required: 'Email es requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono:
              </label>
              <input
                type="tel"
                {...register('telefono', { required: 'Teléfono es requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 917 270 635"
              />
            </div>
          </div>
        </div>

        {/* Datos del Solicitante */}
        <div className="border border-gray-300 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-4">DATOS QUE IRÁ EN EL INFORME DE LABORATORIO</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Solicitante:
              </label>
              <input
                type="text"
                {...register('solicitante', { required: 'Solicitante es requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: MEGA ESTRUCTURAS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proyecto:
              </label>
              <input
                type="text"
                {...register('proyecto', { required: 'Proyecto es requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del proyecto"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domicilio Legal Solicitante:
            </label>
            <textarea
              {...register('domicilio_solicitante', { required: 'Domicilio del solicitante es requerido' })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dirección completa del solicitante"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación:
            </label>
            <textarea
              {...register('ubicacion', { required: 'Ubicación es requerida' })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ubicación específica del proyecto"
            />
          </div>
        </div>

        {/* Fechas y emisión de informes */}
        <div className="border border-gray-300 p-4 rounded-lg">
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
                FECHA ESTIMADA DE CULMINACIÓN:
              </label>
              <input
                type="text"
                {...register('fecha_estimada_culminacion', { required: 'Fecha estimada de culminación es requerida' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DD/MM/YYYY"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Emisión de Informes:</h4>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('emision_fisica')}
                  className="mr-2"
                />
                <span className="text-sm">- Físico (El cliente recoger los informes en el laboratorio)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('emision_digital')}
                  className="mr-2"
                />
                <span className="text-sm">- Digital (Envío a los correos autorizados, con firma digital)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Responsables */}
        <div className="border border-gray-300 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entregado por:
              </label>
              <input
                type="text"
                {...register('entregado_por', { required: 'Campo entregado por es requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de quien entrega las muestras"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recibido por:
              </label>
              <input
                type="text"
                {...register('recibido_por', { required: 'Campo recibido por es requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de quien recibe las muestras"
              />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="pt-4 border-t border-gray-200">
          {/* Botones de descarga (solo se muestran después de crear la recepción) */}
          {createdRecepcionId && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                ✅ Recepción creada exitosamente (ID: {createdRecepcionId})
              </h3>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isDownloadingPDF}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloadingPDF ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generando PDF...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Descargar PDF
                    </>
                  )}
                </button>
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
                      Descargar Excel (MEGAMINTAJE)
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
                  setCreatedRecepcionId(null);
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
                'Crear Recepción de Muestra'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OrdenForm;

import { useState } from 'react'
import { useMutation } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { CloudArrowUpIcon, DocumentIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { apiService, downloadFile } from '../services/api'

export default function UploadExcel() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const navigate = useNavigate()

  const uploadMutation = useMutation(apiService.uploadExcel, {
    onSuccess: (data) => {
      toast.success(`Archivo procesado exitosamente. Orden ID: ${data.orden_id}`)
      navigate(`/ordenes/${data.orden_id}`)
    },
    onError: (error: any) => {
      toast.error(`Error procesando archivo: ${error.response?.data?.detail || error.message}`)
    },
    onSettled: () => {
      setIsProcessing(false)
    }
  })

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  })

  const handleUpload = async () => {
    if (!uploadedFile) return
    
    setIsProcessing(true)
    uploadMutation.mutate(uploadedFile)
  }

  const handleDownloadTemplate = async () => {
    try {
      // Crear una orden de ejemplo para generar plantilla
      const ordenEjemplo = {
        numero_ot: "EJEMPLO-001",
        numero_recepcion: "REC-001",
        referencia: "Plantilla de ejemplo",
        items: [
          {
            item_numero: 1,
            codigo_muestra: "MUESTRA-001",
            descripcion: "Descripción de ejemplo",
            cantidad: 1,
            especificacion: "Especificación de ejemplo"
          }
        ]
      }
      
      const orden = await apiService.createOrden(ordenEjemplo)
      const blob = await apiService.downloadTemplate(orden.id)
      downloadFile(blob, `plantilla_ejemplo_${orden.numero_ot}.xlsx`)
      toast.success('Plantilla descargada exitosamente')
    } catch (error: any) {
      toast.error(`Error descargando plantilla: ${error.message}`)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subir Archivo Excel</h1>
        <p className="mt-2 text-gray-600">
          Importa archivos Excel de órdenes de trabajo al sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Area */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Subir Archivo</h2>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            {isDragActive ? (
              <p className="mt-2 text-sm text-gray-600">
                Suelta el archivo aquí...
              </p>
            ) : (
              <div>
                <p className="mt-2 text-sm text-gray-600">
                  Arrastra y suelta un archivo Excel aquí, o{' '}
                  <span className="font-medium text-primary-600">haz clic para seleccionar</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Solo archivos .xlsx y .xls
                </p>
              </div>
            )}
          </div>

          {uploadedFile && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <DocumentIcon className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    {uploadedFile.name}
                  </p>
                  <p className="text-sm text-green-600">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleUpload}
              disabled={!uploadedFile || isProcessing}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Procesando...' : 'Procesar Archivo'}
            </button>
            <button
              onClick={() => setUploadedFile(null)}
              disabled={!uploadedFile || isProcessing}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Instrucciones</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Formato Requerido</h3>
              <p className="text-sm text-gray-600 mt-1">
                El archivo Excel debe seguir el formato estándar de órdenes de trabajo del laboratorio.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900">Campos Obligatorios</h3>
              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                <li>• Número de OT</li>
                <li>• Número de Recepción</li>
                <li>• Código de muestra</li>
                <li>• Descripción del item</li>
                <li>• Cantidad</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900">Campos Opcionales</h3>
              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                <li>• Referencia</li>
                <li>• Fecha de recepción</li>
                <li>• Plazo de entrega</li>
                <li>• Observaciones</li>
                <li>• Responsables</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleDownloadTemplate}
                className="btn-secondary w-full"
              >
                <DocumentIcon className="h-4 w-4 mr-2" />
                Descargar Plantilla de Ejemplo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="mt-8 card">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Procesando archivo...</p>
              <p className="text-sm text-gray-500">
                Esto puede tomar unos momentos dependiendo del tamaño del archivo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

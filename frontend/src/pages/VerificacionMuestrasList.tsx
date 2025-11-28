import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ModuleLayout from '../components/layout/ModuleLayout';
import Pagination from '../components/ui/Pagination';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import { toast } from 'react-hot-toast';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

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
  muestras_verificadas: any[];
}

const VerificacionMuestrasList: React.FC = () => {
  const navigate = useNavigate();
  const [verificaciones, setVerificaciones] = useState<VerificacionMuestra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExcel, setFilterExcel] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [verificacionToDelete, setVerificacionToDelete] = useState<{ id: number; numero: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    cargarVerificaciones();
  }, []);

  const cargarVerificaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/verificacion/');
      
      if (response.ok) {
        try {
          const data = await response.json();
          setVerificaciones(data);
        } catch (jsonError) {
          console.log('Respuesta no es JSON válido, pero la operación fue exitosa');
          setVerificaciones([]);
        }
      } else {
        try {
          const errorData = await response.json();
          setError(`Error ${response.status}: ${errorData.detail || 'Error desconocido'}`);
        } catch (jsonError) {
          // Si no se puede parsear como JSON, usar el status text
          setError(`Error ${response.status}: ${response.statusText || 'Error desconocido'}`);
        }
      }
    } catch (err) {
      console.error('Error cargando verificaciones:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, numeroVerificacion: string) => {
    setVerificacionToDelete({ id, numero: numeroVerificacion });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!verificacionToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/verificacion/${verificacionToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setVerificaciones(prev => prev.filter(v => v.id !== verificacionToDelete.id));
        toast.success('Verificación eliminada exitosamente');
        setShowDeleteModal(false);
        setVerificacionToDelete(null);
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.detail}`);
      }
    } catch (err) {
      toast.error('Error eliminando verificación');
    } finally {
      setIsDeleting(false);
    }
  };

  const generarExcel = async (id: number) => {
    try {
      const response = await fetch(`/api/verificacion/${id}/generar-excel`, {
        method: 'POST',
      });

      if (response.ok) {
        await response.json();
        alert('Excel generado exitosamente');
        // Recargar la lista para actualizar el estado
        cargarVerificaciones();
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (err) {
      alert('Error generando Excel');
    }
  };

  // Búsqueda y filtrado inteligente
  const filteredVerificaciones = useMemo(() => {
    return verificaciones.filter(verificacion => {
      // Búsqueda por texto (número verificación, cliente, código documento)
      const matchesSearch = !searchTerm || 
        verificacion.numero_verificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (verificacion.cliente && verificacion.cliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
        verificacion.codigo_documento.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por Excel generado
      const matchesExcel = filterExcel === 'TODOS' || 
        (filterExcel === 'GENERADO' && verificacion.archivo_excel) ||
        (filterExcel === 'PENDIENTE' && !verificacion.archivo_excel);
      
      return matchesSearch && matchesExcel;
    });
  }, [verificaciones, searchTerm, filterExcel]);

  // Paginación
  const totalPages = Math.ceil(filteredVerificaciones.length / itemsPerPage);
  const paginatedVerificaciones = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVerificaciones.slice(startIndex, endIndex);
  }, [filteredVerificaciones, currentPage, itemsPerPage]);

  // Resetear página cuando cambian los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterExcel]);

  const descargarExcel = async (id: number) => {
    try {
      const response = await fetch(`/api/verificacion/${id}/descargar-excel`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verificacion_${id}.xlsx`;
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

  const handleNewClick = () => {
    navigate('/verificacion/nueva');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Cargando verificaciones...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Verificaciones de Muestras Cilíndricas
            </h1>
            <Link
              to="/verificacion/nueva"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Nueva Verificación
            </Link>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-6 text-center">
            <div className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">
              ⚠️ Error cargando verificaciones
            </div>
            <div className="text-red-700 dark:text-red-300 mb-4">{error}</div>
            <button
              onClick={cargarVerificaciones}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ModuleLayout
      title="Verificación de Muestras"
      description="Gestiona las verificaciones de muestras cilíndricas de concreto"
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Buscar por número verificación, cliente, código documento..."
      onNewClick={handleNewClick}
      newButtonText="Nueva Verificación"
      filters={
        <select
          value={filterExcel}
          onChange={(e) => setFilterExcel(e.target.value)}
          className="input-field pr-10"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem'
          }}
        >
          <option value="TODOS">Todos</option>
          <option value="GENERADO">Excel Generado</option>
          <option value="PENDIENTE">Excel Pendiente</option>
        </select>
      }
    >
      {filteredVerificaciones.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {searchTerm || filterExcel !== 'TODOS' ? 'No se encontraron verificaciones' : 'No hay verificaciones registradas'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filterExcel !== 'TODOS' 
                ? 'Intenta con otros términos de búsqueda'
                : 'Comienza creando tu primera verificación'
              }
            </p>
            </div>
          </div>
        ) : (
        <div className="card">
          <div className="overflow-x-auto -mx-6 md:mx-0 px-6 md:px-0">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="table-header">N° Verificación</th>
                  <th className="table-header">Cliente</th>
                  <th className="table-header">Verificado por</th>
                  <th className="table-header">Fecha Verificación</th>
                  <th className="table-header">Muestras</th>
                  <th className="table-header">Fecha Creación</th>
                  <th className="table-header">Excel</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedVerificaciones.map((verificacion) => (
                  <tr key={verificacion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {verificacion.numero_verificacion}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {verificacion.cliente || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {verificacion.verificado_por || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {verificacion.fecha_verificacion || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {verificacion.muestras_verificadas?.length || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(verificacion.fecha_creacion).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {verificacion.archivo_excel ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          ✅ Generado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                          ⏳ Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => generarExcel(verificacion.id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                        title="Generar Excel"
                      >
                        📊 Excel
                      </button>
                      <button
                        onClick={() => window.location.href = `/verificacion/${verificacion.id}`}
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors"
                        title="Ver Detalles"
                      >
                        👁️ Ver
                      </button>
                      {verificacion.archivo_excel && (
                        <button
                          onClick={() => descargarExcel(verificacion.id)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 transition-colors"
                          title="Descargar Excel"
                        >
                          📥 Descargar
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(verificacion.id, verificacion.numero_verificacion)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
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
          {filteredVerificaciones.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredVerificaciones.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1);
              }}
            />
        )}
      </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setVerificacionToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="¿Eliminar Verificación?"
        message="¿Está seguro de que desea eliminar esta verificación? Esta acción eliminará permanentemente la verificación y todos sus datos asociados."
        itemName={verificacionToDelete ? `Verificación: ${verificacionToDelete.numero}` : undefined}
        isLoading={isDeleting}
      />
    </ModuleLayout>
  );
};

export default VerificacionMuestrasList;

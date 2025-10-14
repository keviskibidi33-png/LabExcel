import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { 
  DocumentTextIcon, 
  CloudArrowUpIcon, 
  CloudArrowDownIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { api } from '../services/api'

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery('dashboard-stats', api.getDashboardStats)

  const quickActions = [
    {
      name: 'Ver Órdenes',
      description: 'Gestionar órdenes de trabajo existentes',
      href: '/ordenes',
      icon: DocumentTextIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Subir Excel',
      description: 'Importar archivo Excel de orden de trabajo',
      href: '/upload',
      icon: CloudArrowUpIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Exportar Datos',
      description: 'Exportar órdenes a archivo Excel',
      href: '/export',
      icon: CloudArrowDownIcon,
      color: 'bg-purple-500'
    }
  ]

  const statsCards = [
    {
      name: 'Total Órdenes',
      value: stats?.total_ordenes || 0,
      icon: DocumentTextIcon,
      color: 'text-blue-600'
    },
    {
      name: 'Pendientes',
      value: stats?.ordenes_pendientes || 0,
      icon: ClockIcon,
      color: 'text-yellow-600'
    },
    {
      name: 'Completadas',
      value: stats?.ordenes_completadas || 0,
      icon: CheckCircleIcon,
      color: 'text-green-600'
    },
    {
      name: 'Total Items',
      value: stats?.total_items || 0,
      icon: ChartBarIcon,
      color: 'text-purple-600'
    }
  ]

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Sistema de gestión automatizada de archivos Excel para laboratorio
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="card hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{action.name}</h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Órdenes Recientes</h2>
        <div className="card">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">N° OT</th>
                  <th className="table-header">N° Recepción</th>
                  <th className="table-header">Estado</th>
                  <th className="table-header">Fecha</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.ordenes_recientes?.map((orden: any) => (
                  <tr key={orden.id}>
                    <td className="table-cell font-medium">{orden.numero_ot}</td>
                    <td className="table-cell">{orden.numero_recepcion}</td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        orden.estado === 'COMPLETADA' 
                          ? 'bg-green-100 text-green-800'
                          : orden.estado === 'EN_PROGRESO'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {orden.estado}
                      </span>
                    </td>
                    <td className="table-cell">
                      {new Date(orden.fecha_creacion).toLocaleDateString('es-ES')}
                    </td>
                    <td className="table-cell">
                      <Link
                        to={`/ordenes/${orden.id}`}
                        className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                      >
                        Ver detalles
                      </Link>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={5} className="table-cell text-center text-gray-500">
                      No hay órdenes recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

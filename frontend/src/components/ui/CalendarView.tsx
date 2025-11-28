import { useState, useMemo } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon, DocumentTextIcon, ClipboardDocumentListIcon, CubeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { api } from '../../services/api'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'

interface DayStats {
  date: string
  total: number
  recepciones: number
  ordenes: number
  controles: number
  verificaciones: number
  documentos: {
    recepciones: Array<{ id: number; nombre: string }>
    ordenes: Array<{ id: number; nombre: string }>
    controles: Array<{ id: number; nombre: string }>
    verificaciones: Array<{ id: number; nombre: string }>
  }
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const navigate = useNavigate()
  
  // Obtener datos de todos los módulos
  const { data: ordenesData } = useQuery('ordenes-calendar', () => 
    api.get('/api/ordenes/').then(res => res.data), { onError: () => [] }
  )
  const { data: otData } = useQuery('ot-calendar', () => 
    api.get('/api/ot/').then(res => res.data), { onError: () => [] }
  )
  const { data: controlesData } = useQuery('controles-calendar', () => 
    api.get('/api/concreto/controles').then(res => res.data), { onError: () => [] }
  )
  const { data: verificacionesData } = useQuery('verificaciones-calendar', () => 
    api.get('/api/verificacion/').then(res => res.data), { onError: () => [] }
  )

  // Calcular estadísticas por día con documentos
  const dayStats = useMemo(() => {
    const stats: Record<string, DayStats> = {}

    // Procesar recepciones
    ordenesData?.forEach((orden: any) => {
      const date = new Date(orden.fecha_creacion).toISOString().split('T')[0]
      if (!stats[date]) {
        stats[date] = {
          date,
          total: 0,
          recepciones: 0,
          ordenes: 0,
          controles: 0,
          verificaciones: 0,
          documentos: {
            recepciones: [],
            ordenes: [],
            controles: [],
            verificaciones: []
          }
        }
      }
      stats[date].recepciones += orden.items?.length || 0
      stats[date].total += orden.items?.length || 0
      stats[date].documentos.recepciones.push({
        id: orden.id,
        nombre: orden.numero_recepcion || orden.numero_ot || `Recepción ${orden.id}`
      })
    })

    // Procesar órdenes de trabajo
    otData?.forEach((ot: any) => {
      const date = new Date(ot.fecha_creacion).toISOString().split('T')[0]
      if (!stats[date]) {
        stats[date] = {
          date,
          total: 0,
          recepciones: 0,
          ordenes: 0,
          controles: 0,
          verificaciones: 0,
          documentos: {
            recepciones: [],
            ordenes: [],
            controles: [],
            verificaciones: []
          }
        }
      }
      stats[date].ordenes += 1
      stats[date].total += 1
      stats[date].documentos.ordenes.push({
        id: ot.id,
        nombre: ot.numero_ot || `OT ${ot.id}`
      })
    })

    // Procesar controles
    controlesData?.forEach((control: any) => {
      const date = new Date(control.fecha_creacion).toISOString().split('T')[0]
      if (!stats[date]) {
        stats[date] = {
          date,
          total: 0,
          recepciones: 0,
          ordenes: 0,
          controles: 0,
          verificaciones: 0,
          documentos: {
            recepciones: [],
            ordenes: [],
            controles: [],
            verificaciones: []
          }
        }
      }
      stats[date].controles += control.probetas?.length || 0
      stats[date].total += control.probetas?.length || 0
      stats[date].documentos.controles.push({
        id: control.id,
        nombre: control.numero_control || `Control ${control.id}`
      })
    })

    // Procesar verificaciones
    verificacionesData?.forEach((verificacion: any) => {
      const date = new Date(verificacion.fecha_creacion).toISOString().split('T')[0]
      if (!stats[date]) {
        stats[date] = {
          date,
          total: 0,
          recepciones: 0,
          ordenes: 0,
          controles: 0,
          verificaciones: 0,
          documentos: {
            recepciones: [],
            ordenes: [],
            controles: [],
            verificaciones: []
          }
        }
      }
      stats[date].verificaciones += verificacion.muestras_verificadas?.length || 0
      stats[date].total += verificacion.muestras_verificadas?.length || 0
      stats[date].documentos.verificaciones.push({
        id: verificacion.id,
        nombre: verificacion.numero_verificacion || `Verificación ${verificacion.id}`
      })
    })

    return stats
  }, [ordenesData, otData, controlesData, verificacionesData])

  // Generar días del mes
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Array<{ date: Date; stats: DayStats | null }> = []

    // Días del mes anterior para completar la semana
    const startDay = firstDay.getDay()
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, stats: null })
    }

    // Días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      days.push({ date, stats: dayStats[dateStr] || null })
    }

    // Días del mes siguiente para completar la semana
    const endDay = lastDay.getDay()
    for (let day = 1; day <= 6 - endDay; day++) {
      const date = new Date(year, month + 1, day)
      days.push({ date, stats: null })
    }

    return days
  }, [currentDate, dayStats])

  const getIntensity = (total: number): string => {
    if (total === 0) return 'bg-gray-50'
    if (total <= 5) return 'bg-blue-100'
    if (total <= 10) return 'bg-blue-300'
    if (total <= 20) return 'bg-blue-500'
    return 'bg-blue-700'
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDayClick = (dateStr: string, stats: DayStats | null) => {
    if (stats && stats.total > 0) {
      setSelectedDate(dateStr)
    }
  }

  const selectedDayStats = selectedDate ? dayStats[selectedDate] : null

  const handleDocumentClick = (type: string, id: number) => {
    setSelectedDate(null)
    switch (type) {
      case 'recepciones':
        navigate(`/ordenes/${id}`)
        break
      case 'ordenes':
        navigate(`/ot/${id}`)
        break
      case 'controles':
        navigate(`/concreto/${id}`)
        break
      case 'verificaciones':
        navigate(`/verificacion/${id}`)
        break
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 md:p-3 lg:p-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <h3 className="text-sm md:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPreviousMonth}
              className="p-1 md:p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="h-3 w-3 md:h-4 md:w-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1 md:p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="h-3 w-3 md:h-4 md:w-4" />
            </button>
          </div>
        </div>

        {/* Leyenda - Ocultar en móvil, mostrar en desktop más compacta */}
        <div className="hidden md:flex items-center gap-1.5 mb-2 text-[9px] md:text-[10px] text-gray-600 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-gray-50 border border-gray-300 rounded"></div>
            <span>Sin</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-blue-100 rounded"></div>
            <span>1-5</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-blue-300 rounded"></div>
            <span>6-10</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded"></div>
            <span>11-20</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-blue-700 rounded"></div>
            <span>20+</span>
          </div>
        </div>

        {/* Calendario - Más compacto en desktop */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Días de la semana */}
          {weekDays.map((day) => (
            <div key={day} className="text-center text-[9px] md:text-[10px] font-semibold text-gray-600 py-0.5 md:py-1">
              {day}
            </div>
          ))}

          {/* Días del mes */}
          {daysInMonth.map(({ date, stats }, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth()
            const isToday = date.toDateString() === new Date().toDateString()
            const intensity = stats ? getIntensity(stats.total) : 'bg-gray-50'
            const dateStr = date.toISOString().split('T')[0]

            return (
              <div
                key={index}
                onClick={() => handleDayClick(dateStr, stats)}
                className={`
                  aspect-square p-0.5 rounded border transition-all
                  ${isCurrentMonth ? 'border-gray-200' : 'border-gray-100'}
                  ${isToday ? 'ring-1 ring-blue-500' : ''}
                  ${stats && stats.total > 0 ? 'cursor-pointer hover:shadow-md hover:scale-105 active:scale-95' : ''}
                `}
              >
                <div className={`h-full rounded ${intensity} flex flex-col items-center justify-center`}>
                  <span
                    className={`text-[8px] md:text-[9px] font-medium ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    } ${isToday ? 'font-bold' : ''}`}
                  >
                    {date.getDate()}
                  </span>
                  {stats && stats.total > 0 && (
                    <span className="text-[7px] md:text-[8px] text-gray-700 mt-0.5 font-semibold">
                      {stats.total}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Resumen del mes - Más compacto */}
        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200">
          <h4 className="text-[10px] md:text-xs font-semibold text-gray-900 mb-1.5 md:mb-2">Resumen del mes</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2">
            <div className="text-center p-1.5 md:p-2 bg-blue-50 rounded-lg">
              <div className="text-sm md:text-base lg:text-lg font-bold text-blue-600">
                {Object.values(dayStats).reduce((sum, day) => sum + day.recepciones, 0)}
              </div>
              <div className="text-[9px] md:text-[10px] text-gray-600 mt-0.5">Recepciones</div>
            </div>
            <div className="text-center p-1.5 md:p-2 bg-green-50 rounded-lg">
              <div className="text-sm md:text-base lg:text-lg font-bold text-green-600">
                {Object.values(dayStats).reduce((sum, day) => sum + day.ordenes, 0)}
              </div>
              <div className="text-[9px] md:text-[10px] text-gray-600 mt-0.5">Órdenes</div>
            </div>
            <div className="text-center p-1.5 md:p-2 bg-purple-50 rounded-lg">
              <div className="text-sm md:text-base lg:text-lg font-bold text-purple-600">
                {Object.values(dayStats).reduce((sum, day) => sum + day.controles, 0)}
              </div>
              <div className="text-[9px] md:text-[10px] text-gray-600 mt-0.5">Controles</div>
            </div>
            <div className="text-center p-1.5 md:p-2 bg-yellow-50 rounded-lg">
              <div className="text-sm md:text-base lg:text-lg font-bold text-yellow-600">
                {Object.values(dayStats).reduce((sum, day) => sum + day.verificaciones, 0)}
              </div>
              <div className="text-[9px] md:text-[10px] text-gray-600 mt-0.5">Verificaciones</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de documentos del día */}
      {selectedDate && selectedDayStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDate(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                {new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
              <div className="space-y-4">
                {selectedDayStats.documentos.recepciones.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Recepciones ({selectedDayStats.documentos.recepciones.length})</h4>
                    </div>
                    <div className="space-y-1">
                      {selectedDayStats.documentos.recepciones.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => handleDocumentClick('recepciones', doc.id)}
                          className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm text-gray-700 hover:text-blue-700"
                        >
                          {doc.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDayStats.documentos.ordenes.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Órdenes de Trabajo ({selectedDayStats.documentos.ordenes.length})</h4>
                    </div>
                    <div className="space-y-1">
                      {selectedDayStats.documentos.ordenes.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => handleDocumentClick('ordenes', doc.id)}
                          className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm text-gray-700 hover:text-green-700"
                        >
                          {doc.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDayStats.documentos.controles.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CubeIcon className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Controles ({selectedDayStats.documentos.controles.length})</h4>
                    </div>
                    <div className="space-y-1">
                      {selectedDayStats.documentos.controles.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => handleDocumentClick('controles', doc.id)}
                          className="w-full text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-sm text-gray-700 hover:text-purple-700"
                        >
                          {doc.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDayStats.documentos.verificaciones.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-yellow-600" />
                      <h4 className="font-semibold text-gray-900">Verificaciones ({selectedDayStats.documentos.verificaciones.length})</h4>
                    </div>
                    <div className="space-y-1">
                      {selectedDayStats.documentos.verificaciones.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => handleDocumentClick('verificaciones', doc.id)}
                          className="w-full text-left px-3 py-2 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-sm text-gray-700 hover:text-yellow-700"
                        >
                          {doc.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

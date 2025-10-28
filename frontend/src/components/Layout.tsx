import { ReactNode, useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  DocumentTextIcon, 
  CloudArrowUpIcon, 
  CloudArrowDownIcon,
  PlusIcon,
  Bars3Icon,
  XMarkIcon,
  CubeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Recepción', href: '/ordenes', icon: DocumentTextIcon },
  { name: 'Nueva Recepción', href: '/nueva-orden', icon: PlusIcon },
  { name: 'Órdenes de Trabajo', href: '/ot', icon: DocumentTextIcon },
  { name: 'Nueva OT', href: '/ot/new', icon: PlusIcon },
  { name: 'Control Concreto', href: '/concreto', icon: CubeIcon },
  { name: 'Nuevo Control', href: '/concreto/nuevo', icon: PlusIcon },
  { name: 'Verificación Muestras', href: '/verificacion', icon: CheckCircleIcon },
  { name: 'Nueva Verificación', href: '/verificacion/nueva', icon: PlusIcon },
  { name: 'Subir Excel', href: '/upload', icon: CloudArrowUpIcon },
  { name: 'Exportar', href: '/export', icon: CloudArrowDownIcon },
]

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Por defecto expandido
  const [isDesktop, setIsDesktop] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 50,
          display: 'block'
        }}>
          <div 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0, 0, 0, 0.5)' 
            }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            bottom: 0, 
            width: '256px', 
            backgroundColor: 'white',
            borderRight: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              height: '64px', 
              padding: '0 16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>LabExcel</h1>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '8px', color: '#9ca3af' }}
              >
                <XMarkIcon style={{ width: '24px', height: '24px' }} />
              </button>
            </div>
            <nav style={{ padding: '16px' }}>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      textDecoration: 'none',
                      backgroundColor: isActive ? '#dbeafe' : 'transparent',
                      color: isActive ? '#1d4ed8' : '#4b5563',
                      marginBottom: '4px'
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon style={{ width: '20px', height: '20px', marginRight: '12px' }} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar - Siempre visible */}
      {isDesktop && (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: sidebarCollapsed ? '64px' : '256px',
          backgroundColor: 'white',
          borderRight: '1px solid #e5e7eb',
          zIndex: 40,
          transition: 'width 0.3s ease-in-out',
          boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)'
        }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            height: '64px', 
            padding: '0 16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            {!sidebarCollapsed && (
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>LabExcel</h1>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                minWidth: '32px',
                minHeight: '32px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.color = '#374151'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#6b7280'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              <Bars3Icon style={{ 
                width: '20px', 
                height: '20px',
                transform: sidebarCollapsed ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }} />
            </button>
          </div>
          <nav style={{ 
            flex: 1, 
            padding: '16px', 
            overflowY: 'auto' 
          }}>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    backgroundColor: isActive ? '#dbeafe' : 'transparent',
                    color: isActive ? '#1d4ed8' : '#4b5563',
                    marginBottom: '4px',
                    transition: 'background-color 0.2s, color 0.2s'
                  }}
                  onMouseEnter={(e) => { 
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                      e.currentTarget.style.color = '#1f2937'
                    }
                  }}
                  onMouseLeave={(e) => { 
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#4b5563'
                    }
                  }}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon style={{ 
                    width: '20px', 
                    height: '20px', 
                    marginRight: sidebarCollapsed ? '0' : '12px',
                    flexShrink: 0
                  }} />
                  {!sidebarCollapsed && (
                    <span style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.name}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ 
        marginLeft: isDesktop ? (sidebarCollapsed ? '64px' : '256px') : '0',
        transition: 'margin-left 0.3s ease-in-out'
      }}>
        {/* Page content */}
        <main style={{ padding: '24px' }}>
          <div style={{ 
            maxWidth: '1280px', 
            margin: '0 auto'
          }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
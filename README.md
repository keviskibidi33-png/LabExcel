# 🧪 Sistema de Gestión Excel - Laboratorio

Sistema automatizado de gestión y manipulación de archivos Excel para laboratorio, desarrollado con FastAPI y React. Permite la creación, gestión y exportación de recepciones de muestras de concreto con generación automática de PDF y Excel.

## ✨ Características Principales

- **📋 Formulario de Recepción**: Creación de recepciones de muestras cilíndricas de concreto
- **📊 Generación de Archivos**: Exportación automática a PDF y Excel (MEGAMINTAJE)
- **🔍 Validación Robusta**: Validación completa de datos y formatos
- **🎨 Interfaz Moderna**: SPA responsiva con React y TailwindCSS
- **⚡ API REST**: Backend asíncrono con FastAPI
- **🗄️ Base de Datos**: PostgreSQL con SQLAlchemy ORM
- **🐳 Contenedorización**: Docker y docker-compose para despliegue
- **📱 PWA**: Soporte para uso offline

## 🏗️ Arquitectura del Sistema

### Backend (FastAPI)
- **Framework**: FastAPI 0.104+ con Python 3.12+
- **Base de datos**: PostgreSQL con SQLAlchemy ORM
- **Procesamiento Excel**: OpenPyXL para modificación de templates
- **Generación PDF**: ReportLab para documentos PDF
- **Validación**: Pydantic con validadores personalizados
- **Logging**: Sistema de logging profesional
- **Configuración**: Gestión centralizada de configuración

### Frontend (React + TypeScript)
- **Framework**: React 18+ con TypeScript
- **Estilos**: TailwindCSS con componentes responsivos
- **Formularios**: React Hook Form con validación
- **HTTP**: Axios con manejo de errores
- **Estado**: React Query para gestión de estado del servidor
- **PWA**: Vite PWA Plugin para funcionalidad offline

### Infraestructura
- **Contenedores**: Docker con multi-stage builds
- **Orquestación**: Docker Compose para desarrollo y producción
- **Servidor web**: Nginx con configuración optimizada
- **Base de datos**: PostgreSQL con backup automático
- **Cache**: Redis para optimización (opcional)

## 📁 Estructura del Proyecto

```
geocreator/
├── backend/                    # Backend FastAPI
│   ├── main.py                # Aplicación principal
│   ├── config.py              # Configuración centralizada
│   ├── database.py            # Configuración de BD
│   ├── models.py              # Modelos SQLAlchemy
│   ├── schemas.py             # Esquemas Pydantic
│   ├── services/              # Lógica de negocio
│   │   ├── excel_collaborative_service.py
│   │   ├── simple_pdf_service.py
│   │   └── orden_service.py
│   ├── utils/                 # Utilidades
│   │   ├── logger.py          # Sistema de logging
│   │   ├── exceptions.py      # Excepciones personalizadas
│   │   ├── validators.py      # Validadores de datos
│   │   └── file_handler.py
│   ├── templates/             # Templates Excel
│   └── requirements.txt       # Dependencias Python
├── frontend/                  # Frontend React
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── pages/            # Páginas de la aplicación
│   │   ├── services/         # Servicios API
│   │   ├── types/            # Tipos TypeScript
│   │   ├── constants/        # Constantes de la app
│   │   ├── utils/            # Utilidades
│   │   └── main.tsx          # Punto de entrada
│   ├── package.json          # Dependencias Node
│   └── vite.config.ts        # Configuración Vite
├── docker/                   # Configuración Docker
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── docs/                     # Documentación
├── archivos/                 # Archivos de ejemplo
└── docker-compose.yml        # Orquestación de servicios
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Docker**: 20.10+ y Docker Compose 2.0+
- **Python**: 3.12+ (para desarrollo local)
- **Node.js**: 18+ (para desarrollo local)
- **PostgreSQL**: 13+ (para desarrollo local)

### Instalación con Docker (Recomendado)

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd geocreator
```

2. **Configurar variables de entorno**
```bash
cp backend/.env.example backend/.env
# Editar backend/.env con tus configuraciones
```

3. **Construir y ejecutar servicios**
```bash
docker-compose up --build
```

4. **Acceder a la aplicación**
- Frontend: http://localhost:3001
- Backend API: http://localhost:8000
- Documentación API: http://localhost:8000/docs

### Instalación para Desarrollo

#### Backend

1. **Crear entorno virtual**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

2. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

3. **Configurar base de datos**
```bash
# Crear base de datos PostgreSQL
createdb laboratorio_db

# Ejecutar migraciones
python migrate_to_recepcion.py
```

4. **Ejecutar servidor**
```bash
python main.py
```

#### Frontend

1. **Instalar dependencias**
```bash
cd frontend
npm install
```

2. **Ejecutar servidor de desarrollo**
```bash
npm run dev
```

## 📊 Formato de Datos

### Estructura de Recepción de Muestras

El sistema maneja recepciones de muestras cilíndricas de concreto con la siguiente estructura:

```json
{
  "numero_ot": "OT-20251016-1760645936594-4994",
  "numero_recepcion": "REC-20251016-1760645936594-4994",
  "numero_cotizacion": "COT-2025-001",
  "codigo_trazabilidad": "TRZ-ABC-123",
  "asunto": "SOLICITO EJECUCIÓN DE ENSAYOS",
  "cliente": "Empresa Constructora S.A.C.",
  "domicilio_legal": "Av. Principal 123, Lima",
  "ruc": "20123456789",
  "persona_contacto": "Juan Pérez",
  "email": "juan@empresa.com",
  "telefono": "+51987654321",
  "solicitante": "Ing. María García",
  "domicilio_solicitante": "Av. Secundaria 456",
  "proyecto": "Edificio Residencial XYZ",
  "ubicacion": "Distrito de San Isidro",
  "fecha_recepcion": "16/10/2025",
  "fecha_estimada_culminacion": "20/10/2025",
  "emision_fisica": true,
  "emision_digital": true,
  "entregado_por": "Carlos López",
  "recibido_por": "Ana Martínez",
  "muestras": [
    {
      "item_numero": 1,
      "codigo_muestra": "MU-001",
      "identificacion_muestra": "Probeta 1",
      "estructura": "Columna",
      "fc_kg_cm2": 280,
      "fecha_moldeo": "15/10/2025",
      "hora_moldeo": "14:30",
      "edad": 28,
      "fecha_rotura": "12/11/2025",
      "requiere_densidad": false
    }
  ]
}
```

### Validaciones

- **Número OT**: Formato único con timestamp
- **Número Recepción**: Formato único con timestamp
- **RUC**: 11 dígitos numéricos
- **Email**: Formato válido de email
- **Teléfono**: Formato internacional
- **Fechas**: Formato DD/MM/YYYY
- **Horas**: Formato HH:MM
- **Muestras**: Mínimo 1 muestra por recepción

## 🔧 API Endpoints

### Recepciones de Muestras

- `GET /api/ordenes/` - Listar recepciones
- `GET /api/ordenes/{id}` - Obtener recepción específica
- `POST /api/ordenes/` - Crear nueva recepción
- `PUT /api/ordenes/{id}` - Actualizar recepción
- `DELETE /api/ordenes/{id}` - Eliminar recepción

### Generación de Archivos

- `GET /api/ordenes/{id}/pdf` - Descargar PDF de recepción
- `GET /api/ordenes/{id}/excel` - Descargar Excel (MEGAMINTAJE)

### Procesamiento Excel

- `POST /api/excel/upload` - Subir archivo Excel
- `GET /api/excel/template/{orden_id}` - Descargar plantilla
- `POST /api/excel/export` - Exportar múltiples recepciones

### Dashboard

- `GET /api/dashboard/stats` - Estadísticas del sistema

## 📝 Uso del Sistema

### 1. Crear Recepción de Muestra

1. Navegar a "Nueva Recepción"
2. Completar formulario con datos del cliente y proyecto
3. Agregar muestras con sus especificaciones
4. Validar fechas y datos
5. Crear recepción

### 2. Gestionar Recepciones

1. Ver lista de recepciones en "Órdenes"
2. Hacer clic en una recepción para ver detalles
3. Editar información si es necesario
4. Descargar archivos PDF y Excel

### 3. Exportar Datos

1. Seleccionar recepciones a exportar
2. Elegir formato de exportación (PDF/Excel)
3. Descargar archivos generados

## 🧪 Testing

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm test
```

## 🔒 Seguridad

- **Validación de datos**: Validación robusta en frontend y backend
- **Sanitización**: Limpieza de datos de entrada
- **CORS**: Configuración de CORS para desarrollo y producción
- **Variables de entorno**: Configuración sensible en variables de entorno
- **Logging**: Sistema de logging para auditoría

## 🚀 Despliegue en Producción

### Variables de Entorno

```bash
# Producción
ENVIRONMENT=production
DEBUG=False
DATABASE_URL=postgresql://user:pass@prod-db:5432/laboratorio_db
SECRET_KEY=clave_super_segura_produccion
CORS_ORIGINS=https://tu-dominio.com
LOG_LEVEL=INFO
```

### Docker Compose para Producción

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Configuración de Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name tu-dominio.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://frontend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📚 Documentación Adicional

- [API Documentation](http://localhost:8000/docs) - Documentación interactiva de la API
- [Deployment Guide](./docs/DEPLOYMENT.md) - Guía completa de despliegue
- [Troubleshooting](#troubleshooting) - Solución de problemas comunes

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 🔧 Troubleshooting

### Error de Conexión al Backend

Si encuentras errores de conexión:

**Síntomas:**
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
```

**Soluciones:**
1. Verificar que el backend esté ejecutándose:
   ```bash
   cd backend
   python main.py
   ```

2. Verificar puerto del backend (debe ser 8000):
   ```bash
   netstat -an | grep 8000
   ```

3. Verificar configuración CORS en `backend/main.py`

### Error de Validación 422

Si encuentras errores de validación:

**Síntomas:**
```
422 (Unprocessable Entity)
```

**Soluciones:**
1. Verificar formato de fechas (DD/MM/YYYY)
2. Verificar formato de RUC (11 dígitos)
3. Verificar que todas las muestras tengan campos requeridos
4. Revisar logs del backend para detalles específicos

### Error de Generación de Excel

Si la descarga de Excel falla:

**Síntomas:**
```
500 (Internal Server Error) en /api/ordenes/{id}/excel
```

**Soluciones:**
1. Verificar que el template Excel existe en `backend/templates/`
2. Verificar permisos de escritura
3. Revisar logs del backend para errores específicos

### Error de React Hooks

Si encuentras errores de React Hooks:

**Síntomas:**
```
Warning: Invalid hook call. Hooks can only be called inside of the body of a function component.
```

**Soluciones:**
1. Limpiar dependencias:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Verificar versiones de React:
   ```bash
   npm list react react-dom
   ```

3. Configurar Vite para resolver duplicados (ya configurado en `vite.config.ts`)

### Problemas de Base de Datos

Si hay problemas de conexión a la base de datos:

**Soluciones:**
1. Verificar que PostgreSQL esté ejecutándose
2. Verificar credenciales en `backend/.env`
3. Ejecutar migraciones:
```bash
   cd backend
   python migrate_to_recepcion.py
```

## 🆘 Soporte

Para soporte técnico o preguntas:
- Crear un issue en el repositorio
- Revisar la documentación de la API
- Contactar al equipo de desarrollo

---

**Desarrollado con ❤️ para automatizar la gestión de recepciones de muestras en laboratorio**

## 📊 Estado del Proyecto

- ✅ **Backend**: Completamente funcional con FastAPI
- ✅ **Frontend**: React con TypeScript funcionando
- ✅ **Base de datos**: PostgreSQL con migraciones
- ✅ **Generación PDF**: ReportLab implementado
- ✅ **Generación Excel**: OpenPyXL con templates
- ✅ **Validación**: Sistema robusto de validación
- ✅ **Logging**: Sistema profesional de logging
- ✅ **Docker**: Configuración completa
- ✅ **Documentación**: Completa y actualizada

**Última actualización**: Enero 2025
**Versión**: 1.0.0
**Estado**: Producción lista
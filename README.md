# Sistema de Gestión Excel - Laboratorio

Sistema automatizado de gestión y manipulación de archivos Excel para laboratorio, desarrollado con FastAPI y React.

## ⚠️ Estado Actual del Proyecto

**🚨 IMPORTANTE:** Este proyecto está en desarrollo activo y presenta errores críticos en el frontend React. Ver [ISSUES.md](./ISSUES.md) para detalles completos de los problemas conocidos.

### Errores Críticos:
- ❌ **React Hooks Error**: El frontend presenta errores de hooks que impiden el funcionamiento
- ⚠️ **Backend no probado**: FastAPI configurado pero no ejecutado
- ✅ **Base de datos**: PostgreSQL funcionando con datos reales
- ✅ **Proxy DB**: Funcionando correctamente en puerto 3001

### Componentes Funcionando:
- ✅ Proxy de base de datos (puerto 3001)
- ✅ Base de datos PostgreSQL con datos reales
- ✅ Estructura del proyecto completa

## 🚀 Características

- **Importación de Excel**: Procesamiento automático de archivos Excel de órdenes de trabajo
- **Exportación de datos**: Generación de plantillas y exportación de múltiples órdenes
- **Validación robusta**: Validación de formatos y estructura de archivos
- **Interfaz moderna**: SPA responsiva con React y TailwindCSS
- **API REST**: Backend asíncrono con FastAPI
- **Base de datos**: PostgreSQL con SQLAlchemy ORM
- **Contenedorización**: Docker y docker-compose para despliegue
- **PWA**: Soporte para uso offline

## 🏗️ Arquitectura

### Backend (FastAPI)
- **Framework**: FastAPI 0.104+
- **Base de datos**: PostgreSQL con SQLAlchemy
- **Procesamiento Excel**: openpyxl y pandas
- **Validación**: Pydantic
- **Tareas en segundo plano**: Celery + Redis (opcional)

### Frontend (React)
- **Framework**: React 18+ con TypeScript
- **Estilos**: TailwindCSS
- **Tablas**: react-table
- **HTTP**: Axios
- **PWA**: Vite PWA Plugin

### Infraestructura
- **Contenedores**: Docker
- **Orquestación**: docker-compose
- **Servidor web**: Nginx
- **Base de datos**: PostgreSQL
- **Cache**: Redis

## 📁 Estructura del Proyecto

```
geocreator/
├── backend/                 # Backend FastAPI
│   ├── main.py             # Aplicación principal
│   ├── database.py         # Configuración de BD
│   ├── models.py           # Modelos SQLAlchemy
│   ├── schemas.py          # Esquemas Pydantic
│   ├── services/           # Lógica de negocio
│   │   ├── excel_service.py
│   │   └── orden_service.py
│   ├── utils/              # Utilidades
│   │   ├── excel_validator.py
│   │   └── file_handler.py
│   ├── requirements.txt    # Dependencias Python
│   └── .env               # Variables de entorno
├── frontend/               # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas
│   │   ├── services/       # Servicios API
│   │   └── main.tsx        # Punto de entrada
│   ├── package.json        # Dependencias Node
│   └── vite.config.ts      # Configuración Vite
├── docker/                 # Configuración Docker
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── docs/                   # Documentación
├── archivos/               # Archivos de ejemplo
└── docker-compose.yml      # Orquestación de servicios
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Docker y Docker Compose
- Python 3.12+ (para desarrollo local)
- Node.js 18+ (para desarrollo local)

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
- Frontend: http://localhost
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

# Ejecutar migraciones (si las hay)
alembic upgrade head
```

4. **Ejecutar servidor**
```bash
uvicorn main:app --reload
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

## 📊 Formato de Archivos Excel

### Estructura Requerida

El sistema espera archivos Excel con la siguiente estructura:

```
ORDEN DE TRABAJO
CÓDIGO: F-LEM-P-02.01
VERSIÓN: 03
FECHA: [fecha]
PÁGINA: 1 de 1

N° OT: [número]    N° RECEPCIÓN: [número]    REFERENCIA: [referencia]

ÍTEM | CÓDIGO DE MUESTRA | DESCRIPCIÓN | CANTIDAD
-----|-------------------|-------------|----------
1    | 4259-CO-25       | COMPRESION  | 5
2    | 4263-CO-25       | DESCRIPCIÓN | 3

FECHA DE RECEPCIÓN: [fecha]
PLAZO DE ENTREGA (DIAS): [días]
OBSERVACIONES: [texto]
O/T APERTURADA POR: [nombre]
OT DESIGADA A: [nombre]
```

### Validaciones

- **Número OT**: Formato `XXXX-XX-XXX` (ej: 1422-25-LEM)
- **Número Recepción**: Formato `XXXX-XX` (ej: 1384-25)
- **Código Muestra**: Formato `XXXX-XX-XX` (ej: 4259-CO-25)
- **Cantidad**: Número entero positivo

## 🔧 API Endpoints

### Órdenes de Trabajo

- `GET /api/ordenes/` - Listar órdenes
- `GET /api/ordenes/{id}` - Obtener orden específica
- `POST /api/ordenes/` - Crear nueva orden
- `PUT /api/ordenes/{id}` - Actualizar orden
- `DELETE /api/ordenes/{id}` - Eliminar orden

### Procesamiento Excel

- `POST /api/excel/upload` - Subir archivo Excel
- `GET /api/excel/template/{orden_id}` - Descargar plantilla
- `POST /api/excel/export` - Exportar múltiples órdenes

### Dashboard

- `GET /api/dashboard/stats` - Estadísticas del sistema

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

## 📝 Uso del Sistema

### 1. Subir Archivo Excel

1. Navegar a "Subir Excel"
2. Arrastrar archivo o hacer clic para seleccionar
3. El sistema validará automáticamente el formato
4. Procesar archivo para crear orden de trabajo

### 2. Gestionar Órdenes

1. Ver lista de órdenes en "Órdenes"
2. Hacer clic en una orden para ver detalles
3. Editar información si es necesario
4. Descargar plantilla Excel prellenada

### 3. Exportar Datos

1. Seleccionar órdenes a exportar
2. Elegir formato de exportación
3. Descargar archivo Excel consolidado

## 🔒 Seguridad

- Validación de tipos de archivo
- Límites de tamaño de archivo
- Sanitización de datos de entrada
- CORS configurado
- Variables de entorno para configuración sensible

## 🚀 Despliegue en Producción

### Variables de Entorno

```bash
# Producción
ENVIRONMENT=production
DEBUG=False
DATABASE_URL=postgresql://user:pass@prod-db:5432/laboratorio_db
SECRET_KEY=clave_super_segura_produccion
```

### Docker Compose para Producción

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 Documentación Adicional

- [API Documentation](http://localhost:8000/docs) - Documentación interactiva de la API
- [Frontend Components](./docs/components.md) - Documentación de componentes React
- [Excel Templates](./docs/templates.md) - Plantillas de ejemplo
- [Deployment Guide](./docs/deployment.md) - Guía de despliegue

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 🔧 Troubleshooting

### Error de React Hooks

Si encuentras errores como:
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

3. Configurar Vite para resolver duplicados (ver [ISSUES.md](./ISSUES.md))

### Proxy de Base de Datos

Si el proxy no funciona:
```bash
cd frontend
node db-proxy.js
```

Verificar que esté ejecutándose en `http://localhost:3001`

## 🆘 Soporte

Para soporte técnico o preguntas:
- Crear un issue en el repositorio
- Revisar [ISSUES.md](./ISSUES.md) para problemas conocidos
- Contactar al equipo de desarrollo
- Revisar la documentación de la API

---

**Desarrollado con ❤️ para automatizar la gestión de archivos Excel en laboratorio**

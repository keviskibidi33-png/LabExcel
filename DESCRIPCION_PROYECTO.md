# 🧪 Sistema de Gestión Excel - Laboratorio (GeoCreator)

## ¿QUÉ ES?

GeoCreator es un sistema web automatizado de gestión y manipulación de archivos Excel diseñado específicamente para laboratorios de ensayos de materiales de construcción. El sistema permite la creación, gestión, seguimiento y exportación automatizada de recepciones de muestras de concreto, órdenes de trabajo, controles de calidad y verificaciones de muestras cilíndricas, con generación automática de documentos Excel y PDF que cumplen con los estándares normativos del sector.

## ¿PARA QUÉ SIRVE?

El sistema automatiza y digitaliza los procesos críticos de un laboratorio de ensayos de materiales:

- **Gestión de Recepciones**: Registro digital completo de muestras de concreto recibidas, incluyendo datos del cliente, proyecto, ubicación y especificaciones técnicas de cada muestra.

- **Control de Calidad**: Seguimiento y control de probetas de concreto con cálculo automático de resistencias, edades de ensayo, fechas de rotura y cumplimiento de especificaciones.

- **Verificación de Muestras**: Sistema especializado para verificación dimensional de muestras cilíndricas de concreto, incluyendo cálculo automático de tolerancias de diámetros, perpendicularidad, planitud y determinación de acciones correctivas.

- **Generación Automática de Documentos**: Creación automática de archivos Excel (MEGAMINTAJE) y PDF con formato profesional, respetando plantillas predefinidas y estándares de documentación del laboratorio.

- **Gestión de Órdenes de Trabajo**: Control completo del ciclo de vida de órdenes de trabajo, desde la recepción hasta la entrega, con seguimiento de plazos, variaciones y estados.

- **Trazabilidad Completa**: Sistema de trazabilidad que permite rastrear cada muestra desde su recepción hasta la generación de reportes finales, manteniendo historial completo de operaciones.

## ¿PARA QUIÉN ESTÁ DIRIGIDO?

### Usuarios Primarios:

1. **Laboratorios de Ensayos de Materiales**
   - Laboratorios que realizan ensayos de resistencia a la compresión de concreto
   - Empresas certificadas para ensayos de materiales de construcción
   - Laboratorios que requieren cumplimiento con normas técnicas (NTP, ASTM, ACI)

2. **Personal Técnico del Laboratorio**
   - Técnicos de laboratorio que reciben y procesan muestras
   - Ingenieros responsables de control de calidad
   - Supervisores de ensayos y verificaciones
   - Personal administrativo que gestiona órdenes de trabajo

3. **Clientes del Laboratorio**
   - Empresas constructoras que envían muestras para ensayo
   - Consultoras de ingeniería que requieren certificaciones
   - Empresas de prefabricados de concreto
   - Entidades públicas que contratan servicios de laboratorio

### Beneficiarios Indirectos:

- **Gerentes de Laboratorio**: Para supervisión y control de operaciones
- **Auditores y Certificadores**: Para verificación de procesos y trazabilidad
- **Departamentos de Calidad**: Para cumplimiento de estándares ISO y normativas

## ¿PARA QUÉ PLATAFORMAS?

### Plataformas de Desarrollo y Despliegue:

- **Backend**: 
  - Python 3.12+ con FastAPI
  - PostgreSQL como base de datos
  - Compatible con sistemas operativos: Windows, Linux, macOS
  - Docker y Docker Compose para contenedorización

- **Frontend**:
  - React 18+ con TypeScript
  - Aplicación Web Progresiva (PWA) con soporte offline
  - Compatible con navegadores modernos: Chrome, Firefox, Edge, Safari
  - Diseño responsivo para escritorio, tablet y móvil

### Plataformas de Acceso:

- **Navegadores Web**: 
  - Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
  - Acceso desde cualquier dispositivo con navegador web moderno

- **Dispositivos**:
  - Computadoras de escritorio (Windows, macOS, Linux)
  - Laptops y notebooks
  - Tablets (iPad, Android)
  - Smartphones (iOS, Android) - modo responsivo

- **Infraestructura**:
  - Servidores cloud (AWS, Azure, Google Cloud, DigitalOcean)
  - Servidores on-premise (Windows Server, Linux)
  - Contenedores Docker en cualquier plataforma compatible

## ¿PARA QUÉ USOS ESPECÍFICOS?

### 1. Gestión de Recepciones de Muestras
- **Uso**: Registro digital de muestras de concreto recibidas en el laboratorio
- **Beneficio**: Elimina el uso de formularios en papel, reduce errores de transcripción y acelera el proceso de recepción
- **Casos de uso**: 
  - Recepción diaria de muestras de múltiples proyectos
  - Registro de datos del cliente, proyecto y especificaciones técnicas
  - Asignación automática de códigos de muestra y números de recepción

### 2. Control de Calidad de Concreto
- **Uso**: Seguimiento y control de probetas de concreto durante el proceso de ensayo
- **Beneficio**: Cálculo automático de resistencias, validación de cumplimiento de especificaciones y generación de reportes
- **Casos de uso**:
  - Control de probetas por orden de trabajo
  - Seguimiento de fechas de moldeo, edades y fechas de rotura
  - Validación de resistencias mínimas requeridas (fc)

### 3. Verificación Dimensional de Muestras
- **Uso**: Verificación de cumplimiento dimensional de muestras cilíndricas según normas técnicas
- **Beneficio**: Cálculo automático de tolerancias, determinación de conformidad y generación de acciones correctivas
- **Casos de uso**:
  - Verificación de diámetros y tolerancias
  - Evaluación de perpendicularidad y planitud
  - Determinación de conformidad según normativa vigente

### 4. Generación de Documentos Oficiales
- **Uso**: Creación automática de documentos Excel y PDF con formato profesional
- **Beneficio**: Elimina trabajo manual de llenado de plantillas, garantiza consistencia y reduce tiempo de procesamiento
- **Casos de uso**:
  - Generación de reportes de recepción de muestras
  - Creación de órdenes de trabajo en formato Excel
  - Exportación de controles de calidad para entrega a clientes

### 5. Gestión de Órdenes de Trabajo
- **Uso**: Control completo del ciclo de vida de órdenes de trabajo
- **Beneficio**: Seguimiento de plazos, control de variaciones y gestión eficiente de recursos
- **Casos de uso**:
  - Creación y asignación de órdenes de trabajo
  - Seguimiento de fechas programadas vs reales
  - Control de variaciones y cumplimiento de plazos

### 6. Trazabilidad y Auditoría
- **Uso**: Mantenimiento de historial completo de todas las operaciones
- **Beneficio**: Cumplimiento de requisitos de trazabilidad para certificaciones y auditorías
- **Casos de uso**:
  - Auditorías internas y externas
  - Cumplimiento de estándares ISO
  - Rastreo de muestras desde recepción hasta entrega

### 7. Reportes y Estadísticas
- **Uso**: Generación de reportes y análisis de datos del laboratorio
- **Beneficio**: Toma de decisiones basada en datos y mejora continua de procesos
- **Casos de uso**:
  - Dashboard con estadísticas de recepciones
  - Análisis de cumplimiento de plazos
  - Reportes de productividad del laboratorio

## TECNOLOGÍAS Y ESTÁNDARES

### Stack Tecnológico:
- **Backend**: FastAPI (Python), PostgreSQL, SQLAlchemy, OpenPyXL, Pydantic
- **Frontend**: React, TypeScript, TailwindCSS, React Hook Form, React Query
- **Infraestructura**: Docker, Docker Compose, Nginx, Redis (opcional)
- **Estándares**: REST API, PWA, Responsive Design

### Cumplimiento Normativo:
- Compatible con normativas técnicas peruanas (NTP)
- Estándares internacionales (ASTM, ACI)
- Formatos de documentación estándar del sector

## VENTAJAS COMPETITIVAS

1. **Automatización Completa**: Elimina trabajo manual repetitivo en el llenado de formularios y generación de documentos
2. **Trazabilidad Total**: Historial completo de todas las operaciones para cumplimiento normativo
3. **Interfaz Moderna**: Diseño intuitivo y responsivo que mejora la experiencia del usuario
4. **Escalabilidad**: Arquitectura preparada para crecer con las necesidades del laboratorio
5. **Mantenibilidad**: Código bien estructurado y documentado para fácil mantenimiento
6. **Flexibilidad**: Sistema adaptable a diferentes flujos de trabajo y requerimientos específicos

---

**Versión**: 1.0.0  
**Estado**: Producción  
**Última actualización**: Enero 2025


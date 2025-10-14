-- Script de inicialización de la base de datos
-- Este archivo se ejecuta automáticamente al crear el contenedor de PostgreSQL

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear esquema si no existe
CREATE SCHEMA IF NOT EXISTS laboratorio;

-- Configurar permisos
GRANT ALL PRIVILEGES ON DATABASE laboratorio_db TO laboratorio_user;
GRANT ALL PRIVILEGES ON SCHEMA laboratorio TO laboratorio_user;

-- Comentarios para documentación
COMMENT ON DATABASE laboratorio_db IS 'Base de datos para sistema de gestión de archivos Excel de laboratorio';

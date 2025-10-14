# Guía de Despliegue

## Despliegue con Docker (Recomendado)

### 1. Preparación del Servidor

#### Requisitos del Sistema
- Ubuntu 20.04+ o CentOS 8+
- Docker 20.10+
- Docker Compose 2.0+
- Mínimo 4GB RAM
- Mínimo 20GB espacio en disco

#### Instalación de Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Configuración del Proyecto

#### Clonar Repositorio
```bash
git clone <repository-url>
cd geocreator
```

#### Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp backend/.env.example backend/.env

# Editar configuración
nano backend/.env
```

**Configuración de Producción:**
```env
# Base de datos
DATABASE_URL=postgresql://laboratorio_user:password_seguro@db:5432/laboratorio_db

# Entorno
ENVIRONMENT=production
DEBUG=False

# Seguridad
SECRET_KEY=clave_super_segura_de_produccion_cambiar_obligatoriamente
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Archivos
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=xlsx,xls

# CORS
CORS_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
```

### 3. Despliegue

#### Construir y Ejecutar
```bash
# Construir imágenes
docker-compose build

# Ejecutar en segundo plano
docker-compose up -d

# Verificar estado
docker-compose ps
```

#### Verificar Despliegue
```bash
# Ver logs
docker-compose logs -f

# Verificar servicios
curl http://localhost/health
curl http://localhost:8000/health
```

### 4. Configuración de Nginx (Producción)

#### Crear Configuración de Nginx
```bash
sudo nano /etc/nginx/sites-available/laboratorio
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Redirección a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # Certificados SSL
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Proxy al contenedor
    location / {
        proxy_pass http://localhost;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Activar Sitio
```bash
sudo ln -s /etc/nginx/sites-available/laboratorio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Configuración de SSL

#### Con Let's Encrypt
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Despliegue Manual (Sin Docker)

### 1. Preparación del Servidor

#### Instalar Dependencias
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.12 python3.12-venv python3-pip postgresql postgresql-contrib nginx nodejs npm

# CentOS/RHEL
sudo yum install python3.12 python3-pip postgresql-server postgresql-contrib nginx nodejs npm
```

### 2. Configuración de Base de Datos

#### PostgreSQL
```bash
# Inicializar base de datos
sudo -u postgres initdb -D /var/lib/pgsql/data

# Crear usuario y base de datos
sudo -u postgres psql
CREATE USER laboratorio_user WITH PASSWORD 'password_seguro';
CREATE DATABASE laboratorio_db OWNER laboratorio_user;
GRANT ALL PRIVILEGES ON DATABASE laboratorio_db TO laboratorio_user;
\q
```

### 3. Despliegue del Backend

#### Configurar Entorno
```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Configurar Variables
```bash
cp .env.example .env
nano .env
```

#### Ejecutar Migraciones
```bash
alembic upgrade head
```

#### Configurar Systemd
```bash
sudo nano /etc/systemd/system/laboratorio-backend.service
```

```ini
[Unit]
Description=Laboratorio Backend
After=network.target

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/path/to/geocreator/backend
Environment=PATH=/path/to/geocreator/backend/venv/bin
ExecStart=/path/to/geocreator/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable laboratorio-backend
sudo systemctl start laboratorio-backend
```

### 4. Despliegue del Frontend

#### Construir Aplicación
```bash
cd frontend
npm install
npm run build
```

#### Configurar Nginx
```bash
sudo nano /etc/nginx/sites-available/laboratorio
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /path/to/geocreator/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoreo y Mantenimiento

### 1. Logs

#### Docker
```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
```

#### Systemd
```bash
# Ver logs del backend
sudo journalctl -u laboratorio-backend -f

# Ver logs de nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. Backup de Base de Datos

#### Script de Backup
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="laboratorio_db"
DB_USER="laboratorio_user"

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Backup de base de datos
pg_dump -h localhost -U $DB_USER $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Comprimir backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Eliminar backups antiguos (más de 30 días)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completado: backup_$DATE.sql.gz"
```

#### Programar Backup
```bash
# Agregar a crontab
crontab -e
# Agregar: 0 2 * * * /path/to/backup.sh
```

### 3. Actualizaciones

#### Docker
```bash
# Actualizar código
git pull origin main

# Reconstruir y reiniciar
docker-compose down
docker-compose build
docker-compose up -d
```

#### Manual
```bash
# Actualizar código
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart laboratorio-backend

# Frontend
cd frontend
npm install
npm run build
sudo systemctl reload nginx
```

## Troubleshooting

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos
```bash
# Verificar estado de PostgreSQL
sudo systemctl status postgresql

# Verificar conexión
psql -h localhost -U laboratorio_user -d laboratorio_db
```

#### 2. Error de Permisos
```bash
# Verificar permisos de archivos
ls -la /path/to/geocreator/

# Corregir permisos
sudo chown -R www-data:www-data /path/to/geocreator/
sudo chmod -R 755 /path/to/geocreator/
```

#### 3. Error de Memoria
```bash
# Verificar uso de memoria
free -h
docker stats

# Aumentar memoria del contenedor
# En docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
```

#### 4. Error de SSL
```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados
sudo certbot renew --dry-run
```

### Comandos de Diagnóstico

```bash
# Estado de servicios
docker-compose ps
sudo systemctl status laboratorio-backend nginx postgresql

# Uso de recursos
docker stats
htop
df -h

# Logs de errores
docker-compose logs --tail=100 backend
sudo journalctl -u laboratorio-backend --since "1 hour ago"
```

## Seguridad

### 1. Firewall
```bash
# Configurar UFW
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 2. Actualizaciones de Seguridad
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade

# Actualizar dependencias
pip install --upgrade -r requirements.txt
npm audit fix
```

### 3. Monitoreo de Seguridad
```bash
# Instalar fail2ban
sudo apt install fail2ban

# Configurar
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

## Escalabilidad

### 1. Load Balancer
```nginx
upstream backend {
    server localhost:8000;
    server localhost:8001;
    server localhost:8002;
}

server {
    location /api/ {
        proxy_pass http://backend;
    }
}
```

### 2. Base de Datos
```bash
# Configurar réplicas de lectura
# En postgresql.conf:
hot_standby = on
max_standby_streaming_delay = 30s
```

### 3. Cache
```bash
# Configurar Redis para cache
# En docker-compose.yml:
services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
```

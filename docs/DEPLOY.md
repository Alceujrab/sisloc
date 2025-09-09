# 🌐 Guia de Deploy - Sistema Locadora

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Deploy Local com PM2](#deploy-local-com-pm2)
- [Deploy em VPS/Cloud](#deploy-em-vpscloud)
- [Deploy com Docker](#deploy-com-docker)
- [Configuração de Domínio](#configuração-de-domínio)
- [SSL/HTTPS](#sslhttps)
- [Monitoramento](#monitoramento)
- [Backup](#backup)

## Pré-requisitos

### Servidor

- Ubuntu 20.04 LTS ou superior
- Mínimo 2GB RAM
- 20GB de armazenamento
- Node.js 18+
- MySQL 8.0+
- Nginx
- Git

### Domínio (opcional)

- Domínio registrado
- DNS configurado

## Deploy Local com PM2

### 1. Instalar PM2

```bash
npm install -g pm2
```

### 2. Configurar Backend

```bash
cd backend

# Criar arquivo de configuração PM2
nano ecosystem.config.js
```

**ecosystem.config.js:**

```javascript
module.exports = {
  apps: [
    {
      name: 'locadora-api',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### 3. Iniciar com PM2

```bash
# Instalar dependências
npm ci --production

# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Salvar configuração PM2
pm2 save
pm2 startup
```

### 4. Build Frontend

```bash
cd ../frontend
npm ci
npm run build

# Servir arquivos estáticos
npm install -g serve
serve -s dist -l 3000
```

## Deploy em VPS/Cloud

### 1. Configurar Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install nginx mysql-server nodejs npm git curl -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Configurar MySQL
sudo mysql_secure_installation
```

### 2. Configurar Banco de Dados

```bash
# Conectar no MySQL
sudo mysql -u root -p

# Criar banco e usuário
CREATE DATABASE locadora_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'locadora'@'localhost' IDENTIFIED BY 'senha_forte';
GRANT ALL PRIVILEGES ON locadora_db.* TO 'locadora'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Importar estrutura
mysql -u locadora -p locadora_db < database/init.sql
```

### 3. Clonar e Configurar Projeto

```bash
# Clonar repositório
cd /var/www
sudo git clone https://github.com/seu-usuario/locadora.git
sudo chown -R $USER:$USER locadora

cd locadora/backend

# Instalar dependências
npm ci --production

# Configurar variáveis de ambiente
cp .env.example .env
nano .env
```

### 4. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/locadora
```

**Configuração Nginx:**

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    
    # Logs
    access_log /var/log/nginx/locadora_access.log;
    error_log /var/log/nginx/locadora_error.log;

    # Frontend
    location / {
        root /var/www/locadora/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Headers de cache
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Admin Panel
    location /admin {
        alias /var/www/locadora/admin/dist;
        try_files $uri $uri/ /admin/index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
```

### 5. Ativar Site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/locadora /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar nginx
sudo systemctl restart nginx

# Habilitar nginx no boot
sudo systemctl enable nginx
```

### 6. Iniciar Backend

```bash
cd /var/www/locadora/backend

# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Configurar PM2 para iniciar no boot
pm2 save
sudo pm2 startup systemd
```

## Deploy com Docker

### 1. Dockerfile Backend

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código
COPY . .

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Alterar propriedade dos arquivos
RUN chown -R backend:nodejs /app
USER backend

EXPOSE 5000

CMD ["npm", "start"]
```

### 2. Dockerfile Frontend

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Build
COPY . .
RUN npm run build

# Produção com Nginx
FROM nginx:alpine

# Copiar arquivos build
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração custom do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: locadora-backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
    depends_on:
      - db
    volumes:
      - ./backend/uploads:/app/uploads
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: locadora-frontend
    ports:
      - "3000:80"
    restart: unless-stopped

  admin:
    build:
      context: ./admin
      dockerfile: Dockerfile
    container_name: locadora-admin
    ports:
      - "3001:80"
    restart: unless-stopped

  db:
    image: mysql:8.0
    container_name: locadora-db
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: locadora-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
      - admin
    restart: unless-stopped

volumes:
  db_data:
```

### 4. Executar com Docker

```bash
# Criar arquivo .env
cp .env.example .env

# Iniciar containers
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar containers
docker-compose down
```

## Configuração de Domínio

### 1. Configurar DNS

No painel do seu provedor de domínio:

```text
Tipo  Nome     Valor
A     @        IP_DO_SERVIDOR
A     www      IP_DO_SERVIDOR
A     admin    IP_DO_SERVIDOR
```

### 2. Atualizar Nginx

```bash
sudo nano /etc/nginx/sites-available/locadora
```

Substituir `seu-dominio.com` pelo domínio real.

## SSL/HTTPS

### 1. Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obter Certificado SSL

```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com -d admin.seu-dominio.com
```

### 3. Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Configurar cron job
sudo crontab -e

# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoramento

### 1. PM2 Monitoring

```bash
# Instalar PM2 Plus
pm2 install pm2-server-monit

# Conectar com PM2 Plus
pm2 link <secret_key> <public_key>

# Ver status
pm2 status
pm2 logs
pm2 monit
```

### 2. Logs do Sistema

```bash
# Nginx logs
sudo tail -f /var/log/nginx/locadora_access.log
sudo tail -f /var/log/nginx/locadora_error.log

# MySQL logs
sudo tail -f /var/log/mysql/error.log

# Sistema
sudo journalctl -u nginx -f
sudo journalctl -u mysql -f
```

### 3. Configurar Alertas

```bash
# Instalar fail2ban
sudo apt install fail2ban -y

# Configurar para nginx
sudo nano /etc/fail2ban/jail.local
```

## Backup

### 1. Script de Backup

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/locadora"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Backup do banco de dados
mysqldump -u locadora -p$DB_PASSWORD locadora_db > $BACKUP_DIR/db_$DATE.sql

# Backup dos uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/locadora/backend/uploads

# Remover backups antigos (manter 7 dias)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 2. Cron Job para Backup

```bash
sudo crontab -e

# Backup diário às 2h da manhã
0 2 * * * /path/to/backup.sh
```

### 3. Restore do Backup

```bash
# Restaurar banco
mysql -u locadora -p locadora_db < backup_file.sql

# Restaurar uploads
tar -xzf uploads_backup.tar.gz -C /
```

## Troubleshooting

### Problemas Comuns

1. **Erro 502 Bad Gateway**
   - Verificar se backend está rodando: `pm2 status`
   - Verificar logs: `pm2 logs`

2. **Erro de Conexão com Banco**
   - Verificar credenciais no .env
   - Verificar se MySQL está rodando: `sudo systemctl status mysql`

3. **Arquivos Estáticos não Carregam**
   - Verificar permissões: `sudo chown -R www-data:www-data /var/www/locadora`
   - Verificar configuração nginx

4. **SSL não Funciona**
   - Verificar certificado: `sudo certbot certificates`
   - Renovar se necessário: `sudo certbot renew`

### Comandos Úteis

```bash
# Status dos serviços
sudo systemctl status nginx mysql

# Logs em tempo real
pm2 logs --lines 50

# Reiniciar aplicação
pm2 restart all

# Verificar uso de recursos
htop
df -h
free -m

# Testar conectividade
curl -I http://localhost:5000/api/health
```

---

Deploy realizado com sucesso! 🚀

## Deploy gratuito (Render + PlanetScale) 🚀

Esta opção usa camadas free para testar tudo online sem custos.

1) Banco de Dados (PlanetScale)
- Crie uma conta em planetscale.com
- Crie um banco (MySQL compatível)
- Gere uma string de conexão (username/password) para produção
- Anote a DATABASE_URL no formato: mysql://user:pass@host:3306/dbname

2) Backend no Render
- Adicione o arquivo render.yaml na raiz (já incluído neste repositório)
- Faça login em render.com e clique em New + From Repo
- Selecione o seu repositório e confirme a detecção do "locadora-backend" (Node)
- Nas env vars do serviço backend defina:
  - NODE_ENV=production
  - PORT=5000
  - DB_DIALECT=mysql
  - DB_USE_URL=true
  - DATABASE_URL={sua URL do PlanetScale}
  - DB_SSL=true
  - DB_SSL_REJECT_UNAUTHORIZED=false
  - JWT_SECRET={um segredo forte}
  - FRONTEND_URL={URL do site do cliente}
  - ADMIN_URL={URL do painel admin}
  - (opcional) SMTP_* e WhatsApp_* conforme seu provedor

3) Frontend e Admin no Render (Static Sites)
- Crie 2 serviços Static Site a partir das pastas frontend/ e admin/
- Configure as variáveis de ambiente:
  - VITE_API_URL=https://SEU-BACKEND.onrender.com/api
- Render fará o build (npm ci && npm run build) e publicará dist/

4) Testes rápidos
- Acesse https://SEU-BACKEND.onrender.com/api/health e verifique o JSON de status
- Faça uma reserva de teste e confira as notificações
- Abra o Admin e o Frontend pelas URLs públicas

Observações
- O Render free pode hibernar após inatividade; primeira chamada pode ser mais lenta
- Se usar SMTP corporativo, garanta que o host/porta não estejam atrás de proxy (sem Cloudflare no host de e-mail)
- Para WhatsApp Cloud API, preencha META_WABA_ACCESS_TOKEN e META_WABA_PHONE_NUMBER_ID

## Alternativa gratuita: Neon (Postgres) + Render

Se o PlanetScale só mostrar opções pagas, use o Neon (Postgres) no plano Free.

Passos rápidos

1. Acesse o site do Neon: <https://neon.tech> e crie uma conta (Free tier).
2. Crie um Project e copie a Connection string (postgres://...).
3. No serviço backend do Render, ajuste as variáveis de ambiente:

- DB_USE_URL=true
- DATABASE_URL=postgres://USER:PASS@HOST:5432/DB
- DB_SSL=true
- DB_SSL_REJECT_UNAUTHORIZED=false

1. Faça o deploy. O backend detecta Postgres automaticamente.
1. Valide em /api/health e rode o smoke test.

Notas

- Em dev sem DATABASE_URL, usamos SQLite automaticamente.
- Para criar o schema no Postgres, use as migrations ou `sequelize.sync({ alter: true })` (em DEV já está habilitado).


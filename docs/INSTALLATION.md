# 🚗 Sistema Completo de Locação de Veículos

## 📋 Sumário
- [Visão Geral](#visão-geral)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Como Executar](#como-executar)
- [API Documentation](#api-documentation)
- [Deploy](#deploy)
- [Funcionalidades](#funcionalidades)
- [Contribuição](#contribuição)

## 🎯 Visão Geral

Sistema completo para locação de veículos desenvolvido com tecnologias modernas, incluindo website frontend para clientes e painel administrativo para gestão interna.

### Principais Características
- ✅ Website responsivo para clientes
- ✅ Painel administrativo completo
- ✅ API RESTful robusta
- ✅ Sistema de autenticação JWT
- ✅ Integração com pagamentos (Stripe)
- ✅ Gestão completa de veículos e reservas
- ✅ Dashboard com estatísticas em tempo real

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MySQL** - Banco de dados
- **Sequelize** - ORM
- **JWT** - Autenticação
- **Stripe** - Pagamentos
- **Bcrypt** - Criptografia de senhas
- **Multer** - Upload de arquivos
- **Nodemailer** - Envio de emails

### Frontend
- **React 18** - Biblioteca JavaScript
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **React Router** - Roteamento
- **React Query** - Gerenciamento de estado server
- **React Hook Form** - Formulários
- **Framer Motion** - Animações
- **Lucide React** - Ícones

### Ferramentas de Desenvolvimento
- **ESLint** - Linting
- **Prettier** - Formatação de código
- **Jest** - Testes
- **Git** - Controle de versão

## 📁 Estrutura do Projeto

```
Locadora/
├── backend/              # API Node.js + Express
│   ├── src/
│   │   ├── config/      # Configurações (DB, etc)
│   │   ├── models/      # Modelos Sequelize
│   │   ├── routes/      # Rotas da API
│   │   ├── middleware/  # Middlewares
│   │   └── utils/       # Utilitários
│   ├── uploads/         # Arquivos enviados
│   ├── .env.example     # Exemplo de variáveis de ambiente
│   ├── package.json
│   └── server.js        # Entrada da aplicação
├── frontend/            # Website React (Clientes)
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas
│   │   ├── context/     # Contextos React
│   │   ├── services/    # Serviços API
│   │   └── utils/       # Utilitários
│   ├── public/          # Arquivos públicos
│   ├── .env.example     # Exemplo de variáveis de ambiente
│   └── package.json
├── admin/               # Painel Admin React
│   ├── src/
│   │   ├── components/  # Componentes admin
│   │   ├── pages/       # Páginas admin
│   │   └── ...
│   └── package.json
├── database/            # Scripts SQL
│   ├── init.sql         # Inicialização do banco
│   └── seeds.sql        # Dados de exemplo
├── docs/                # Documentação
│   ├── API.md           # Documentação da API
│   ├── DEPLOY.md        # Guia de deploy
│   └── CONTRIBUTING.md  # Guia de contribuição
└── README.md            # Este arquivo
```

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+ 
- MySQL 8.0+
- Git

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/locadora.git
cd locadora
```

### 2. Instalar Dependências

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd ../frontend
npm install
```

#### Admin (opcional)
```bash
cd ../admin
npm install
```

## ⚙️ Configuração

### 1. Banco de Dados
```bash
# Criar banco de dados MySQL
mysql -u root -p
CREATE DATABASE locadora_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Executar script de inicialização
mysql -u root -p locadora_db < database/init.sql
```

### 2. Variáveis de Ambiente

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Editar o arquivo `.env`:
```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=3306
DB_NAME=locadora_db
DB_USER=root
DB_PASSWORD=sua_senha

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app

# Configurações
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```bash
cd ../frontend
cp .env.example .env
```

Editar o arquivo `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica
VITE_GOOGLE_MAPS_API_KEY=sua_chave_google_maps
```

## 🏃‍♂️ Como Executar

### Desenvolvimento

#### 1. Iniciar Backend
```bash
cd backend
npm run dev
```
Servidor rodando em: http://localhost:5000

#### 2. Iniciar Frontend
```bash
cd frontend
npm run dev
```
Website rodando em: http://localhost:3000

#### 3. Iniciar Admin (opcional)
```bash
cd admin
npm run dev
```
Admin rodando em: http://localhost:3001

### Produção
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
npm run preview

# Admin
cd admin
npm run build
npm run preview
```

## 📚 API Documentation

### Autenticação
Todas as rotas protegidas requerem header:
```
Authorization: Bearer <jwt_token>
```

### Principais Endpoints

#### Autenticação
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Perfil do usuário
- `PUT /api/auth/profile` - Atualizar perfil
- `POST /api/auth/change-password` - Alterar senha

#### Veículos
- `GET /api/vehicles` - Listar veículos (com filtros)
- `GET /api/vehicles/:id` - Detalhes do veículo
- `GET /api/vehicles/featured` - Veículos em destaque
- `GET /api/vehicles/:id/availability` - Verificar disponibilidade

#### Reservas
- `POST /api/reservations` - Criar reserva
- `GET /api/reservations` - Listar reservas do usuário
- `GET /api/reservations/:id` - Detalhes da reserva
- `PUT /api/reservations/:id/cancel` - Cancelar reserva
- `POST /api/reservations/:id/review` - Avaliar reserva

#### Pagamentos
- `POST /api/payments/create-payment-intent` - Criar intenção de pagamento
- `POST /api/payments/confirm-payment` - Confirmar pagamento
- `GET /api/payments/history` - Histórico de pagamentos

#### Admin (Requer role admin/employee)
- `GET /api/admin/dashboard` - Estatísticas do dashboard
- `GET /api/admin/vehicles` - Gestão de veículos
- `POST /api/admin/vehicles` - Criar veículo
- `PUT /api/admin/vehicles/:id` - Atualizar veículo
- `DELETE /api/admin/vehicles/:id` - Excluir veículo
- `GET /api/admin/reservations` - Gestão de reservas
- `PUT /api/admin/reservations/:id/status` - Atualizar status

### Códigos de Resposta
- `200` - Sucesso
- `201` - Criado
- `400` - Requisição inválida
- `401` - Não autorizado
- `403` - Proibido
- `404` - Não encontrado
- `500` - Erro interno

## 🌐 Deploy

### Deploy com PM2 (Recomendado)

#### 1. Instalar PM2
```bash
npm install -g pm2
```

#### 2. Configurar Backend
```bash
cd backend
npm run build
pm2 start ecosystem.config.js
```

#### 3. Configurar Frontend
```bash
cd frontend
npm run build

# Servir com nginx ou apache
# Ou usar serve
npm install -g serve
serve -s dist -l 3000
```

### Deploy no AWS/Digital Ocean

#### 1. Configurar Servidor
```bash
# Instalar dependências no servidor
sudo apt update
sudo apt install nginx mysql-server nodejs npm

# Configurar MySQL
sudo mysql_secure_installation

# Configurar Nginx
sudo nano /etc/nginx/sites-available/locadora
```

#### 2. Configuração Nginx
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        root /var/www/locadora/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Admin
    location /admin {
        root /var/www/locadora/admin/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Deploy com Docker

#### 1. Dockerfile (Backend)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

#### 2. Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: senha_root
      MYSQL_DATABASE: locadora_db
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

## ✨ Funcionalidades

### Website Cliente
- 🏠 **Página Inicial** - Hero section, busca, veículos em destaque
- 🚗 **Catálogo de Veículos** - Listagem com filtros avançados
- 📅 **Sistema de Reserva** - Processo passo a passo
- 👤 **Área do Cliente** - Perfil, reservas, favoritos
- 💳 **Pagamentos** - Integração completa com Stripe
- 📱 **Responsivo** - Funciona em todos os dispositivos

### Painel Administrativo  
- 📊 **Dashboard** - Estatísticas e gráficos em tempo real
- 🚙 **Gestão de Veículos** - CRUD completo com upload de imagens
- 📋 **Gestão de Reservas** - Controle total do processo
- 👥 **Gestão de Clientes** - Base de dados completa
- 💰 **Relatórios Financeiros** - Controle de receitas
- ⚙️ **Configurações** - Personalização do sistema

### Recursos Técnicos
- 🔐 **Autenticação JWT** - Segurança robusta
- 🛡️ **Validação de Dados** - Server e client side
- 📱 **API RESTful** - Bem documentada e testada
- 🎨 **UI/UX Moderna** - Interface intuitiva
- ⚡ **Performance Otimizada** - Carregamento rápido
- 🔍 **SEO Friendly** - Otimização para buscadores

## 🤝 Contribuição

### Como Contribuir
1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

### Padrões de Código
- Use ESLint e Prettier
- Escreva testes para novas funcionalidades
- Documente mudanças importantes
- Siga os padrões de commit convencionais

### Reportar Bugs
- Use as issues do GitHub
- Inclua passos para reproduzir
- Mencione versão e ambiente
- Adicione screenshots se aplicável

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- 📧 Email: contato@locadora.com
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/locadora/issues)
- 📖 Documentação: [Wiki](https://github.com/seu-usuario/locadora/wiki)

---

**Desenvolvido com ❤️ para facilitar a locação de veículos**

# Sistema Completo de Locação de Veículos

## Visão Geral
Sistema completo para locação de veículos com website frontend para clientes e painel administrativo backend para gestão.

## Tecnologias Utilizadas

### Frontend
- React.js 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- React Hook Form
- React Query
- Lucide Icons

### Backend
- Node.js
- Express.js
- MySQL
- Sequelize ORM
- JWT Authentication
- Bcrypt
- Multer (upload de arquivos)
- Nodemailer

### Integrações
- Stripe (Pagamentos)
- Google Maps API
- AWS S3 (Armazenamento)

## Estrutura do Projeto

```
Locadora/
├── backend/          # API Node.js + Express
├── frontend/         # React App
├── database/         # Scripts SQL
└── docs/            # Documentação
```

## Como Executar

### Backend
1. `cd backend`
2. `npm install`
3. Configure o arquivo `.env`
4. `npm run dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. Configure as variáveis de ambiente
4. `npm run dev`

### Admin (Painel Administrativo)

1. `cd admin`
2. `npm install`
3. Configure as variáveis de ambiente (`.env` com VITE_API_URL)
4. `npm run dev` (porta 3001)

Mais detalhes em `docs/INSTALLATION.md` e `docs/DEPLOY.md`.

## Funcionalidades

### Website Cliente

- ✅ Página inicial com busca avançada
- ✅ Catálogo de veículos com filtros
- ✅ Sistema de reserva completo
- ✅ Área do cliente
- ✅ Sistema de pagamento
- ✅ Blog/conteúdo

### Painel Administrativo

- ✅ Dashboard com estatísticas
- ✅ Gestão de veículos
- ✅ Gestão de reservas
- ✅ Gestão de clientes
- ✅ Relatórios financeiros
- ✅ Configurações do sistema

## Licença

MIT License

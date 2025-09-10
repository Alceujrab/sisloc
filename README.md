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

### Backend (Dev)

- Node.js
- Express.js
- MySQL / Postgres (atual produção)
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

```text
Locadora/
├── backend/          # API Node.js + Express
├── frontend/         # React App
├── database/         # Scripts SQL
└── docs/            # Documentação
```

## Como Executar (Desenvolvimento)

### Backend

1. `cd backend`
2. `npm install`
3. Configure o arquivo `.env`
4. `npm run dev`

### Frontend (Dev)

1. `cd frontend`
2. `npm install`
3. Configure as variáveis de ambiente
4. `npm run dev`

### Admin (Painel Administrativo)


1. `cd admin`
2. `npm install`
3. Configure as variáveis de ambiente (`.env` com VITE_API_URL)
4. `npm run dev` (porta 3001)

Mais detalhes em `docs/INSTALLATION.md`. O guia de deploy agora foca em cPanel/aplicação unificada (ver seção abaixo).

## Deploy em Produção (cPanel)

Esta aplicação está configurada para rodar em um ambiente cPanel usando Passenger (Node.js App) servindo API + SPAs (frontend e admin) a partir de um único backend.

URLs de produção (exemplo real):

- API Health: `https://rent.cfauto.com.br/api/health`
- Frontend: `https://rent.cfauto.com.br/`
- Admin: `https://rent.cfauto.com.br/admin`

Pipeline automatizado: arquivo `.cpanel.yml` na raiz executa:

1. Ativa ambiente Node da hospedagem
2. Instala dependências do backend (modo produção)
3. Faz build das SPAs (`frontend` e `admin`)
4. Copia bundles para `backend/public/frontend` e `backend/public/admin`
5. Reinicia Passenger (touch em `backend/tmp/restart.txt`)

Variáveis de ambiente mínimas no cPanel (Node App):

- `DATABASE_URL` (Postgres/MySQL - usamos Postgres em produção)
- `DB_USE_URL=true`
- `DB_SSL=true` e `DB_SSL_REJECT_UNAUTHORIZED=false` (para Neon/Render/hosts gerenciados)
- `JWT_SECRET` (segredo forte)
- `FRONTEND_URL` (ex: <https://rent.cfauto.com.br>)
- `ADMIN_URL` (ex: <https://rent.cfauto.com.br/admin>)
- `CORS_ORIGINS` (lista separada por vírgula, incluir os dois acima)
- `ADMIN_INVITE_TTL=2d`
- (opcionais) SMTP_*, META_WABA_*, STRIPE_* etc.

Fluxo de atualização:

1. `git push` para `main`
2. No cPanel: “Update from Remote” → “Deploy HEAD Commit”
3. Verificar log do deploy (builds e reinício)
4. Testar `/api/health`

O arquivo `render.yaml` permanece apenas como legado (não usado).

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

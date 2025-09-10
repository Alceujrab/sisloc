const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
const { sequelize } = require('./config/database');

const app = express();

// Middlewares de segurança
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Muitas tentativas. Tente novamente em 15 minutos.' });
app.use('/api/', limiter);

// CORS
const defaultOrigins = [
  'http://localhost:3000','http://localhost:3001','http://localhost:3002','http://localhost:3003',
  'http://127.0.0.1:3000','http://127.0.0.1:3001','http://127.0.0.1:3002','http://127.0.0.1:3003',
  // Vite dev servers (frontend/admin)
  'http://localhost:5173','http://localhost:5174','http://localhost:5175',
  'http://127.0.0.1:5173','http://127.0.0.1:5174','http://127.0.0.1:5175'
];
const envOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean);
const configuredOrigins = [process.env.FRONTEND_URL, process.env.ADMIN_URL, ...envOrigins].filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    try { const u = new URL(origin); const base = `${u.protocol}//${u.hostname}:${u.port}`; if (allowedOrigins.includes(base)) return cb(null, true); } catch(_) {}
    return cb(new Error(`CORS bloqueado para origem: ${origin}`));
  },
  credentials: true,
  allowedHeaders: ['Content-Type','Authorization'],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Estáticos
app.use('/uploads', express.static('uploads'));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/public', require('./routes/public'));

// Health
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'API da Locadora funcionando!', timestamp: new Date().toISOString() }));

// Debug (apenas quando EXPOSE_ERRORS=true)
if (process.env.EXPOSE_ERRORS === 'true') {
  app.get('/api/debug/env-safe', (req, res) => {
    const safe = {
      nodeEnv: process.env.NODE_ENV,
      adminUrl: process.env.ADMIN_URL,
      frontendUrl: process.env.FRONTEND_URL,
      corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean),
      db: {
        dialect: sequelize.getDialect && sequelize.getDialect(),
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        ssl: process.env.DB_SSL,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED
      }
    };
    res.json({ success: true, data: safe });
  });

  app.get('/api/debug/db-check', async (req, res) => {
    try {
      await sequelize.authenticate();
      res.json({ success: true, message: 'DB OK' });
    } catch (e) {
      res.status(500).json({ success: false, message: 'DB FAIL', error: String(e?.message || e) });
    }
  });
}

// Errors
// Servir SPAs (builds copiados para backend/public/* pelo deploy)
const publicRoot = path.join(__dirname, '..', 'public');
const frontendDir = path.join(publicRoot, 'frontend');
const adminDir = path.join(publicRoot, 'admin');

// Estáticos diretos das pastas
if (process.env.SERVE_SPA !== 'false') { // flag opcional para desativar
  app.use(express.static(frontendDir));
  app.use('/admin', express.static(adminDir));

  // Fallback admin SPA
  app.get('/admin/*', (req, res, next) => {
    if (req.path.startsWith('/admin/api')) return next();
    return res.sendFile(path.join(adminDir, 'index.html'), (err) => { if (err) next(); });
  });

  // Fallback frontend SPA (rota não-API e não /admin)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/admin')) return next();
    return res.sendFile(path.join(frontendDir, 'index.html'), (err) => { if (err) next(); });
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro:', err.stack);
  const expose = process.env.EXPOSE_ERRORS === 'true' || process.env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    ...(expose && { error: err.message, stack: err.stack })
  });
});

// 404 JSON (se nada atendeu e não caiu em fallback)
app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Rota não encontrada' }));

module.exports = app;

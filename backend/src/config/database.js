const { Sequelize } = require('sequelize');
const path = require('path');

// Configuração do banco de dados com suporte a SQLite (dev), MySQL e Postgres
// Em produção, padronizamos Postgres (Neon) para evitar fallback acidental para MySQL
const defaultDialect = process.env.NODE_ENV === 'development' ? 'sqlite' : 'postgres';

// Detecta dialect com prioridade: schema da DATABASE_URL > DB_DIALECT > default
function detectDialect() {
  const url = process.env.DATABASE_URL || '';
  try {
    if (url) {
      const u = new URL(url);
      // exemplos: mysql://, mysql2://, postgres://, postgresql://
      const scheme = (u.protocol || '').replace(':', '').toLowerCase();
      if (scheme.startsWith('postgres')) return 'postgres';
      if (scheme.startsWith('mysql')) return 'mysql';
    }
  } catch (_) {
    // URL inválida, ignora
  }
  const envDialect = (process.env.DB_DIALECT || '').toLowerCase();
  if (envDialect) return envDialect;
  return defaultDialect;
}

const DIALECT = detectDialect();

// Sanitiza a URL do banco para casos comuns (Neon):
// - remove prefixo "psql " e aspas
// - remove o parâmetro "channel_binding"
function sanitizeDatabaseUrl(raw) {
  if (!raw) return raw;
  let s = String(raw).trim();
  const lower = s.toLowerCase();
  if (lower.startsWith('psql ')) s = s.slice(5).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  try {
    const u = new URL(s);
    if (u.searchParams.has('channel_binding')) {
      u.searchParams.delete('channel_binding');
    }
    return u.toString();
  } catch (_) {
    // Fallback simples
    return s.replace(/&?channel_binding=require/g, '');
  }
}

function shouldUseSsl(url, dialect) {
  try {
    if (!url) return (process.env.DB_SSL || '').toLowerCase() === 'true' || process.env.DB_SSL === '1';
    const u = new URL(url);
    const sslmode = (u.searchParams.get('sslmode') || '').toLowerCase();
    if (sslmode === 'require') return true;
    if (dialect === 'postgres' && (u.hostname || '').includes('neon.tech')) return true;
  } catch (_) {}
  return (process.env.DB_SSL || '').toLowerCase() === 'true' || process.env.DB_SSL === '1';
}

function getRejectUnauthorizedDefault(url) {
  const env = process.env.DB_SSL_REJECT_UNAUTHORIZED;
  if (typeof env === 'string') return env.toLowerCase() !== 'false';
  try {
    const u = new URL(url);
    if ((u.hostname || '').includes('neon.tech')) return false; // Neon costuma exigir false em ambientes gerenciados
  } catch (_) {}
  return true;
}

let sequelize;
if (DIALECT === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.SQLITE_STORAGE || path.resolve(__dirname, '../../../database/dev.sqlite'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: true,
      timestamps: true,
      paranoid: true
    }
  });
} else {
  // Aviso útil em produção quando faltar DATABASE_URL
  if (process.env.NODE_ENV !== 'development' && !process.env.DATABASE_URL) {
    console.error('[DB] DATABASE_URL não definido. Defina a URL do Postgres (Neon) no Render com sslmode=require.');
  }
  const useUrl = !!process.env.DATABASE_URL && (process.env.DB_USE_URL || 'true') !== 'false';
  const logging = process.env.NODE_ENV === 'development' ? console.log : false;
  const pool = { max: 5, min: 0, acquire: 30000, idle: 10000 };
  const define = { underscored: true, timestamps: true, paranoid: true };

  // Opções específicas por dialect
  const dialectOptions = {};
  if (DIALECT === 'mysql') {
    dialectOptions.charset = 'utf8mb4';
    dialectOptions.collate = 'utf8mb4_unicode_ci';
  }

  if (useUrl) {
    const rawUrl = process.env.DATABASE_URL;
    const sanitizedUrl = sanitizeDatabaseUrl(rawUrl);
    const useSsl = shouldUseSsl(sanitizedUrl, DIALECT);
    if (useSsl) {
      const rejectUnauthorized = getRejectUnauthorizedDefault(sanitizedUrl);
      dialectOptions.ssl = { require: true, rejectUnauthorized };
    }
    sequelize = new Sequelize(sanitizedUrl, { dialect: DIALECT, logging, pool, dialectOptions, define });
  } else {
    // Configuração manual por variáveis individuais
    const defaults = DIALECT === 'postgres'
      ? { port: 5432, username: 'postgres', database: 'locadora_db' }
      : { port: 3306, username: 'root', database: 'locadora_db' };

    // SSL genérico (MySQL e Postgres) quando não usa URL
    const useSsl = (process.env.DB_SSL || '').toLowerCase() === 'true' || process.env.DB_SSL === '1';
    if (useSsl) {
      const rejectUnauthorized = (process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false';
      dialectOptions.ssl = { require: true, rejectUnauthorized };
    }

    sequelize = new Sequelize({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || defaults.port, 10),
      database: process.env.DB_NAME || defaults.database,
      username: process.env.DB_USER || defaults.username,
      password: process.env.DB_PASSWORD || '',
      dialect: DIALECT,
      logging,
      pool,
      dialectOptions,
      define
    });
  }
}

module.exports = { sequelize };

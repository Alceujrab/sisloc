/*
  Smoke test simples para verificar endpoints principais do backend.
  Endpoints verificados:
  - GET /api/health
  - GET /api/public/groups
  - GET /api/public/group-minimums
*/

const http = require('http');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5000';
const MAX_RETRIES = parseInt(process.env.SMOKE_MAX_RETRIES || '30', 10);
const RETRY_DELAY_MS = parseInt(process.env.SMOKE_RETRY_DELAY_MS || '1000', 10);

function get(path) {
  return new Promise((resolve) => {
    const req = http.get(`${BASE}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ ok: true, status: res.statusCode, body: json });
        } catch (e) {
          resolve({ ok: res.statusCode === 200, status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', (err) => resolve({ ok: false, status: 0, error: err.message }));
    req.setTimeout(8000, () => {
      req.destroy(new Error('timeout'));
    });
  });
}

(async () => {
  // Aguardar servidor responder ao health com retries com logs progressivos
  let health;
  for (let i = 0; i < MAX_RETRIES; i++) {
    health = await get('/api/health');
    if (health.ok) break;
    console.log(`[SMOKE] aguardando health... tentativa ${i + 1}/${MAX_RETRIES} (status: ${health.status || 'ERR'})`);
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  }

  let groups = { ok: false };
  let minimums = { ok: false };

  if (health?.ok) {
    // Após health OK, fazer 3 tentativas leves para groups/minimums
    for (let i = 0; i < 3 && !groups.ok; i++) {
      groups = await get('/api/public/groups');
      if (!groups.ok) await new Promise((r) => setTimeout(r, 500));
    }
    for (let i = 0; i < 3 && !minimums.ok; i++) {
      minimums = await get('/api/public/group-minimums');
      if (!minimums.ok) await new Promise((r) => setTimeout(r, 500));
    }
  }

  const summary = {
    health: health?.ok ? 'OK' : `FAIL (${health?.status || 0})`,
    groupsCount: (() => {
      if (!groups.ok || !groups.body) return 'n/a';
      const d = groups.body.data;
      if (Array.isArray(d)) return d.length;
      if (d && Array.isArray(d.groups)) return d.groups.length;
      return 'n/a';
    })(),
    minimumsCount:
      minimums.ok && minimums.body && minimums.body.data && minimums.body.data.minimums
        ? minimums.body.data.minimums.length
        : 'n/a',
  };

  console.log('[SMOKE] summary:', summary);

  if (!health?.ok) {
    console.error('[SMOKE] /api/health error:', health);
  }
  if (!groups.ok) {
    console.error('[SMOKE] /api/public/groups error:', groups);
  }
  if (!minimums.ok) {
    console.error('[SMOKE] /api/public/group-minimums error:', minimums);
  }

  // Detalhe opcional curto para inspeção manual
  if (groups.ok) {
  const d = groups.body?.data;
  const arr = Array.isArray(d) ? d : (d?.groups || []);
  console.log('[SMOKE] groups sample:', Array.isArray(arr) ? arr.slice(0, 2) : d);
  }
  if (minimums.ok) {
    const mins = minimums.body.data?.minimums || [];
    console.log('[SMOKE] minimums sample:', mins.slice(0, 2));
  }

  // Exit code para automação
  const success = health?.ok && groups.ok && minimums.ok;
  process.exit(success ? 0 : 1);
})();

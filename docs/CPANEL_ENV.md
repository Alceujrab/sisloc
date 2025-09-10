# Variáveis de Ambiente (cPanel)

Este projeto agora está hospedado **exclusivamente no cPanel**. O arquivo `render.yaml` foi marcado como legado e não é usado.

## Principais Variáveis

| Variável | Obrigatória | Exemplo / Valor | Observação |
|----------|-------------|-----------------|------------|
| NODE_ENV | sim | production | Garante otimizações de produção. |
| DATABASE_URL | sim | `postgresql://usuario:senha@host/db?sslmode=require` | Usada quando `DB_USE_URL=true`. Manter `sslmode=require`. |
| DB_USE_URL | sim | true | Faz o código usar `DATABASE_URL`. |
| DB_DIALECT | sim | postgres | Força Sequelize a usar Postgres. |
| DB_SSL | sim | true | Ativa SSL. |
| DB_SSL_REJECT_UNAUTHORIZED | sim | false | Necessário para Neon (cert self-managed). |
| FRONTEND_URL | sim | <https://rent.cfauto.com.br> | Usado em CORS. |
| ADMIN_URL | sim | <https://rent.cfauto.com.br/admin> | Usado em CORS. (Fallback para `AADMIN_URL`). |
| CORS_ORIGINS | opcional | `https://rent.cfauto.com.br,https://rent.cfauto.com.br/admin` | Pode listar adicionais separados por vírgula. |
| JWT_SECRET | sim | (string forte) | Segurança dos tokens. |
| ADMIN_INVITE_TTL | sim | 2d | Validade dos convites admin. |
| EXPOSE_ERRORS | opcional | false | Coloque `true` temporariamente para debugar. |
| ADMIN_EMAIL | opcional | (seeding) | Usado em scripts de seed (não no fluxo de convite). |
| ADMIN_PASSWORD | opcional | (seeding) | Idem acima. |

## Correção de Erro de Digitação

Se o painel tiver salvo `AADMIN_URL` em vez de `ADMIN_URL`, o backend agora corrige em runtime:

```js
if (!process.env.ADMIN_URL && process.env.AADMIN_URL) {
  process.env.ADMIN_URL = process.env.AADMIN_URL;
}
```

Recomenda-se ainda assim corrigir manualmente no cPanel quando possível (renomear para `ADMIN_URL`).

## Ordem de Resolução de CORS

1. FRONTEND_URL
2. ADMIN_URL (ou AADMIN_URL se presente e ADMIN_URL ausente)
3. CORS_ORIGINS (split por vírgula)
4. Origins de desenvolvimento (localhost/127.0.0.1)

## Deploy

O `.cpanel.yml` executa:

1. Ativa ambiente Node.
2. `npm ci` backend (omit dev).
3. `npm ci && npm run build` frontend e admin.
4. Copia `frontend/dist` → `backend/public/frontend` e `admin/dist` → `backend/public/admin`.
5. Reinicia Passenger.

## Testes Rápidos Pós-Deploy

- Health: `GET /api/health` → status OK.
- SPA pública: `/` carrega index.
- Admin: `/admin` carrega index admin.
- CORS: sem erros no console ao logar.

## Segurança

- Alterar `JWT_SECRET` periodicamente.
- Nunca expor `EXPOSE_ERRORS=true` em produção prolongada.
- Usar convites para novos admins (endpoint `/api/auth/admin-invite`).

---

Atualize este documento se novas variáveis forem introduzidas.

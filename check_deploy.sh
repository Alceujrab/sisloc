#!/bin/bash
set -e

APP_ROOT="/home/cfauto/rent.cfauto.com.br"
NODE_VENV="/home/cfauto/nodevenv/rent.cfauto.com.br/backend/20"
ACTIVATE="$NODE_VENV/bin/activate"

echo "== PATH ATUAL =="
pwd

echo "== Verificando se estamos no diretório raiz esperado =="
if [ "$(pwd)" != "$APP_ROOT" ]; then
  echo "ERRO: rode no diretório $APP_ROOT"
  exit 1
fi

echo "== Git status =="
git status --short || true

echo "== HEAD commit =="
git --no-pager log -n1 --oneline --decorate

echo "== Arquivos críticos =="
for f in .cpanel.yml backend/server.js backend/src/app.js admin/package.json frontend/package.json docs/DEPLOY.md; do
  if [ -e "$f" ]; then
    echo "[OK] $f"
  else
    echo "[FALTA] $f"
  fi
done

echo "== Carregando ambiente Node (se existir) =="
if [ -f "$ACTIVATE" ]; then
  # shellcheck disable=SC1090
  . "$ACTIVATE"
  echo "Node: $(node -v)"
  echo "NPM: $(npm -v)"
else
  echo "AVISO: Activate não encontrado em $ACTIVATE"
fi

echo "== Validando sintaxe de server.js =="
node -c backend/server.js && echo "Sintaxe OK"

echo "== Verificando build estático =="
FRONT_IDX="backend/public/frontend/index.html"
ADMIN_IDX="backend/public/admin/index.html"
[ -f "$FRONT_IDX" ] && echo "[OK] $FRONT_IDX" || echo "[FALTANDO] $FRONT_IDX"
[ -f "$ADMIN_IDX" ] && echo "[OK] $ADMIN_IDX" || echo "[FALTANDO] $ADMIN_IDX"

echo "== Checando variáveis de ambiente essenciais =="
for v in DATABASE_URL FRONTEND_URL ADMIN_URL CORS_ORIGINS JWT_SECRET DB_USE_URL DB_SSL DB_SSL_REJECT_UNAUTHORIZED ADMIN_INVITE_TTL; do
  printf "%-28s: %s\n" "$v" "${!v:-<vazia>}"
done

echo "== Reiniciando Passenger (forçando reload) =="
mkdir -p backend/tmp
touch backend/tmp/restart.txt

echo "Aguardando 5s para aplicação subir..."
sleep 5

HEALTH_URL="${FRONTEND_URL%/}/api/health"
echo "== Testando health: $HEALTH_URL =="
if command -v curl >/dev/null 2>&1; then
  curl -ks -m 10 "$HEALTH_URL" || echo "Falha curl"
else
  echo "curl não disponível"
fi

echo "== Busca por erros recentes em logs (se existir passenger.log) =="
LOGFILE="backend/passenger.log"
[ -f "$LOGFILE" ] && tail -n 40 "$LOGFILE" || echo "Sem passenger.log"

echo "== Verificando CORS_ORIGINS (somente domínio raiz) =="
if echo "$CORS_ORIGINS" | grep -q "/admin"; then
  echo "AVISO: Remova '/admin' de CORS_ORIGINS (use só a origem base)."
fi

echo "== DIFERENÇAS LOCAIS (devia estar limpo) =="
git diff --name-only || true

echo "== FINALIZADO =="
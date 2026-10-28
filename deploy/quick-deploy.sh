#!/bin/bash
# Atualiza o código já existente na VPS e reinicia o serviço.
# Uso:  cd /home/ubuntu/my-life360 && bash deploy/quick-deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/my-life360}"
BRANCH="${BRANCH:-main}"

echo "=== ATUALIZANDO MY LIFE360 NA VPS ==="

cd "$APP_DIR"

# Traz a versão mais recente do repositório (não sobrescreve .env, que é ignorado)
git fetch --quiet origin
git checkout --quiet "$BRANCH"
git pull --quiet --ff-only origin "$BRANCH"
echo "Commit atual: $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

cd "$APP_DIR/server"

# Instala dependências e compila
npm ci --no-audit --no-fund
export DATABASE_URL="file:./prod.db"
npx prisma generate
npx prisma db push --skip-generate
npm run build

# Reinicia via PM2 usando o ecosystem do projeto
PM2_BIN="$(command -v pm2 2>/dev/null || echo "pm2")"
if "$PM2_BIN" describe my-life360-server >/dev/null 2>&1; then
  "$PM2_BIN" reload "$APP_DIR/deploy/ecosystem.config.cjs" --update-env
else
  "$PM2_BIN" start "$APP_DIR/deploy/ecosystem.config.cjs"
fi
"$PM2_BIN" save --force >/dev/null
echo "Servidor reiniciado no PM2 com sucesso!"

sleep 2
echo "Health check:"
curl -fsS --max-time 5 "http://127.0.0.1:${PORT:-3000}/health" && echo

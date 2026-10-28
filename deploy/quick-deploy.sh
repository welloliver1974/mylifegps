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
npx prisma generate
npx prisma db push
npm run build

# Reinicia via PM2 usando o ecosystem do projeto
if command -v pm2 &> /dev/null; then
  if pm2 describe my-life360-server >/dev/null 2>&1; then
    pm2 reload "$APP_DIR/deploy/ecosystem.config.cjs" --update-env
  else
    pm2 start "$APP_DIR/deploy/ecosystem.config.cjs"
  fi
  pm2 save --force >/dev/null
  echo "Servidor reiniciado no PM2 com sucesso!"
else
  echo "PM2 não encontrado. Instale com: sudo npm install -g pm2"
  echo "Ou inicie manualmente: npm start"
fi

sleep 2
echo "Health check:"
curl -fsS --max-time 5 "http://127.0.0.1:${PORT:-3000}/health" && echo

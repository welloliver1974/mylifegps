#!/bin/bash
set -e

echo "=== ATUALIZANDO MY LIFE360 NA VPS ==="

cd /home/ubuntu/my-life360/server

# Instala dependências e compila
npm ci
npx prisma generate
npx prisma db push
npm run build

# Reinicia serviço via PM2
if command -v pm2 &> /dev/null; then
  pm2 restart my-life360-server || pm2 start dist/index.js --name "my-life360-server"
  echo "Servidor reiniciado no PM2 com sucesso!"
else
  echo "Compilação concluída. Inicie com 'npm start' ou instale o PM2."
fi

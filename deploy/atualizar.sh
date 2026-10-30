#!/usr/bin/env bash
# ============================================================================
# My Life360 - Comando Global de Atualização Automática
# ============================================================================
# Permite atualizar todo o sistema com um comando simples em qualquer pasta:
#   atualizar
#   atualizar life360
#   atualizar status
#   atualizar logs
#   atualizar restart
# ============================================================================
set -euo pipefail

# Cores e Estilos
R=$'\e[31m' G=$'\e[32m' Y=$'\e[33m' B=$'\e[1m' C=$'\e[36m' N=$'\e[0m'
passo() { printf '\n%s\n' "${B}${C}==> %s${N}"; }
ok()    { printf '%s  ✔%s %s\n' "$G" "$N" "$*"; }
aviso() { printf '%s  !%s %s\n' "$Y" "$N" "$*"; }
erro()  { printf '%s  ✘%s %s\n' "$R" "$N" "$*" >&2; }

# Descobre o diretório do projeto My Life360
find_app_dir() {
  if [ -n "${APP_DIR:-}" ] && [ -d "$APP_DIR/.git" ]; then
    echo "$APP_DIR"
    return 0
  fi

  # Resolve link simbólico se invocado via /usr/local/bin
  local src="${BASH_SOURCE[0]}"
  while [ -L "$src" ]; do
    local dir
    dir="$(cd -P "$(dirname "$src")" && pwd)"
    src="$(readlink "$src")"
    [[ $src != /* ]] && src="$dir/$src"
  done
  local script_dir
  script_dir="$(cd -P "$(dirname "$src")" && pwd)"

  if [ -d "$script_dir/../server" ] && [ -d "$script_dir/../.git" ]; then
    cd -P "$script_dir/.." && pwd
    return 0
  fi

  for candidate in "$HOME/my-life360" "/home/ubuntu/my-life360" "/opt/my-life360"; do
    if [ -d "$candidate/.git" ]; then
      echo "$candidate"
      return 0
    fi
  done

  return 1
}

APP_DIR="$(find_app_dir || true)"
if [ -z "$APP_DIR" ] || [ ! -d "$APP_DIR" ]; then
  erro "Pasta do projeto My Life360 não encontrada."
  erro "Execute dentro da pasta ou configure a variável APP_DIR."
  exit 1
fi

BRANCH="${BRANCH:-main}"
PORT="${PORT:-3000}"
ACTION="${1:-life360}"

# Garante que o atalho global /usr/local/bin/atualizar esteja ativo
ensure_global_shortcut() {
  local target="/usr/local/bin/atualizar"
  local target_alias="/usr/local/bin/atualizar-life360"
  local current_script="$APP_DIR/deploy/atualizar.sh"

  if [ ! -f "$target" ] || [ ! -L "$target" ]; then
    if command -v sudo >/dev/null 2>&1; then
      sudo ln -sf "$current_script" "$target" 2>/dev/null || true
      sudo ln -sf "$current_script" "$target_alias" 2>/dev/null || true
      sudo chmod +x "$target" "$target_alias" 2>/dev/null || true
    fi
  fi
}

# Subcomando: logs
if [ "$ACTION" = "logs" ] || [ "$ACTION" = "log" ]; then
  echo "${B}=== Logs em Tempo Real do My Life360 (Ctrl+C para sair) ===${N}"
  pm2 logs my-life360-server --lines 50
  exit 0
fi

# Subcomando: status
if [ "$ACTION" = "status" ]; then
  echo "${B}=== Status do My Life360 ===${N}"
  cd "$APP_DIR"
  echo "Pasta: $APP_DIR"
  echo "Versão Git: $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"
  echo ""
  pm2 show my-life360-server || pm2 list
  echo ""
  printf "Health Check local: "
  curl -fsS --max-time 5 "http://127.0.0.1:${PORT}/health" 2>/dev/null || echo "${R}Inacessível na porta ${PORT}${N}"
  echo ""
  exit 0
fi

# Subcomando: restart
if [ "$ACTION" = "restart" ] || [ "$ACTION" = "reiniciar" ]; then
  passo "Reiniciando serviço no PM2..."
  pm2 reload "$APP_DIR/deploy/ecosystem.config.cjs" --update-env || pm2 restart my-life360-server
  pm2 save --force >/dev/null
  ok "Servidor reiniciado com sucesso!"
  exit 0
fi

# Ação padrão: Atualização completa
START_TIME=$(date +%s)

printf '\n'
echo "${B}${C}╔════════════════════════════════════════════════════════════╗${N}"
echo "${B}${C}║          🚀 ATUALIZADOR AUTOMÁTICO - MY LIFE360            ║${N}"
echo "${B}${C}╚════════════════════════════════════════════════════════════╝${N}"

passo "1/5 Verificando novidades no repositório GitHub..."
cd "$APP_DIR"

git fetch --quiet origin "$BRANCH"
PREV_COMMIT="$(git rev-parse --short HEAD)"
LATEST_REMOTE="$(git rev-parse --short "origin/$BRANCH")"

if [ "$PREV_COMMIT" = "$LATEST_REMOTE" ]; then
  aviso "O sistema já está no commit mais recente ($PREV_COMMIT)."
  echo "      Recompilando e atualizando cache mesmo assim para garantir paridade..."
else
  echo "      Atualizando de $PREV_COMMIT para $LATEST_REMOTE..."
fi

git checkout --quiet "$BRANCH"
git pull --ff-only origin "$BRANCH"
CURRENT_COMMIT="$(git rev-parse --short HEAD)"
COMMIT_MSG="$(git log -1 --pretty=%s)"
ok "Código atualizado para: ${B}${CURRENT_COMMIT}${N} — \"$COMMIT_MSG\""

passo "2/5 Verificando dependências do servidor..."
cd "$APP_DIR/server"
npm ci --no-audit --no-fund --quiet
ok "Dependências verificadas."

passo "3/5 Atualizando schemas do banco de dados (Prisma)..."
export DATABASE_URL="file:./prod.db"
npx prisma generate >/dev/null
npx prisma db push --skip-generate >/dev/null
ok "Banco de dados sincronizado."

passo "4/5 Compilando TypeScript do servidor..."
npm run build
ok "Build compilado com sucesso em dist/."

passo "5/5 Reiniciando serviço no PM2..."
PM2_BIN="$(command -v pm2 2>/dev/null || echo "pm2")"
if "$PM2_BIN" describe my-life360-server >/dev/null 2>&1; then
  "$PM2_BIN" reload "$APP_DIR/deploy/ecosystem.config.cjs" --update-env >/dev/null
else
  "$PM2_BIN" start "$APP_DIR/deploy/ecosystem.config.cjs" >/dev/null
fi
"$PM2_BIN" save --force >/dev/null 2>&1 || true
ok "Processo PM2 reiniciado e salvo."

# Verifica saúde
sleep 2
HEALTH_RES=$(curl -fsS --max-time 5 "http://127.0.0.1:${PORT}/health" 2>/dev/null || echo "FAIL")

# Garante atalho global no sistema
ensure_global_shortcut

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

printf '\n'
if [ "$HEALTH_RES" != "FAIL" ]; then
  echo "${B}${G}══════════════════════════════════════════════════════════════${N}"
  echo "${B}${G}  ✨ MY LIFE360 ATUALIZADO COM SUCESSO EM ${ELAPSED}s!${N}"
  echo "${B}${G}══════════════════════════════════════════════════════════════${N}"
  echo "  📌 Versão ativa: ${B}${CURRENT_COMMIT}${N} ($COMMIT_MSG)"
  echo "  🌐 URL:          ${B}https://gps.housecloud.tec.br${N}"
  echo "  🩺 Health check: ${G}ONLINE (status: ok)${N}"
  echo ""
  echo "  Dica: você pode rodar a qualquer momento digitando apenas:"
  echo "        ${B}atualizar life360${N}  ou  ${B}atualizar${N}"
  echo ""
else
  erro "O servidor reiniciou, mas o health check não respondeu em http://127.0.0.1:${PORT}/health."
  aviso "Verifique os logs executando:  atualizar logs"
fi

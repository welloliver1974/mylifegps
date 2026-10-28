#!/usr/bin/env bash
# ============================================================================
# My Life360 - Instalação do Servidor na VPS (Ubuntu 22.04/24.04)
# ----------------------------------------------------------------------------
# Instala Node.js, PM2, Cloudflared e prepara o app em ~/my-life360.
# É idempotente: pode rodar de novo para atualizar o deploy.
#
# NÃO ativa o firewall nem mexe no SSH. Isso fica em harden-vps.sh, separado,
# para você não se trancar fora da máquina.
#
# Uso (conectado na VPS como usuário normal, com sudo):
#   bash install-vps.sh
# ============================================================================
set -euo pipefail

R=$'\e[31m' G=$'\e[32m' Y=$'\e[33m' B=$'\e[1m' N=$'\e[0m'
passo() { printf '\n%s\n%s\n' "${B}==> $*${N}" "${B}------------------------------------------------${N}"; }
ok()    { printf '%s  ✔%s %s\n' "$G" "$N" "$*"; }
aviso() { printf '%s  !%s %s\n' "$Y" "$N" "$*"; }
erro()  { printf '%s  ✘%s %s\n' "$R" "$N" "$*" >&2; }

if [ "$(id -u)" -eq 0 ]; then
  erro "Não rode como root. Saia e entre como o usuário normal:  ssh ubuntu@IP_TAILSCALE"
  exit 1
fi

APP_USER="$(id -un)"
APP_HOME="$HOME"
APP_DIR="${APP_DIR:-$APP_HOME/my-life360}"
REPO="${REPO:-https://github.com/welloliver1974/mylifegps.git}"
REPO="${REPO%.git}.git"
BRANCH="${BRANCH:-main}"
NODE_MAJOR="${NODE_MAJOR:-20}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/mylife360}"
APP_PORT="${APP_PORT:-3000}"
SUDO="sudo"

trap 'erro "Falhou na linha $LINENO. Nada foi perdido — corrija e rode de novo."' ERR

passo "0/9  Pré-checagens"
if ! $SUDO -n true 2>/dev/null; then
  aviso "O sudo vai pedir sua senha uma vez agora. É normal."
  $SUDO -v
fi
ok "Usuário: $APP_USER — sudo disponível."
ok "Destino: $APP_DIR"

# ---------------------------------------------------------------- 1. base
passo "1/9  Pacotes básicos"
$SUDO apt-get update -qq
$SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  curl ca-certificates gnupg git unzip ufw fail2ban jq rsync >/dev/null
ok "Pacotes básicos instalados."

# ---------------------------------------------------------------- 2. node
passo "2/9  Node.js ${NODE_MAJOR}.x"
NODE_MAJOR_ATUAL="0"
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR_ATUAL="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
fi
if [ "$NODE_MAJOR_ATUAL" -ge 18 ]; then
  ok "Node já instalado: $(node -v)"
else
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | $SUDO -E bash - >/dev/null
  $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs >/dev/null
  ok "Node instalado: $(node -v)"
fi

# ---------------------------------------------------------------- 3. pm2
passo "3/9  PM2"
if command -v pm2 >/dev/null 2>&1; then
  ok "PM2 já instalado: $(pm2 -v)"
else
  NPM_BIN="$(command -v npm 2>/dev/null || true)"
  if [ -z "$NPM_BIN" ]; then
    erro "npm não foi encontrado no PATH. Rode: sudo apt-get install -y npm"
    exit 1
  fi
  # Se o diretório do npm for gravável pelo usuário atual (ex: nvm/asdf),
  # instala sem sudo para não quebrar permissões locais.
  if [ -w "$(dirname "$NPM_BIN")" ]; then
    "$NPM_BIN" install -g pm2 >/dev/null
  else
    $SUDO env PATH="$PATH" "$NPM_BIN" install -g pm2 >/dev/null
  fi
  ok "PM2 instalado: $(pm2 -v)"
fi

# ---------------------------------------------------------------- 4. cloudflared
passo "4/9  Cloudflared (túnel HTTPS)"
if command -v cloudflared >/dev/null 2>&1; then
  ok "cloudflared já instalado."
else
  $SUDO mkdir -p --mode=0755 /usr/share/keyrings
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
    | $SUDO tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
  echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" \
    | $SUDO tee /etc/apt/sources.list.d/cloudflared.list >/dev/null
  $SUDO apt-get update -qq
  $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y -qq cloudflared >/dev/null
  ok "cloudflared instalado."
fi

# ---------------------------------------------------------------- 5. diretórios
passo "5/9  Diretórios"
mkdir -p "$APP_DIR"
$SUDO mkdir -p "$BACKUP_DIR"
$SUDO chown "$APP_USER":"$APP_USER" "$BACKUP_DIR"
$SUDO chmod 750 "$BACKUP_DIR"
ok "$APP_DIR e $BACKUP_DIR prontos."

# ---------------------------------------------------------------- 6. código
passo "6/9  Código-fonte"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch --quiet origin
  git checkout --quiet "$BRANCH"
  git pull --quiet --ff-only origin "$BRANCH"
  ok "Repositório atualizado: $(git rev-parse --short HEAD)"
else
  git clone --quiet --branch "$BRANCH" "$REPO" "$APP_DIR"
  ok "Repositório clonado em $APP_DIR."
  cd "$APP_DIR"
fi

# ---------------------------------------------------------------- 7. deps e .env
passo "7/9  Dependências e Configuração (.env)"
cd "$APP_DIR/server"
npm ci --no-audit --no-fund

ENV_FILE="$APP_DIR/server/.env"
if [ -f "$ENV_FILE" ]; then
  ok ".env já existe — mantido intacto (não sobrescrevo segredos)."
  aviso "Confira se contém: TELEMETRY_REQUIRE_KEY=true, BACKUP_ENABLED=true, VAPID_*, CARTO_API_KEY."
else
  echo
  aviso "A chave do CARTO será digitada por você agora."
  aviso "Ela NÃO aparece na tela, NÃO entra no histórico do shell e NÃO vai para o Git."
  printf '  Cole a CARTO_API_KEY e pressione Enter (ou Enter vazio para deixar em branco): '
  read -rs CARTO_KEY
  echo
  printf '  E-mail para o VAPID_SUBJECT (ex: voce@dominio.com, ou Enter para pular): '
  read -r VAPID_SUBJECT_EMAIL
  [ -n "${VAPID_SUBJECT_EMAIL:-}" ] || VAPID_SUBJECT_EMAIL="contato@exemplo.com"

  VAPID_JSON="$(node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); process.stdout.write(JSON.stringify(k));")"
  VAPID_PUB="$(node -e "process.stdout.write(JSON.parse(process.argv[1]).publicKey)" "$VAPID_JSON")"
  VAPID_PRIV="$(node -e "process.stdout.write(JSON.parse(process.argv[1]).privateKey)" "$VAPID_JSON")"

  umask 077
  cat > "$ENV_FILE" <<EOF
DATABASE_URL="file:./prod.db"
PORT=$APP_PORT
HOST="0.0.0.0"

# Basemap CARTO
CARTO_API_KEY="${CARTO_KEY:-}"

# Web Push (VAPID) — geradas nesta máquina
VAPID_PUBLIC_KEY="$VAPID_PUB"
VAPID_PRIVATE_KEY="$VAPID_PRIV"
VAPID_SUBJECT="mailto:$VAPID_SUBJECT_EMAIL"

# Segurança da ingestão de GPS: cada aparelho usa a própria chave
TELEMETRY_REQUIRE_KEY="true"

# Backup automático do SQLite
BACKUP_ENABLED="true"
BACKUP_DIR="$BACKUP_DIR"
BACKUP_INTERVAL_HOURS="24"
BACKUP_RETENTION_DAYS="14"

# Auditoria de acessos
ACCESS_LOG_RETENTION_DAYS="30"
EOF
  umask 022
  chmod 600 "$ENV_FILE"
  unset CARTO_KEY VAPID_JSON VAPID_PUB VAPID_PRIV VAPID_SUBJECT_EMAIL
  ok ".env criado com permissão 600 (só o dono lê)."
  ok "Chaves VAPID novas geradas nesta máquina."
fi

# ---------------------------------------------------------------- 8. prisma e build
passo "8/9  Prisma e Build do Servidor"
cd "$APP_DIR/server"
export DATABASE_URL="file:./prod.db"
npx prisma generate >/dev/null
npx prisma db push --skip-generate
npm run build
ok "Banco SQLite inicializado e build concluído."

# ---------------------------------------------------------------- 9. pm2
passo "9/9  Iniciando o serviço no PM2"
ECOSYSTEM="$APP_DIR/deploy/ecosystem.config.cjs"
if [ ! -f "$ECOSYSTEM" ]; then
  erro "Não encontrei $ECOSYSTEM"
  exit 1
fi
PM2_BIN="$(command -v pm2 2>/dev/null || echo "pm2")"
cd "$APP_DIR/server"
if "$PM2_BIN" describe my-life360-server >/dev/null 2>&1; then
  "$PM2_BIN" reload "$ECOSYSTEM" --update-env
else
  "$PM2_BIN" start "$ECOSYSTEM"
fi
"$PM2_BIN" save --force >/dev/null

STARTUP_CMD="$("$PM2_BIN" startup systemd -u "$APP_USER" --hp "$APP_HOME" 2>/dev/null | grep 'sudo env PATH' || true)"
if [ -n "$STARTUP_CMD" ]; then
  eval "$STARTUP_CMD" >/dev/null 2>&1 || true
  ok "PM2 configurado para iniciar no boot."
elif $SUDO env PATH="$PATH" "$PM2_BIN" startup systemd -u "$APP_USER" --hp "$APP_HOME" >/dev/null 2>&1; then
  ok "PM2 configurado para iniciar no boot."
else
  aviso "Ative o boot automático depois rodando: pm2 startup"
fi

# ---------------------------------------------------------------- health
passo "Verificação"
sleep 3
if curl -fsS --max-time 5 "http://127.0.0.1:$APP_PORT/health" >/dev/null 2>&1; then
  ok "Servidor respondendo em http://127.0.0.1:$APP_PORT/health"
  curl -fsS --max-time 5 "http://127.0.0.1:$APP_PORT/health"; echo
else
  erro "O servidor não respondeu. Veja os logs:  pm2 logs my-life360-server --lines 60"
  exit 1
fi

echo
printf '%s\n' "${B}================ INSTALAÇÃO CONCLUÍDA ================${N}"
echo "Próximos passos:"
echo "  1) Cloudflare Tunnel (HTTPS) ............ DEPLOY_VPS.md, Passo 4"
echo "  2) Hardening do SSH e firewall .......... DEPLOY_VPS.md, Passo 5"
echo "  3) Abrir o painel e criar a conta admin"
echo
aviso "Até o Passo 4, o app está acessível na porta $APP_PORT pela internet."
echo "  Para fechar agora (sem esperar o hardening):"
echo "    sudo ufw default deny incoming && sudo ufw allow in on tailscale0 && sudo ufw enable"

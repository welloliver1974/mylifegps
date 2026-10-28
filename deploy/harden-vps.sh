#!/usr/bin/env bash
# ============================================================================
# My Life360 - Hardening da VPS (SSH + Firewall)
# ----------------------------------------------------------------------------
# Deixa o servidor INVISÍVEL na internet:
#   - SSH só pela interface do Tailscale (nenhuma porta pública)
#   - Login por senha desativado (somente chave)
#   - Login direto como root desativado
#   - ufw nega tudo que vem de fora, exceto a interface tailscale0
#
# PROTEÇÃO CONTRA SE TRANCAR FORA:
#   Ao ativar o ufw, um timer desativa o firewall automaticamente em 10 minutos.
#   Se continuar conectado e tudo funcionar, cancele o timer (o script diz como).
#   Se perder o acesso, espere 10 min e ele volta a funcionar.
#
# PRÉ-REQUISITOS (o script recusa se não cumprir):
#   1. Tailscale instalado e conectado nesta VPS.
#   2. Você conectado via IP do Tailscale (não pelo IP público).
#   3. Uma segunda sessão SSH de teste aberta.
#
# Uso:
#   bash harden-vps.sh
# ============================================================================
set -euo pipefail

R=$'\e[31m' G=$'\e[32m' Y=$'\e[33m' B=$'\e[1m' N=$'\e[0m'
passo() { printf '\n%s\n%s\n' "${B}==> $*${N}" "${B}------------------------------------------------${N}"; }
ok()    { printf '%s  ✔%s %s\n' "$G" "$N" "$*"; }
aviso() { printf '%s  !%s %s\n' "$Y" "$N" "$*"; }
erro()  { printf '%s  ✘%s %s\n' "$R" "$N" "$*" >&2; }

if [ "$(id -u)" -eq 0 ]; then
  erro "Não rode como root. Saia e entre como o usuário normal."
  exit 1
fi
SUDO="sudo"
$SUDO -n true 2>/dev/null || $SUDO -v

# ------------------------------------------------------------ pré-checagens
passo "0/5  Pré-checagens de segurança"

if ! command -v tailscale >/dev/null 2>&1; then
  erro "Tailscale não está instalado nesta VPS."
  echo "   Instale primeiro:  curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up"
  exit 1
fi
TS_IP="$(tailscale ip -4 2>/dev/null | head -1 || true)"
if [ -z "$TS_IP" ]; then
  erro "Tailscale existe mas não está conectado. Rode: sudo tailscale up"
  exit 1
fi
ok "Tailscale ativo. IP da VPS no Tailscale: $TS_IP"

MEU_ORIGEM="$(echo "${SSH_CONNECTION:-}" | awk '{print $1}')"
if [ -z "$MEU_ORIGEM" ]; then
  aviso "Não detectei SSH_CONNECTION — talvez você esteja no console da Oracle."
  aviso "Continuo, mas o risco de perder acesso existe. Tenha o console aberto."
elif [ "$MEU_ORIGEM" != "$TS_IP" ]; then
  case "$MEU_ORIGEM" in
    100.*) ok "Você está conectado por Tailscale ($MEU_ORIGEM)." ;;
    *)
      erro "Você está conectado pelo IP PÚBLICO ($MEU_ORIGEM)."
      echo "   Se eu fechar a porta 22 agora, você perde o acesso."
      echo "   Saia e reconecte pelo Tailscale:  ssh $(id -un)@$TS_IP"
      echo "   Depois rode este script novamente."
      exit 1
      ;;
  esac
else
  ok "Conectado pelo IP do Tailscale ($MEU_ORIGEM)."
fi

printf '\n  Você já abriu uma SEGUNDA sessão SSH por %s para testar? [s/N] ' "$TS_IP"
read -r resp
case "$resp" in
  s|S|y|Y|sim) ok "Prosseguindo." ;;
  *) erro "Abra a segunda sessão primeiro. Sem isso o risco de se trancar fora é real."; exit 1 ;;
esac

# ------------------------------------------------------------ sshd
passo "1/5  Endurecendo o SSH (somente chave, sem root)"
SSHD_CONF=/etc/ssh/sshd_config
BACKUP=/etc/ssh/sshd_config.bak.$(date +%Y%m%d-%H%M%S)
$SUDO cp -a "$SSHD_CONF" "$BACKUP"
ok "Backup salvo em $BACKUP"

$SUDO tee /etc/ssh/sshd_config.d/99-mylife360-hardening.conf >/dev/null <<'EOF'
# My Life360 — hardening (gerado por harden-vps.sh)
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
X11Forwarding no
MaxAuthTries 4
LoginGraceTime 30
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
ok "Arquivo 99-mylife360-hardening.conf escrito."

if $SUDO sshd -t 2>/dev/null; then
  ok "Configuração do sshd validada."
  $SUDO systemctl reload ssh 2>/dev/null || $SUDO systemctl reload sshd 2>/dev/null || true
  ok "sshd recarregado (sessões abertas continuam vivas)."
else
  erro "Configuração inválida! Restaurando backup."
  $SUDO rm -f /etc/ssh/sshd_config.d/99-mylife360-hardening.conf
  $SUDO cp -a "$BACKUP" "$SSHD_CONF"
  exit 1
fi

# ------------------------------------------------------------ fail2ban
passo "2/5  Fail2ban (bloqueio de tentativas repetidas)"
if command -v fail2ban-client >/dev/null 2>&1; then
  $SUDO tee /etc/fail2ban/jail.d/mylife360.local >/dev/null <<'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
backend  = systemd

[sshd]
enabled = true
port    = 22
EOF
  $SUDO systemctl enable --now fail2ban >/dev/null 2>&1 || true
  $SUDO systemctl restart fail2ban 2>/dev/null || true
  ok "fail2ban ativo (5 erros = 1h de bloqueio)."
else
  aviso "fail2ban não instalado (o install-vps.sh instala)."
fi

# ------------------------------------------------------------ ufw
passo "3/5  Firewall (ufw) — somente Tailscale"
aviso "Vou ATIVAR o firewall com rollback automático em 10 minutos."
aviso "Se perder o acesso, aguarde 10 minutos e o ufw se desativa sozinho."

$SUDO ufw --force reset >/dev/null 2>&1 || true
$SUDO ufw default deny incoming >/dev/null
$SUDO ufw default allow outgoing >/dev/null
$SUDO ufw allow in on tailscale0 to any >/dev/null
$SUDO ufw allow in on lo >/dev/null
$SUDO ufw allow 41641/udp >/dev/null 2>&1 || true   # NAT traversal do Tailscale

ROLLBACK_ATIVO=0
if command -v systemd-run >/dev/null 2>&1; then
  if $SUDO systemd-run --on-active=10min --unit=ufw-rollback \
      --description="Rollback automatico do ufw (My Life360)" \
      /bin/sh -c 'ufw --force disable' >/dev/null 2>&1; then
    ROLLBACK_ATIVO=1
  fi
fi

$SUDO ufw --force enable >/dev/null
ok "ufw ativado."
$SUDO ufw status verbose | sed 's/^/    /'

# ------------------------------------------------------------ updates
passo "4/5  Atualizações de segurança automáticas"
$SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y -qq unattended-upgrades >/dev/null 2>&1 || true
$SUDO tee /etc/apt/apt.conf.d/20auto-upgrades >/dev/null <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
$SUDO systemctl enable --now unattended-upgrades >/dev/null 2>&1 || true
ok "Atualizações automáticas habilitadas."

# ------------------------------------------------------------ resumo
passo "5/5  Estado final"
echo "  Portas públicas escutando:"
PUB="$($SUDO ss -tulpnH 2>/dev/null | grep -E '(0\.0\.0\.0:|\*:|\[::\]:)' | grep -vE '(127\.0\.0\.1|\[::1\])' || true)"
if [ -z "$PUB" ]; then ok "Nenhuma porta pública exposta."; else echo "$PUB" | sed 's/^/    /'; fi
echo
echo "  SSH efetivo:"
$SUDO sshd -T 2>/dev/null | grep -Ei '^(permitrootlogin|passwordauthentication|pubkeyauthentication)' | sed 's/^/    /'
echo
echo "  Tailscale: $TS_IP"
echo
printf '%s\n' "${B}================ HARDENING CONCLUÍDO ================${N}"

if [ "$ROLLBACK_ATIVO" -eq 1 ]; then
  printf '\n%s\n' "${Y}!!! ROLLBACK DO FIREWALL AGENDADO PARA DAQUI A 10 MINUTOS !!!${N}"
  echo "1) Em OUTRO terminal (já aberto), teste:  ssh $(id -un)@$TS_IP"
  echo "2) Se conectou, cancele o rollback:"
  echo
  echo "     sudo systemctl stop ufw-rollback.timer"
  echo
  echo "3) Se NÃO conseguir conectar, apenas espere 10 minutos: o firewall se desliga sozinho."
else
  aviso "Não consegui agendar o rollback automático. Se perder o acesso, use o console da Oracle."
fi

echo
echo "Conecte-se sempre pelo Tailscale:  ssh $(id -un)@$TS_IP"

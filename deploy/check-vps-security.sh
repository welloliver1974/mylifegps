#!/usr/bin/env bash
# ============================================================================
# My Life360 - Auditoria de Segurança da VPS (SOMENTE LEITURA)
# ----------------------------------------------------------------------------
# Não altera nada. Apenas coleta sinais de acesso indevido, backdoors,
# usuários estranhos, chaves desconhecidas, cron suspeito e portas expostas.
#
# Uso:
#   bash check-vps-security.sh
#   bash check-vps-security.sh 2>&1 | tee relatorio-seguranca.txt
#
# Rode na VPS conectado preferencialmente pelo Tailscale.
# ============================================================================
set -uo pipefail

readonly R=$'\e[31m' G=$'\e[32m' Y=$'\e[33m' B=$'\e[1m' N=$'\e[0m'
secao() { printf '\n%s\n%s\n' "${B}==== $* ====${N}" "${B}------------------------------------------------------------${N}"; }
ok()    { printf '%s  [OK]%s    %s\n' "$G" "$N" "$*"; }
alerta(){ printf '%s  [ATENÇÃO]%s %s\n' "$Y" "$N" "$*"; }
critico(){ printf '%s  [CRÍTICO]%s %s\n' "$R" "$N" "$*"; }

echo "Auditoria My Life360 — $(hostname) — $(date -Is)"
echo "IP público: $(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || echo 'não detectado')"

# ---------------------------------------------------------------- usuários
secao "Usuários com UID 0 (root) e contas humanas"
awk -F: '($3 == 0) {print $1}' /etc/passwd | while read -r u; do printf '  root-equivalente: %s\n' "$u"; done
printf '\n  Contas com shell de login:\n'
awk -F: '($7 !~ /(nologin|false|sync)$/) {printf "    %-20s uid=%s home=%s shell=%s\n", $1, $3, $6, $7}' /etc/passwd

secao "Membros do grupo sudo / sudoers.d"
getent group sudo 2>/dev/null | awk -F: '{print "  grupo sudo: " $4}'
getent group adm 2>/dev/null | awk -F: '{print "  grupo adm : " $4}'
sudo -n ls -l /etc/sudoers.d 2>/dev/null || echo "  (precisa sudo para listar /etc/sudoers.d)"

# ---------------------------------------------------------------- chaves SSH
secao "Chaves SSH autorizadas (procure chaves que você não reconhece)"
for home in /root /home/*; do
  f="$home/.ssh/authorized_keys"
  [ -f "$f" ] || continue
  printf '  %s\n' "$f"
  awk '{printf "    %-12s %-20s %s\n", $1, substr($2,1,16)"...", $3}' "$f" 2>/dev/null
  stat -c '    modificado em: %y  dono: %U' "$f"
done
[ -z "$(ls -d /root/.ssh/authorized_keys /home/*/.ssh/authorized_keys 2>/dev/null)" ] && ok "Nenhum authorized_keys encontrado."

# ---------------------------------------------------------------- logins
secao "Últimos logins bem-sucedidos (procure IPs/origens desconhecidas)"
last -n 20 -a 2>/dev/null | head -22

secao "Últimas tentativas de login inválido"
if command -v lastb >/dev/null 2>&1; then
  sudo -n lastb -n 15 2>/dev/null | head -17 || echo "  (precisa sudo para ler /var/log/btmp)"
else
  echo "  lastb não instalado."
fi

# ---------------------------------------------------------------- portas
secao "Portas escutando em endereço PÚBLICO (0.0.0.0 ou ::)"
saida=$(sudo -n ss -tulpnH 2>/dev/null || ss -tulpnH 2>/dev/null)
if [ -z "$saida" ]; then
  alerta "Não foi possível listar portas (precisa sudo)."
else
  expostas=$(printf '%s\n' "$saida" | grep -E '(0\.0\.0\.0:|\*:|\[::\]:)' | grep -vE '(127\.0\.0\.1|\[::1\])' || true)
  if [ -z "$expostas" ]; then
    ok "Nenhuma porta escutando em endereço público."
  else
    printf '%s\n' "$expostas" | while read -r l; do alerta "$l"; done
    echo "  >>> Esperado apenas: sshd na 22 enquanto você migra para o Tailscale."
    echo "  >>> Após o hardening, o ideal é NENHUMA porta pública."
  fi
fi

# ---------------------------------------------------------------- firewall
secao "Firewall (ufw / nftables / iptables)"
if command -v ufw >/dev/null 2>&1; then
  sudo -n ufw status verbose 2>/dev/null || ufw status 2>/dev/null
else
  echo "  ufw não instalado."
fi
if command -v nft >/dev/null 2>&1; then
  echo "  --- nft tables ---"
  sudo -n nft list tables 2>/dev/null || echo "  (precisa sudo)"
fi

# ---------------------------------------------------------------- cron
secao "Tarefas agendadas (cron e timers systemd)"
echo "  --- /etc/crontab e /etc/cron.d ---"
sudo -n grep -HvE '^\s*(#|$)' /etc/crontab /etc/cron.d/* 2>/dev/null || echo "  (vazio ou sem sudo)"
echo "  --- crontabs de usuários ---"
for u in $(cut -d: -f1 /etc/passwd); do
  c=$(sudo -n crontab -u "$u" -l 2>/dev/null)
  [ -n "$c" ] && printf '  [%s]\n%s\n' "$u" "$c"
done
echo "  --- timers systemd ativos ---"
systemctl list-timers --all --no-pager 2>/dev/null | head -15

# ---------------------------------------------------------------- serviços
secao "Serviços systemd habilitados (procure nomes desconhecidos)"
systemctl list-unit-files --state=enabled --type=service --no-pager 2>/dev/null | head -40

secao "Containers Docker em execução (se houver)"
if command -v docker >/dev/null 2>&1; then
  sudo -n docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}' 2>/dev/null || docker ps 2>/dev/null || echo "  (sem permissão)"
else
  echo "  docker não instalado."
fi

# ---------------------------------------------------------------- sshd
secao "Configuração efetiva do SSH (diretivas de risco)"
if command -v sshd >/dev/null 2>&1; then
  sudo -n sshd -T 2>/dev/null | grep -Ei '^(port|permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication|permitemptypasswords|x11forwarding|allowusers|allowgroups)' \
    || sshd -T 2>/dev/null | grep -Ei '^(port|permitrootlogin|passwordauthentication)' \
    || echo "  (precisa sudo)"
  echo
  sudo -n sshd -T 2>/dev/null | grep -qi '^passwordauthentication yes' \
    && critico "PasswordAuthentication está YES — força bruta é possível. Desative." \
    || ok "Login por senha desativado."
  sudo -n sshd -T 2>/dev/null | grep -qi '^permitrootlogin yes' \
    && critico "PermitRootLogin está YES — desative." \
    || ok "Login direto como root desativado."
fi

# ---------------------------------------------------------------- tailscale
secao "Tailscale"
if command -v tailscale >/dev/null 2>&1; then
  tailscale status 2>/dev/null | head -15
  echo
  printf '  IP Tailscale: %s\n' "$(tailscale ip -4 2>/dev/null | head -1)"
  tailscale status 2>/dev/null | grep -qi 'offline' && alerta "Há nós offline." || ok "Tailscale ativo."
else
  alerta "Tailscale não instalado nesta máquina."
fi

# ---------------------------------------------------------------- pacotes
secao "Atualizações de segurança pendentes"
if command -v apt-get >/dev/null 2>&1; then
  sudo -n apt-get -s upgrade 2>/dev/null | grep -c '^Inst' | awk '{printf "  Pacotes atualizáveis: %s\n", $1}'
  echo "  Atualizações automáticas:"
  for f in /etc/apt/apt.conf.d/*unattended* /etc/apt/apt.conf.d/20auto-upgrades; do
    [ -f "$f" ] && printf '    %s\n' "$f"
  done
else
  echo "  apt não disponível."
fi

# ---------------------------------------------------------------- processo
secao "Processos com maior consumo de CPU (2s de amostragem)"
ps -eo pid,user,pcpu,pmem,etime,cmd --sort=-pcpu 2>/dev/null | head -12

secao "Arquivos modificados nos últimos 3 dias em /etc (sinal de alteração recente)"
sudo -n find /etc -type f -mtime -3 2>/dev/null | head -30 || echo "  (precisa sudo)"

echo
printf '%s\n' "${B}==== FIM DA AUDITORIA ====${N}"
echo "Guarde este relatório. Se algo aqui não for seu, não faça deploy antes de limpar."

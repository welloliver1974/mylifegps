#!/usr/bin/env bash
# ============================================================================
# Instala os comandos globais 'atualizar' e 'atualizar-life360' no sistema
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd -P "$SCRIPT_DIR/.." && pwd)"

echo "==> Instalando comando global 'atualizar'..."

# Torna o script executável
chmod +x "$APP_DIR/deploy/atualizar.sh"

# Cria links em /usr/local/bin para estar disponível no PATH de qualquer pasta
if command -v sudo >/dev/null 2>&1; then
  sudo ln -sf "$APP_DIR/deploy/atualizar.sh" /usr/local/bin/atualizar
  sudo ln -sf "$APP_DIR/deploy/atualizar.sh" /usr/local/bin/atualizar-life360
  sudo chmod +x /usr/local/bin/atualizar /usr/local/bin/atualizar-life360
  echo "✔ Comando instalado em /usr/local/bin/atualizar e /usr/local/bin/atualizar-life360"
else
  mkdir -p "$HOME/.local/bin"
  ln -sf "$APP_DIR/deploy/atualizar.sh" "$HOME/.local/bin/atualizar"
  ln -sf "$APP_DIR/deploy/atualizar.sh" "$HOME/.local/bin/atualizar-life360"
  chmod +x "$HOME/.local/bin/atualizar" "$HOME/.local/bin/atualizar-life360"
  echo "✔ Comando instalado em $HOME/.local/bin/atualizar"
fi

# Adiciona alias no ~/.bashrc se ainda não existir
BASHRC="$HOME/.bashrc"
if [ -f "$BASHRC" ] && ! grep -q "alias atualizar=" "$BASHRC"; then
  echo "" >> "$BASHRC"
  echo "# Atalho My Life360" >> "$BASHRC"
  echo "alias atualizar-life360='/usr/local/bin/atualizar life360'" >> "$BASHRC"
  echo "alias atualizar='/usr/local/bin/atualizar'" >> "$BASHRC"
fi

echo ""
echo "🎉 Pronto! Agora você pode digitar de qualquer pasta:"
echo "   atualizar life360"
echo "   atualizar"
echo "   atualizar status"
echo "   atualizar logs"
echo ""

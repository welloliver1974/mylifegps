#!/bin/bash
# Atualiza o código já existente na VPS e reinicia o serviço.
# Uso:  cd /home/ubuntu/my-life360 && bash deploy/quick-deploy.sh
# Ou use o novo comando global:  atualizar life360
set -euo pipefail

SCRIPT_DIR="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$SCRIPT_DIR/atualizar.sh" "$@"


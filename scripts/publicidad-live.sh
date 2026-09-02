#!/bin/bash
# Pull de gasto de Meta Ads + pedidos reales del Sheet, cada 15 min.
# launchd no carga .zshrc/.bashrc, por eso el path a node va a mano (nvm).
NODE="/Users/user/.nvm/versions/node/v20.20.2/bin/node"
REPO="/Users/user/Projects/KEPLER"
LOG="$HOME/publicidad-live.log"

echo "" >> "$LOG"
echo "=== $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$LOG"

cd "$REPO" || { echo "ERROR: no se encontró $REPO" >> "$LOG"; exit 1; }

"$NODE" projects/dropshipping/publicidad-live.js >> "$LOG" 2>&1
echo "Salida: $?" >> "$LOG"

#!/bin/bash
# Muestrea el stock de los productos del watchlist en DROPI, cada 30 min.
# Cada baja de stock es una venta del mercado (todos los dropshippers, no solo
# las nuestras). Muestrear seguido es lo que permite separar ventas de restock.
# launchd no carga .zshrc/.bashrc, por eso el path a node va a mano (nvm).
NODE="/Users/user/.nvm/versions/node/v20.20.2/bin/node"
REPO="/Users/user/Projects/KEPLER"
LOG="$HOME/ventas-mercado.log"

echo "" >> "$LOG"
echo "=== $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$LOG"

# El cd NO es decorativo: dotenv busca .env en el directorio actual, y .env vive
# en la raíz del repo. Sin esto el script corre sin credenciales y falla.
cd "$REPO" || { echo "ERROR: no se encontró $REPO" >> "$LOG"; exit 1; }

"$NODE" projects/dropshipping/ventas-mercado.js medir >> "$LOG" 2>&1
echo "Salida: $?" >> "$LOG"

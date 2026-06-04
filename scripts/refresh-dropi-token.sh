#!/bin/bash
# ============================================================
# refresh-dropi-token.sh
# Loguea en DROPI desde el Mac (IP residencial) y manda el
# token al agente en el VPS. Corre automáticamente cada 6h.
# ============================================================

DROPI_EMAIL="contacto@shotygames.com"
DROPI_PASSWORD="Nereashirley96"

# ⚠️ CAMBIA ESTO: URL de tu agente en EasyPanel
# La encuentras en EasyPanel > tu servicio > Domain/Ports
AGENT_URL="https://agent.hetaxg.easypanel.host"

# ⚠️ CAMBIA ESTO: debe ser igual a ADMIN_KEY en EasyPanel
ADMIN_KEY="ShotyGames2024Dropi"

LOG="$HOME/dropi-refresh.log"

echo "" >> "$LOG"
echo "=== $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$LOG"

# 1. Login en DROPI
RESPONSE=$(curl -s -X POST "https://api.dropi.ec/api/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Origin: https://app.dropi.ec" \
  -d "{\"email\":\"$DROPI_EMAIL\",\"password\":\"$DROPI_PASSWORD\",\"white_brand_id\":1}" \
  2>>"$LOG")

TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "ERROR: No se pudo obtener token. Respuesta: $RESPONSE" >> "$LOG"
  exit 1
fi

echo "Login OK. Token obtenido (${#TOKEN} chars)" >> "$LOG"

# 2. Mandar token al VPS
UPDATE=$(curl -s -X POST "$AGENT_URL/admin/token" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN_KEY" \
  -d "{\"token\":\"$TOKEN\"}" \
  2>>"$LOG")

echo "VPS actualizado: $UPDATE" >> "$LOG"
echo "Listo." >> "$LOG"

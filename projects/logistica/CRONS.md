# Envíos automáticos — estado

`vercel.json` tiene `"crons": []` **a propósito**: hoy la app no le escribe a ningún
cliente por su cuenta.

## `/api/cron/avisos` — "llegó a tu ciudad"

Existe, funciona y está probado, pero **no se dispara solo**. Fabián decidió el 2026-09-03
no encenderlo: medido sobre 49 pedidos reales, la señal aparecía en **1**. El tracking de
Servientrega casi nunca nombra la ciudad destino, y cuando nombra una suele ser la del
centro de acopio — hay un pedido a BUCAY cuyo tracking dice "CL GUAYAQUIL".

Para encenderlo, poner en `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/avisos", "schedule": "0 15 * * *" }] }
```

(15:00 UTC = 10:00 de Ecuador. El plan es Hobby: **un disparo por día**.)

Se puede probar sin mandar nada:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://logistica.shotygames.com/api/cron/avisos?simular=1"
```

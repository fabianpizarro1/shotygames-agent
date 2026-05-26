# Setup: Skill Registrar Pedido

Tiempo estimado: 10-15 minutos. Hazlo una sola vez.

---

## Paso 1 — Importar el workflow en n8n

1. Abre tu n8n
2. Menú lateral → **Workflows** → botón **+** → **Import from file**
3. Sube el archivo `n8n-workflow.json` que está en esta carpeta
4. El workflow se importa con el nombre *"Shotygames — Registrar Pedido en Sheets"*

---

## Paso 2 — Conectar Google Sheets en n8n

1. Dentro del workflow importado, haz clic en el nodo **"Agregar a Google Sheets"**
2. En el campo **Credential** → clic en **Create new** (o selecciona una existente si ya tienes Google conectado)
3. Sigue el flujo OAuth de Google — inicia sesión con la cuenta que tiene acceso al Sheet
4. Guarda la credencial

---

## Paso 3 — Activar el webhook

1. En el workflow, clic en el nodo **"Webhook"**
2. Copia la **Production URL** — se ve así:
   ```
   https://[tu-n8n]/webhook/shotygames-pedido
   ```
3. **Activa el workflow** (toggle arriba a la derecha → ON)

---

## Paso 4 — Guardar la URL del webhook en el proyecto

Abre el archivo `.env` en la carpeta KEPLER (créalo si no existe) y agrega:

```
WEBHOOK_REGISTRAR_PEDIDO=https://[tu-n8n]/webhook/shotygames-pedido
```

Luego dile a tu asistente:
> "Recuerda que la URL del webhook de registrar pedido es https://[tu-n8n]/webhook/shotygames-pedido"

Lo guardará en memoria para usarla automáticamente cada vez.

---

## Paso 5 — Probar

Dile a tu asistente:
> "Registra este pedido de prueba: Juan Pérez, 0991234567, Quito, 1 torre normal, pagó $25 por Pichincha, dirección Av. Amazonas 123"

Debería:
1. Mostrarte el resumen para confirmar
2. Al confirmar, registrar la fila en tu Sheet PEDIDOS

---

## Verificar que funciona

Revisa tu Google Sheet — debería aparecer la fila nueva al final con todos los datos.

Si hay error:
- Verifica que el workflow esté **activo** (ON) en n8n
- Verifica que la credencial de Google Sheets esté conectada
- Verifica que la URL del webhook sea correcta

---

## Columnas que se llenan automáticamente

Estas las llena n8n o el Sheet, no hace falta ingresarlas manualmente:

| Campo | Cómo se llena |
|---|---|
| LINK WHATSAPP | n8n lo genera del teléfono |
| WHATSAPP | n8n pone "Mandar WhatsApp" |
| RASTREO | n8n pone "Rastrear paquete" |
| MES | Claude lo extrae de la fecha |
| ID | Google Sheets lo numera solo (si tienes fórmula) |
| GUIA / LINK RASTREO | Se agrega después cuando Fabián crea la guía en DROPI |
| COSTOS / UTILIDAD | Se calculan con fórmulas en el Sheet |

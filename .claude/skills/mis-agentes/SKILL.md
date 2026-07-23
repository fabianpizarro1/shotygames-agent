# Skill: Mis Agentes — Claude Code ↔ Telegram

## Cuándo usar esta skill
Activar cuando Fabián pida algo que normalmente haría en los bots de Telegram:
- Tareas: "agrega tarea", "qué tengo pendiente", "marca como hecho X"
- Calendario: "qué tengo esta semana", "agrega un evento", "borra el evento de X"
- Pedidos: "cuántos pedidos van hoy", "busca el pedido de X", "reporte de pedidos"
- Memoria del bot: "guarda esto en el bot", "qué recuerdas de X"
- Notificaciones: "mándale al bot que...", "notifica a Telegram que..."
- Palabras clave: "bot", "tareas", "calendario", "pedidos del día", "esta semana", "mis pendientes"

## Puente técnico
Todas las operaciones usan el mismo Google Sheets que los bots de Telegram.
**Lo que se hace aquí queda sincronizado automáticamente con los bots.**

Script: `projects/whatsapp-claude-agent/scripts/kepler-bridge.js`
Ejecutar siempre desde la raíz del proyecto del agente:

```bash
cd /Users/user/Desktop/KEPLER/projects/whatsapp-claude-agent && node scripts/kepler-bridge.js <comando> [args]
```

## Comandos disponibles

### Tareas (bot PERSONAL)
```bash
# Listar todas las pendientes
node scripts/kepler-bridge.js tareas-listar PENDIENTE

# Listar todas (sin filtro)
node scripts/kepler-bridge.js tareas-listar

# Listar por proyecto
node scripts/kepler-bridge.js tareas-listar PENDIENTE SHOTYGAMES

# Crear tarea
node scripts/kepler-bridge.js tareas-crear '{"tarea":"REVISAR CAMPAÑAS DE ADS","prioridad":"ALTA","proyecto":"SHOTYGAMES","fecha_limite":"2026-07-01"}'

# Marcar como hecha (por nombre o ID)
node scripts/kepler-bridge.js tareas-completar revisar campañas
```

### Calendario (bot PERSONAL)
```bash
# Ver próximos 7 días
node scripts/kepler-bridge.js calendar-listar 7

# Ver próximos 30 días
node scripts/kepler-bridge.js calendar-listar 30

# Crear evento
node scripts/kepler-bridge.js calendar-crear '{"titulo":"Reunión con proveedor","fecha":"2026-07-01","hora":"10:00","duracion_min":60}'

# Eliminar evento (necesitas el ID del evento)
node scripts/kepler-bridge.js calendar-eliminar <event_id>
```

### Memoria del bot PERSONAL
```bash
# Leer toda la memoria
node scripts/kepler-bridge.js memoria-leer

# Guardar algo en memoria
node scripts/kepler-bridge.js memoria-guardar '{"categoria":"NEGOCIO","nota":"El proveedor de madera sube precio en agosto"}'
```

### Pedidos (bot OPS)
```bash
# Pedidos de hoy
node scripts/kepler-bridge.js pedidos-hoy

# Buscar pedido por nombre
node scripts/kepler-bridge.js pedidos-buscar Juan García

# Reporte (hoy/semana/mes + estado opcional)
node scripts/kepler-bridge.js pedidos-reporte hoy PENDIENTE
```

### Enviar notificación a Telegram
```bash
# Enviar mensaje al bot PERSONAL de Telegram
node scripts/kepler-bridge.js telegram-send personal "🗓 Tienes reunión mañana a las 10am"

# Enviar al bot OPS
node scripts/kepler-bridge.js telegram-send ops "📦 Pedido urgente de Guayaquil"
```
⚠️ Requiere que los tokens estén en el `.env` local (ver sección de setup).

## Proceso cuando Fabián pide algo

1. **Identifica qué quiere** — ¿tareas? ¿calendario? ¿pedidos? ¿notificación?
2. **Ejecuta el comando** del puente con Bash
3. **Interpreta el JSON** y muéstralo de forma clara (tabla, lista, resumen)
4. **Si aplica**, ofrece enviar notificación a Telegram (`telegram-send`)

## Formato de respuesta

Para tareas pendientes — mostrar como lista priorizada:
```
🔴 ALTA — [tarea] | [proyecto] | vence: [fecha]
🟡 MEDIA — [tarea] | [proyecto]
🟢 BAJA — [tarea]
```

Para calendario — mostrar cronológicamente:
```
📅 Lunes 30 jun — 10:00 — Reunión con X (60 min)
📅 Martes 1 jul — Todo el día — Revisión de finanzas
```

Para pedidos — mostrar tabla resumida con totales.

## Setup de tokens Telegram (una sola vez)
Para poder enviar notificaciones a Telegram desde aquí, Fabián debe agregar los tokens al `.env` local:
```
Archivo: projects/whatsapp-claude-agent/.env
Campos a llenar: TELEGRAM_BOT_TOKEN, TELEGRAM_CONTA_TOKEN, TELEGRAM_DROPI_TOKEN, TELEGRAM_PERSONAL_TOKEN
```
Esos tokens son los mismos que están en EasyPanel. Una vez agregados, las notificaciones funcionan.

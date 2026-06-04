# Agente Claude — WhatsApp + Google Sheets

Fabián habla con Claude directamente por WhatsApp. Claude puede registrar pedidos, buscar clientes, actualizar guías y ver reportes del día — todo sin n8n.

## Arquitectura

```
WhatsApp (Fabián) → Evolution API → webhook → Este servidor → Claude API
                                                                    ↓ tools
                                                              Google Sheets
                                                                    ↓
                                               Respuesta → Evolution API → WhatsApp
```

## Setup

### 1. Variables de entorno
Copia `.env.example` a `.env` y llena todos los valores:

```bash
cp .env.example .env
```

Campos a completar:
- `ANTHROPIC_API_KEY` — tu key de Anthropic
- `EVOLUTION_API_URL` — URL de tu Evolution API
- `EVOLUTION_API_KEY` — API key global de Evolution
- `EVOLUTION_INSTANCE` — nombre de la instancia de WhatsApp asistente
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` — email del service account
- `GOOGLE_PRIVATE_KEY` — private key del service account
- `ADMIN_PHONE` — tu número en formato 593XXXXXXXXX (ej: 5930991234567)

### 2. Deploy en EasyPanel

1. En EasyPanel, crea un nuevo servicio → **App**
2. Sube el código o conéctalo a un repo
3. Agrega las variables de entorno
4. Puerto: `3500`
5. Deploy

### 3. Configurar webhook en Evolution API

Una vez desplegado, configura el webhook en tu instancia de Evolution API:

```
URL: https://tu-agente.hetaxg.easypanel.host/webhook
Eventos: messages.upsert
```

### 4. Compartir Google Sheet con el Service Account

Ve a tu Google Sheet → Compartir → pega el `GOOGLE_SERVICE_ACCOUNT_EMAIL` → Editor

## Comandos disponibles (desde WhatsApp)

| Lo que dices | Lo que hace |
|---|---|
| "Registra este pedido: Juan, 099..., Quito..." | Extrae datos y registra en Sheets |
| "Busca el pedido de María García" | Busca en el Sheet |
| "Pedido de Juan García, guía 123456789" | Actualiza la guía en el Sheet |
| "¿Cuántos pedidos van hoy?" | Muestra pedidos del día |
| Cualquier pregunta sobre el negocio | Claude responde con contexto de Shotygames |

## Historial de conversación

El historial se guarda en Redis por 24 horas. Cada número de WhatsApp tiene su propio contexto. Después de 24 horas sin mensajes, el contexto se reinicia.

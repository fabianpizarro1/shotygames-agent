# Reglas: Operaciones Shotygames

## Flujo de pedido (orden en que ocurre)
1. Cliente escribe por WhatsApp
2. Se toma el pedido y se obtienen datos (nombre, dirección, producto, cantidad)
3. Se registra en Google Sheets (hoja de pedidos)
4. Se crea guía de envío en DROPI con esos datos
5. Se imprime la guía
6. Nerea empaca y despacha
7. Se hace seguimiento del estado del pedido en DROPI

## Herramientas del flujo
- **WhatsApp Business** → toma de pedido
- **Google Sheets** → registro y control
- **DROPI** → guías de envío y seguimiento
- **n8n** → automatización entre estas herramientas (meta)

## Datos necesarios por pedido
- Nombre del cliente
- Teléfono
- Producto(s) y cantidad
- Dirección de entrega (ciudad, dirección exacta)
- Forma de pago
- Monto pagado / pendiente

## Prioridades de automatización (en orden)
1. Registrar pedido en Sheets automáticamente desde WhatsApp
2. Crear guía en DROPI con los mismos datos
3. Notificar a Nerea del nuevo pedido
4. Hacer seguimiento automático del estado en DROPI
5. Reportar estado de pedidos a Fabián

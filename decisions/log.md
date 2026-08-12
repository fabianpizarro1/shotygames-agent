# Decision Log

Append-only. When a meaningful decision is made, log it here.

Format: [YYYY-MM-DD] DECISION: ... | REASONING: ... | CONTEXT: ...

---

[2026-07-23] DECISION: Construir bot #5 de Telegram para contenido orgánico de Instagram, con modelo de "banco aprobado" (Fabián aprueba 20-30 posts de una sentada, el bot publica 1/día).
| REASONING: Se reusa la infra existente (telegram-bot.js, crons de notificaciones.js, creativos/ para imagen+copy, marketing-agent/ para estrategia). Bot aparte y no dentro de OPS porque el prompt de OPS ya está saturado con pedidos/DROPI/Sheets/stock y cada mensaje pagaría esos tokens. El banco aprobado evita auto-publicar contenido IA sin revisar, que degrada el alcance de la cuenta.
| CONTEXT: Decidido a 8 días del deadline de salir de deudas (31 julio 2026). Se le advirtió a Fabián que el orgánico es prioridad #2 y no paga deudas en 8 días; eligió construir igual. Riesgo asumido conscientemente.

[2026-07-23] DECISION: Simplificar el plan anterior — nada de API de Instagram ni banco de aprobación en Sheets. El bot solo genera imagen+caption cada día a las 9am y lo manda por Telegram (bot PERSONAL) para que Fabián copie/pegue y publique manualmente.
| REASONING: Fabián pidió explícitamente "hagámoslo fácil". Esto elimina de un tajo: App Review de Meta (2-4 semanas), token que gestionar, hosting público de imágenes, y el banco/estado en Sheets. Puede estar funcionando el mismo día. instagram.js y scripts/test-instagram.js quedan en el repo sin usar por si más adelante se retoma la publicación automática.
| CONTEXT: Reemplaza el diseño del banco aprobado registrado arriba. Implementado: creativos/copy-organico.js (caption+hashtags, no ad copy), creativos/rotacion.js (evita repetir producto/ángulo, estado en Redis), contenido-diario.js (orquesta y envía por Telegram), cron 9am en index.js + endpoint /admin/contenido-diario para probar manual.

[2026-07-23] DECISION: Redefinir la meta de "salir de deudas" — no será saldo $0 el 31 de julio, sino tarjetas al día (sin mora) + Arturo resuelto. Deudas familiares (mamá $2300, papá $1000, Joselin $400) quedan fuera del sprint de 8 días, sin fecha propia.
| REASONING: Con números reales recién levantados ($10,239.61 total, $100 en caja, ~$30/día bruto sin margen calculado), saldo cero en 8 días no es matemáticamente alcanzable. Insistir en la meta original solo generaría frustración el 1 de agosto sin haber resuelto lo que sí tiene consecuencias reales (mora bancaria, palabra empeñada con un amigo).
| CONTEXT: Primera vez que el proyecto salir-de-deudas tiene números reales — creado el 2026-05-26, vacío hasta hoy (58 días después), a 8 días del deadline original. Plan completo y detalle de cada deuda en projects/salir-de-deudas/README.md.

[2026-07-23] DECISION: Fabián prefiere esperar antes de avisarle a Arturo (a quien debe $540, vence 31 jul) que no tendrá el monto completo. Se acordó un checkpoint fijo: martes 28 de julio, si no están los $540 completos, ese día se le avisa — no el 31.
| REASONING: Se le advirtió que "esperar a ver" sin fecha es el mismo patrón de falta de rumbo que motivó esta sesión. Fabián mantuvo su decisión de no hablar aún; el checkpoint del 28 es el punto medio entre respetar su decisión y evitar que se convierta en silencio hasta el día del vencimiento.
| CONTEXT: Ver projects/salir-de-deudas/README.md, punto 4 del plan de 8 días.

[2026-08-08] DECISION: Arrancar un negocio de dropshipping con el catálogo de DROPI, bajo marca y dominio NUEVOS (no bajo Shotygames), con cuenta de dropshipper separada. Campañas de Meta creadas por API pero siempre en pausa — Fabián aprueba antes de que gaste.
| REASONING: Shotygames es una marca de juegos de fiesta; meter productos genéricos ahí confunde al cliente y ensucia el aprendizaje del píxel. La API en pausa da automatización sin riesgo de gasto no aprobado.
| CONTEXT: Ver projects/dropshipping/README.md. Bloqueado por credenciales DROPI2_* y token de Meta Marketing API.

[2026-08-08] DECISION: Filtro de entrada al catálogo — múltiplo mínimo 4.5x sobre costo de proveedor. Ningún producto llega a Meta Ads sin pasar la calculadora en verde.
| REASONING: Con los números reales de Fabián (CPA $10, flete $5.50, retorno $3.50, entrega 70%), un producto a múltiplo 3x — el estándar que recomienda todo el mundo en dropshipping — pierde $2.27 por pedido generado. Verificado con projects/dropshipping/calculadora.js, no con supuestos.
| CONTEXT: El sprint de deudas del 31 de julio no se cumplió. Sin colchón para tests por corazonada.

[2026-08-08] DECISION: Cadencia de testing 2-3 productos por semana ($10/día x 3 días cada uno), no un producto diario como pedía Fabián.
| REASONING: Un test de 1 día no saca a Meta de la fase de aprendizaje — el dato no existe y la plata sí se gastó. Mismo presupuesto semanal, data que sí sirve para decidir.
| CONTEXT: Protocolo de 72h con criterios de matar/escalar en projects/dropshipping/README.md.

[2026-08-10] DECISION: Documentar las reglas no escritas de la API de DROPI en projects/dropshipping/API-DROPI.md y guardar en memoria la regla de diffear contra el código que ya funciona antes de teorizar.
| REASONING: Conectar la segunda cuenta de DROPI costó 2 días y medio por un fallo trivial (faltaban headers sec-fetch-* en el login, y se mandaba `authorization` junto a `x-authorization` en las llamadas). Se persiguieron teorías externas — plan vencido, anti-bot, white-label, credenciales malas — y se le pidió a Fabián copiar tokens del navegador y correr snippets, todo innecesario. Fabián señaló dos veces que solo había que replicar lo que ya funcionaba y tenía razón las dos veces.
| CONTEXT: El login automático de la cuenta 12054 quedó funcionando el 2026-08-10. Ver projects/dropshipping/API-DROPI.md y la memoria feedback_replicar_lo_que_ya_funciona.

[2026-08-11] DECISION: El dropshipping se estructura en DOS tiendas separadas por riesgo de Meta, no por gusto: "Truquito" (truquito.ec) para Hogar & Gadgets — se construye primero — y "Avanora Naturals" (avanoranaturals.com) para Salud & Bienestar — se activa después. Business, página y pixel separados. "Importadora Pizarro" queda como paraguas legal (facturación, cuenta DROPI), no como marca de cara al cliente.
| REASONING: Los productos de salud hacen que Meta rechace anuncios y puede banear la cuenta publicitaria; si viven en el mismo pixel que los gadgets, un strike tumba las dos tiendas. Se arranca por gadgets porque es Meta-safe y no tiene ancla de precio pública como los suplementos de farmacia. "Truquito" además regala formato de contenido orgánico ("el truquito de hoy"), que ataca la prioridad de bajar dependencia de ads. La máquina (landing, Sheet, DROPI, bot, cron) es compartida: dos tiendas no es doble ingeniería.
| CONTEXT: Dominios verificados libres por DNS el 2026-08-11. truquito.com estaba ocupado. Ver projects/dropshipping/FLUJO-VENTAS.md.

[2026-08-11] DECISION: La API de Meta Ads quedó conectada por MCP — ya no hace falta configurar token de Marketing API a mano. Incluye crear campañas, subir creativos, leer resultados y buscar en la Biblioteca de Anuncios.
| REASONING: Corrige lo indicado el 2026-08-08, cuando se le pidió a Fabián 1 hora de setup en developers.facebook.com. Ese pendiente queda cancelado.
| CONTEXT: ALERTA detectada al listar cuentas: casi todas las cuentas publicitarias de ShotyGames están en estado UNSETTLED (saldo pendiente con Meta). Solo "Cuenta Publicitaria Prueba 2" (1284579892343452) y "Cuenta Publicitaria 10" (1451115062090627) están ACTIVE. Revisar al tratar el tema deudas.

[2026-08-12] DECISION: El bot de dropshipping NO genera la guía al crear el pedido en DROPI — lo deja PENDIENTE y el proveedor la genera cuando alista el paquete. Un cron cada 2h detecta las guías nuevas y completa el Sheet con número de guía, flete y estado.
| REASONING: En Shotygames Fabián ES el proveedor, así que genera la guía en el acto. En dropshipping el dueño del producto es otro: forzar la guía desde nuestro lado pediría despacho de mercadería que el proveedor todavía no separó. Sin el cron, esos pedidos quedarían invisibles en EN_DROPI sin que nadie note que ya salieron.
| CONTEXT: Se agregó el estado EN_DROPI (no estaba en la lista original de Fabián) para cubrir el limbo entre "cliente confirmó" y "proveedor generó la guía". Ver projects/dropshipping/sheets-pedidos.js y claude-dropshipping.js.

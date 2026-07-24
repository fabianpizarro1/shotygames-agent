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

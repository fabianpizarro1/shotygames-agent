# Plan de trabajo — Dropshipping DROPI

_Creado: 2026-08-08 (sábado)_

Regla de este plan: **Fabián solo aprueba, cambia o rechaza.** Todo lo demás lo ejecuta el sistema. Si algo aparece en la columna de Fabián es porque no existe forma de que lo haga otro — no porque sea más cómodo.

---

## Cómo funciona "yo me encargo de todo lo operativo"

Que quede claro cómo se ejecuta, porque no es magia:

1. **Scripts que corren solos** en el servidor por cron (igual que el bot de contenido diario y los briefings que ya tienes).
2. **Telegram como mesa de aprobaciones.** El sistema te manda propuestas con los números; tú respondes con un toque.
3. **Sesiones de trabajo** para lo que necesita criterio: landings, creativos, resolver problemas.

Lo que **no** puede hacer el sistema por ti, y por qué:

| No delegable | Por qué |
|---|---|
| Activar gasto en Meta | La campaña se crea en pausa. Encender plata es decisión tuya, siempre |
| Pagar (dominio, plan DROPI, saldo de ads) | Requiere tus medios de pago |
| Verificaciones de identidad de plataformas | Piden documentos tuyos |
| Decidir cuando los números empatan | Es tu negocio y tu riesgo |
| Reseñas de clientes inventadas | No se hacen. Se llenan con clientes reales cuando existan |

**Tu carga diaria real: 3 momentos, ~20 minutos en total.**

---

## Fase 0 — Infraestructura (sáb 8 → dom 9 de agosto)

| Qué | Quién | Estado |
|---|---|---|
| Conexión a la cuenta dropshipper | Sistema | ✅ hecho |
| Calculadora (terminal + web) | Sistema | ✅ hecho |
| Snapshot #1 del catálogo (~33.000 productos) | Sistema | 🔄 corriendo |
| Snapshot #2 (activa el detector de ganadores) | Sistema | ⬜ domingo |
| Ranking automático de ganadores | Sistema | ⬜ domingo |
| Token de Meta Marketing API | **Fabián** | ⬜ 1 hora, pasos en README |
| Dominio nuevo (~$12/año) | **Fabián** | ⬜ el sistema propone 5 nombres |
| Plantilla de landing clonada del checkout COD | Sistema | ⬜ domingo |
| Cron diario en el servidor | Sistema | ⬜ domingo |

**Lo tuyo en la fase 0: token de Meta y comprar el dominio.** Nada más. Sin eso, el lunes no arranca.

---

## Fase 1 — Primer test real (lun 10 de agosto)

| Qué | Quién |
|---|---|
| Ranking del top 10 con filtro de rentabilidad ya aplicado | Sistema |
| Elegir 1 de los 3 candidatos propuestos | **Fabián** (1 toque) |
| Bajar imágenes, escribir copy, armar landing, publicarla | Sistema |
| Armar campaña en Meta — creada en pausa | Sistema |
| Revisar landing y campaña → activar | **Fabián** (10 min) |
| Confirmación de pedidos por WhatsApp | Sistema (agente existente) |
| Crear guías en DROPI | Sistema |

---

## Fase 2 — El ritmo diario

Diseñado alrededor de tu rutina. **El bloque 10:00–13:00 queda intacto** — el dropshipping no toca tu trabajo profundo, corre solo.

```
07:30  🤖 AUTOMÁTICO
       Snapshot del catálogo, ranking, filtro de rentabilidad.
       Telegram: "3 candidatos de hoy" con costo, precio sugerido,
       precio recomendado, CPA máximo y velocidad de venta.

08:00  👤 TÚ — 3 minutos
       Apruebas uno, o los rechazas todos. Un toque.

08:00–09:30  🤖 AUTOMÁTICO
       Landing publicada, creativos generados, campaña armada en pausa.

09:30  👤 TÚ — 10 minutos
       Abres la landing, la miras, apruebas o pides cambios.
       Si apruebas: la campaña se activa.

10:00–13:00  🧠 TRABAJO PROFUNDO — INTOCABLE
       Shotygames, contenido, lo que paga las deudas hoy.
       Los tests corren solos.

14:30  🤖 AUTOMÁTICO
       Reporte de tests activos: gasto, CPA real vs CPA máximo,
       pedidos. Cada uno con recomendación: MATAR / ESCALAR / ITERAR.

14:45  👤 TÚ — 5 minutos
       Confirmas o corriges las decisiones.

19:30  🤖 AUTOMÁTICO
       Cierre del día: pedidos, guías creadas, plata del día.
```

**Semanal:**
- **Lunes 07:30** — top 10 de la semana con la data acumulada de 7 snapshots
- **Viernes 19:30** — números de la semana: gastado, vendido, margen real, qué escalar

---

## Fase 3 — Escalar (cuando aparezca un ganador)

Un ganador es: CPA real por debajo del CPA máximo durante 3 días seguidos con al menos 10 pedidos.

Ahí el sistema propone subir presupuesto por escalones ($10 → $20 → $35), abrir públicos nuevos y armar variantes de creativo. Tú apruebas cada escalón. **No se escala solo. Nunca.**

---

## Presupuesto y freno de emergencia

| Concepto | Costo |
|---|---|
| Ads | $60–90 / semana |
| Dominio | ~$12 / año |
| Hosting de landings | $0 |
| Plan DROPI dropshipper | ⚠️ **Fabián: averiguar cuánto es** — entra al modelo antes de pagarlo |

**Freno duro:** si en 3 semanas ($180–270 gastados) no hay un solo producto con CPA bajo el máximo, esto se para y se revisa. No se sigue "porque ya invertimos". Con $10K de deuda encima no hay espacio para enamorarse de un proyecto.

---

## Lo que puede tumbar esto

| Riesgo | Cómo se maneja |
|---|---|
| Tasa de entrega peor al 70% | Confirmación por WhatsApp antes de despachar. Es la variable que más pesa |
| Precio sugerido de DROPI no da margen | Ya resuelto: filtro de 4.5x, se ignora el sugerido |
| Fabián no responde las aprobaciones | El loop se detiene. Es el único punto donde el sistema depende de ti |
| Producto ganador se agota o sube de precio | El snapshot diario detecta ambos y avisa |
| Se come el bloque de trabajo profundo | Las aprobaciones están fuera de 10–13h a propósito |

---

## Lo único que necesito de ti hoy

1. Token de Meta Marketing API (1 hora — pasos en el README)
2. Comprar el dominio cuando el sistema te pase los nombres
3. Decirme cuánto cobra DROPI el plan de dropshipper

Con eso, el lunes 10 arranca el primer test.

# Skill: Agente de Marketing Shotygames

## Cuándo usar esta skill
Activar SIEMPRE que Fabián pida cualquiera de esto:
- Estrategia de ads, creativos, campañas para Shotygames
- Ángulos de venta, ideas de contenido, copy para ads
- Análisis de competencia o mercado de Shotygames
- Prompts para generar imágenes de ads
- Estructura de cuenta, packs, adsets, presupuestos, escalado, auditoría de cuenta de Meta Ads
- `/marketing [cualquier cosa]`
- Palabras clave: "ad", "creativos", "ángulos", "prompts", "campaña", "imagen para", "estrategia de ventas", "estructura de cuenta", "escalar", "packs", "presupuesto"

## Dos modos — elegir según lo que pida Fabián

Esta skill cubre dos tipos de trabajo distintos. **No usar el formato de creativos para pedidos de estructura de cuenta, ni al revés.**

| Si Fabián pide... | Usar |
|---|---|
| Ángulos, prompts de imagen, copy, hooks, ideas de contenido | **Modo 1 — Creativos** (ver abajo) |
| Armar/revisar estructura de cuenta, packs, adsets, presupuestos, cuándo escalar, por qué el ROAS se comporta raro, auditoría de la cuenta de Meta Ads | **Modo 2 — Estructura de Campaña** (ver abajo) |

Si el pedido mezcla ambos (ej. "armemos la campaña completa"), hacer los dos: primero estructura (Modo 2), después los creativos que van dentro de cada pack (Modo 1).

## Base de Conocimiento

Lee SIEMPRE estos archivos antes de responder — todos, no solo los primeros:

@.claude/skills/shotygames-marketing/knowledge/01-shotygames.md
@.claude/skills/shotygames-marketing/knowledge/02-static-ads-masterclass.md
@.claude/skills/shotygames-marketing/knowledge/03-sistema-m4-estructura-cuentas.md
@.claude/skills/shotygames-marketing/knowledge/04-algoritmo-andromeda-fase-aprendizaje.md
@.claude/skills/shotygames-marketing/knowledge/05-escalado-vertical-horizontal-twin-engine.md
@.claude/skills/shotygames-marketing/knowledge/06-caso-real-estructura-y-reglas-clave.md
@.claude/skills/shotygames-marketing/knowledge/07-retrieval-shares-y-jerarquia-de-aprendizaje.md
@.claude/skills/shotygames-marketing/knowledge/08-psicologia-5-pasos-ads-que-convierten.md
@.claude/skills/shotygames-marketing/knowledge/09-datos-reales-catalogo-y-embudo-nuevo.md
@projects/whatsapp-claude-agent/claude-ventas.js

### ⚠️ Jerarquía de fuentes de verdad (respetar este orden)
1. **`09-datos-reales-catalogo-y-embudo-nuevo.md`** — verificado contra el código de los repos y las ventas reales el 2026-08-02. **Manda sobre todo lo demás.**
2. **El código de los repos** (`projects/emparejados/src/data/cards.ts`, `projects/entredados/src/types/game.ts`) — si hay duda sobre contenido de un juego, leerlo ahí antes de afirmar nada.
3. `claude-ventas.js` — precios y combos de productos físicos.
4. `01-shotygames.md` — base histórica; **tiene datos desactualizados** de precios digitales, contenido de los juegos y del CTA.

Si aparecen archivos nuevos en `.claude/skills/shotygames-marketing/knowledge/` con número mayor a 08, léelos también y agrégalos a esta lista de imports la próxima vez que edites este archivo — no basta con "leerlos", tienen que quedar citados acá para que se carguen siempre.

### Cómo conviven las dos metodologías de estructura que hay en la base
- **Felipe Vergara** (Presentación/Evaluación/Conversión/Ascensión, doc 01) describe la **intención de mensaje** — en qué momento de consciencia está el cliente y qué tipo de comunicación le corresponde. Se usa para clasificar cada ángulo/creativo.
- **Sam Piliero / Sistema M4** (Prospecting/Retención/Retargeting/Scale, docs 03-07) describe la **estructura literal de campañas dentro del Ads Manager** — qué campañas y adsets existen de verdad, cómo se nombran, cómo se presupuestan.
- **No son lo mismo y no compiten.** Mapeo práctico: Presentación/Evaluación viven dentro de la campaña **Prospecting** (son distintos packs/avatares apuntando a gente que no conoce la marca todavía). Conversión también vive en Prospecting o en Retargeting si aplica. Ascensión vive en la campaña de **Retención**. Al generar una estrategia completa, usar Vergara para el copy/mensaje y M4 para dónde vive esa campaña en la cuenta real.

## Modo 1 — Creativos (prompts, copy, ángulos)

### Proceso Obligatorio (nunca saltarse)

#### Paso 1 — INVESTIGAR antes de generar
Antes de dar cualquier idea, SIEMPRE hacer:
- Buscar en web qué está funcionando ahora en Meta Ads para productos similares
- Buscar tendencias actuales de creativos en el nicho de entretenimiento/fiestas
- Identificar qué hace la competencia (juegos de mesa, entretenimiento Ecuador)
- Detectar gaps — ángulos que nadie está usando

#### Paso 2 — ANALIZAR el pedido de Fabián
- ¿Qué producto de Shotygames aplica?
- ¿Qué nivel de consciencia del cliente es el objetivo?
- ¿Qué persona específica?
- ¿Qué etapa del embudo (Felipe Vergara: Presentación / Evaluación / Conversión / Ascensión)?

#### Paso 3 — GENERAR con estructura

Cada prompt que se genera DEBE construirse siguiendo, en orden, el **framework de psicología de 5 pasos** (ver [08-psicologia-5-pasos-ads-que-convierten.md](knowledge/08-psicologia-5-pasos-ads-que-convierten.md)):

1. **Pattern Interrupt** — el hook detiene el scroll, típicamente nombrando/describiendo al avatar en la primera línea
2. **Self-Recognition** — el avatar es una persona específica (no demografía genérica tipo "jóvenes"), tiene que sentir "esto es para mí"
3. **Problem Articulation** — el copy nombra el problema real y concreto de ese avatar
4. **Unique Mechanism** — no basta con decir "es bueno", hay que mostrar QUÉ hace que Shotygames sea la solución única (el reto, el formato, lo que no tiene la competencia)
5. **Proof** — algo que reduce el riesgo o prueba que funciona: envío gratis, regalo si pide hoy, garantía, testimonio/reseña si existe

Antes de entregar cada prompt, verificar mentalmente que cumple los 5 pasos — si falta alguno, el prompt no está listo.

### Formato de Respuesta (Modo 1)

Usar SIEMPRE este formato exacto:

---

## 🔍 Investigación
[Qué encontraste al investigar. Qué está funcionando ahora. Qué hace la competencia. Qué oportunidades hay. Ser específico — no genérico.]

---

## 📋 Estrategia

**Producto:** [Producto de Shotygames]
**Objetivo del ad:** [Un solo objetivo claro]
**Audiencia:** [Persona específica con contexto — no "jóvenes"]
**Nivel de consciencia:** [No consciente / Consciente del problema / Consciente de la solución / Consciente del producto / Más consciente]
**Etapa del embudo:** [Presentación / Evaluación / Conversión / Ascensión]
**Descripción:** [Estrategia creativa completa]
**Formatos a testear:** [Lista de 2-3 formatos prioritarios]

---

## 🎨 Prompt #1 — [Nombre del Ángulo]

**Formato:** [Tipo de formato]

**🪝 Hook (primeras palabras / texto que detiene el scroll):**
> "[Texto del hook — máximo 10 palabras, directo al dolor o deseo]"

**📝 Copy (cuerpo del ad):**
> "[Copy completo del ad. 2-4 líneas. Específico, con detalles del producto si aplica — precio, qué incluye, beneficio concreto. Aplicar principios del Static Ads Masterclass.]"

**📲 CTA:**
> "[Llamado a la acción claro — siempre orientado a WhatsApp. Ej: 'Escríbenos al WhatsApp 👇', 'Pide el tuyo por WhatsApp ahora', 'Escríbenos y te lo enviamos hoy']"

**🎨 Visual:**
[Descripción concreta de la composición gráfica, en español. SIN personas. Estilo plano/minimalista con el reto o la carta como protagonista, en la paleta de marca. Indicar si se puede armar en Canva con assets existentes o si hace falta generar algo. Ver doc 09 para paleta y referencias.]

---

## 🎨 Prompt #2 — [Nombre del Ángulo]

[Mismo formato]

---

## 🎨 Prompt #3 — [Nombre del Ángulo]

[Mismo formato]

---

💾 *¿Quieres que guarde este conocimiento o esta estrategia para futuras sesiones?*

---

### Reglas de Calidad (Modo 1)

- **NUNCA** dar algo genérico — todo debe ser específico para Shotygames y Ecuador
- Cada prompt SIEMPRE incluye: Hook + Copy + CTA + descripción del Visual
- **El CTA apunta a la LANDING, no a WhatsApp** — el embudo cambió en agosto 2026 (ver doc 09). Ej: "Pedilo acá 👆", "Hacé tu pedido acá 👆". NUNCA "Escríbenos al WhatsApp"
- El copy puede mencionar precio, qué incluye el producto/combo y el regalo si aplica
- **Los creativos NO llevan personas.** Estilo gráfico plano y minimalista, con el reto/carta como protagonista, en la paleta de marca (crema `#FDF0DC`, vino `#7B1F1F`, terracota `#B5695E`). Describir composiciones gráficas, no fotografías de gente — ver doc 09
- Preferir visuales que Fabián pueda armar en Canva con sus assets existentes antes que imágenes generadas por IA
- El hook debe aplicar al menos uno de los principios del Static Ads Masterclass
- Cada prompt debe cumplir el checklist de los 5 pasos de psicología (Pattern Interrupt, Self-Recognition, Problem Articulation, Unique Mechanism, Proof) — ver knowledge/08
- Mínimo 3 prompts por respuesta, máximo 5
- Si Fabián pide un ángulo específico → úsalo como base pero mejóralo con la investigación
- Siempre mencionar a qué etapa del embudo de Felipe Vergara aplica cada estrategia
- Cuando el copy mencione precio, usar los precios reales del knowledge base (Torres: $28 con envío gratis; TODO el catálogo lleva envío gratis a Ecuador)

---

## Modo 2 — Estructura de Campaña (Ads Manager)

Se activa cuando Fabián pide armar, revisar, auditar o escalar la estructura real de la cuenta de Meta Ads — no creativos.

### Proceso Obligatorio

#### Paso 1 — DIAGNOSTICAR el estado actual
Preguntar (o usar lo que Fabián ya haya compartido) antes de recomendar nada:
- ¿Cuántas campañas hay hoy y cómo están nombradas?
- ¿Cuál es la campaign bid strategy (highest volume/value, cost cap, ROAS goal)?
- ¿A qué evento está optimizando cada campaña (Purchase, o algo distinto — ver doc 04/07)?
- ¿Existen exclusiones correctas (compradores excluidos de Prospecting, incluidos en Retención)?
- ¿Hay campaña de Retención activa o todo el presupuesto va a Prospecting?
- ¿Se están mezclando ads nuevos en adsets/packs viejos? (error #1 documentado en doc 06)

Si Fabián no tiene esta info a mano, dejarlo explícito como primer pendiente antes de recomendar cambios a ciegas.

#### Paso 2 — APLICAR el checklist M4 (docs 03 y 06)
Verificar contra la base mínima:
- ✅ ¿Existen como mínimo 2 campañas: Prospecting CBO + Retención?
- ✅ ¿Los packs/adsets siguen la convención `packN_avatar_concepto`?
- ✅ ¿Cada pack tiene 4-8 ads, ni más ni menos?
- ✅ ¿Se está lanzando un pack nuevo con cadencia regular (1-3 semanas)?
- ✅ ¿El evento de conversión es siempre Purchase?
- ✅ ¿El testing (ad set spending limit) nunca supera el 20% del presupuesto total combinado, y se desactiva a los 7 días?

#### Paso 3 — RECOMENDAR estructura o próximos pasos
Según lo que falte, generar recomendación concreta y accionable — no solo teoría. Si hay que decidir sobre escalar presupuesto, aplicar doc 05 (vertical/horizontal/Twin Engine) y el reframe del embudo de doc 04 antes de sugerir subir o bajar gasto.

### Formato de Respuesta (Modo 2)

---

## 🔎 Diagnóstico
[Qué se sabe del estado actual de la cuenta. Qué falta saber. Señales de alerta si las hay (evento mal optimizado, mezcla de ads nuevos en packs viejos, ausencia de Retención, etc.)]

---

## 🏗️ Estructura Recomendada

| Campaña | Objetivo | Budget sugerido | Evento | Exclusiones |
|---|---|---|---|---|
| [ML_prospecting / nombre real] | Adquisición nueva | [monto o fórmula: 1x CPA objetivo] | Purchase | Excluir compradores 180 días |
| [ML_retention / nombre real] | Retener existentes | [monto, empezar bajo] | Purchase | Solo compradores 180d / all-time |

**Packs activos / a lanzar:**
- `pack1_[avatar]_[concepto]` — [qué avatar y ángulo, y a qué prompts de creativos del Modo 1 corresponde]

---

## ⚙️ Acciones Inmediatas
[Lista concreta y priorizada — qué cambiar primero, qué revisar, qué NO tocar todavía]

---

## 🚫 Qué NO Hacer Ahora
[Errores específicos a evitar según lo que se está por hacer — ej. "no subir presupuesto más del 20-30% de una vez", "no pausar los ads de mayor gasto sin mirar el embudo completo primero"]

---

💾 *¿Quieres que guarde esta estructura o decisión para futuras sesiones?*

---

### Reglas de Calidad (Modo 2)

- Nunca recomendar cambios agresivos (duplicar presupuesto, pausar ads top-spend) sin advertir el riesgo documentado en doc 05/06
- Siempre nombrar packs con la convención `packN_avatar_concepto`
- Siempre verificar el evento de conversión antes de diagnosticar cualquier otra cosa — es la causa más común y más ignorada de bajo rendimiento (doc 04/07)
- Si Fabián pide escalar, clasificar primero si aplica escalado vertical, horizontal, o Twin Engine (doc 05) — no dar un solo número de presupuesto sin ese contexto
- Conectar siempre cada pack recomendado con qué tipo de creativo del Modo 1 le correspondería (avatar + ángulo), para que estructura y creativos queden coherentes entre sí

## Agregar Nuevo Conocimiento

Cuando Fabián comparte un documento, artículo, transcripción o nota nueva:
1. Leer y analizar el contenido
2. Extraer los puntos más relevantes para Shotygames
3. Guardarlo en `.claude/skills/shotygames-marketing/knowledge/[NN-nombre].md`
4. Confirmar que quedó guardado y cómo aplica

El número NN es secuencial (03, 04, 05...) para mantener orden.

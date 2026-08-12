# Sistema M4 — Estructura de Cuentas Meta Ads

## Fuente
Video YouTube: "The Only Facebook Ads Video You Need in 2026" — Sam Piliero (The Moonlighters). 10 años gestionando Facebook Ads, +100 marcas (VaynerMedia, BarkBox, Jake Paul's W, Glam Squad, Young Nails). Sistema aplicado en cuentas desde $200/día hasta $1.8M/mes, mismo funcionamiento sin importar el tamaño.

## La idea central
> "La estructura es la base de tu casa. Puedes tener creativos increíbles, buena oferta, buen producto — pero sin estructura de cuenta, solo llegas hasta cierto punto."

Sin estructura correcta = techo de crecimiento, sin importar qué tan buenos sean los creativos o la oferta.

---

## M1 — Estructura de Campañas (la base)

### 2 campañas núcleo (obligatorias) + 2 opcionales

**1. Prospecting CBO (obligatoria)**
- Objetivo único: conseguir clientes NUEVOS
- Sistema modular: se organiza en "packs" (adsets) agrupados por **concepto/avatar**
- Budget mínimo: 1x tu CPA objetivo (ej. si CPA objetivo = $10, budget mínimo = $10/día)
- Bid strategy: highest volume/value
- Audiencia: completamente amplia (Advantage+ activado), sin segmentar por intereses
- Exclusión: excluir a compradores existentes (ellos van en Retención)
- Conversión: SIEMPRE optimizar a evento de **Purchase**, nunca a Add to Cart o Initiate Checkout — "Facebook te da lo que le pides optimizar"
- Ventana de atribución: 7-day click, 1-day engagement, 1-day view (la más amplia posible)

**2. Retención (obligatoria)**
- Enfocada 100% en compradores pasados
- Aquí van: ads ganadores, evergreen, promos, upsells, downsells
- Pocos adsets (1-2), agrupando todo para lograr alta frecuencia
- **"La mayoría de los negocios de e-commerce no ganan dinero en la primera compra — ganan en retención."** Es la vaca lechera del negocio.
- Segmentar por: compradores últimos 180 días + compradores de todos los tiempos
- Budget: empezar bajo, subir gradualmente. Cuidar la frecuencia (no saturar)

**3. Retargeting (opcional)**
- Solo se activa si al revisar audiencias "engaged" ves que estás gastando de más ahí — entonces la sacas del Prospecting y la aíslas
- Audiencias típicas: engagers de FB/IG, visitantes de sitio 30-60 días, add-to-cart/checkout iniciado 90+ días
- Creativo enfocado en: objeciones, ofertas, urgencia — "empujar a la gente sobre la barrera para comprar"

**4. Scale (opcional, solo cuentas grandes/maduras)**
- Un solo adset amplio con SOLO tus 5 mejores ads de siempre (los que conoces "como la palma de tu mano")
- Único propósito: forzar más presupuesto a los ganadores probados

### Sistema de "Packs" (adsets) — la clave del crecimiento
- Cada pack = un concepto/avatar específico, nombrado como `avatar_concepto_número` (ej: `mamas-fiesteras_torre-normal_01`)
- Regla de oro: **4 a 8 ads por pack**. Más que eso es caótico, menos no es suficiente volumen de testeo
- **Cadencia: lanzar un pack nuevo cada 1-2-3 semanas, consistentemente** — "como un tambor"
- Límite de gasto en adset nuevo: mínimo diario = tu CPA objetivo (o máx 20% del presupuesto total si el CPA es muy alto)
- Después de 7 días, se quita el forzado de gasto (sin resetear aprendizaje): si el pack ganó, sigue vivo; si perdió, muere solo
- Por qué funciona: en un sistema CBO, el presupuesto migra automáticamente hacia los adsets que mejor rinden — pero solo si hay variedad constante de packs compitiendo

---

## La era "Andromeda" — cómo cambió el targeting

Antes: audiencia → creativos para esa audiencia.
Ahora: **el creativo ES el targeting**. El anuncio, si nombra/habla directamente a un avatar específico, es lo que hace que Meta lo entregue a esa persona correcta — ya no hace falta segmentar por intereses.

### Los 4 elementos de un buen ad (aplican directo a los prompts de creativos)
1. **Llama al avatar** — "esto me habla a mí" (self-selection)
2. **Educa sobre el problema** — hace que el avatar sienta que el problema es real
3. **Posiciona tu producto como LA solución única** (el mecanismo)
4. **Entrega una oferta** — en bandeja de plata, con urgencia y bajo riesgo, para que compren ya

**Ejemplo citado (marca Garunes, vendida en $1B):** cada ángulo apunta a un avatar completamente distinto — "pierde peso, no tu metabolismo" (avatar GLP-1), "mejor caca en 2025" (avatar digestión), pelo saludable, comparación directa vs. competencia (AG1). Cada avatar = ángulo, copy y creativo 100% distintos entre sí.

**Aplicación a Shotygames:** en vez de un solo "ad genérico para jóvenes", cada pack debería atacar un avatar puntual — ej. "el que siempre organiza la previa", "la pareja aburrida de rutina", "el que no sabe qué regalar" — con su propio ángulo, hook y creativo. Esto conecta directo con la regla de "persona específica" que ya usa la skill.

---

## El "Creative Flywheel" (rueda de creativos)

Proceso continuo, no un evento único:
1. Lanzar ads nuevos (dentro del pack)
2. Esperar 7-14 días — dejar que se acumule data
3. Analizar resultados con **atribución incremental** (no solo lo que Meta reporta)
4. Identificar ganadores (los que más gastan Y cumplen el KPI real)
5. Crear iteraciones/variaciones de esos ganadores
6. "Robar como artista" — ver qué formatos repite la competencia constantemente (si lo repiten, es porque funciona) y usarlos como inspiración, no copia literal

---

## M3 — "El caballo más rápido" (optimización avanzada, para cuando ya hay volumen de datos)

Idea: no todos los segmentos rinden igual — no repartas presupuesto parejo entre todos.

- Revisar breakdowns en Ads Manager: edad, género, plataforma, ubicación, día de la semana, hora del día
- **Nunca cortar de raíz un segmento que rinde mal** (ej. "quitar 65+") — se pierde alcance y potencial de escala
- En su lugar: usar **Value Rules** — reglas que ajustan el bid (ej. -10% a -20%) a segmentos débiles sin eliminarlos, aplicadas en un adset nuevo (como un A/B test) para no ensuciar el aprendizaje del original
- **Cost Caps / ROAS goals / Bid Caps**: solo activarlos cuando la cuenta ya tiene volumen serio de gasto (referencia del video: $100K+). Antes de eso, dejar en "highest volume" — los cost caps no arreglan una cuenta con problemas de fondo, solo dan estabilidad cuando ya hay data confiable
- Regla fuerte: **nunca correr bid cap/cost cap al mismo tiempo que highest volume** — se pisan entre sí y distorsionan resultados

---

## Aplicación directa a Shotygames

Dado el estado actual (95% ventas por Meta Ads, presupuesto de ads "comiendo demasiada utilidad" — ver [current-priorities.md](../../../../context/current-priorities.md)):

1. **Diagnóstico probable:** si hoy Shotygames corre todo en pocas campañas/adsets sin sistema de packs, es candidato directo a estar dejando plata en la mesa — el problema puede no ser el producto/oferta sino la estructura de cuenta.
2. **Retención es la oportunidad más barata y más ignorada** — con el volumen de clientes que ya compraron Torres/Combos, una campaña de retención bien armada (evergreen + promos + upsell a combos más caros) puede bajar el costo de adquisición ponderado del negocio sin gastar más en prospecting.
3. **El sistema de packs por avatar** encaja directo con la skill de creativos: cada tanda de 3-5 prompts que genera la skill debería mapear a UN avatar/concepto específico, no mezclar ángulos random — y lanzarse con cadencia regular (semanal/quincenal) en vez de esporádica.
4. Antes de tocar cost caps o settings avanzados, revisar primero si existe la estructura base (Prospecting + Retención con exclusiones correctas) — es más probable que ahí esté la ineficiencia.

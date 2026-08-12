# Caso Real: +121% ROAS en 30 Días Solo con Estructura (+ reglas que faltaban)

## Fuente
Video YouTube — mismo autor (Sam Piliero / The Moonlighters). Es la versión "paso a paso 2026" de la estructura M4 ya documentada en [03-sistema-m4-estructura-cuentas.md](03-sistema-m4-estructura-cuentas.md) — este video confirma y agrega detalles nuevos, no la reemplaza.

## El caso real (por qué importa)
Marca de moda, cuenta chica: solo $14,000 gastados en 30 días. Antes de trabajar con la agencia estaba en **0.63 ROAS** (perdiendo plata). En 30 días llegaron a **1.4 ROAS** — **+121%**.

**La causa NO fue:**
- Ninguna promoción/sale nueva
- Ningún producto nuevo
- Ningún creativo nuevo

**La causa SÍ fue:** pura implementación táctica en Ads Manager — específicamente, **condensar la cuenta de 165 ads a solo 62**, reorientar breakdowns (placement, edad, género, día de semana) hacia lo que mejor rendía, e implementar la estructura M4 correctamente.

> "Necesitamos más ads, sí — pero solo si están posicionados correctamente. Por eso poner la base primero es tan crítico."

**Lección directa:** el problema de gasto/utilidad de Shotygames podría no resolverse agregando más creativos — podría resolverse **limpiando y reestructurando lo que ya existe**, antes de producir nada nuevo.

---

## Confirma: la cuenta base son solo 2 campañas

Aunque hay 4 tipos posibles (Prospecting, Retención, Retargeting, Scale — ver doc 03), el autor es explícito: **"esto es lo que haría con 9 de cada 10 marcas nuevas que empiezan con nosotros"** — arrancar con solo **Prospecting + Retención**. Todo lo demás (retargeting, scale, bid caps, cost caps, "zombie campaigns") se agrega después, orgánicamente, a medida que la cuenta lo necesita.

**Metáfora clave del video:** el negocio (proveedores, costos, operación) es un **sistema abierto** — cada marca es 100% única y no se debe comparar directamente con otras. Pero el **Ads Manager es un sistema cerrado** — funciona con las mismas reglas para todas las cuentas, como un deporte: hay reglas fijas, y la ventaja competitiva está en exprimir esas reglas al máximo, no en reinventarlas.

---

## Reglas nuevas / más específicas que no estaban en el doc 03

### 1. Convención de nombres exacta
`pack{número}_{avatar}_{concepto}` — ej. `pack1_mama-fiestera_torre-normal`. Si no hay un concepto claro todavía, al menos poner el avatar. La regla: con solo mirar el nombre del adset en el reporte, tenés que entender de qué se trata sin abrir nada.

### 2. Regla dura: nunca inyectar ads nuevos en packs viejos
> "Cada vez que lanzamos ads nuevos, los lanzamos en un pack nuevo o adset nuevo. NUNCA inyectamos ads nuevos en packs viejos. Que esto se te grabe."

Es la causa exacta del ejemplo del video anterior (05) donde un ad pasó de $11 a $2,000 de gasto y acaparó toda la cuenta — pasó por mezclar ads nuevos en una campaña ya consolidada.

### 3. Fórmula exacta del "ad set spending limit" (probar packs nuevos)
- Mínimo diario promedio = 1x tu CPA objetivo
- Tope duro: nunca más del **20% del presupuesto total de la cuenta** en testing combinado (sumando todos los adsets en fase de prueba a la vez)
- Se mantiene ese mínimo forzado por **exactamente 7 días**, después se desactiva (sin resetear el aprendizaje) — si ganó, sigue vivo solo; si no, se apaga solo

### 4. Exclusión de compradores = ventana de churn de tu negocio, no un default fijo
180 días es lo típico en e-commerce, pero si el ciclo de recompra real es más largo, extender a 270 o 365. Se debe usar la ventana real del negocio, no copiar el default.

### 5. Retención: usar también catálogo
Además de reciclar los mejores ads de Prospecting y sumar promos/lanzamientos, se recomienda activar catálogo de productos en Retención — CPMs baratos porque le hablás a gente que ya te compró y ya confía en la marca.

### 6. Primary text: mínimo 2-3 variantes REALMENTE distintas
Error común: poner "Compra tus zapatos" y "Compra tus zapatos hoy" como si fueran variantes — son básicamente el mismo texto y no generan señal nueva. Las variantes deben ser genuinamente distintas entre sí para que el algoritmo aprenda algo útil.

### 7. CTA: "Shop now" es el default en ~80% de los casos
Otras opciones válidas: "Get offer" (si hay promo activa), "Learn more" (si hay que llevar a leer algo primero), "Order now" (a veces rinde mejor que Shop now, vale la pena testear).

### 8. Pro tip: correr "número de conversiones" y "valor de conversiones" en paralelo
Si el presupuesto lo permite, correr ambas estrategias en 2 campañas de Prospecting separadas (no solo una) suele rendir mejor que elegir una sola de entrada — dejar que la data diga cuál gana en la práctica.

### 9. Advantage+ Creative: regla simple para decidir qué activar
Si la mejora **modifica** el anuncio (recorte automático, cambio de color, música, animaciones, fondo generado) → **desactivar**. Si solo **agrega/mejora alrededor** sin tocar el creativo original (overlays, mejoras de texto, spotlights, revelar detalles con el tiempo) → **activar**. Regla mental simple para no perder tiempo revisando 20+ toggles cada vez.

### 10. Traducir a todos los idiomas si aplica
Si el negocio vende en más de un idioma/país, activar "traducir a todos" amplía alcance real — la mayoría de los negocios NO lo hace y se quedan solo en su idioma nativo por default, dejando alcance sobre la mesa.

---

## Aplicación directa a Shotygames

1. **Antes de pedirle más creativos a la skill, auditar lo que YA está corriendo:** ¿cuántos ads activos hay hoy en la cuenta de Shotygames? Si hay ads viejos mezclados con nuevos en las mismas campañas/adsets, ese solo movimiento (condensar y reordenar en packs limpios) puede mover el ROAS más que cualquier creativo nuevo — tal como pasó en el caso real (+121% sin cambiar nada de producto ni oferta).
2. **Aplicar la convención de nombres `packN_avatar_concepto` desde ya** en cualquier campaña nueva que se arme — esto se puede pedir directo a la skill al generar briefs, para que cada tanda de prompts venga con su nombre de pack sugerido.
3. **Regla no negociable: los próximos creativos que salgan de la skill van a un pack NUEVO, nunca se mezclan en un adset existente.**
4. **Empezar simple: Prospecting + Retención únicamente.** No hace falta correr Retargeting ni Scale todavía si la cuenta no tiene ese volumen — coincide con la recomendación de priorizar Retención primero (ver doc 03), que hoy parece subutilizada.
5. **Activar catálogo en Retención** en cuanto esté disponible — con el catálogo de Torres/Combos ya definido en [claude-ventas.js](../../../projects/whatsapp-claude-agent/claude-ventas.js), es una implementación relativamente simple y barata en CPM para reimpactar compradores.

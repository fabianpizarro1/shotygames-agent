# Cómo Funciona el Algoritmo Paso a Paso — Retrieval, Shares y Jerarquía de Aprendizaje

## Fuente
Video YouTube — mismo autor (Sam Piliero / The Moonlighters). Explica el algoritmo de Meta (Andromeda) en 6 pasos simples.

## Los 6 pasos del algoritmo

### 1. Retrieval (recuperación) — el matcheo inicial
Tu creativo entra a una "bolsa" donde se agrupa con cientos de miles de otros creativos, según lo que la IA percibe que ES tu anuncio (tono, formato, a quién parece hablarle). Se agrupa por **avatar** — igual que en los docs anteriores, tu avatar se empareja con uno de millones de perfiles de persona reales que maneja Meta.

### 2. Matching avatar → problema
Una vez agrupado el avatar, Meta lo empareja con los problemas específicos que ese avatar típicamente tiene — así tu ad puede mostrarse como LA solución a ese problema puntual. (Refuerza directo la fórmula Avatar + Ángulo = Concepto del doc 04.)

### 3. La métrica proxy #1 que nadie menciona: **Shares (compartidos)**
> "Shares son el nuevo proxy de rendimiento. Mientras más shares tenga tu ad, más probable es que escale bien. Es el input número uno."

Por qué: los shares son la señal más directa hacia conversión — si alguien comparte un ad, es la prueba social más fuerte de que ese contenido realmente conecta y va a mover gente a comprar.

**Después de shares**, importan el resto de las métricas de engagement (comentarios, likes, scroll-stop, tiempo de retención) — Meta trata tu ad casi como un post orgánico: si mantiene a la gente en la plataforma, lo favorece.

**Implicación práctica:** un creativo que genera shares y comentarios reales (no solo clics) tiene ventaja estructural en el algoritmo, más allá de si el copy "vende directo". Esto es un argumento fuerte a favor de formatos tipo infográfico/educativo o contenido que parece orgánico (ya mencionado en el Static Ads Masterclass, doc 02) — generan más engagement social que un ad puramente transaccional.

### 4-5. Dónde vive el aprendizaje — 5 niveles, de abajo hacia arriba
El aprendizaje se acumula y fluye en cascada:

1. **Píxel** (incluye Conversions API) — todo el aprendizaje se agrega acá primero
2. **Cuenta** — guarda conversiones de por vida asociadas a esa cuenta. Por esto las cuentas "calientes" (con historial) rinden mejor que las cuentas frías, y por esto es riesgoso meter un vertical de negocio totalmente distinto en la misma cuenta — contamina el histórico
3. **Campaña** — contenedor de adsets. Mientras más relevantes sean los adsets entre sí dentro de una campaña, mejor optimiza el presupuesto CBO entre ellos
4. **Adset (pack)** — contenedor de ads. El aprendizaje colectivo de todos los ads de ese adset se consolida ahí
5. **Ad individual** — el cambio más grande de la era Andromeda: antes el aprendizaje paraba en el adset, ahora **cada ad individual se empareja con personas individuales**. Por eso hoy se puede meter diversidad de creativos dentro de un mismo adset sin que eso "rompa" el aprendizaje del conjunto — cada ad aprende su propio matching.

El flujo es bidireccional: los ads alimentan al adset, los adsets alimentan a la campaña, la campaña alimenta a la cuenta y al píxel.

### 6. Eventos estándar — el "conocimiento compartido" gratis entre todas las cuentas de Meta
Esta es la pieza más importante y menos conocida del video:

- **Eventos estándar** (Purchase, Add to Cart, Initiate Checkout, etc.) están compartidos entre TODAS las cuentas publicitarias del mundo que usan Meta. Facebook ya sabe, de millones de anunciantes, qué tipo de persona tiende a hacer Add to Cart, y qué tipo de persona tiende a comprar — sin que vos le hayas pagado ni aportado ese dato.
- **Eventos personalizados/custom:** Facebook NO tiene ningún conocimiento previo sobre ellos. Solo sabe que "se disparó" — cero contexto de quién lo hace ni por qué.

**Por qué esto es la razón #1 de optimizar siempre a Purchase (evento estándar):** al elegir un evento estándar, tu cuenta hereda gratis todo ese conocimiento acumulado de millones de otros anunciantes. Elegir un evento custom te deja empezando de cero, sin ese "conocimiento heredado". Esto refuerza y explica el *por qué* detrás de la regla ya documentada en el doc 04 ("optimizar siempre a Purchase, nunca a Add to Cart/Checkout").

## La secuencia completa resumida
1. Tu ad entra al sistema de retrieval y se empareja por avatar
2. Meta usa el evento estándar elegido para saber quién es probable que actúe
3. Usa shares como proxy inicial para encontrar la primera conversión
4. Una vez que consigue la primera compra, usa esa data real para encontrar la segunda, la tercera, la cuarta...
5. El sistema empieza adivinando con proxies (shares, engagement) y se vuelve cada vez más preciso a medida que acumula conversiones reales propias de tu cuenta — "densidad de señal" creciente

---

## Aplicación directa a Shotygames

1. **Priorizar formatos con potencial real de compartir/comentar**, no solo de vender directo — un creativo tipo "reto/juego" mostrado en acción (alguien tumbando la torre, reacciones genuinas) tiene más chance de generar shares que un flyer de producto con precio. Esto es coherente con la naturaleza social del producto (juegos para fiestas) — el contenido debería sentirse "compartible entre amigos", no solo "vendible".
2. **Nunca mezclar verticales o experimentos raros en la cuenta principal de ads de Shotygames** — el histórico de conversiones vale, no arriesgar esa cuenta "caliente" con pruebas ajenas al negocio.
3. **Confirmar que el píxel/evento de Purchase esté limpio y sea el único optimizado** — dado que esta es la fuente del conocimiento gratuito compartido entre cuentas, cualquier ruido acá (eventos mal disparados, duplicados, o campañas optimizando a Add to Cart) le está costando a Shotygames el acceso a ese conocimiento acumulado de Meta.
4. **Con el sistema de packs ya definido (docs 03 y 06):** ahora sabemos que se puede meter variedad real de creativos dentro de un mismo pack sin miedo a "romper" el aprendizaje del adset — cada ad individual aprende su propio matching. Esto le da más libertad a la skill de generar 3-5 ángulos distintos por pack sin preocuparse de que compitan mal entre sí.

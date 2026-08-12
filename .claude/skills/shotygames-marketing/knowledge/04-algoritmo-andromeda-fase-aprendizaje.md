# Cómo Funciona el Algoritmo Andromeda (y por qué no hay que pelear contra él)

## Fuente
Video YouTube — mismo autor que el sistema M4 (Sam Piliero / The Moonlighters). Ejemplos: cuenta que pasó de $800K a $8.9M en 6 meses (+987%), otra con +126% en gasto manteniendo ROAS plano, otra pequeña ($30K en 6 meses) con ROAS hasta 24.4.

## La idea central
> "La mayoría cree que el algoritmo trabaja en su contra. En realidad la mayoría trabaja CONTRA el algoritmo en vez de A FAVOR de él."

Cada vez que el algoritmo cambia y todos entran en pánico, es el momento ideal para aprovechar — "cuando ellos hacen zig, nosotros hacemos zag".

---

## Qué optimiza realmente el algoritmo: solo 2 cosas

En **Campaign bid strategy** (nivel campaña), normalmente configurado en "highest volume/value", el algoritmo solo mira:

1. **Volumen** — ¿puede esto escalar? ¿puede gastar más?
2. **Valor** — ¿puede hacerlo de forma eficiente, devolviendo valor real?

**Por qué a veces un ad gasta mucho y no rinde:** el algoritmo detecta que ESE ad es "escalable" (marca la casilla de volumen), aunque no esté marcando la de valor. Un verdadero ganador cumple ambas.

El "valor" se conecta directo con el **performance goal** a nivel adset:
- **Maximize number of conversions** → prioriza cantidad de gente que compra (la mayoría de marcas usa esto)
- **Maximize value of conversions** → prioriza ingreso total (mejor si hay tickets muy variables)

Y todo esto se ata al **evento de conversión elegido**. Por eso en el 99.99% de los casos se debe optimizar directo a **Purchase** — Meta tiene toda su data histórica entrenada sobre ese evento estándar, y es literalmente lo único que le importa a un negocio (vender).

**Resumen de la cadena:** Campaign bid strategy (volumen+valor) → Performance goal (conversiones o valor) → Conversion event (Purchase). Los tres deben estar alineados.

---

## Avatar + Ángulo = Concepto (el verdadero significado de "el creativo es el targeting")

Decir "el creativo es el targeting" es demasiado vago. La fórmula concreta:

**Avatar** (a quién le hablas) **+ Ángulo** (problema/solución específico) **= Concepto**

Ese concepto es lo que hace el targeting por ti — el sistema de Meta empareja el ad con la persona que (a) se identifica con el avatar llamado en el ad Y (b) tiene historial/probabilidad de actuar sobre ese evento de conversión, según las señales que Meta ya tiene de ella.

**Aplicación directa a la skill de creativos de Shotygames:** cada prompt que genera la skill NO debe ser solo "un ad para jóvenes que quieren fiesta" — debe nombrar un avatar concreto + un ángulo problema/solución específico. Ej: avatar "el que organiza la previa y siempre repite lo mismo" + ángulo "la previa se pone aburrida siempre → Torre de Shots la anima en minutos". Esto conecta con el sistema de "packs" ya documentado en [03-sistema-m4-estructura-cuentas.md](03-sistema-m4-estructura-cuentas.md) — cada pack = un avatar+ángulo distinto.

---

## La fase de aprendizaje ("learning phase") — por qué no hay que tenerle miedo

El miedo típico: pausar y relanzar ads constantemente cada vez que algo no arranca rápido — "el death loop". Esto es contraproducente.

**Qué significa realmente "learning limited":**
- NO significa que el ad esté mal, ni que no pueda gastar o rendir
- Solo significa que todavía no está generando resultados *estables/consistentes*
- La fase "Active" llega cuando el sistema ya tiene suficiente data para dar resultados predecibles

**Por qué el ROAS baja al escalar (y por qué NO es necesariamente malo):**

El embudo tiene 3 niveles de consciencia:
- **Fondo de embudo:** consciente del problema, la solución Y la marca — compra rápido
- **Medio de embudo:** sabe que necesita "algo" pero no conoce tu marca todavía
- **Tope de embudo:** ni siquiera sabe que existe una solución a su problema — recién se está enterando

A medida que se gasta más presupuesto, los primeros dólares capturan al fondo de embudo (conversión rápida). Según se sigue escalando, el gasto empuja hacia arriba en el embudo — gente que tarda más en decidir, no porque el ad esté fallando, sino porque literalmente están más lejos de comprar.

**El error común:** ver que el ROAS baja y asumir que algo se rompió, y apagar la campaña. La realidad: se está capturando mercado nuevo que de otra forma nunca hubiera conocido la marca — solo necesita más tiempo para convertir.

**La lección práctica:** cuando se escala presupuesto, subir gradual (ej. +10% a la vez) agrega pocas "personas de tope de embudo" nuevas. Subir agresivo agrega muchas de golpe, lo cual genera más ruido/lentitud en resultados. En ambos casos, **la solución es paciencia**, no pausar y reiniciar.

---

## Aplicación directa a Shotygames

1. **Antes de tocar nada del algoritmo:** verificar que las 3 piezas estén alineadas — bid strategy en highest volume/value, performance goal en maximize conversions, evento optimizado = Purchase (no Add to Cart ni Initiate Checkout). Si Shotygames está optimizando a un evento distinto de Purchase, ese es un candidato fuerte al problema de "ads que gastan pero no convierten".
2. **Dejar de pausar/relanzar packs por pánico** cuando un adset entra en "learning limited" los primeros días — coincide con la disciplina de "esperar 7-14 días antes de analizar" que ya está en el sistema M4.
3. **Reframe del ROAS que baja al escalar gasto:** si se decide subir presupuesto en Prospecting, es normal y esperable que el ROAS baje un poco al principio — no es señal automática de que algo esté roto, puede ser simplemente que se está llegando a gente más arriba del embudo. Evaluar con paciencia antes de recortar.
4. **Cada concepto de ad (cada "pack") debe nombrar avatar + ángulo explícitamente** — esto ya lo exige el proceso de la skill ("persona específica", "nivel de consciencia"), pero ahora hay marco teórico de por qué es literalmente el mecanismo de targeting de Meta, no solo buena práctica de copy.

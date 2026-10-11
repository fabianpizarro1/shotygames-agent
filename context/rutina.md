# Rutina y Sistema de Energía de Fabián

_Basado en ciencia de productividad y salud (Sebastián Castro, médico). Aplicar siempre al organizar el calendario o planificar la semana._

---

## El día ideal de Fabián (lunes a viernes) — versión 2, vigente desde 2026-10-12

_La versión del 4-oct (despertar 07:00, gym 08:15, profundos 10:10-12:30 y 14:00-16:30) está en `archives/rutina-2026-10-v1/`; la de junio en `archives/rutina-2026-06/`. Esta la definió Fabián el 11-oct y es la que usa la app Progreso (`projects/progreso/src/lib/agenda.ts`) y el bot de Telegram (`rutina.js`), y está cargada como eventos repetidos en los calendarios **Rutina**, **Comidas** y **Ejercicio** de Google Calendar (script: `scripts/rutina-calendario-2026-10-v2.js`). Si cambia una, cambiar todas._

```
06:00–06:45   Agua, aseo — SIN redes + Biblia y oración                  [Rutina]
06:45–07:00   Comida pre-entreno                                          [Comidas]
07:00–09:00   Gym (ir, entrenar y volver: 2 h en total)                   [Ejercicio]
09:00–09:30   Desayuno (después del gym)                                  [Comidas]
09:30–10:00   Ducha + prepararme                                          [Rutina]
10:00–10:30   Revisión de logística #1: guías + novedades (3 tiendas),
              pedidos y Meta — revisar, no optimizar                      [Rutina]
10:30–13:00   🧠 PROFUNDO #1 (150 min)                                    [Rutina, libre]
13:00–13:30   Pausa: caminar o estirar (zona 2)                           (sin evento)
13:30–14:30   Almuerzo                                                   [Comidas]
14:30–17:00   🧠 PROFUNDO #2 (150 min)                                    [Rutina, libre]
17:00–17:30   Revisión de logística #2: guías, novedades, urgentes       [Rutina]
17:30–17:45   Snack                                                       [Comidas]
17:45–19:00   Producción / sistemas / secundarias                         [Rutina, libre]
19:00–20:00   Vida personal — familia, pareja, amigos (sin culpa)         [Rutina, libre]
20:00–21:00   Merienda                                                    [Comidas]
21:00–21:20   Revisión de logística #3: la última del día                 [Rutina]
21:20–22:00   Vida personal — desconectar, sin trabajo                    [Rutina, libre]
22:00–22:20   Cerrar el día + Top 3 de mañana                             [Rutina]
22:30          Dormir (7,5 h) — viernes y sábado 23:30
```

Inglés: en pausa desde el 11-oct (salió del calendario y del 80% semanal de la app). Para volver, restaurar el hábito en `tipos.ts` y agregar el bloque.

Pedido nuevo = microinterrupción de 1–2 min y de vuelta. Nunca excusa para abrir redes ni revisar campañas.

**Fines de semana:** sin cambios, salvo que el Desayuno pasa al calendario Comidas. Sábado y domingo 10–22h en CandyShots; domingo duerme 22:30 (el lunes se despierta a las 06:00).

**Pendiente:** armar con Claude la rutina de comidas (qué va en pre-entreno, desayuno, almuerzo, snack y merienda) y la de gym (5 sesiones/semana).

---

## Tema de cada día

| Día | Profundo #1 | Profundo #2 |
|---|---|---|
| Lunes | CEO: números + elegir UN cuello de botella | Ads ShotyGames — tanda 1 (3-5 creativos) |
| Martes | Producto activo ShotyGames | Producto activo (diseño, proveedor, costos, prototipo…) |
| Miércoles | Product Lab: investigar y seleccionar | Ofertas, landings, creativos, campañas — cola de 7 |
| Jueves | Sistemas + delegación: ¿qué dejo de hacer yo? | CandyShots: procesos, recetas, inventario, caja |
| Viernes | Ads: ganadores + tanda 2 | Contenido + finanzas + plan semana · stock para sáb-dom-lun |
| Sábado | CandyShots 10–22h (observar cuellos de botella, grabar contenido) + revisión mínima | |
| Domingo | CandyShots 10–22h + revisión semanal de 30 min | |

---

## Qué va en cada bloque

### Profundo (10:30–13:00 y 14:30–17:00)
Crear, pensar, construir: producto activo, ads, Product Lab, SOPs, estrategia, contenido. **Prohibido:** WhatsApp, Meta, redes, coordinar con Nerea, compras.

### Operativo (revisiones 10:00, 17:00 y 21:00; bloque 17:45–19:00)
Guías, novedades, Nerea, compras, trámites, producción por lotes.

---

## Reglas de asignación (usar al planificar)

| ¿La tarea es...? | Va en |
|---|---|
| Crear, pensar, estrategia, contenido | Profundo #1 o #2 (según el tema del día) |
| Gestionar, coordinar, responder, comprar | 12:30 o 16:30–17:35 |
| Social, personal, familia | Después de 17:35 |
| Muy larga (más de 2h) | Dividir entre Profundo #1 y #2 |

---

## Reglas de vida (no negociables)

**Sueño:**
- Despertar: 06:00 de lunes a viernes (lo exige gym de 2 h + desayuno + ducha antes de la revisión de las 10:00); fin de semana 07:00
- Dormir: 22:30 domingo a jueves, 23:30 viernes y sábado — 7–7,5 h
- No alcohol 3h antes de dormir (2 cervezas = -50% recuperación de sueño)
- No trabajo profundo ni mails de trabajo después de las 21h
- No comer después de las 21h

**Ejercicio:**
- Gym: 5 sesiones/semana, 07:00–09:00 con ida y vuelta (empuje, tirón, running+core, piernas, full body)
- Zona 2: 75–90 min/semana — trotar suave o caminar rápido (puede ser la caminata 13–14h)
- HIIT: 1–2x/semana — 4 min máxima intensidad + 4 min descanso, repetir 4 veces
- Pasos: 8,000–10,000 diarios

**Alimentación:**
- Desayuno: proteína alta + bajo glucémico (huevos, yogur, frutos rojos, nueces). No harinas solas.
- Almuerzo: comida más grande (proteína + fibra + verduras)
- Cena: liviana y temprana — proteína fácil + carbohidrato lento (batata, quinoa) + verduras
- Durante trabajo profundo: solo café o agua, no comer
- Cafeína: esperar 1–2h después de despertar. Cortar antes de las 14h.
- Creatina (si la toma): 5g diarios con el almuerzo

---

## Por qué importa

Los bloques profundos son los que pagan las deudas. Si ese tiempo se gasta en WhatsApp y gestión operativa, no hay energía ni tiempo para crear contenido, escalar campañas o lanzar nuevos productos. El sistema ya existe — el problema es respetarlo.

**El vicio más costoso:** Quedarse despierto tarde + alcohol antes de dormir → sueño sin recuperación → energía baja al día siguiente → procrastinación → menos ingresos → más deudas. Ciclo.

---

_Horario actualizado: 2026-10-11 (versión 2; antes 2026-10-04). Reglas de salud: 2026-06-29. Fuente: video "Cómo Organizar tu Día Para Estar Más Sano" — Sebastián Castro_

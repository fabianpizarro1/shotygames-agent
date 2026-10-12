# Metas — Q4 2026 (octubre–diciembre)

_Última actualización: 2026-10-11. La versión Q2 está en `archives/goals-2026-Q2.md`._

Quedan 81 días de año. Q4 es la temporada fuerte de juegos de fiesta: Halloween (31-oct), Black Friday (27-nov), Navidad (25-dic) y **Año Viejo (31-dic), el pico**. Lo que no esté listo a mediados de noviembre se vende en enero.

Las tareas con fecha viven en la app Progreso (`projects/progreso`, script `scripts/progreso.mjs`). Este archivo es el mapa; la app es el detalle.

---

## Metas del trimestre

| # | Meta | Cómo se sabe que se cumplió (31-dic) |
|---|---|---|
| 1 | **Salir de deudas** (mora en 0 + Arturo + Joselin) | Mora de tarjetas en 0 el 16-oct · Arturo pagado el 23-oct · Joselin pagado el 20-nov · plan de pagos por escrito con papá y mamá el 6-nov y primer abono el 4-dic |
| 2 | **Cartas para Grupos vendiendo antes de Navidad** | El juego ya existe (69 cartas, diseño que se vendía antes): se cotiza con las cartas de muestra y se rediseña logo, retos y caja. Pedido a imprenta el 6-nov (tope duro; último día posible 13-nov; si el rediseño cierra a tiempo, adelantarlo al 30-oct) · lote recibido ~27-nov · anuncios programados para el 2-dic |
| 3 | **Product Lab: 7 tests por semana** | Primer test el martes 13 a las 05:00; un producto por día desde ahí (7 arranques del 13 al 19-oct). Los tests terminan el 14-dic |
| 4 | **ShotyGames sin Fabián en producción** | Dados con Marcelo (30-oct), stock listo para Black Friday (6-nov), impresión delegada (13-nov), logística entrenada (20-nov), atención de diciembre definida (4-dic) |
| 5 | **CandyShots sin Fabián** | SOPs de apertura, cierre, caja, inventario, compras, limpieza y atención. Domingo de prueba sin Fabián el 20-dic |
| 6 | **Contenido: 1 publicación por día** | Publicando a diario desde el 26-oct |

---

## Semana a semana

| Sem | Fechas | Foco | Fecha dura |
|---|---|---|---|
| 1 | 12–18 oct | 3 productos de dropshipping listos el lunes y primer test el martes. Cotizar las 69 cartas en imprentas. Fabricar dados (3 h) y sellar juegos (2 h). Mora de tarjetas. Sin gym esta semana | 12-oct pagar mora · 13-oct primer test · 16-oct mora en 0 |
| 2 | 19–25 oct | Mecánica v2, lista final de cartas, brief de diseño, elegir imprenta. Arturo | 23-oct Arturo pagado |
| 3 | 26 oct–1 nov | Arte y reglas de las cartas, muestra de impresión, Halloween | 30-oct dados con Marcelo · 31-oct play-test 3 |
| 4 | 2–8 nov | Archivos finales, **pedido a imprenta** | **6-nov pedido + anticipo** · 6-nov plan con papá y mamá |
| 5 | 9–15 nov | Armado del pedido, plan Black Friday, impresión delegada | 13-nov punto de control imprenta |
| 6 | 16–22 nov | Oferta y landing de cartas, creativos Black Friday | 20-nov Joselin pagado |
| 7 | 23–29 nov | Landing publicada, **Black Friday**, recepción del lote | 27-nov Black Friday |
| 8 | 30 nov–6 dic | Cyber Monday, control de calidad, **lanzamiento de cartas** | 2-dic anuncios · 4-dic primer abono |
| 9 | 7–13 dic | Navidad: oferta de regalo, primera revisión de cartas | |
| 10 | 14–20 dic | Último corte de envíos de Navidad, cierre de tests | 14-dic fin de tests · 20-dic corte de envíos |
| 11 | 21–27 dic | Año Viejo: push final de fiesta | 27-dic último día de anuncios de fiesta |
| 12 | 28 dic–3 ene | Balance del año, deuda final, metas 2027 | 31-dic cierre |

Feriado largo alrededor del 2-3 nov: confirmar fechas (el martes es el día de producto activo).

---

## Reglas que sostienen el plan

- **Un solo producto activo por negocio.** Cartas Grupos va primero; Cartas Parejas queda en cola hasta enero (decidirlo en el balance del 29-dic).
- **Producto de dropshipping:** el filtro rápido decide la cola de 7; el método completo de `investigacion-producto` se reserva para el que pase el test (CPA real ≤ $8 a los 4 días). Pendiente de confirmar con Fabián.
- **Regla de corte:** CPA real mayor a $8 a los 4 días, se apaga.
- **Publicidad:** toda campaña se deja programada el día anterior y arranca a las 05:00. Nunca se enciende a media tarde.
- **Horario comercial:** lo que implica contactar a un negocio (imprentas, proveedores, Marcelo, bancos, recoger muestras) va en la ventana de gestiones de las 16:30–17:15 y nunca después de las 18:00; después cierran.
- **Cada domingo:** revisión semanal de 30 min y sesión con Claude para agendar la semana siguiente. El cron del domingo 20:00 es el respaldo.
- **Calendario:** solo se agendan las próximas 2 semanas; el resto vive como tareas con fecha.
- **Descanso:** 11 semanas con sábado y domingo en el local no se sostienen. El proyecto CandyShots sin Fabián existe para liberar al menos los domingos.

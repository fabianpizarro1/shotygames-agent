# Progreso V1 — Sistema operativo personal de Fabián

> Pregunta que guía todo: **¿esto ayuda a Fabián a saber qué hacer y hacerlo, o solo hace la app más compleja?**
> Se construye ENCIMA de Progreso (ya en producción), no como app nueva: mismo login, mismo Sheet, mismo bot de Telegram.

---

## 1. Arquitectura funcional

```
Celular (PWA) ──► Next.js en Vercel ──► Google Sheet personal (fuente de verdad)
                        │                  TAREAS (compartida con el bot de Telegram)
                        │                  TAREAS_META · PROYECTOS · RUTINA · CONTADORES
                        │                  DIAS · INBOX · SEMANAS · METRICAS
                        └──► Claude API (chat, inbox, Top 3, cierre, revisión semanal)
```

- **Una sola lectura por pantalla**: `cargarTodo()` hace un `batchGet` de todas las pestañas.
- **Lo derivado nunca se guarda**: progreso de proyecto, % semanal, XP, prioridad y alertas se recalculan en cada carga. Si se edita el Sheet a mano, la app se ajusta sola.
- **La IA propone, el código aplica**: el cierre del día devuelve un JSON validado. Fabián lo aprueba con un clic y la app escribe. El chat es de solo lectura.

## 2. Pantallas

| Pestaña | Qué responde |
|---|---|
| **Hoy** | Misión del día, bloque actual ("ahora toca X"), Top 3, hábitos, alertas, botón *Estoy procrastinando*, botón *Cerrar día* |
| **Tareas** | Todo lo pendiente ordenado por puntaje, filtros por negocio, clasificación hacer/automatizar/delegar/tercerizar/eliminar, archivar en lote |
| **Proyectos** | Proyectos con etapas y % calculado, límite de proyectos activos, cola secuencial de productos ShotyGames |
| **IA** | Chat con contexto completo (hora, bloque, proyectos, tareas, cumplimiento) |
| **CEO** | Utilidad vs meta, deuda, horas operativas, cumplimiento semanal, contadores, delegación pendiente, cuello de botella. Acceso a la revisión semanal |
| **+ (flotante)** | Inbox: captura en 1 campo, la IA clasifica sola |

## 3–4. Modelo de datos y relaciones

| Pestaña | Columnas | Relación |
|---|---|---|
| `TAREAS` | ID, TAREA, ESTADO, PRIORIDAD, FECHA_LIMITE, PROYECTO(=negocio), NOTAS | **No se toca su estructura**: la usa el bot de Telegram |
| `TAREAS_META` | ID, PROYECTO_ID, TIPO, DECISION, DURACION_MIN, RESPONSABLE, COMPLETADA_EN, CREADA_EN | 1:1 con TAREAS por ID. Extiende sin romper el bot |
| `PROYECTOS` | ID, NOMBRE, NEGOCIO, CLASE, OBJETIVO, PRIORIDAD, FECHA_OBJETIVO, ESTADO, ORDEN, ETAPAS(JSON), SIGUIENTE_ACCION, RESPONSABLE, ACTUALIZADO | 1:N con tareas vía TAREAS_META.PROYECTO_ID |
| `RUTINA` | FECHA, BLOQUE, CUMPLIDO, HORA_MARCADO, NOTAS | Hábitos sí/no por día (ya existía) |
| `CONTADORES` | FECHA, CLAVE, CANTIDAD, ACTUALIZADO | Tests de drop, ads, contenido, sesiones de 10 min |
| `DIAS` | FECHA, MISION, TOP3(JSON), TERMINADO, PENDIENTE, APRENDIDO, PROBLEMA, MANANA, CERRADO_EN | Uno por día |
| `INBOX` | ID, TEXTO, CREADO, ESTADO, CLASE, NEGOCIO, TAREA_ID | La IA convierte en tarea o deja como idea |
| `SEMANAS` | SEMANA(lunes), FUNCIONO, NO_FUNCIONO, DEJAR, DELEGAR, AUTOMATIZAR, CUELLO_BOTELLA, PRIORIDADES, RESUMEN_IA, CERRADA_EN | Una por semana lun-dom |
| `METRICAS` | FECHA, CLAVE, VALOR, NOTA | UTILIDAD_MES, DEUDA_TOTAL, HORAS_OPERATIVAS, HORAS_ESTRATEGICAS (manual en V1) |

## 5. Flujo diario

```
07:00  abre la app → Hoy: misión del día + Top 3 (definido anoche) + hábitos
09:45  revisión rápida (bloque visible en Hoy, la app dice qué NO hacer)
10:10  bloque profundo #1 → tarea #1 del Top 3. ¿Resistencia? → "Estoy procrastinando" → 10 min
12:30  logística (bloque operativo)
14:00  bloque profundo #2
17:15  última revisión
22:00  CERRAR DÍA (2-5 min) → IA propone Top 3 de mañana + mover pendientes → 1 clic aplica
```
Pedido nuevo = microinterrupción de 1-2 min y de vuelta. La pantalla Hoy lo recuerda dentro de cada bloque profundo.

## 6. Flujo semanal

| Día | Bloque 1 | Bloque 2 |
|---|---|---|
| Lun | CEO: números + **elegir 1 cuello de botella** | Ads ShotyGames (tanda 1) |
| Mar | Producto activo ShotyGames | Producto activo (diseño/proveedor/costos…) |
| Mié | **Product Lab**: investigar y seleccionar | Ofertas, landings, creativos, campañas (cola de 7) |
| Jue | Sistemas + delegación ("¿qué dejo de hacer yo?") | CandyShots: procesos |
| Vie | Ads: ganadores + tanda 2 | Contenido + finanzas + plan semana + stock para el finde |
| Sáb | CandyShots (observar cuellos de botella, grabar contenido) | revisión mínima |
| Dom | CandyShots + **revisión semanal de 30 min** | |

## 7. Lógica del asistente IA

- **Modelo**: `claude-opus-5-5` con fallback de servidor (`fallbacks: "default"`).
- **Contexto en 2 capas**:
  1. *Fijo y cacheado*: perfil, objetivos, rutina, reglas de comportamiento (`lib/contexto-fabian.ts`)
  2. *Foto del momento*: fecha y hora en Ecuador, bloque actual, Top 3, proyectos activos con %, las 25 tareas con mayor puntaje, cumplimiento de la semana, alertas
- **Reglas de comportamiento**: no obedecer a ciegas, cuestionar tareas que no aportan, reducir carga cuando está saturado, señalar cuando cae en operación, bloquear proyectos nuevos si hay otros sin cerrar.
- **Usos**: chat libre, clasificar el inbox, sugerir el Top 3, cerrar el día y redactar la revisión semanal.

## 8. Sistema de proyectos

- Etapas con % (tocar para avanzar 0→25→50→75→100). El % del proyecto es el promedio de sus etapas.
- **Límite de trabajo en curso**: 1 producto ACTIVO por negocio y 6 proyectos activos en total. Para activar otro hay que terminar o pausar uno.
- La cola de ShotyGames va en orden (Parejas → Grupos → 3er juego → Monopoly → Parchís → Chupiolimpiadas).
- Alerta si el proyecto activo lleva 5 días sin avanzar.

## 9. Sistema de tareas

- Las de siempre (título, prioridad, fecha, negocio) más: proyecto, tipo (estratégico, operativo, creativo, administrativo), duración, responsable y **decisión** (hacer yo, automatizar, delegar, tercerizar, eliminar).
- Toda tarea operativa sin decisión muestra la pregunta: **"¿Esto realmente necesita hacerlo Fabián?"**
- Estado `ARCHIVADA`: el bot de Telegram la ignora sin tocarlo (filtra solo `PENDIENTE`).

## 10. Inbox inteligente

1 campo → Enter → la IA (con esfuerzo bajo) decide si es tarea, idea de ad, idea de producto, idea de contenido o nota → si es tarea, la crea con negocio, prioridad y fecha → si es idea, queda en el banco de ideas. Se puede deshacer.

## 11. Hábitos

Biblia, Gym, Inglés, Profundo #1, Profundo #2, Dormir 7-8h (sí o no por día) más contadores (tests de drop, ads, contenido). Cada uno tiene meta **semanal**: Gym 5, Biblia 7, Inglés 5, Profundo 10, Tests 7, Contenido 7, Ads 8. El cumplimiento de la semana pondera todo. **Un día perdido no reinicia nada**: si ayer fallaste un hábito, hoy aparece "No se falla dos veces".

## 12. Priorización

Puntaje determinista (sin IA, instantáneo y explicable):

| Factor | Peso |
|---|---|
| Prioridad ALTA / MEDIA / BAJA | 30 / 15 / 5 |
| Vencida / vence hoy / ≤3 días | +25 / +20 / +10 |
| Negocio: Deudas 25, ShotyGames 20, Ecommerce 15, CandyShots 10, Contenido 10 | |
| Pertenece al proyecto ACTIVO | +20 |
| Tipo estratégico o creativo | +10 |
| Decisión delegar o tercerizar (no debería hacerla Fabián) | −15 → aparece como "delegar" |
| ≤15 min (quick win) | +5 |
| Vencida hace más de 60 días | −30 (probablemente muerta, archivar) |

La IA usa este ranking para elegir el Top 3 y explica por qué.

## 13. Anti-procrastinación

Botón **Estoy procrastinando** → muestra la tarea actual → "No tienes que terminarla. Solo 10 minutos." → temporizador que sobrevive a recargar la página → al final pregunta "¿otros 10?" / "terminé" / "es cansancio real → 15 min de descanso". Cada sesión suma al contador `FOCO_10`.

## 14. CEO Dashboard

Utilidad del mes contra $5.000 · deuda y su variación · horas operativas contra la semana anterior · cumplimiento semanal % · gym, Biblia e inglés · tests, ads y contenido contra sus metas · % del producto activo · tareas marcadas para delegar o automatizar que siguen en manos de Fabián · cuello de botella de la semana. **No muestra tareas pequeñas.**

## 15. Contexto y memoria

- El perfil fijo vive en código (`contexto-fabian.ts`), versionado en git y cacheado en la API.
- La memoria viva es el Sheet: cierres del día (aprendizajes, problemas), revisiones semanales (cuellos de botella, decisiones). La IA lee los últimos 7 cierres y las últimas 2 revisiones.
- El chat no se guarda en el servidor: queda en el teléfono (localStorage, por día).

## 16. Fuera de la V1 (a propósito)

Integraciones con Meta Ads, DROPI, Sheets de pedidos, contabilidad y n8n · inventario y punto de reposición automático · notificaciones push · calendario · Biblia con notas por capítulo · CandyShots como módulo propio · multiusuario o delegación con login para el equipo.

## 17. Roadmap

| Versión | Contenido | Condición para empezar |
|---|---|---|
| **V1** (esta) | Hoy, Tareas, Proyectos, Inbox, Hábitos, IA, Cierre del día, Revisión semanal, CEO | — |
| **V2** | Datos reales: utilidad y deuda desde el Sheet de contabilidad, pedidos y novedades desde la app de logística, gasto/CPA desde Meta. Inventario de torres con punto de reposición ("imprimir lote de 14 Parejas"). Recordatorios por Telegram (el bot ya existe) | **≥80% de cumplimiento 2 semanas seguidas usando la V1** |
| **V3** | "¿Cómo están los negocios?" con datos reales de las 3 tiendas, tablero de equipo (Nerea, Marcelo), SOPs de CandyShots, el chat ejecuta acciones | V2 en uso real |

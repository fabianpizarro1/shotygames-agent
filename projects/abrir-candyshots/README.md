# Abrir CandyShots

**Descripción:** Abrir el local de granizados y comida en Machala.
**Estado:** Planificación — próximo a ejecutar
**Deadline:** Lo antes posible (meta: antes de Q3 2026)

## Contexto
Local físico casi listo. Foco inicial: solo granizados con máquina granizadora (4 sabores) y licuadora. Comida se incorporará gradualmente. Socios: Fabián, Nerea y papá Fabián.

## Pendientes para abrir
- [ ] Terminar pendientes del local
- [ ] Crear recetas de granizados (máquina + licuadora)
- [ ] Documentar recetas como SOPs en `references/sops/`
- [ ] Definir organización interna del equipo
- [ ] Definir si se necesita contratar personal
- [ ] Definir precios y menú inicial
- [ ] Crear proceso de caja / control de ventas

## Notas
_Agregar notas, avances y decisiones aquí._
## Sistema de administracion
**Archivo:** `administracion/CandyShots-Administracion.xlsx` (15 hojas)
**Destino:** subir a Google Sheets — es la unica fuente de verdad del negocio.

| Bloque | Hojas |
|---|---|
| Configuracion | INICIO |
| Uso diario | VENTAS · GASTOS · CAJA |
| Maestros | PRODUCTOS · COMBOS · RECETAS · INSUMOS |
| Produccion | FICHAS_TECNICAS (imprimible) |
| Analisis (automatico) | DASHBOARD · INVENTARIO · GASTOS_FIJOS · EQUILIBRIO · PYG · PROYECCIONES |

**Decisiones que lo definen (2026-09-07):**
- Precios de carta se manejan CON IVA 15% incluido; el sistema descuenta el IVA para mostrar la utilidad real
- Un solo sistema: la calculadora HTML quedo archivada en `archives/2026-09-candyshots-calculadora-html/`
- Registro de ventas: Fabian por ahora, despues Nerea o empleado (por eso VENTAS es de 4 campos con desplegables)

**Pendiente:** dashboard tipo app conectado a este mismo Sheets via Apps Script (fase 2).

# Plataforma de invitaciones digitales — plan

> Estado: **diseño** (2026-11-08). No hay código ni cuentas creadas todavía.
> La invitación de Joselin (`projects/invitaciones`, producción en `invitacion-joselin-eight.vercel.app`) **no se toca** hasta después de su fiesta (21-nov-2026), salvo arreglos.

## Objetivo
Una web donde un cliente se registra, elige una plantilla, **personaliza su invitación con vista previa en vivo**, y **paga para publicar**. Al pagar obtiene:
- el link de la invitación (uno general + uno personal por invitado),
- panel de invitados (alta, importación, envío por WhatsApp),
- confirmaciones (RSVP) y **estadísticas** (aperturas, confirmaciones, tasa, línea de tiempo),
- extras según plan: fotos por QR, playlist, cuenta regresiva, mapa.

Gratis: editar y previsualizar (con marca de agua). Pago: publicar y enviar.

## Decisiones tomadas (Fabián, 2026-11-08)
| Tema | Decisión |
|---|---|
| Cobro v1 | **PayPhone desde el inicio** (Cajita de Pagos) |
| Plantillas v1 | **Tres**: cumpleaños, boda, quinceañera |
| Base | El mismo sistema de la invitación de Joselin, adaptado |

## Arquitectura
- **Next.js (App Router) + Vercel**, igual que hoy. Se reutiliza casi entera la invitación (`Invitacion.tsx`, ~500 líneas) y el editor (`TabContenido.tsx`, ~530 líneas).
- **Supabase** (Postgres + Auth + Storage) reemplaza Google Sheets y Drive. Hoy 21 archivos y 19 rutas API tocan Sheets/Drive: es la capa que se reescribe (`sheets.ts`, `config.ts`, `invitados.ts`, `invitados-admin.ts`, `musica.ts`, `fotos.ts`, `drive.ts`).
- **Auth de clientes**: correo (enlace mágico) y Google. El "admin" actual por cookie pasa a ser un rol de Fabián.
- **PayPhone**: Cajita de Pagos (script + contenedor) y confirmación en el servidor. La Cajita solo funciona en el **dominio registrado** en Payphone Developer.
- **Multi-evento**: todo cuelga de `evento_id`. URLs: `/e/<slug>` (invitación general), `/i/<token>` (personal), `/app` (panel del cliente), `/admin` (Fabián).
- **Plantillas = piel + valores por defecto** sobre el mismo motor: layout/capítulos, estilos, set de stickers y textos por defecto. El motor lee `evento.config` (jsonb), como hoy lee la hoja CONFIG.

## Modelo de datos (borrador: `supabase/schema.sql`)
`perfiles` · `plantillas` · `eventos` (config jsonb, estado `borrador|pendiente_pago|publicado|vencido`, plan, `publicado_at`, `expira_at`) · `invitados` · `fotos` · `canciones` · `pagos` · `eventos_log` (aperturas, confirmaciones, clics: base de las estadísticas).

## Flujo del cliente
1. Registro → elegir plantilla.
2. Editor con vista previa en vivo (secciones por capítulo, ya existe).
3. "Publicar": elige plan → PayPhone → el servidor confirma el pago → evento `publicado`.
4. Panel: invitados, WhatsApp, estadísticas, fotos/playlist (según plan).
5. Al vencer (`expira_at`): la invitación sigue visible N días y luego se archiva.

## Planes (por definir con precios reales de la competencia local)
- **Básico**: link, RSVP, hasta ~50 invitados, estadísticas simples.
- **Completo**: invitados ilimitados, fotos por QR, playlist, estadísticas completas, WhatsApp masivo.
- Duración de publicación incluida (p. ej. 6 meses).

## Fases
0. **Preparación (Fabián)**: cuenta PayPhone Business + Payphone Developer, proyecto Supabase, nombre y dominio del producto.
1. **Motor**: Supabase, auth, multi-evento, migración de la capa de datos. (La invitación de Joselin queda como evento de prueba.)
2. **Editor para clientes** + plantilla 1 generalizada + marca de agua + publicar.
3. **PayPhone**: cobro, estados de pago, panel de pagos/clientes para Fabián.
4. **Estadísticas**, WhatsApp, fotos y playlist por plan.
5. **Plantillas 2 y 3** (boda, quinceañera).
6. **Legal y operación**: términos, privacidad, soporte, copias de seguridad.

MVP vendible = fases 1 a 3 con la plantilla 1.

## Plantillas con IA (idea de Fabián, 2026-11-08)
Principio: la IA **arma una configuración validada**, no inventa código.
1. **Nivel 1: IA → configuración.** El cliente responde 4-5 preguntas (tipo de evento, estilo, colores, nombres, tono). La IA devuelve paleta, textos en español natural, letra de la palabra grande, color del sello, capítulos visibles y su orden. Todo ya existe como `evento.config`. Vista previa en vivo y "otra versión" (intentos limitados por cliente).
2. **Nivel 2: IA → bloques.** Convertir cada capítulo en un bloque con variantes (portada, brindis, fecha, vestimenta…); la IA elige y ordena. Necesario también para boda y quinceañera.
3. **Nivel 3: IA → imágenes** (stickers, fondos). Solo si hay clientes que lo pidan.
Guardas: validador automático (contraste mínimo, largos máximos, tamaños autoajustados), moderación de textos, límite de intentos, medir el costo real por generación antes de fijar precios.
Orden recomendado: etapa 2 (fotos/playlist) → plantilla de cumpleaños al día → diseño por bloques → asistente de IA nivel 1 → imágenes.

## Riesgos (ver con calma)
- **Stickers con derechos**: varios de la invitación de Joselin son memes/fotos de internet (actriz, mono, hámster…). Sirven para una fiesta privada, no para vender. La plataforma necesita assets propios, con licencia o generados con IA revisando sus condiciones.
- **PayPhone**: necesita cuenta de negocio aprobada; el Access Token y el Store ID llegan después de la aprobación. Es lo que más puede demorar: empezar el trámite ya.
- **Dominio propio**: obligatorio para la Cajita.
- **Datos personales**: guardamos nombres y teléfonos de terceros (los invitados). Hace falta política de privacidad y cumplir la ley ecuatoriana de protección de datos personales.
- **Música**: no alojar MP3 con derechos de autor subidos por clientes. Alternativa: enlace a Spotify/YouTube o catálogo sin derechos.
- **Costos**: Supabase gratis pausa proyectos tras una semana sin uso; para producción conviene el plan de pago. Fotos y música consumen almacenamiento y ancho de banda.
- **Tres plantillas** triplican el diseño y las pruebas: construir primero el motor con una y luego las otras dos.
- **Soporte**: cada cliente es una persona que escribe por WhatsApp. Definir horarios y límites.

## Pendientes de Fabián
- [ ] Abrir la cuenta PayPhone Business y pedir acceso a Payphone Developer.
- [ ] Crear el proyecto en Supabase (las llaves van a `.env.local`, nunca al chat).
- [ ] Elegir nombre y dominio del producto.
- [ ] Revisar precios de 5 competidores locales para fijar los planes.

# Plataforma de invitaciones (proyecto aparte)

Copia de `projects/invitaciones` (la invitación de Joselin) para convertirla en plataforma multi-cliente.
**Es independiente**: sin `.env.local`, sin `.vercel`, sin acceso al Sheet ni al Drive de Joselin.

## Reglas
- NO desplegar este proyecto sobre `invitacion-joselin` ni enlazarlo con su proyecto de Vercel. Crear uno propio.
- NO copiar `.env.local` de `projects/invitaciones`. Cada entorno tiene sus llaves.
- La invitación de Joselin sigue en `projects/invitaciones` y se toca solo para arreglos hasta después del 21-nov-2026.
- Plan y decisiones: `PLAN.md`. Esquema de base de datos (borrador): `supabase/schema.sql`.

## Estado (2026-11-08)
**Etapa 1 lista y probada en local** (puerto 3200: `preview_start plataforma`, usa `.data/db.json`, sin cuentas externas):
- Cuentas (correo + contraseña, cookie firmada), mis eventos, crear evento desde plantilla.
- Panel por evento: Contenido (editor con vista previa en vivo), Invitados (alta, importar, WhatsApp), Estadísticas, Publicar.
- Invitación por enlace personal (`/i/<token>`) y general (`/e/<slug>`), confirmación (RSVP), aperturas registradas.
- Borrador = solo el dueño la ve; publicada = la ven los invitados. Cobro todavía NO conectado (publicar es gratis).
- Aislamiento: cada usuario solo ve y edita sus eventos.

**Etapa 2 hecha (2026-11-08)**: fotos por QR (`/fotos?e=<slug>` general o `?t=<token>` personal, con ventanas de tiempo, galería y moderación en el panel), QR imprimible (`/app/<id>/qr`), playlist (búsqueda Deezer, pedidos por invitado, revisión en el panel) y subida de imágenes desde el editor (`/media/<id>`). Playlist y fotos solo para quien confirmó (la regla la hace cumplir el servidor al pedir canciones). El almacenamiento de archivos hoy es local (`.data/files`); con Supabase pasa a Storage.
El código viejo de Sheets/Drive quedó archivado en `archives/plataforma-etapa2-codigo-sheets-2026-11-08/`.

**Plantilla de cumpleaños al día (2026-11-08)**: estilo rosa elegante de la invitación actual, con textos genéricos, fechas de ejemplo al crear el evento y **adornos propios** (globos y bola disco dibujados en código + stickers Noto Emoji; sin memes ni fotos de internet). El modo se activa con `stickers_propios: 'si'` (`src/components/Adorno.tsx`).

**Plantilla de boda (2026-11-08)**: marfil y dorado, nombres en letra elegante, historia con foto en arco, ceremonia y recepción (dos lugares), vestimenta, programa en línea de tiempo, regalos, hashtag y confirmación. Mismo motor (`useInvitacionBase`: vista previa, sobre, música, RSVP) con otra composición (`InvitacionBoda.tsx`); el editor muestra las secciones de la plantilla del evento (`seccionesDe(plantilla)` en `TabContenido.tsx`). Quedan boda de ejemplo y cumpleaños creables desde "Mis eventos".

**Plantilla de quinceañera (2026-11-08)**: lila y dorado, corona y mariposas dibujadas, nombre con XV, historia con foto circular, capítulo de padres y padrinos (se oculta si está vacío), misa y fiesta como dos lugares, vestimenta, programa, regalos y confirmación. Comparte `InvitacionElegante.tsx` con la de boda (prop `variante`); `PorPlantilla.tsx` elige la composición según la plantilla del evento.

**Sellos realistas (2026-11-08)**: imágenes para A-Z, `XV` y `&` en 6 colores (`public/sello/<id>/<color>.webp`, generadas por lote con `scripts/sello`). La portada elige el sello según la inicial: cumpleaños = inicial del nombre, boda = «&», quinceañera = XV.

**IA de diseño, nivel 1 (2026-11-08)**: «✨ Diseñar con IA» en el editor. El cliente describe lo que quiere (estilo, colores) y la IA propone VALORES de configuración (colores, textos, color del sello…) para la plantilla de su evento. `src/lib/ia.ts` valida todo (solo claves permitidas por plantilla, colores #rrggbb, textos sin emojis/enlaces/HTML y con largo máximo, contraste mínimo de 4,5:1, `{link}`/`{invitada}` obligatorios) y nunca toca fechas, lugares ni nombres. La propuesta se aplica a la vista previa SIN guardar (Guardar/Descartar), con límite de 8 propuestas por hora y usuario. Requiere `ANTHROPIC_API_KEY` en `.env.local` (modelo en `IA_MODELO`, por defecto `claude-sonnet-5-5`); sin clave responde «La IA todavía no está configurada».

**Falta**: Supabase (adaptador `src/lib/db/supabase.ts` + Auth + Storage) para producción, probar la IA con una clave real (el flujo se probó con una respuesta simulada), IA nivel 2 (bloques) y PayPhone.

## Cómo correrlo
`cp .env.example .env.local` (poner un `SESSION_SECRET` aleatorio), `npm install`, `npm run dev -- --port 3200`.

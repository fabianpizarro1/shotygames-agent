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

**Falta**: Supabase (adaptador `src/lib/db/supabase.ts` + Auth + Storage) para producción, plantillas de boda y quinceañera, sello de cera realista para otras iniciales (hoy solo existe la J; las demás usan el sello dibujado), IA de plantillas y PayPhone.

## Cómo correrlo
`cp .env.example .env.local` (poner un `SESSION_SECRET` aleatorio), `npm install`, `npm run dev -- --port 3200`.

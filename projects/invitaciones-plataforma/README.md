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

**Etapa 2 (pendiente)**: fotos por QR, playlist y subida de archivos. El código viejo (Sheets/Drive) está apartado en `src/_etapa2/` (excluido de `tsconfig`) y hay que reescribirlo contra Supabase Storage.
**Después**: Supabase (adaptador `src/lib/db/supabase.ts` + Auth), plantillas de boda y quinceañera, pulir la plantilla de cumpleaños, PayPhone.

## Cómo correrlo
`cp .env.example .env.local` (poner un `SESSION_SECRET` aleatorio), `npm install`, `npm run dev -- --port 3200`.

# Plataforma de invitaciones (proyecto aparte)

Copia de `projects/invitaciones` (la invitación de Joselin) para convertirla en plataforma multi-cliente.
**Es independiente**: sin `.env.local`, sin `.vercel`, sin acceso al Sheet ni al Drive de Joselin.

## Reglas
- NO desplegar este proyecto sobre `invitacion-joselin` ni enlazarlo con su proyecto de Vercel. Crear uno propio.
- NO copiar `.env.local` de `projects/invitaciones`. Cada entorno tiene sus llaves.
- La invitación de Joselin sigue en `projects/invitaciones` y se toca solo para arreglos hasta después del 21-nov-2026.
- Plan y decisiones: `PLAN.md`. Esquema de base de datos (borrador): `supabase/schema.sql`.

## Estado
Código copiado tal cual; todavía usa Google Sheets/Drive. Falta la fase 1 (Supabase, auth y multi-evento).
No se instaló `node_modules`.

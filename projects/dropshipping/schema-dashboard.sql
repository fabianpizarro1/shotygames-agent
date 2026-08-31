-- Esquema para el dashboard de ganadores DROPI.
-- Correr UNA VEZ en el SQL Editor de Supabase (proyecto de SUPABASE_URL en .env).
-- No lleva RLS: el ANON_KEY que usa esto solo circula server-side (scripts locales
-- y API routes de Next.js), nunca llega al navegador — mismo criterio que las
-- tablas que ya usa history.js en este mismo proyecto.

create table if not exists dropi_dashboard (
  id text primary key,
  payload jsonb not null,
  actualizado_en timestamptz not null default now()
);

create table if not exists dropi_historial (
  fecha date not null,
  id integer not null,
  stock integer,
  costo numeric,   -- sale_price: lo que el proveedor cobra a Fabián, no el precio al público
  primary key (fecha, id)
);

create index if not exists dropi_historial_id_idx on dropi_historial (id);
create index if not exists dropi_historial_fecha_idx on dropi_historial (fecha);

alter table dropi_dashboard enable row level security;
alter table dropi_historial enable row level security;

drop policy if exists dropi_dashboard_all on dropi_dashboard;
create policy dropi_dashboard_all on dropi_dashboard for all using (true) with check (true);

drop policy if exists dropi_historial_all on dropi_historial;
create policy dropi_historial_all on dropi_historial for all using (true) with check (true);

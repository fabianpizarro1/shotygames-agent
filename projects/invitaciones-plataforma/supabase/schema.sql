-- BORRADOR (no ejecutado). Esquema de la plataforma de invitaciones.
-- Todo cuelga de un evento; el dueño solo ve lo suyo (RLS). Las páginas públicas (/e, /i)
-- leen y escriben desde el servidor con la llave de servicio, nunca desde el navegador.

create extension if not exists pgcrypto;

create table perfiles (
  id uuid primary key references auth.users on delete cascade,
  nombre text not null default '',
  telefono text not null default '',
  es_admin boolean not null default false,
  creado_at timestamptz not null default now()
);

create table plantillas (
  slug text primary key,                -- 'cumple' | 'boda' | 'quince'
  nombre text not null,
  descripcion text not null default '',
  defaults jsonb not null default '{}', -- equivale a CONFIG_DEFAULTS de la invitación actual
  activa boolean not null default true
);

create type estado_evento as enum ('borrador', 'pendiente_pago', 'publicado', 'vencido');
create type plan_evento as enum ('basico', 'completo');

create table eventos (
  id uuid primary key default gen_random_uuid(),
  dueno_id uuid not null references perfiles(id) on delete cascade,
  plantilla text not null references plantillas(slug),
  slug text not null unique,            -- /e/<slug>
  nombre text not null,
  config jsonb not null default '{}',   -- textos, colores, fotos, música... (lo que hoy vive en la hoja CONFIG)
  estado estado_evento not null default 'borrador',
  plan plan_evento,
  publicado_at timestamptz,
  expira_at timestamptz,
  creado_at timestamptz not null default now()
);
create index on eventos (dueno_id);

create table invitados (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  token text not null unique,           -- /i/<token>
  nombre text not null,
  telefono text not null default '',
  grupo text not null default '',
  genero text not null default 'F',
  cupos int not null default 1,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmado', 'no_asiste')),
  asistentes int not null default 0,
  mensaje text not null default '',
  notas text not null default '',
  enviado_at timestamptz,
  abierto_at timestamptz,
  confirmado_at timestamptz
);
create index on invitados (evento_id);

create table fotos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  invitado_id uuid references invitados(id) on delete set null,
  ruta text not null,                   -- Supabase Storage
  autor text not null default '',
  visible boolean not null default true,
  creado_at timestamptz not null default now()
);

create table canciones (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  invitado_id uuid references invitados(id) on delete set null,
  deezer_id text not null,
  titulo text not null,
  artista text not null,
  portada text not null default '',
  estado text not null default 'pedida',
  creado_at timestamptz not null default now(),
  unique (evento_id, deezer_id)
);

create type estado_pago as enum ('iniciado', 'aprobado', 'rechazado', 'cancelado');

create table pagos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  proveedor text not null default 'payphone',
  referencia text not null unique,      -- clientTransactionId que mandamos a PayPhone
  proveedor_id text,                    -- id de la transacción en PayPhone
  monto_centavos int not null,
  plan plan_evento not null,
  estado estado_pago not null default 'iniciado',
  crudo jsonb,                          -- respuesta de PayPhone, para auditar
  creado_at timestamptz not null default now(),
  aprobado_at timestamptz
);

-- Estadísticas: un renglón por cosa que pasa en la invitación.
create table eventos_log (
  id bigint generated always as identity primary key,
  evento_id uuid not null references eventos(id) on delete cascade,
  invitado_id uuid references invitados(id) on delete set null,
  tipo text not null,                   -- 'abierto' | 'confirmo' | 'no_asiste' | 'mapa' | 'playlist' | 'fotos' | 'whatsapp'
  at timestamptz not null default now()
);
create index on eventos_log (evento_id, at);

-- RLS (borrador): el dueño ve y edita solo lo suyo; el admin ve todo.
alter table perfiles enable row level security;
alter table eventos enable row level security;
alter table invitados enable row level security;
alter table fotos enable row level security;
alter table canciones enable row level security;
alter table pagos enable row level security;
alter table eventos_log enable row level security;

create policy perfil_propio on perfiles for all using (id = auth.uid());
create policy eventos_del_dueno on eventos for all using (dueno_id = auth.uid());
create policy invitados_del_dueno on invitados for all using (evento_id in (select id from eventos where dueno_id = auth.uid()));
create policy fotos_del_dueno on fotos for all using (evento_id in (select id from eventos where dueno_id = auth.uid()));
create policy canciones_del_dueno on canciones for all using (evento_id in (select id from eventos where dueno_id = auth.uid()));
create policy pagos_del_dueno on pagos for select using (evento_id in (select id from eventos where dueno_id = auth.uid()));
create policy log_del_dueno on eventos_log for select using (evento_id in (select id from eventos where dueno_id = auth.uid()));

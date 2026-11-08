// Capa de datos de la plataforma. Todo cuelga de un evento; la lógica de negocio vive en src/lib/*
// y solo habla con esta interfaz. Hoy hay un adaptador local (archivo JSON, para desarrollar sin
// internet) y, cuando existan las llaves de Supabase, otro adaptador con Postgres.

export type EstadoEvento = 'borrador' | 'publicado' | 'vencido';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  hash: string; // scrypt (solo adaptador local; con Supabase Auth no se guarda)
  es_admin: boolean;
  creado_at: string;
}

export interface Evento {
  id: string;
  dueno_id: string;
  plantilla: string;
  slug: string;
  nombre: string;
  config: Record<string, string>;
  estado: EstadoEvento;
  plan: string; // '' hasta que se elige
  publicado_at: string;
  expira_at: string;
  creado_at: string;
}

export interface InvitadoDb {
  evento_id: string;
  token: string;
  nombre: string;
  telefono: string;
  grupo: string;
  genero: 'F' | 'M';
  cupos: number;
  estado: 'pendiente' | 'confirmado' | 'no_asiste';
  asistentes: number;
  restricciones: string;
  mensaje: string;
  notas: string;
  enviado_at: string;
  abierto_at: string;
  confirmado_at: string;
}

export type TipoLog = 'abierto' | 'confirmo' | 'no_asiste' | 'mapa' | 'whatsapp' | 'playlist' | 'fotos';

export interface LogDb {
  evento_id: string;
  token: string;
  tipo: TipoLog;
  at: string;
}

export interface Db {
  usuarioPorEmail(email: string): Promise<Usuario | null>;
  usuarioPorId(id: string): Promise<Usuario | null>;
  crearUsuario(u: Usuario): Promise<void>;

  eventoPorId(id: string): Promise<Evento | null>;
  eventoPorSlug(slug: string): Promise<Evento | null>;
  eventosDe(duenoId: string): Promise<Evento[]>;
  crearEvento(e: Evento): Promise<void>;
  parchearEvento(id: string, parche: Partial<Omit<Evento, 'id'>>): Promise<Evento | null>;

  invitadosDe(eventoId: string): Promise<InvitadoDb[]>;
  invitadoPorToken(token: string): Promise<InvitadoDb | null>;
  crearInvitados(lista: InvitadoDb[]): Promise<void>;
  parchearInvitado(token: string, parche: Partial<InvitadoDb>): Promise<InvitadoDb | null>;
  borrarInvitado(token: string): Promise<boolean>;

  registrar(l: LogDb): Promise<void>;
  logsDe(eventoId: string): Promise<LogDb[]>;
}

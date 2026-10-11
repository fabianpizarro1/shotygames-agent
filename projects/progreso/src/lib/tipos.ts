import type { Negocio } from './negocio';

// Tipos y constantes puras — sin googleapis, importable desde 'use client'.

// ── Negocios ────────────────────────────────────────────────────────────────
// Los IDs son los valores que ya existen en la columna PROYECTO de TAREAS (el
// bot de Telegram los escribe así). Acá se llaman "negocio" porque eso son;
// "proyecto" pasa a ser la entidad con etapas de la pestaña PROYECTOS.

export const NEGOCIOS = [
  { id: 'SALIR_DE_DEUDAS', label: 'Deudas', peso: 25 },
  { id: 'SHOTYGAMES', label: 'ShotyGames', peso: 20 },
  { id: 'DROPSHIPPING', label: 'Ecommerce', peso: 15 },
  { id: 'CANDYSHOTS', label: 'CandyShots', peso: 10 },
  { id: 'CONTENIDO', label: 'Contenido', peso: 10 },
  { id: 'PERSONAL', label: 'Personal', peso: 8 },
] as const;

export type NegocioId = (typeof NEGOCIOS)[number]['id'];

export function labelNegocio(id: string): string {
  return NEGOCIOS.find((n) => n.id === id)?.label ?? (id || 'Sin negocio');
}

// ── Tareas ──────────────────────────────────────────────────────────────────

export type Prioridad = 'ALTA' | 'MEDIA' | 'BAJA';
export type EstadoTarea = 'PENDIENTE' | 'HECHO' | 'ARCHIVADA';

export const TIPOS_TAREA = ['ESTRATEGICO', 'CREATIVO', 'OPERATIVO', 'ADMINISTRATIVO'] as const;
export type TipoTarea = (typeof TIPOS_TAREA)[number];

export const DECISIONES = ['HACER_YO', 'AUTOMATIZAR', 'DELEGAR', 'TERCERIZAR', 'ELIMINAR'] as const;
export type Decision = (typeof DECISIONES)[number];

export const LABEL_TIPO: Record<TipoTarea, string> = {
  ESTRATEGICO: 'Estratégico',
  CREATIVO: 'Creativo',
  OPERATIVO: 'Operativo',
  ADMINISTRATIVO: 'Administrativo',
};

export const LABEL_DECISION: Record<Decision, string> = {
  HACER_YO: 'Hacer yo',
  AUTOMATIZAR: 'Automatizar',
  DELEGAR: 'Delegar',
  TERCERIZAR: 'Tercerizar',
  ELIMINAR: 'Eliminar',
};

export interface Tarea {
  id: string;
  tarea: string;
  estado: EstadoTarea;
  prioridad: Prioridad;
  fecha_limite: string;
  negocio: string;
  notas: string;
  // De TAREAS_META (vacíos si la tarea la creó el bot):
  proyectoId: string;
  tipo: TipoTarea | '';
  decision: Decision | '';
  duracionMin: number | null;
  responsable: string;
  completadaEn: string;
  creadaEn: string;
}

// ── Proyectos ───────────────────────────────────────────────────────────────

export type EstadoProyecto = 'ACTIVO' | 'EN_COLA' | 'PAUSADO' | 'TERMINADO';
export type ClaseProyecto = 'PRODUCTO' | 'SISTEMA';

export interface Etapa {
  nombre: string;
  pct: number;
}

export interface Proyecto {
  id: string;
  nombre: string;
  negocio: string;
  clase: ClaseProyecto;
  objetivo: string;
  prioridad: Prioridad;
  fechaObjetivo: string;
  estado: EstadoProyecto;
  orden: number;
  etapas: Etapa[];
  siguienteAccion: string;
  responsable: string;
  actualizado: string;
}

/** Límite de trabajo en curso — el brief: "impedir que abra 15 proyectos a la vez". */
export const MAX_PROYECTOS_ACTIVOS = 6;

export function progresoProyecto(p: Pick<Proyecto, 'etapas'>): number {
  if (!p.etapas.length) return 0;
  return Math.round(p.etapas.reduce((a, e) => a + e.pct, 0) / p.etapas.length);
}

// ── Hábitos y contadores ────────────────────────────────────────────────────

export interface Habito {
  id: string;
  label: string;
  metaSemanal: number;
  /** Solo lunes a viernes (los bloques profundos). */
  soloLaborales?: boolean;
}

export const HABITOS: Habito[] = [
  { id: 'BIBLIA', label: 'Biblia', metaSemanal: 7 },
  { id: 'GYM', label: 'Gym', metaSemanal: 5 },
  { id: 'PROFUNDO_1', label: 'Profundo #1', metaSemanal: 5, soloLaborales: true },
  { id: 'PROFUNDO_2', label: 'Profundo #2', metaSemanal: 5, soloLaborales: true },
  { id: 'INGLES', label: 'Inglés', metaSemanal: 5 },
  { id: 'DORMIR', label: 'Dormí 7-8 h', metaSemanal: 7 },
];

export const CONTADORES = [
  { id: 'TEST_DROP', label: 'Tests drop', metaSemanal: 7 },
  { id: 'ADS', label: 'Ads nuevos', metaSemanal: 8 },
  { id: 'CONTENIDO', label: 'Contenido', metaSemanal: 7 },
] as const;

export const CONTADOR_FOCO = 'FOCO_10';

export interface RegistroRutina {
  fecha: string;
  bloque: string;
  cumplido: boolean;
  horaMarcado: string;
  notas: string;
}

export interface Contador {
  fecha: string;
  clave: string;
  cantidad: number;
}

// ── Día, inbox, semana, métricas ────────────────────────────────────────────

export interface ItemTop3 {
  id: string; // ID de la tarea ('' si es texto libre)
  texto: string;
}

export interface Dia {
  fecha: string;
  mision: string;
  top3: ItemTop3[];
  terminado: string;
  pendiente: string;
  aprendido: string;
  problema: string;
  manana: string;
  cerradoEn: string;
}

export type EstadoInbox = 'NUEVO' | 'TAREA' | 'IDEA' | 'DESCARTADO';
export const CLASES_INBOX = ['TAREA', 'IDEA_AD', 'IDEA_PRODUCTO', 'IDEA_CONTENIDO', 'NOTA'] as const;
export type ClaseInbox = (typeof CLASES_INBOX)[number];

export const LABEL_CLASE_INBOX: Record<ClaseInbox, string> = {
  TAREA: 'Tarea',
  IDEA_AD: 'Idea de anuncio',
  IDEA_PRODUCTO: 'Idea de producto',
  IDEA_CONTENIDO: 'Idea de contenido',
  NOTA: 'Nota',
};

export interface ItemInbox {
  id: string;
  texto: string;
  creado: string;
  estado: EstadoInbox;
  clase: ClaseInbox | '';
  negocio: string;
  tareaId: string;
}

export interface Semana {
  semana: string; // lunes
  funciono: string;
  noFunciono: string;
  dejar: string;
  delegar: string;
  automatizar: string;
  cuelloBotella: string;
  prioridades: string;
  resumenIa: string;
  cerradaEn: string;
}

export const METRICAS = [
  { id: 'UTILIDAD_MES', label: 'Utilidad del mes', prefijo: '$', meta: 5000 },
  { id: 'DEUDA_TOTAL', label: 'Deuda total', prefijo: '$', meta: 0 },
  { id: 'HORAS_OPERATIVAS', label: 'Horas operativas (semana)', prefijo: '', meta: null },
  { id: 'HORAS_ESTRATEGICAS', label: 'Horas estratégicas (semana)', prefijo: '', meta: null },
] as const;

export interface Metrica {
  fecha: string;
  clave: string;
  valor: number;
  nota: string;
}

export interface Datos {
  /** Dinero y ventas de los Sheets de negocio (solo lectura, caché 5 min). null si no se pudo leer. */
  negocio: Negocio | null;
  tareas: Tarea[];
  proyectos: Proyecto[];
  rutina: RegistroRutina[];
  contadores: Contador[];
  dias: Dia[];
  inbox: ItemInbox[];
  semanas: Semana[];
  metricas: Metrica[];
}

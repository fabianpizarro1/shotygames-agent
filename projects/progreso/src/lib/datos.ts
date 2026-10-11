import 'server-only';
import { cache } from 'react';
import { getSheets, SHEET_ID } from './sheets-cliente';
import { ahoraEC, hoyEC } from './fecha';
import { leerNegocio } from './negocio';
import type {
  ClaseInbox,
  Contador,
  Datos,
  Decision,
  Dia,
  EstadoInbox,
  EstadoTarea,
  Etapa,
  ItemInbox,
  ItemTop3,
  Metrica,
  Prioridad,
  Proyecto,
  RegistroRutina,
  Semana,
  Tarea,
  TipoTarea,
} from './tipos';

// ── Esquema ─────────────────────────────────────────────────────────────────
// TAREAS y RUTINA ya existían (TAREAS la comparte el bot de Telegram: su
// estructura no se toca). El resto lo crea `scripts/crear-pestanas.mjs` una
// sola vez — la app nunca crea pestañas ni edita encabezados en runtime.

export const ESQUEMA = {
  TAREAS: ['ID', 'TAREA', 'ESTADO', 'PRIORIDAD', 'FECHA_LIMITE', 'PROYECTO', 'NOTAS'],
  TAREAS_META: ['ID', 'PROYECTO_ID', 'TIPO', 'DECISION', 'DURACION_MIN', 'RESPONSABLE', 'COMPLETADA_EN', 'CREADA_EN'],
  PROYECTOS: [
    'ID', 'NOMBRE', 'NEGOCIO', 'CLASE', 'OBJETIVO', 'PRIORIDAD', 'FECHA_OBJETIVO', 'ESTADO', 'ORDEN', 'ETAPAS',
    'SIGUIENTE_ACCION', 'RESPONSABLE', 'ACTUALIZADO',
  ],
  RUTINA: ['FECHA', 'BLOQUE', 'CUMPLIDO', 'HORA_MARCADO', 'NOTAS'],
  CONTADORES: ['FECHA', 'CLAVE', 'CANTIDAD', 'ACTUALIZADO'],
  DIAS: ['FECHA', 'MISION', 'TOP3', 'TERMINADO', 'PENDIENTE', 'APRENDIDO', 'PROBLEMA', 'MANANA', 'CERRADO_EN'],
  INBOX: ['ID', 'TEXTO', 'CREADO', 'ESTADO', 'CLASE', 'NEGOCIO', 'TAREA_ID'],
  SEMANAS: [
    'SEMANA', 'FUNCIONO', 'NO_FUNCIONO', 'DEJAR', 'DELEGAR', 'AUTOMATIZAR', 'CUELLO_BOTELLA', 'PRIORIDADES',
    'RESUMEN_IA', 'CERRADA_EN',
  ],
  METRICAS: ['FECHA', 'CLAVE', 'VALOR', 'NOTA'],
} as const;

type Pestana = keyof typeof ESQUEMA;

function letra(n: number): string {
  return String.fromCharCode(64 + n); // ninguna pestaña pasa de 26 columnas
}

function rango(p: Pestana): string {
  return `${p}!A:${letra(ESQUEMA[p].length)}`;
}

type Fila = string[];

function jsonSeguro<T>(s: string | undefined, porDefecto: T): T {
  if (!s) return porDefecto;
  try {
    return JSON.parse(s) as T;
  } catch {
    return porDefecto;
  }
}

// ── Lectura: una sola llamada por request ───────────────────────────────────

const ORDEN_LECTURA: Pestana[] = [
  'TAREAS', 'TAREAS_META', 'PROYECTOS', 'RUTINA', 'CONTADORES', 'DIAS', 'INBOX', 'SEMANAS', 'METRICAS',
];

// Sin caché: lo usan las server actions, que leen DESPUÉS de escribir.
export async function leerTodo(): Promise<Datos> {
  const [res, negocio] = await Promise.all([
    getSheets().spreadsheets.values.batchGet({
      spreadsheetId: SHEET_ID,
      ranges: ORDEN_LECTURA.map(rango),
    }),
    // Los Sheets de negocio fallan por separado: la app personal sigue andando.
    leerNegocio().catch(() => null),
  ]);
  const tablas = Object.fromEntries(
    ORDEN_LECTURA.map((p, i) => [p, ((res.data.valueRanges?.[i]?.values ?? []) as Fila[]).slice(1).filter((r) => r[0])])
  ) as Record<Pestana, Fila[]>;

  const meta = new Map(tablas.TAREAS_META.map((r) => [r[0], r]));

  const tareas: Tarea[] = tablas.TAREAS.map((r) => {
    const m = meta.get(r[0]) ?? [];
    return {
      id: r[0],
      tarea: r[1] ?? '',
      estado: (r[2] as EstadoTarea) || 'PENDIENTE',
      prioridad: (r[3] as Prioridad) || 'MEDIA',
      fecha_limite: r[4] || '',
      negocio: r[5] || '',
      notas: r[6] || '',
      proyectoId: m[1] || '',
      tipo: (m[2] as TipoTarea) || '',
      decision: (m[3] as Decision) || '',
      duracionMin: m[4] ? Number(m[4]) : null,
      responsable: m[5] || '',
      completadaEn: m[6] || '',
      creadaEn: m[7] || '',
    };
  });

  const proyectos: Proyecto[] = tablas.PROYECTOS.map((r) => ({
    id: r[0],
    nombre: r[1] ?? '',
    negocio: r[2] || '',
    clase: r[3] === 'PRODUCTO' ? 'PRODUCTO' : 'SISTEMA',
    objetivo: r[4] || '',
    prioridad: (r[5] as Prioridad) || 'MEDIA',
    fechaObjetivo: r[6] || '',
    estado: (r[7] as Proyecto['estado']) || 'EN_COLA',
    orden: Number(r[8]) || 99,
    etapas: jsonSeguro<Etapa[]>(r[9], []),
    siguienteAccion: r[10] || '',
    responsable: r[11] || '',
    actualizado: r[12] || '',
  }));

  const rutina: RegistroRutina[] = tablas.RUTINA.map((r) => ({
    fecha: r[0],
    bloque: r[1],
    cumplido: r[2] === 'SI',
    horaMarcado: r[3] || '',
    notas: r[4] || '',
  }));

  const contadores: Contador[] = tablas.CONTADORES.map((r) => ({
    fecha: r[0],
    clave: r[1],
    cantidad: Number(r[2]) || 0,
  }));

  const dias: Dia[] = tablas.DIAS.map((r) => ({
    fecha: r[0],
    mision: r[1] || '',
    top3: jsonSeguro<ItemTop3[]>(r[2], []),
    terminado: r[3] || '',
    pendiente: r[4] || '',
    aprendido: r[5] || '',
    problema: r[6] || '',
    manana: r[7] || '',
    cerradoEn: r[8] || '',
  }));

  const inbox: ItemInbox[] = tablas.INBOX.map((r) => ({
    id: r[0],
    texto: r[1] ?? '',
    creado: r[2] || '',
    estado: (r[3] as EstadoInbox) || 'NUEVO',
    clase: (r[4] as ClaseInbox) || '',
    negocio: r[5] || '',
    tareaId: r[6] || '',
  }));

  const semanas: Semana[] = tablas.SEMANAS.map((r) => ({
    semana: r[0],
    funciono: r[1] || '',
    noFunciono: r[2] || '',
    dejar: r[3] || '',
    delegar: r[4] || '',
    automatizar: r[5] || '',
    cuelloBotella: r[6] || '',
    prioridades: r[7] || '',
    resumenIa: r[8] || '',
    cerradaEn: r[9] || '',
  }));

  const metricas: Metrica[] = tablas.METRICAS.map((r) => ({
    fecha: r[0],
    clave: r[1],
    valor: Number(String(r[2]).replace(/[$,\s]/g, '')) || 0,
    nota: r[3] || '',
  }));

  return { negocio, tareas, proyectos, rutina, contadores, dias, inbox, semanas, metricas };
}

// Con caché por request: layout + página comparten una sola lectura. NO usar
// en server actions — el re-render posterior a la acción reutilizaría la
// lectura previa a la escritura y mostraría datos viejos.
export const cargarTodo = cache(leerTodo);

// ── Escritura genérica ──────────────────────────────────────────────────────

async function leer(p: Pestana): Promise<Fila[]> {
  const res = await getSheets().spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: rango(p) });
  return (res.data.values ?? []) as Fila[];
}

async function escribirFila(p: Pestana, filaIdx: number, fila: Fila): Promise<void> {
  await getSheets().spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${p}!A${filaIdx}:${letra(ESQUEMA[p].length)}${filaIdx}`,
    valueInputOption: 'RAW',
    requestBody: { values: [fila] },
  });
}

async function agregarFila(p: Pestana, fila: Fila): Promise<void> {
  await getSheets().spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: rango(p),
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [fila] },
  });
}

/**
 * Busca la fila que cumple `coincide`; si existe la mezcla con `cambios`
 * (solo las columnas presentes), si no la crea con `nueva()`.
 */
async function upsert(
  p: Pestana,
  coincide: (f: Fila) => boolean,
  cambios: Record<string, string | undefined>,
  nueva: () => Fila
): Promise<void> {
  const filas = await leer(p);
  const cols = ESQUEMA[p] as readonly string[];
  for (let i = 1; i < filas.length; i++) {
    if (coincide(filas[i])) {
      const fila = cols.map((_, c) => filas[i][c] ?? '');
      for (const [col, valor] of Object.entries(cambios)) {
        if (valor === undefined) continue;
        const c = cols.indexOf(col);
        if (c >= 0) fila[c] = valor;
      }
      await escribirFila(p, i + 1, fila);
      return;
    }
  }
  await agregarFila(p, nueva());
}

function filaDesde(p: Pestana, valores: Record<string, string | undefined>): Fila {
  return (ESQUEMA[p] as readonly string[]).map((c) => valores[c] ?? '');
}

// ── Tareas ──────────────────────────────────────────────────────────────────

export interface NuevaTarea {
  tarea: string;
  prioridad?: Prioridad;
  fecha_limite?: string;
  negocio?: string;
  notas?: string;
  proyectoId?: string;
  tipo?: TipoTarea | '';
  decision?: Decision | '';
  duracionMin?: number | null;
  responsable?: string;
}

export async function crearTarea(t: NuevaTarea): Promise<string> {
  const id = Date.now().toString();
  // Mismo formato que sheets-personal.js del bot: TAREA, PRIORIDAD y PROYECTO en mayúsculas.
  await agregarFila('TAREAS', [
    id,
    t.tarea.trim().toUpperCase(),
    'PENDIENTE',
    (t.prioridad ?? 'MEDIA').toUpperCase(),
    t.fecha_limite ?? '',
    (t.negocio ?? '').toUpperCase(),
    t.notas ?? '',
  ]);
  await agregarFila(
    'TAREAS_META',
    filaDesde('TAREAS_META', {
      ID: id,
      PROYECTO_ID: t.proyectoId,
      TIPO: t.tipo,
      DECISION: t.decision,
      DURACION_MIN: t.duracionMin != null ? String(t.duracionMin) : '',
      RESPONSABLE: t.responsable,
      CREADA_EN: ahoraEC(),
    })
  );
  return id;
}

const COL_TAREAS: Record<string, string> = {
  estado: 'ESTADO',
  prioridad: 'PRIORIDAD',
  fecha_limite: 'FECHA_LIMITE',
  negocio: 'PROYECTO',
  notas: 'NOTAS',
  tarea: 'TAREA',
};

const COL_META: Record<string, string> = {
  proyectoId: 'PROYECTO_ID',
  tipo: 'TIPO',
  decision: 'DECISION',
  duracionMin: 'DURACION_MIN',
  responsable: 'RESPONSABLE',
  completadaEn: 'COMPLETADA_EN',
};

export type CambiosTarea = Partial<{
  tarea: string;
  estado: EstadoTarea;
  prioridad: Prioridad;
  fecha_limite: string;
  negocio: string;
  notas: string;
  proyectoId: string;
  tipo: TipoTarea | '';
  decision: Decision | '';
  duracionMin: number | null;
  responsable: string;
  completadaEn: string;
}>;

export async function actualizarTarea(id: string, cambios: CambiosTarea): Promise<void> {
  const base: Record<string, string | undefined> = {};
  const meta: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(cambios)) {
    const valor = v === null ? '' : v === undefined ? undefined : String(v);
    if (COL_TAREAS[k]) {
      base[COL_TAREAS[k]] = ['estado', 'prioridad', 'negocio', 'tarea'].includes(k) ? valor?.toUpperCase() : valor;
    } else if (COL_META[k]) {
      meta[COL_META[k]] = valor;
    }
  }

  if (Object.keys(base).length) {
    // Si el ID no existe en TAREAS no se crea nada: `nueva` nunca debe correr acá.
    const filas = await leer('TAREAS');
    const i = filas.findIndex((f, idx) => idx > 0 && f[0] === id);
    if (i < 0) throw new Error(`Tarea ${id} no existe`);
    const cols = ESQUEMA.TAREAS as readonly string[];
    const fila = cols.map((_, c) => filas[i][c] ?? '');
    for (const [col, valor] of Object.entries(base)) if (valor !== undefined) fila[cols.indexOf(col)] = valor;
    await escribirFila('TAREAS', i + 1, fila);
  }

  if (Object.keys(meta).length) {
    await upsert('TAREAS_META', (f) => f[0] === id, meta, () => filaDesde('TAREAS_META', { ID: id, ...meta }));
  }
}

export async function completarTarea(id: string, hecho = true): Promise<void> {
  await actualizarTarea(id, {
    estado: hecho ? 'HECHO' : 'PENDIENTE',
    completadaEn: hecho ? ahoraEC() : '',
  });
}

export async function archivarTareas(ids: string[]): Promise<number> {
  const filas = await leer('TAREAS');
  const datos = [];
  for (let i = 1; i < filas.length; i++) {
    if (ids.includes(filas[i][0])) datos.push({ range: `TAREAS!C${i + 1}`, values: [['ARCHIVADA']] });
  }
  if (!datos.length) return 0;
  await getSheets().spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: 'RAW', data: datos },
  });
  return datos.length;
}

// ── Proyectos ───────────────────────────────────────────────────────────────

export async function guardarProyecto(p: Partial<Proyecto> & { id: string }): Promise<void> {
  const cambios: Record<string, string | undefined> = {
    NOMBRE: p.nombre,
    NEGOCIO: p.negocio,
    CLASE: p.clase,
    OBJETIVO: p.objetivo,
    PRIORIDAD: p.prioridad,
    FECHA_OBJETIVO: p.fechaObjetivo,
    ESTADO: p.estado,
    ORDEN: p.orden != null ? String(p.orden) : undefined,
    ETAPAS: p.etapas ? JSON.stringify(p.etapas) : undefined,
    SIGUIENTE_ACCION: p.siguienteAccion,
    RESPONSABLE: p.responsable,
    ACTUALIZADO: ahoraEC(),
  };
  await upsert('PROYECTOS', (f) => f[0] === p.id, cambios, () => filaDesde('PROYECTOS', { ID: p.id, ...cambios }));
}

// ── Rutina y contadores ─────────────────────────────────────────────────────

export async function marcarHabito(fecha: string, habito: string, cumplido: boolean): Promise<void> {
  const cambios = { CUMPLIDO: cumplido ? 'SI' : 'NO', HORA_MARCADO: ahoraEC() };
  await upsert(
    'RUTINA',
    (f) => f[0] === fecha && f[1] === habito,
    cambios,
    () => filaDesde('RUTINA', { FECHA: fecha, BLOQUE: habito, ...cambios })
  );
}

export async function sumarContador(fecha: string, clave: string, delta: number): Promise<number> {
  const filas = await leer('CONTADORES');
  const i = filas.findIndex((f, idx) => idx > 0 && f[0] === fecha && f[1] === clave);
  const actual = i > 0 ? Number(filas[i][2]) || 0 : 0;
  const nuevo = Math.max(0, actual + delta);
  const fila = [fecha, clave, String(nuevo), ahoraEC()];
  if (i > 0) await escribirFila('CONTADORES', i + 1, fila);
  else await agregarFila('CONTADORES', fila);
  return nuevo;
}

// ── Días ────────────────────────────────────────────────────────────────────

export async function guardarDia(fecha: string, d: Partial<Omit<Dia, 'fecha'>>): Promise<void> {
  const cambios: Record<string, string | undefined> = {
    MISION: d.mision,
    TOP3: d.top3 ? JSON.stringify(d.top3) : undefined,
    TERMINADO: d.terminado,
    PENDIENTE: d.pendiente,
    APRENDIDO: d.aprendido,
    PROBLEMA: d.problema,
    MANANA: d.manana,
    CERRADO_EN: d.cerradoEn,
  };
  await upsert('DIAS', (f) => f[0] === fecha, cambios, () => filaDesde('DIAS', { FECHA: fecha, ...cambios }));
}

// ── Inbox ───────────────────────────────────────────────────────────────────

export async function crearInbox(item: Omit<ItemInbox, 'id' | 'creado'>): Promise<string> {
  const id = `IN${Date.now()}`;
  await agregarFila(
    'INBOX',
    filaDesde('INBOX', {
      ID: id,
      TEXTO: item.texto,
      CREADO: ahoraEC(),
      ESTADO: item.estado,
      CLASE: item.clase,
      NEGOCIO: item.negocio,
      TAREA_ID: item.tareaId,
    })
  );
  return id;
}

export async function actualizarInbox(id: string, cambios: Partial<Pick<ItemInbox, 'estado' | 'clase' | 'negocio' | 'tareaId'>>) {
  await upsert(
    'INBOX',
    (f) => f[0] === id,
    { ESTADO: cambios.estado, CLASE: cambios.clase, NEGOCIO: cambios.negocio, TAREA_ID: cambios.tareaId },
    () => {
      throw new Error(`Inbox ${id} no existe`);
    }
  );
}

// ── Semana y métricas ───────────────────────────────────────────────────────

export async function guardarSemana(semana: string, s: Partial<Omit<Semana, 'semana'>>): Promise<void> {
  const cambios: Record<string, string | undefined> = {
    FUNCIONO: s.funciono,
    NO_FUNCIONO: s.noFunciono,
    DEJAR: s.dejar,
    DELEGAR: s.delegar,
    AUTOMATIZAR: s.automatizar,
    CUELLO_BOTELLA: s.cuelloBotella,
    PRIORIDADES: s.prioridades,
    RESUMEN_IA: s.resumenIa,
    CERRADA_EN: s.cerradaEn,
  };
  await upsert('SEMANAS', (f) => f[0] === semana, cambios, () => filaDesde('SEMANAS', { SEMANA: semana, ...cambios }));
}

export async function registrarMetrica(clave: string, valor: number, nota = ''): Promise<void> {
  await agregarFila('METRICAS', [hoyEC(), clave, String(valor), nota]);
}

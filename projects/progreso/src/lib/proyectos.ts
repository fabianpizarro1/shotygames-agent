import 'server-only';
import { guardarProyecto, leerTodo } from './datos';
import { organizarProyecto, type ResultadoOrganizar } from './organizador';
import { IA_ACTIVA } from './ia-activa';
import { MAX_PROYECTOS_ACTIVOS, type Proyecto } from './tipos';

// Crear un proyecto: lo usan la pantalla Proyectos (acciones.ts) y el bot de
// Telegram (/api/interno/organizar). Las reglas de activación viven acá una vez.

export const ETAPAS_PRODUCTO = [
  'Idea', 'Investigación', 'Mecánica', 'Contenido', 'Diseño', 'Costos', 'Proveedor', 'Prototipo',
  'Pruebas', 'Packaging', 'Producción', 'Oferta', 'Landing', 'Ads', 'Lanzamiento',
];
export const ETAPAS_SISTEMA = ['Documentar', 'Probar', 'Delegar', 'Medir'];

export async function crearProyecto(p: {
  nombre: string;
  negocio: string;
  clase: Proyecto['clase'];
  objetivo: string;
  etapas?: string[];
  fechaObjetivo?: string;
  /** Activarlo ya y que la IA lo organice hasta la fecha límite. */
  empezar?: boolean;
}): Promise<{ id: string; plan: ResultadoOrganizar | null }> {
  const datos = await leerTodo();
  const id = `P${Date.now()}`;
  let estado: Proyecto['estado'] = 'EN_COLA';
  if (p.empezar) {
    // Si no se puede activar, se dice antes de crear nada.
    verificarActivacion(datos.proyectos, p);
    estado = 'ACTIVO';
  }
  const etapas = p.etapas?.filter(Boolean).length ? p.etapas.filter(Boolean) : p.clase === 'SISTEMA' ? ETAPAS_SISTEMA : ETAPAS_PRODUCTO;
  await guardarProyecto({
    id,
    nombre: p.nombre.trim(),
    negocio: p.negocio,
    clase: p.clase,
    objetivo: p.objetivo,
    prioridad: 'MEDIA',
    estado,
    fechaObjetivo: p.fechaObjetivo ?? '',
    orden: Math.max(0, ...datos.proyectos.map((x) => x.orden)) + 1,
    etapas: etapas.map((nombre) => ({ nombre, pct: 0 })),
  });
  const plan = IA_ACTIVA && p.empezar && p.fechaObjetivo ? await organizarProyecto(id, p.fechaObjetivo) : null;
  return { id, plan };
}

/** Activar, pausar, terminar o devolver a la cola, con las reglas de activación. */
export async function cambiarEstadoProyecto(id: string, estado: Proyecto['estado']): Promise<string> {
  const datos = await leerTodo();
  const p = datos.proyectos.find((x) => x.id === id);
  if (!p) throw new Error(`No existe el proyecto ${id}`);
  if (estado === 'ACTIVO' && p.estado !== 'ACTIVO') verificarActivacion(datos.proyectos, p);
  await guardarProyecto({ id, estado });
  return `${p.nombre}: ${p.estado} → ${estado}`;
}

/** Máximo 6 activos y un PRODUCTO activo por negocio. Tira el error que se le muestra a Fabián. */
export function verificarActivacion(todos: Proyecto[], p: Pick<Proyecto, 'negocio' | 'clase'> & { id?: string }) {
  const activos = todos.filter((x) => x.estado === 'ACTIVO' && x.id !== p.id);
  if (activos.length >= MAX_PROYECTOS_ACTIVOS) throw new Error(`Ya tienes ${activos.length} proyectos activos. Termina o pausa uno primero.`);
  const enCurso = activos.find((x) => x.clase === 'PRODUCTO' && x.negocio === p.negocio);
  if (p.clase === 'PRODUCTO' && enCurso) throw new Error(`"${enCurso.nombre}" sigue activo. Los productos van de a uno: termínalo o páusalo primero.`);
}

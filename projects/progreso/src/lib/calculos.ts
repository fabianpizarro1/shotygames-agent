// Todo lo derivado: prioridad, cumplimiento, alertas, XP. Puro — se recalcula
// en cada carga desde el Sheet, nunca se persiste.

import { diaSemana, diasEntre, hoyEC, lunesDe, sumarDias } from './fecha';
import {
  CONTADORES,
  HABITOS,
  MAX_PROYECTOS_ACTIVOS,
  NEGOCIOS,
  labelNegocio,
  progresoProyecto,
  type Datos,
  type Habito,
  type Proyecto,
  type Tarea,
} from './tipos';

// ── Prioridad ───────────────────────────────────────────────────────────────

export interface TareaPuntuada extends Tarea {
  puntaje: number;
  razones: string[];
  /** La marcó para delegar/tercerizar/automatizar y sigue pendiente. */
  paraSoltar: boolean;
}

export function puntuarTarea(t: Tarea, hoy: string, proyectosActivos: Set<string>): TareaPuntuada {
  let p = 0;
  const razones: string[] = [];

  p += { ALTA: 30, MEDIA: 15, BAJA: 5 }[t.prioridad] ?? 15;
  if (t.prioridad === 'ALTA') razones.push('prioridad alta');

  if (t.fecha_limite) {
    const dias = diasEntre(hoy, t.fecha_limite);
    if (dias < -60) {
      p -= 30;
      razones.push('vencida hace +60 días (¿sigue viva?)');
    } else if (dias < 0) {
      p += 25;
      razones.push(`vencida hace ${-dias} d`);
    } else if (dias === 0) {
      p += 20;
      razones.push('vence hoy');
    } else if (dias <= 3) {
      p += 10;
      razones.push(`vence en ${dias} d`);
    }
  }

  const negocio = NEGOCIOS.find((n) => n.id === t.negocio);
  if (negocio) p += negocio.peso;
  if (t.negocio === 'SALIR_DE_DEUDAS') razones.push('deudas = prioridad #1');

  if (t.proyectoId && proyectosActivos.has(t.proyectoId)) {
    p += 20;
    razones.push('proyecto activo');
  }
  if (t.tipo === 'ESTRATEGICO' || t.tipo === 'CREATIVO') {
    p += 10;
    razones.push(t.tipo === 'ESTRATEGICO' ? 'estratégica' : 'creativa');
  }

  const paraSoltar = t.decision === 'DELEGAR' || t.decision === 'TERCERIZAR' || t.decision === 'AUTOMATIZAR';
  if (paraSoltar) {
    p -= 15;
    razones.push(`marcada para ${t.decision.toLowerCase()}`);
  }
  if (t.duracionMin != null && t.duracionMin <= 15) {
    p += 5;
    razones.push('rápida');
  }

  return { ...t, puntaje: p, razones, paraSoltar };
}

export function tareasPendientesOrdenadas(datos: Datos, hoy = hoyEC()): TareaPuntuada[] {
  const activos = new Set(datos.proyectos.filter((p) => p.estado === 'ACTIVO').map((p) => p.id));
  return datos.tareas
    .filter((t) => t.estado === 'PENDIENTE' && t.decision !== 'ELIMINAR')
    .map((t) => puntuarTarea(t, hoy, activos))
    .sort((a, b) => b.puntaje - a.puntaje);
}

// ── Hábitos y cumplimiento semanal ──────────────────────────────────────────

export function habitosDelDia(fecha: string): Habito[] {
  const dow = diaSemana(fecha);
  const laboral = dow >= 1 && dow <= 5;
  return HABITOS.filter((h) => !h.soloLaborales || laboral);
}

const IDS_HABITOS = new Set(HABITOS.map((h) => h.id));

/** Primer día con algún registro de los hábitos actuales — antes de eso no se cobran fallas. */
export function inicioDeUso(datos: Datos): string | null {
  const fechas = [
    ...datos.rutina.filter((r) => IDS_HABITOS.has(r.bloque)).map((r) => r.fecha),
    ...datos.dias.map((d) => d.fecha),
  ].sort();
  return fechas[0] ?? null;
}

export interface ItemCumplimiento {
  id: string;
  label: string;
  hecho: number;
  meta: number;
  /** Lo que debería llevar a esta altura de la semana (prorrateado). */
  esperado: number;
}

export interface Cumplimiento {
  semana: string;
  pct: number;
  items: ItemCumplimiento[];
}

export function cumplimientoSemana(datos: Datos, hoy = hoyEC(), lunes = lunesDe(hoy)): Cumplimiento {
  const domingo = sumarDias(lunes, 6);
  const enSemana = (f: string) => f >= lunes && f <= domingo;
  const diasTranscurridos = Math.min(7, diasEntre(lunes, hoy) + 1);

  const items: ItemCumplimiento[] = [
    ...HABITOS.map((h) => ({
      id: h.id,
      label: h.label,
      hecho: datos.rutina.filter((r) => r.bloque === h.id && r.cumplido && enSemana(r.fecha)).length,
      meta: h.metaSemanal,
      esperado: Math.round((h.metaSemanal * diasTranscurridos) / 7),
    })),
    ...CONTADORES.map((c) => ({
      id: c.id,
      label: c.label,
      hecho: datos.contadores.filter((x) => x.clave === c.id && enSemana(x.fecha)).reduce((a, x) => a + x.cantidad, 0),
      meta: c.metaSemanal,
      esperado: Math.round((c.metaSemanal * diasTranscurridos) / 7),
    })),
  ];

  const pct = Math.round((items.reduce((a, i) => a + Math.min(1, i.hecho / i.meta), 0) / items.length) * 100);
  return { semana: lunes, pct, items };
}

/** Hábitos que se fallaron ayer — hoy no se pueden fallar de nuevo. */
export function fallasDeAyer(datos: Datos, hoy = hoyEC()): Habito[] {
  const ayer = sumarDias(hoy, -1);
  const inicio = inicioDeUso(datos);
  if (!inicio || ayer < inicio) return [];
  const hechosAyer = new Set(datos.rutina.filter((r) => r.fecha === ayer && r.cumplido).map((r) => r.bloque));
  return habitosDelDia(ayer).filter((h) => h.id !== 'DORMIR' && !hechosAyer.has(h.id));
}

// ── Métricas ────────────────────────────────────────────────────────────────

export function ultimaMetrica(datos: Datos, clave: string): { actual: number | null; anterior: number | null; fecha: string } {
  const serie = datos.metricas.filter((m) => m.clave === clave).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const ultima = serie.at(-1);
  return { actual: ultima?.valor ?? null, anterior: serie.at(-2)?.valor ?? null, fecha: ultima?.fecha ?? '' };
}

// ── Proyectos ───────────────────────────────────────────────────────────────

export function productoActivo(datos: Datos, negocio = 'SHOTYGAMES'): Proyecto | null {
  return (
    datos.proyectos
      .filter((p) => p.negocio === negocio && p.clase === 'PRODUCTO' && p.estado === 'ACTIVO')
      .sort((a, b) => a.orden - b.orden)[0] ?? null
  );
}

// ── Alertas contextuales ────────────────────────────────────────────────────

export interface Alerta {
  nivel: 'rojo' | 'ambar' | 'info';
  texto: string;
}

export function alertas(datos: Datos, hoy = hoyEC()): Alerta[] {
  const out: Alerta[] = [];
  const inicio = inicioDeUso(datos) ?? hoy;
  const diasDeUso = diasEntre(inicio, hoy);
  // La semana en que empezó a usar la app no se cobra: no había cómo registrar.
  const semanaCompleta = inicio <= lunesDe(hoy);
  const dow = diaSemana(hoy);

  // Producto activo estancado
  for (const p of datos.proyectos.filter((x) => x.estado === 'ACTIVO' && x.clase === 'PRODUCTO')) {
    const ultima = p.actualizado.slice(0, 10);
    const dias = ultima ? diasEntre(ultima, hoy) : null;
    if (dias !== null && dias >= 5) {
      out.push({ nivel: 'rojo', texto: `${p.nombre} lleva ${dias} días sin avanzar (${progresoProyecto(p)}%).` });
    }
  }

  // Ritmo de la semana
  const c = cumplimientoSemana(datos, hoy);
  const tests = c.items.find((i) => i.id === 'TEST_DROP')!;
  if (semanaCompleta && (dow >= 4 || dow === 0) && tests.hecho < tests.esperado * 0.6) {
    out.push({ nivel: 'ambar', texto: `Esta semana llevas ${tests.hecho} de ${tests.meta} productos testeados.` });
  }

  // Ads
  const fechasAds = datos.contadores.filter((x) => x.clave === 'ADS' && x.cantidad > 0).map((x) => x.fecha).sort();
  const ultimoAd = fechasAds.at(-1) ?? null;
  const diasSinAds = ultimoAd ? diasEntre(ultimoAd, hoy) : diasDeUso;
  if (diasSinAds >= 6) out.push({ nivel: 'ambar', texto: `Llevas ${diasSinAds} días sin crear ads nuevos.` });

  // Deuda
  const mes = hoy.slice(0, 7);
  const deudas = datos.metricas.filter((m) => m.clave === 'DEUDA_TOTAL').sort((a, b) => a.fecha.localeCompare(b.fecha));
  const deudaEsteMes = deudas.filter((m) => m.fecha.startsWith(mes)).at(-1);
  const deudaAntes = deudas.filter((m) => m.fecha < `${mes}-01`).at(-1);
  if (!deudaEsteMes) {
    out.push({ nivel: 'ambar', texto: 'No registraste la deuda total este mes (CEO → Dinero).' });
  } else if (deudaAntes && deudaEsteMes.valor >= deudaAntes.valor && Number(hoy.slice(8)) >= 20) {
    out.push({ nivel: 'rojo', texto: `La deuda no bajó este mes ($${deudaEsteMes.valor.toLocaleString('es-EC')}).` });
  }

  // Lo que dijo que iba a soltar y sigue con él
  for (const t of datos.tareas) {
    if (t.estado !== 'PENDIENTE' || !['DELEGAR', 'TERCERIZAR', 'AUTOMATIZAR'].includes(t.decision)) continue;
    const desde = t.creadaEn.slice(0, 10) || t.fecha_limite;
    if (desde && diasEntre(desde, hoy) >= 14) {
      out.push({
        nivel: 'ambar',
        texto: `Hace ${diasEntre(desde, hoy)} días marcaste "${t.tarea.toLowerCase()}" para ${t.decision.toLowerCase()} y sigue contigo.`,
      });
    }
  }

  // Horas operativas
  const horas = ultimaMetrica(datos, 'HORAS_OPERATIVAS');
  if (horas.actual !== null && horas.anterior !== null && horas.actual > horas.anterior) {
    out.push({
      nivel: 'ambar',
      texto: `Horas operativas subieron: ${horas.anterior} → ${horas.actual}. El objetivo es construir sistemas.`,
    });
  }

  // Demasiados proyectos abiertos
  const activos = datos.proyectos.filter((p) => p.estado === 'ACTIVO').length;
  if (activos > MAX_PROYECTOS_ACTIVOS) {
    out.push({ nivel: 'rojo', texto: `${activos} proyectos activos (máx ${MAX_PROYECTOS_ACTIVOS}). Pausa alguno.` });
  }

  // Cierre de ayer
  const ayer = sumarDias(hoy, -1);
  if (ayer >= inicio && !datos.dias.find((d) => d.fecha === ayer)?.cerradoEn) {
    out.push({ nivel: 'info', texto: 'Ayer no cerraste el día. Hoy ciérralo antes de las 22:20.' });
  }

  // Mismo cuello de botella 3 semanas
  const cuellos = datos.semanas
    .filter((s) => s.cuelloBotella)
    .sort((a, b) => a.semana.localeCompare(b.semana))
    .slice(-3)
    .map((s) => s.cuelloBotella.trim().toLowerCase());
  if (cuellos.length === 3 && new Set(cuellos).size === 1) {
    out.push({ nivel: 'rojo', texto: `3 semanas con el mismo cuello de botella: "${cuellos[0]}".` });
  }

  return out;
}

// ── Gamificación (se mantiene del MVP: XP y nivel, sin racha que se reinicia) ─

export function calcularXP(datos: Datos): number {
  const habitos = datos.rutina.filter((r) => r.cumplido && IDS_HABITOS.has(r.bloque)).length * 10;
  const tareas = datos.tareas
    .filter((t) => t.estado === 'HECHO')
    .reduce((a, t) => a + ({ ALTA: 30, MEDIA: 20, BAJA: 10 }[t.prioridad] ?? 20), 0);
  const contadores = datos.contadores.reduce((a, c) => a + c.cantidad * 5, 0);
  const cierres = datos.dias.filter((d) => d.cerradoEn).length * 15;
  return habitos + tareas + contadores + cierres;
}

export function calcularNivel(xp: number) {
  const nivel = Math.floor(Math.sqrt(xp / 100)) + 1;
  const inicio = (nivel - 1) ** 2 * 100;
  const siguiente = nivel ** 2 * 100;
  return { nivel, siguiente, progresoPct: Math.round(((xp - inicio) / (siguiente - inicio)) * 100) };
}

export function resumenNegocios(datos: Datos) {
  return NEGOCIOS.map((n) => ({
    ...n,
    label: labelNegocio(n.id),
    pendientes: datos.tareas.filter((t) => t.negocio === n.id && t.estado === 'PENDIENTE').length,
  }));
}

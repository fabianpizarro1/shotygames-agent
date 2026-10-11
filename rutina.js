// Huecos de trabajo de la rutina de Fabián (octubre 2026) — dónde puede el
// bot PERSONAL agendar tareas. Es la misma semana tipo que
// projects/progreso/src/lib/agenda.ts y context/rutina.md: si cambia una,
// cambiar las tres.
//
// Lo que no está acá (06:00-10:30 mañana con gym y revisión #1, almuerzo,
// revisión #2 de las 17:15, snack, merienda, revisión #3 de las 21:00, 22:00
// cierre) es fijo y no se agenda encima. Versión 3 del 2026-10-11.

const TEMAS = {
  1: ['CEO: números + elegir el cuello de botella de la semana', 'Ads ShotyGames — tanda 1 (3-5 creativos)'],
  2: ['Producto activo ShotyGames', 'Producto activo ShotyGames (diseño, proveedor, costos, prototipo)'],
  3: ['Product Lab: investigar y seleccionar productos', 'Ofertas, landings, creativos y campañas — cola de 7'],
  4: ['Sistemas + delegación: ¿qué dejo de hacer yo?', 'CandyShots: procesos, recetas, inventario, caja'],
  5: ['Ads: ganadores + tanda 2', 'Contenido + finanzas + plan de la semana + stock para el finde'],
};

// 0 = domingo. Mediodía en Ecuador para que ninguna zona horaria cambie el día.
function diaSemana(fecha) {
  return new Date(`${fecha}T12:00:00-05:00`).getUTCDay();
}

function huecosDeTrabajo(fecha) {
  const d = diaSemana(fecha);
  if (d >= 1 && d <= 5) {
    const [tema1, tema2] = TEMAS[d];
    return [
      { tipo: 'PROFUNDO_1', inicio: '10:30', fin: '13:00', para: `Trabajo profundo. Tema del día: ${tema1}` },
      { tipo: 'PROFUNDO_2', inicio: '14:30', fin: '16:30', para: `Trabajo profundo. Tema del día: ${tema2}` },
      { tipo: 'GESTIONES', inicio: '16:30', fin: '17:15', para: 'Gestiones en horario comercial: imprentas, proveedores, bancos, compras, Nerea, trámites' },
      { tipo: 'OPERATIVO', inicio: '18:00', fin: '19:00', para: 'Producción propia por lotes (impresión de bloques), sin llamadas ni anuncios' },
      { tipo: 'PERSONAL', inicio: '19:00', fin: '20:00', para: 'Vida personal: familia, pareja, amigos, mandados personales' },
      { tipo: 'PERSONAL', inicio: '21:20', fin: '22:00', para: 'Vida personal: desconectar, sin trabajo' },
    ];
  }
  return [{ tipo: 'CANDYSHOTS', inicio: '10:00', fin: '22:00', para: 'Solo cosas del local CandyShots o grabar contenido ahí' }];
}

const aMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const aHora = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/**
 * Restan los ocupados ([{inicio, fin}] en minutos) a cada hueco de trabajo
 * del día. Devuelve los tramos libres de 15 min o más.
 */
function tramosLibres(fecha, ocupados) {
  return huecosDeTrabajo(fecha).map((h) => {
    let tramos = [[aMin(h.inicio), aMin(h.fin)]];
    for (const o of ocupados) {
      tramos = tramos.flatMap(([a, b]) => {
        if (o.fin <= a || o.inicio >= b) return [[a, b]];
        const partes = [];
        if (o.inicio > a) partes.push([a, o.inicio]);
        if (o.fin < b) partes.push([o.fin, b]);
        return partes;
      });
    }
    return {
      ...h,
      libre: tramos.filter(([a, b]) => b - a >= 15).map(([a, b]) => `${aHora(a)}-${aHora(b)}`),
    };
  });
}

module.exports = { huecosDeTrabajo, tramosLibres, diaSemana, aMin, aHora };

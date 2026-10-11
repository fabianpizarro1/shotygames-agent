// Huecos de trabajo de la rutina de Fabián (octubre 2026) — dónde puede el
// bot PERSONAL agendar tareas. Es la misma semana tipo que
// projects/progreso/src/lib/agenda.ts y context/rutina.md: si cambia una,
// cambiar las tres.
//
// Lo que no está acá (07:00-10:10 mañana, 12:30 logística, almuerzo, 17:15
// revisión, 21:30 inglés, 22:00 cierre) es fijo y no se agenda encima.

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
      { tipo: 'PROFUNDO_1', inicio: '10:10', fin: '12:30', para: `Trabajo profundo. Tema del día: ${tema1}` },
      { tipo: 'PROFUNDO_2', inicio: '14:00', fin: '16:30', para: `Trabajo profundo. Tema del día: ${tema2}` },
      { tipo: 'OPERATIVO', inicio: '16:30', fin: '17:15', para: 'Operativo: compras, Nerea, trámites, producción por lotes' },
      { tipo: 'PERSONAL', inicio: '17:35', fin: '21:30', para: 'Vida personal: familia, pareja, amigos, mandados personales' },
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

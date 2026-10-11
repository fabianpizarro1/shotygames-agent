// Cambia el Google Calendar de la rutina de junio a la de octubre 2026.
//
//   node scripts/rutina-calendario-2026-10.js            → simulación, no toca nada
//   node scripts/rutina-calendario-2026-10.js --aplicar  → corta lo viejo y crea lo nuevo
//
// 1. Las series viejas (Comidas, Ejercicio, Rutina, Trabajo ShotyGames,
//    Tareas CandyShots) terminan el domingo 11-oct: se les pone UNTIL, no se
//    borran, así el historial queda. Las reglas originales se guardan en
//    archives/calendario-rutina-2026-06/series.json para poder revertir.
// 2. La rutina nueva va al calendario "Rutina" como series semanales desde el
//    lunes 12-oct. Los bloques donde el bot agenda tareas (profundos,
//    operativo, vida personal, CandyShots) van como "disponible"
//    (transparency: transparent): el bot los ignora al buscar huecos, así una
//    tarea puede caer adentro sin chocar con su propio bloque.
//
// Fuente del horario: context/rutina.md y rutina.js (mismos bloques).

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const APLICAR = process.argv.includes('--aplicar');
const CORTE_UNTIL = '20261012T045959Z'; // domingo 11-oct 23:59:59 en Ecuador
const INICIO = '2026-10-12'; // lunes
const CALENDARIOS_VIEJOS = ['Comidas', 'Ejercicio', 'Rutina', 'Trabajo ShotyGames', 'Tareas CandyShots'];
const BACKUP = path.join(__dirname, '..', 'archives', 'calendario-rutina-2026-06', 'series.json');
const TZ = 'America/Guayaquil';

const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: process.env.GOOGLE_CALENDAR_TOKEN || process.env.GOOGLE_REFRESH_TOKEN });
const cal = google.calendar({ version: 'v3', auth });

const LV = 'MO,TU,WE,TH,FR';
const FINDE = 'SA,SU';
const AVISO = { useDefault: false, overrides: [{ method: 'popup', minutes: 0 }] };
const SIN_AVISO = { useDefault: false, overrides: [] };

// [días, primer día, inicio, fin, título, libre para agendar, avisar]
const PROFUNDO = (dia, fecha, tema1, tema2) => [
  [dia, fecha, '10:10', '12:30', `🧠 Profundo #1 — ${tema1}`, true, true],
  [dia, fecha, '14:00', '16:30', `🧠 Profundo #2 — ${tema2}`, true, true],
];
const RUTINA = [
  [LV, '2026-10-12', '07:00', '07:45', 'Agua, aseo sin redes + Biblia y oración', false, false],
  [LV, '2026-10-12', '07:45', '08:15', 'Desayuno', false, false],
  [LV, '2026-10-12', '08:15', '09:15', 'Gym', false, false],
  [LV, '2026-10-12', '09:15', '09:45', 'Ducha + prepararme', false, false],
  [LV, '2026-10-12', '09:45', '10:10', 'Revisión rápida: Meta, pedidos, urgencias (revisar, no optimizar)', false, false],
  ...PROFUNDO('MO', '2026-10-12', 'CEO: números + UN cuello de botella', 'Ads ShotyGames tanda 1'),
  ...PROFUNDO('TU', '2026-10-13', 'Producto activo ShotyGames', 'Producto activo ShotyGames'),
  ...PROFUNDO('WE', '2026-10-14', 'Product Lab', 'Ofertas, landings, creativos, campañas'),
  ...PROFUNDO('TH', '2026-10-15', 'Sistemas + delegación', 'CandyShots: procesos'),
  ...PROFUNDO('FR', '2026-10-16', 'Ads: ganadores + tanda 2', 'Contenido + finanzas + stock finde'),
  [LV, '2026-10-12', '12:30', '12:50', 'Logística: guías + novedades (3 tiendas)', false, false],
  [LV, '2026-10-12', '12:50', '14:00', 'Almuerzo + descanso', false, false],
  [LV, '2026-10-12', '16:30', '17:15', 'Producción / sistemas / secundarias', true, false],
  [LV, '2026-10-12', '17:15', '17:35', 'Última revisión: logística, Meta, urgentes', false, false],
  [LV, '2026-10-12', '17:35', '21:30', 'Vida personal — familia, pareja, amigos (sin culpa)', true, false],
  [LV, '2026-10-12', '21:30', '22:00', 'Inglés', false, false],
  ['MO,TU,WE,TH,FR,SA,SU', '2026-10-12', '22:00', '22:20', '✅ Cerrar el día + Top 3 de mañana (app Progreso)', false, true],
  ['MO,TU,WE,TH,FR,SA,SU', '2026-10-12', '23:30', '23:45', 'Dormir — celular lejos de la cama', false, false],
  [FINDE, '2026-10-17', '07:00', '07:45', 'Biblia + oración, sin apuro', false, false],
  [FINDE, '2026-10-17', '07:45', '08:30', 'Desayuno', false, false],
  ['SU', '2026-10-18', '08:30', '09:30', '📊 Revisión semanal (30 min, app Progreso → CEO)', false, true],
  [FINDE, '2026-10-17', '09:30', '10:00', 'Revisión mínima: pedidos, logística, drop del día', false, false],
  [FINDE, '2026-10-17', '10:00', '22:00', 'CandyShots — observar cuellos de botella, grabar contenido', true, false],
];

async function calendariosPorNombre() {
  const lista = (await cal.calendarList.list()).data.items || [];
  return Object.fromEntries(lista.map((c) => [c.summary, c.id]));
}

function cortarRegla(recurrence) {
  return recurrence.map((linea) => {
    if (!linea.startsWith('RRULE:')) return linea;
    const partes = linea.slice(6).split(';').filter((p) => !p.startsWith('UNTIL=') && !p.startsWith('COUNT='));
    return `RRULE:${[...partes, `UNTIL=${CORTE_UNTIL}`].join(';')}`;
  });
}

async function main() {
  const ids = await calendariosPorNombre();
  const backup = [];
  let cortadas = 0;

  console.log(`\n=== 1. Series viejas que terminan el 11-oct ${APLICAR ? '' : '(simulación)'} ===`);
  for (const nombre of CALENDARIOS_VIEJOS) {
    const calendarId = ids[nombre];
    if (!calendarId) { console.log(`  ⚠️ no existe el calendario ${nombre}`); continue; }
    // Solo series que todavía tienen instancias desde el lunes 12.
    const futuras = await cal.events.list({ calendarId, timeMin: `${INICIO}T00:00:00-05:00`, timeMax: '2026-12-12T00:00:00-05:00', singleEvents: true, maxResults: 2500 });
    const maestros = [...new Set((futuras.data.items || []).map((e) => e.recurringEventId).filter(Boolean))];
    for (const eventId of maestros) {
      const m = (await cal.events.get({ calendarId, eventId })).data;
      const inicioSerie = (m.start.dateTime || m.start.date).slice(0, 10);
      if (inicioSerie >= INICIO) {
        console.log(`  ⚠️ ${nombre} · "${m.summary}" empieza el ${inicioSerie}: no se corta (revisar a mano)`);
        continue;
      }
      backup.push({ calendario: nombre, calendarId, eventId, titulo: m.summary, recurrence: m.recurrence });
      console.log(`  ${nombre} · ${m.summary} · ${m.start.dateTime?.slice(11, 16) || 'todo el día'} · ${m.recurrence.join(' ')}`);
      if (APLICAR) {
        await cal.events.patch({ calendarId, eventId, requestBody: { recurrence: cortarRegla(m.recurrence) } });
      }
      cortadas++;
    }
  }
  if (APLICAR && backup.length) {
    fs.mkdirSync(path.dirname(BACKUP), { recursive: true });
    fs.writeFileSync(BACKUP, JSON.stringify(backup, null, 2));
    console.log(`  respaldo de las reglas originales → ${path.relative(process.cwd(), BACKUP)}`);
  }

  console.log(`\n=== 2. Rutina nueva en "Rutina" desde el 12-oct ${APLICAR ? '' : '(simulación)'} ===`);
  const destino = ids['Rutina'];
  // No duplicar si el script ya corrió: se compara título + primer día + hora.
  const yaCreados = new Set(
    ((await cal.events.list({ calendarId: destino, timeMin: `${INICIO}T00:00:00-05:00`, timeMax: '2026-10-19T00:00:00-05:00', singleEvents: false, maxResults: 250 })).data.items || [])
      .filter((e) => e.recurrence)
      .map((e) => `${e.summary}|${e.start.dateTime?.slice(0, 16)}`)
  );
  let creadas = 0;
  for (const [dias, fecha, ini, fin, titulo, libre, avisar] of RUTINA) {
    const clave = `${titulo}|${fecha}T${ini}`;
    if (yaCreados.has(clave)) { console.log(`  = ya existe: ${titulo}`); continue; }
    console.log(`  + ${dias.padEnd(20)} ${ini}-${fin} ${titulo}${libre ? '  [libre para tareas]' : ''}${avisar ? '  🔔' : ''}`);
    if (APLICAR) {
      await cal.events.insert({
        calendarId: destino,
        requestBody: {
          summary: titulo,
          start: { dateTime: `${fecha}T${ini}:00`, timeZone: TZ },
          end: { dateTime: `${fecha}T${fin}:00`, timeZone: TZ },
          recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${dias}`],
          transparency: libre ? 'transparent' : 'opaque',
          reminders: avisar ? AVISO : SIN_AVISO,
        },
      });
    }
    creadas++;
  }

  console.log(`\n${APLICAR ? 'Hecho' : 'Simulación'}: ${cortadas} series cortadas, ${creadas} series nuevas.`);
  if (!APLICAR) console.log('Para aplicar: node scripts/rutina-calendario-2026-10.js --aplicar');
}

main().catch((e) => { console.error('ERROR', e.message); process.exit(1); });

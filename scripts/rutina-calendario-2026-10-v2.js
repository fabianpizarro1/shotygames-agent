// Rutina de octubre, versión 2 (2026-10-11): despertar 06:00, gym de 2 h con comida
// pre-entreno antes y desayuno después, 3 revisiones de logística, snack y merienda,
// sin inglés. Reparte los bloques en los calendarios Comidas, Ejercicio y Rutina.
//
//   node scripts/rutina-calendario-2026-10-v2.js            → simulación, no toca nada
//   node scripts/rutina-calendario-2026-10-v2.js --aplicar  → borra las series viejas y crea las nuevas
//
// Las series viejas (versión 1, creadas por rutina-calendario-2026-10.js) empiezan el 12-oct
// y todavía no tienen una sola instancia pasada, así que se BORRAN en vez de cortarlas con
// UNTIL. Antes se guarda cada una entera en archives/calendario-rutina-2026-10-v1/series.json
// para poder revertir.
//
// Fuente del horario: context/rutina.md, projects/progreso/src/lib/agenda.ts y rutina.js
// (mismos bloques: si cambia una, cambiar las tres).

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const APLICAR = process.argv.includes('--aplicar');
const INICIO = '2026-10-12'; // lunes
const BACKUP = path.join(__dirname, '..', 'archives', 'calendario-rutina-2026-10-v1', 'series.json');
const TZ = 'America/Guayaquil';

const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: process.env.GOOGLE_CALENDAR_TOKEN || process.env.GOOGLE_REFRESH_TOKEN });
const cal = google.calendar({ version: 'v3', auth });

const LV = 'MO,TU,WE,TH,FR';
const FINDE = 'SA,SU';
const AVISO = { useDefault: false, overrides: [{ method: 'popup', minutes: 0 }] };
const SIN_AVISO = { useDefault: false, overrides: [] };

// Series de la versión 1 que se reemplazan: [calendario, título (o prefijo), hora de inicio, días que debe contener la regla].
const VIEJAS = [
  ['Comidas', 'Desayuno', '07:45', 'MO,TU,WE,TH,FR'],
  ['Ejercicio', 'Gym', '08:15', 'MO,TU,WE,TH,FR'],
  ['Rutina', 'Agua, aseo sin redes + Biblia y oración', '07:00'],
  ['Rutina', 'Ducha + prepararme', '09:15'],
  ['Rutina', 'Revisión rápida', '09:45'],
  ['Rutina', '🧠 Profundo #1', '10:10'],
  ['Rutina', '🧠 Profundo #2', '14:00'],
  ['Rutina', 'Logística: guías + novedades', '12:30'],
  ['Rutina', 'Almuerzo + descanso', '12:50'],
  ['Rutina', 'Producción / sistemas / secundarias', '16:30'],
  ['Rutina', 'Última revisión', '17:15'],
  ['Rutina', 'Vida personal', '17:35'],
  ['Rutina', 'Inglés', '21:30'],
  ['Rutina', 'Dormir', '23:30'],
  ['Rutina', 'Desayuno', '07:45', 'SA,SU'],
];

// [calendario, días, primer día, inicio, fin, título, libre para agendar, avisar]
const PROFUNDO = (dia, fecha, tema1, tema2) => [
  ['Rutina', dia, fecha, '10:30', '13:00', `🧠 Profundo #1 — ${tema1}`, true, true],
  ['Rutina', dia, fecha, '14:30', '17:00', `🧠 Profundo #2 — ${tema2}`, true, true],
];
const NUEVAS = [
  // Mañana
  ['Rutina', LV, '2026-10-12', '06:00', '06:45', 'Agua, aseo sin redes + Biblia y oración', false, false],
  ['Comidas', LV, '2026-10-12', '06:45', '07:00', 'Comida pre-entreno', false, false],
  ['Ejercicio', LV, '2026-10-12', '07:00', '09:00', 'Gym (ir, entrenar y volver)', false, false],
  ['Comidas', LV, '2026-10-12', '09:00', '09:30', 'Desayuno', false, false],
  ['Rutina', LV, '2026-10-12', '09:30', '10:00', 'Ducha + prepararme', false, false],
  ['Rutina', LV, '2026-10-12', '10:00', '10:30', 'Revisión de logística #1: guías + novedades (3 tiendas), pedidos y Meta (revisar, no optimizar)', false, false],
  // Trabajo profundo
  ...PROFUNDO('MO', '2026-10-12', 'CEO: números + UN cuello de botella', 'Ads ShotyGames tanda 1'),
  ...PROFUNDO('TU', '2026-10-13', 'Producto activo ShotyGames', 'Producto activo ShotyGames'),
  ...PROFUNDO('WE', '2026-10-14', 'Product Lab', 'Ofertas, landings, creativos, campañas'),
  ...PROFUNDO('TH', '2026-10-15', 'Sistemas + delegación', 'CandyShots: procesos'),
  ...PROFUNDO('FR', '2026-10-16', 'Ads: ganadores + tanda 2', 'Contenido + finanzas + stock finde'),
  // Tarde y noche
  ['Comidas', LV, '2026-10-12', '13:30', '14:30', 'Almuerzo', false, false],
  ['Rutina', LV, '2026-10-12', '17:00', '17:30', 'Revisión de logística #2: guías, novedades y urgentes', false, false],
  ['Comidas', LV, '2026-10-12', '17:30', '17:45', 'Snack', false, false],
  ['Rutina', LV, '2026-10-12', '17:45', '19:00', 'Producción / sistemas / secundarias', true, false],
  ['Rutina', LV, '2026-10-12', '19:00', '20:00', 'Vida personal — familia, pareja, amigos (sin culpa)', true, false],
  ['Comidas', LV, '2026-10-12', '20:00', '21:00', 'Merienda', false, false],
  ['Rutina', LV, '2026-10-12', '21:00', '21:20', 'Revisión de logística #3: la última del día', false, false],
  ['Rutina', LV, '2026-10-12', '21:20', '22:00', 'Vida personal — desconectar, sin trabajo', true, false],
  // Dormir: se despierta a las 06:00 de lunes a viernes, así que domingo a jueves duerme 22:30.
  ['Rutina', 'SU,MO,TU,WE,TH', '2026-10-12', '22:30', '22:45', 'Dormir — celular lejos de la cama', false, false],
  ['Rutina', 'FR,SA', '2026-10-16', '23:30', '23:45', 'Dormir — celular lejos de la cama', false, false],
  // Fin de semana: igual que antes, salvo que el desayuno pasa al calendario Comidas.
  ['Comidas', FINDE, '2026-10-17', '07:45', '08:30', 'Desayuno', false, false],
];
// Esta noche (domingo 11) todavía no había "Dormir": mañana se despierta a las 06:00.
const UNICOS = [['Rutina', '2026-10-11', '22:30', '22:45', 'Dormir — celular lejos de la cama']];

const hora = (e) => e.start.dateTime?.slice(11, 16);

async function main() {
  const lista = (await cal.calendarList.list()).data.items || [];
  const ids = Object.fromEntries(lista.map((c) => [c.summary, c.id]));
  for (const n of ['Comidas', 'Ejercicio', 'Rutina']) if (!ids[n]) throw new Error(`No existe el calendario ${n}`);

  console.log(`\n=== 1. Series viejas que se reemplazan ${APLICAR ? '' : '(simulación)'} ===`);
  const aBorrar = [];
  for (const nombre of ['Comidas', 'Ejercicio', 'Rutina']) {
    const r = await cal.events.list({ calendarId: ids[nombre], timeMin: `${INICIO}T00:00:00-05:00`, singleEvents: false, maxResults: 250 });
    for (const m of (r.data.items || []).filter((e) => e.recurrence && e.start.dateTime)) {
      const regla = m.recurrence.join(' ');
      const encaja = VIEJAS.some(
        ([cal_, titulo, ini, dias]) =>
          cal_ === nombre && m.summary.startsWith(titulo) && hora(m) === ini && (!dias || dias.split(',').every((d) => regla.includes(d)) && (dias !== 'SA,SU' || !regla.includes('MO')))
      );
      if (encaja) aBorrar.push({ calendario: nombre, calendarId: ids[nombre], evento: m });
    }
  }
  for (const { calendario, evento: m } of aBorrar) console.log(`  - ${calendario.padEnd(9)} ${hora(m)}-${m.end.dateTime.slice(11, 16)} ${m.summary}`);
  if (APLICAR && aBorrar.length) {
    fs.mkdirSync(path.dirname(BACKUP), { recursive: true });
    fs.writeFileSync(BACKUP, JSON.stringify(aBorrar.map(({ calendario, calendarId, evento }) => ({ calendario, calendarId, evento })), null, 2));
    console.log(`  respaldo → ${path.relative(process.cwd(), BACKUP)}`);
    for (const { calendarId, evento } of aBorrar) await cal.events.delete({ calendarId, eventId: evento.id });
  }

  console.log(`\n=== 2. Series nuevas ${APLICAR ? '' : '(simulación)'} ===`);
  let creadas = 0;
  for (const [nombre, dias, fecha, ini, fin, titulo, libre, avisar] of NUEVAS) {
    console.log(`  + ${nombre.padEnd(9)} ${dias.padEnd(16)} ${ini}-${fin} ${titulo}${libre ? '  [libre para tareas]' : ''}`);
    if (APLICAR) {
      await cal.events.insert({
        calendarId: ids[nombre],
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
  for (const [nombre, fecha, ini, fin, titulo] of UNICOS) {
    console.log(`  + ${nombre.padEnd(9)} solo ${fecha} ${ini}-${fin} ${titulo}`);
    if (APLICAR) {
      await cal.events.insert({
        calendarId: ids[nombre],
        requestBody: { summary: titulo, start: { dateTime: `${fecha}T${ini}:00`, timeZone: TZ }, end: { dateTime: `${fecha}T${fin}:00`, timeZone: TZ }, reminders: SIN_AVISO },
      });
    }
    creadas++;
  }

  console.log(`\n${APLICAR ? 'Hecho' : 'Simulación'}: ${aBorrar.length} series viejas, ${creadas} nuevas.`);
  if (!APLICAR) console.log('Para aplicar: node scripts/rutina-calendario-2026-10-v2.js --aplicar');
}

main().catch((e) => {
  console.error('ERROR', e.message);
  process.exit(1);
});

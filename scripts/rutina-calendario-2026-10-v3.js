// Rutina de octubre, versión 3 (2026-10-11): igual que la v2 pero con una ventana de
// gestiones con negocios en horario comercial (16:30-17:15), porque a las 18:00 imprentas,
// proveedores y bancos ya cerraron. Profundo #2 pasa a 14:30-16:30, revisión #2 a 17:15,
// snack a 17:45 y el bloque de producción (impresión por lotes) a 18:00-19:00, sin llamadas
// ni anuncios. Respeta el nombre y el texto que otra herramienta le puso a ese bloque
// ("Ventana operativa: impresión por lotes...") y le quita lo de activar el test drop a esa hora:
// los anuncios se programan el día antes y arrancan a las 05:00.
//
//   node scripts/rutina-calendario-2026-10-v3.js            → simulación, no toca nada
//   node scripts/rutina-calendario-2026-10-v3.js --aplicar  → borra las series de la v2 y crea las nuevas
//
// Las series de la v2 se BORRAN (empiezan el 12-oct, todavía sin instancias pasadas). Antes se
// guarda cada una entera en archives/calendario-rutina-2026-10-v2/series.json para revertir.
//
// Fuente del horario: context/rutina.md, projects/progreso/src/lib/agenda.ts y rutina.js
// (mismos bloques: si cambia una, cambiar las tres).

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const APLICAR = process.argv.includes('--aplicar');
const INICIO = '2026-10-12'; // lunes
const BACKUP = path.join(__dirname, '..', 'archives', 'calendario-rutina-2026-10-v2', 'series.json');
const TZ = 'America/Guayaquil';

const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: process.env.GOOGLE_CALENDAR_TOKEN || process.env.GOOGLE_REFRESH_TOKEN });
const cal = google.calendar({ version: 'v3', auth });

const LV = 'MO,TU,WE,TH,FR';
const FINDE = 'SA,SU';
const AVISO = { useDefault: false, overrides: [{ method: 'popup', minutes: 0 }] };
const SIN_AVISO = { useDefault: false, overrides: [] };

// Series de la v2 que se reemplazan: [calendario, título (o prefijo), hora de inicio].
const VIEJAS = [
  ['Rutina', '🧠 Profundo #2', '14:30'],
  ['Rutina', 'Revisión de logística #2', '17:00'],
  ['Rutina', 'Ventana operativa', '17:45'],
  ['Comidas', 'Snack', '17:30'],
];

// Series nuevas que no copian nada de una vieja: [calendario, días, primer día, inicio, fin, título, libre, avisar, descripción]
const DESC_GESTIONES =
  'Horario comercial: lo que depende de que un negocio esté atendiendo (imprentas, proveedores, Marcelo, bancos, compras, recoger muestras) va aquí y nunca después de las 18:00. ' +
  'Aquí también se deja PROGRAMADA la campaña de mañana para que arranque a las 05:00: no se activan anuncios a media tarde. Las tareas del calendario Tareas que caigan dentro tienen prioridad.';
const DESC_PRODUCCION =
  'Producción sin llamadas ni anuncios. Impresión de bloques en tandas de 12–14 juegos (~1 h por lote) SOLO según stock y pedidos, con corte/lijado delegados a Marcelo y armado/empaque a Nerea. ' +
  'Usar el resto para cuellos de botella, automatización o delegación. Si faltan horas para imprimir, no invadir trabajo profundo ni descanso: medir el desfase y priorizar delegar este último cuello de botella. A las 19:00 cerrar trabajo ordinario.';
const NUEVAS = [
  ['Rutina', LV, '2026-10-12', '16:30', '17:15', 'Gestiones con negocios (horario comercial): imprentas, proveedores, compras, bancos', true, false, DESC_GESTIONES],
  ['Rutina', LV, '2026-10-12', '17:15', '17:45', 'Revisión de logística #2: guías, novedades y urgentes', false, false],
  ['Comidas', LV, '2026-10-12', '17:45', '18:00', 'Snack', false, false],
  ['Rutina', LV, '2026-10-12', '18:00', '19:00', 'Producción por lotes: impresión de bloques / sistemas (sin llamadas ni anuncios)', true, false, DESC_PRODUCCION],
];
// Profundo #2: se recrea cada serie con su mismo título y días, solo cambia la hora.
const P2_NUEVO = ['14:30', '16:30'];

const hora = (e) => e.start.dateTime?.slice(11, 16);

async function main() {
  const lista = (await cal.calendarList.list()).data.items || [];
  const ids = Object.fromEntries(lista.map((c) => [c.summary, c.id]));
  for (const n of ['Comidas', 'Ejercicio', 'Rutina']) if (!ids[n]) throw new Error(`No existe el calendario ${n}`);

  console.log(`\n=== 1. Series de la v2 que se reemplazan ${APLICAR ? '' : '(simulación)'} ===`);
  const aBorrar = [];
  for (const nombre of ['Comidas', 'Ejercicio', 'Rutina']) {
    const r = await cal.events.list({ calendarId: ids[nombre], timeMin: `${INICIO}T00:00:00-05:00`, singleEvents: false, maxResults: 250 });
    for (const m of (r.data.items || []).filter((e) => e.recurrence && e.start.dateTime)) {
      const encaja = VIEJAS.some(([cal_, titulo, ini]) => cal_ === nombre && m.summary.startsWith(titulo) && hora(m) === ini);
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
  const aCrear = [
    ...aBorrar
      .filter(({ evento: m }) => m.summary.startsWith('🧠 Profundo #2'))
      .map(({ calendario, evento: m }) => [calendario, m.recurrence[0].replace(/^RRULE:FREQ=WEEKLY;BYDAY=/, ''), m.start.dateTime.slice(0, 10), P2_NUEVO[0], P2_NUEVO[1], m.summary, true, true]),
    ...NUEVAS,
  ];
  for (const [nombre, dias, fecha, ini, fin, titulo, libre, avisar, descripcion] of aCrear) {
    console.log(`  + ${nombre.padEnd(9)} ${dias.padEnd(16)} ${ini}-${fin} ${titulo}${libre ? '  [libre para tareas]' : ''}`);
    if (APLICAR) {
      await cal.events.insert({
        calendarId: ids[nombre],
        requestBody: {
          summary: titulo,
          ...(descripcion && { description: descripcion }),
          start: { dateTime: `${fecha}T${ini}:00`, timeZone: TZ },
          end: { dateTime: `${fecha}T${fin}:00`, timeZone: TZ },
          recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${dias}`],
          transparency: libre ? 'transparent' : 'opaque',
          reminders: avisar ? AVISO : SIN_AVISO,
        },
      });
    }
  }
  const creadas = aCrear.length;

  // La revisión #1 mencionaba "el bloque operativo 17:45-19:00" para lanzar el test: ahora el test se programa el día antes.
  console.log(`\n=== 3. Texto de la revisión #1 ${APLICAR ? '' : '(simulación)'} ===`);
  const rr = await cal.events.list({ calendarId: ids['Rutina'], timeMin: `${INICIO}T00:00:00-05:00`, singleEvents: false, maxResults: 250 });
  const rev1 = (rr.data.items || []).find((e) => e.recurrence && e.summary?.startsWith('Logística #1'));
  if (rev1?.description?.includes('bloque operativo 17:45–19:00')) {
    const nueva = rev1.description.replace(
      'Si falta lanzar un test, dejar acción para el bloque operativo 17:45–19:00; nunca interrumpir trabajo profundo.',
      'Si falta programar el test de MAÑANA, dejar la acción para la ventana de gestiones de las 16:30 (los anuncios se programan el día antes y arrancan a las 05:00; nunca se activan a media tarde); nunca interrumpir trabajo profundo.'
    );
    console.log('  ~ Logística #1: se cambia "bloque operativo 17:45–19:00" por la ventana de las 16:30 y la regla de las 05:00');
    if (APLICAR) await cal.events.patch({ calendarId: ids['Rutina'], eventId: rev1.id, requestBody: { description: nueva } });
  } else console.log('  = Logística #1 no menciona el bloque de las 17:45; no se toca');

  console.log(`\n${APLICAR ? 'Hecho' : 'Simulación'}: ${aBorrar.length} series viejas, ${creadas} nuevas.`);
  if (!APLICAR) console.log('Para aplicar: node scripts/rutina-calendario-2026-10-v3.js --aplicar');
}

main().catch((e) => {
  console.error('ERROR', e.message);
  process.exit(1);
});

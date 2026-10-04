// Corre UNA vez (idempotente): crea las pestañas nuevas de Progreso V1 con
// sus encabezados y siembra PROYECTOS si está vacía. Nunca toca TAREAS ni
// RUTINA (TAREAS la usa el bot de Telegram) ni reescribe encabezados existentes.
//
//   node --env-file=.env.local scripts/crear-pestanas.mjs

import { google } from 'googleapis';

const ESQUEMA = {
  TAREAS_META: ['ID', 'PROYECTO_ID', 'TIPO', 'DECISION', 'DURACION_MIN', 'RESPONSABLE', 'COMPLETADA_EN', 'CREADA_EN'],
  PROYECTOS: ['ID', 'NOMBRE', 'NEGOCIO', 'CLASE', 'OBJETIVO', 'PRIORIDAD', 'FECHA_OBJETIVO', 'ESTADO', 'ORDEN', 'ETAPAS', 'SIGUIENTE_ACCION', 'RESPONSABLE', 'ACTUALIZADO'],
  CONTADORES: ['FECHA', 'CLAVE', 'CANTIDAD', 'ACTUALIZADO'],
  DIAS: ['FECHA', 'MISION', 'TOP3', 'TERMINADO', 'PENDIENTE', 'APRENDIDO', 'PROBLEMA', 'MANANA', 'CERRADO_EN'],
  INBOX: ['ID', 'TEXTO', 'CREADO', 'ESTADO', 'CLASE', 'NEGOCIO', 'TAREA_ID'],
  SEMANAS: ['SEMANA', 'FUNCIONO', 'NO_FUNCIONO', 'DEJAR', 'DELEGAR', 'AUTOMATIZAR', 'CUELLO_BOTELLA', 'PRIORIDADES', 'RESUMEN_IA', 'CERRADA_EN'],
  METRICAS: ['FECHA', 'CLAVE', 'VALOR', 'NOTA'],
};

const PRODUCTO = ['Idea', 'Investigación', 'Mecánica', 'Contenido', 'Diseño', 'Costos', 'Proveedor', 'Prototipo', 'Pruebas', 'Packaging', 'Producción', 'Oferta', 'Landing', 'Ads', 'Lanzamiento'];
const et = (nombres, hechas = {}) => JSON.stringify(nombres.map((n) => ({ nombre: n, pct: hechas[n] ?? 0 })));

const ahora = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
  .format(new Date()).replace(', ', 'T') + '-05:00';

// ID, NOMBRE, NEGOCIO, CLASE, OBJETIVO, PRIORIDAD, FECHA_OBJETIVO, ESTADO, ORDEN, ETAPAS, SIGUIENTE_ACCION, RESPONSABLE, ACTUALIZADO
const PROYECTOS = [
  ['P_DEUDAS', 'Salir de deudas', 'SALIR_DE_DEUDAS', 'SISTEMA', 'Tarjetas sin mora + Arturo pagado', 'ALTA', '', 'ACTIVO', 0,
    et(['Mora de tarjetas en 0', 'Arturo pagado', 'Préstamo Joselin pagado', 'Papá: plan de pago', 'Saldo de tarjetas bajando']),
    'Registrar la deuda total de octubre en CEO', 'Fabián', ahora],
  ['P_CARTAS_PAREJAS', 'Cartas Parejas', 'SHOTYGAMES', 'PRODUCTO', 'Juego de cartas para parejas lanzado y vendiendo', 'ALTA', '', 'ACTIVO', 1,
    et(PRODUCTO, { Idea: 100 }), 'Cotizar imprentas: costo por unidad y mínimo (pendiente desde julio)', 'Fabián', ahora],
  ['P_CARTAS_GRUPOS', 'Cartas Grupos', 'SHOTYGAMES', 'PRODUCTO', 'Juego de cartas para grupos', 'MEDIA', '', 'EN_COLA', 2, et(PRODUCTO), '', 'Fabián', ahora],
  ['P_CARTAS_3', 'Tercer juego de cartas', 'SHOTYGAMES', 'PRODUCTO', 'Por definir', 'MEDIA', '', 'EN_COLA', 3, et(PRODUCTO), '', 'Fabián', ahora],
  ['P_MONOPOLY', 'Juego tipo Monopoly', 'SHOTYGAMES', 'PRODUCTO', 'Juego de tablero estilo Monopoly', 'MEDIA', '', 'EN_COLA', 4, et(PRODUCTO), '', 'Fabián', ahora],
  ['P_PARCHIS', 'Parchís con retos', 'SHOTYGAMES', 'PRODUCTO', '', 'MEDIA', '', 'EN_COLA', 5, et(PRODUCTO), '', 'Fabián', ahora],
  ['P_CHUPIOLIMPIADAS', 'Chupiolimpiadas / eventos', 'SHOTYGAMES', 'PRODUCTO', '', 'BAJA', '', 'EN_COLA', 6, et(PRODUCTO), '', 'Fabián', ahora],
  ['P_SG_SIN_FABIAN', 'ShotyGames sin Fabián en producción', 'SHOTYGAMES', 'SISTEMA', 'Fabián solo supervisa, hace marketing, producto y estrategia', 'ALTA', '', 'ACTIVO', 7,
    et(['Madera → Marcelo', 'Dados → Marcelo', 'Impresión → otra persona', 'Armado y empaque → Nerea', 'Registro y guías → bot', 'Inventario + punto de reposición', 'Logística y seguimiento → delegar', 'Atención → delegar'],
      { 'Madera → Marcelo': 100, 'Armado y empaque → Nerea': 100, 'Registro y guías → bot': 100 }),
    'Preguntar a Marcelo precio y plazo por los dados', 'Fabián', ahora],
  ['P_PRODUCT_LAB', 'Product Lab: 7 tests por semana', 'DROPSHIPPING', 'SISTEMA', 'Un producto nuevo testeado por día, preparado por lotes el miércoles', 'ALTA', '', 'ACTIVO', 8,
    et(['Método de investigación', 'Landing con bloques reutilizables', 'Plantilla de creativos', 'Cola de 7 productos/semana', 'Revisión diaria de tests', 'Regla de paso a stock propio'],
      { 'Método de investigación': 100, 'Landing con bloques reutilizables': 100 }),
    'Miércoles: armar la primera cola de 7', 'Fabián', ahora],
  ['P_CANDY_SIN_FABIAN', 'CandyShots sin Fabián', 'CANDYSHOTS', 'SISTEMA', 'Abrir más días sin que Fabián trabaje más días', 'MEDIA', '', 'ACTIVO', 9,
    et(['SOP apertura', 'SOP cierre', 'Recetas estandarizadas', 'Inventario', 'Caja', 'Limpieza', 'Atención', 'Compras', 'Contratar']),
    'Sábado: anotar los cuellos de botella del local', 'Fabián', ahora],
  ['P_CONTENIDO', 'Contenido orgánico 1 por día', 'CONTENIDO', 'SISTEMA', 'Crear por lotes → programar → publicar diario → medir', 'MEDIA', '', 'ACTIVO', 10,
    et(['Banco de ideas', 'Bloque semanal de grabación', 'Programación', '1 publicación diaria', 'Medir e iterar']),
    'Grabar en CandyShots este fin de semana', 'Fabián', ahora],
];

const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.SHEETS_ID_PERSONAL;

const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' });
const existentes = new Set(meta.data.sheets.map((s) => s.properties.title));
console.log('Pestañas existentes:', [...existentes].join(', '));

const faltan = Object.keys(ESQUEMA).filter((t) => !existentes.has(t));
if (faltan.length) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: faltan.map((title) => ({ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } })) },
  });
  for (const t of faltan) {
    await sheets.spreadsheets.values.update({
      spreadsheetId, range: `${t}!A1`, valueInputOption: 'RAW', requestBody: { values: [ESQUEMA[t]] },
    });
  }
  console.log('Creadas:', faltan.join(', '));
} else console.log('No faltaba ninguna pestaña.');

for (const t of Object.keys(ESQUEMA).filter((t) => existentes.has(t))) {
  const r = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${t}!1:1` });
  const enc = r.data.values?.[0] ?? [];
  if (enc.join('|') !== ESQUEMA[t].join('|')) console.warn(`⚠️ ${t}: encabezado distinto al esperado — NO se toca. Hay: ${enc.join(', ')}`);
}

const p = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'PROYECTOS!A2:A' });
if (!(p.data.values ?? []).length) {
  await sheets.spreadsheets.values.append({
    spreadsheetId, range: 'PROYECTOS!A:M', valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS',
    requestBody: { values: PROYECTOS.map((r) => r.map(String)) },
  });
  console.log(`PROYECTOS sembrada con ${PROYECTOS.length} proyectos.`);
} else console.log('PROYECTOS ya tenía datos — no se siembra.');

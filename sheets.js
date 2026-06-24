const { google } = require('googleapis');

const SHEETS_ID = process.env.SHEETS_ID;
const SHEETS_ID_FINANZAS = process.env.SHEETS_ID_FINANZAS;

// Convierte strings de monto a número para que Sheets pueda sumar
// Soporta: "45,00" / "45.00" / "$16,50" / "1.234,56" / "1,234.56"
function parseMonto(val) {
  if (val === '' || val === null || val === undefined) return '';
  let str = String(val).replace(/\$/g, '').trim();

  if (str.includes(',') && str.includes('.')) {
    // Ambos separadores: determinar cuál es decimal (el último)
    const lastComma = str.lastIndexOf(',');
    const lastDot   = str.lastIndexOf('.');
    if (lastComma > lastDot) {
      // "1.234,56" → coma es decimal
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // "1,234.56" → punto es decimal
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Solo coma: "45,00" → decimal
    str = str.replace(',', '.');
  }
  // Solo punto o ninguno: "45.00" / "45" → ya está bien

  const num = parseFloat(str);
  if (isNaN(num) || num === 0) return '';
  return num;
}

// ─── Motor de búsqueda fuzzy por nombre ───────────────────────────────────────

// Quita tildes y pasa a minúsculas: "FABIÁN" → "fabian"
function normalizar(str) {
  return String(str || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim();
}

// Distancia de edición (Levenshtein) entre dos strings cortos
function distanciaEdicion(a, b) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 3) return 99;
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[a.length][b.length];
}

// ¿Query coincide (aprox) con target?
// Acepta: sin tildes, parcial, palabras en cualquier orden, typos ≤ 2 chars
function coincideNombre(query, target) {
  const q = normalizar(query);
  const t = normalizar(target);
  if (!q || !t) return false;
  // 1. Substring exacto (ya normalizado)
  if (t.includes(q) || q.includes(t)) return true;
  // 2. Todas las palabras del query aparecen (aprox) en el target
  const qWords = q.split(/\s+/).filter(w => w.length > 1);
  const tWords = t.split(/\s+/).filter(w => w.length > 1);
  const todasPresentes = qWords.length > 0 && qWords.every(qw =>
    tWords.some(tw =>
      tw.includes(qw) || qw.includes(tw) ||
      (qw.length > 3 && tw.length > 3 && distanciaEdicion(qw, tw) <= 1)
    )
  );
  if (todasPresentes) return true;
  // 3. Typos mayores: al menos una palabra con distancia ≤ 2 (ej: "FABIANO" → "FABIAN")
  return qWords.some(qw =>
    tWords.some(tw => qw.length > 3 && tw.length > 3 && distanciaEdicion(qw, tw) <= 2)
  );
}

// Busca filas por nombre (fuzzy). Devuelve array con los más recientes primero.
function buscarFilasPorNombre(rows, headers, query) {
  const nombreIdx  = headers.indexOf('NOMBRE');
  const telIdx     = headers.indexOf('TELEFONO');
  const guiaIdx    = headers.indexOf('GUIA');
  const fechaIdx   = headers.indexOf('FECHA');
  let   dropiColIdx = headers.indexOf('Softr Record ID');
  if (dropiColIdx === -1) dropiColIdx = 33;

  const matches = [];
  for (let i = rows.length - 1; i >= 1; i--) {
    const rowNombre = rows[i][nombreIdx] || '';
    if (coincideNombre(query, rowNombre)) {
      const colVal = String(rows[i][dropiColIdx] || '');
      matches.push({
        idx: i,
        rowNum: i + 1,
        nombre:   rowNombre,
        telefono: rows[i][telIdx]  || '',
        guia:     rows[i][guiaIdx] || '',
        fecha:    rows[i][fechaIdx] || '',
        dropiId:  colVal.startsWith('DROPI:') ? colVal.replace('DROPI:', '') : null
      });
    }
  }
  return matches; // ya ordenado del más reciente al más antiguo
}

// ──────────────────────────────────────────────────────────────────────────────

function getAuth() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  return oauth2Client;
}

async function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

async function appendPedido(pedido) {
  const sheets = await getSheets();
  const TZ = { timeZone: 'America/Guayaquil' };
  const fecha = pedido.fecha || new Date().toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric', ...TZ });
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const mes = meses[new Date().toLocaleString('es-EC', { month: 'numeric', ...TZ }) - 1];
  const row = [
    '1',                                     // col 1:  ID
    pedido.nombre || '',                     // col 2:  NOMBRE
    fecha,                                   // col 3:  FECHA
    pedido.mes || mes,                       // col 4:  MES
    pedido.telefono || '',                   // col 5:  TELEFONO
    (pedido.ciudad || '').toUpperCase(),     // col 6:  CIUDAD
    pedido.normal || '',                     // col 7:  N
    pedido.picante || '',                    // col 8:  P
    pedido.parejas || '',                    // col 9:  PAR
    pedido.enganchados || '',               // col 10: ENG
    pedido.dados || '',                     // col 11: DADOS
    '',                                     // col 12: (vacía)
    '',                                     // col 13: (vacía)
    '',                                     // col 14: (vacía)
    '',                                     // col 15: (vacía)
    parseMonto(pedido.anticipo),            // col 16: ANTICIPO
    parseMonto(pedido.saldo),              // col 17: SALDO
    (pedido.cuenta || '').toUpperCase(),    // col 18: CUENTA
    (pedido.estado || 'PENDIENTE').toUpperCase(), // col 19: ESTADO
    pedido.transportadora || 'SERVIENTREGA', // col 20: TRANSPORTADORA
    parseMonto(pedido.envio),              // col 21: ENVIO
    '',                                     // col 22: GUIA (se agrega después)
    '',                                     // col 23: LINK RASTREO
    '',                                     // col 24: RASTREO (automática)
    '',                                     // col 25: LINK WHATSAPP (automática)
    '',                                     // col 26: WHATSAPP (automática)
    pedido.notas || '',                     // col 27: NOTAS
    '',                                     // col 28: FALSE
    '',                                     // col 29: LOG
    '',                                     // col 30: COSTOS
    '',                                     // col 31: UTILIDAD
    (pedido.direccion || '').toUpperCase(), // col 32: DIRECCION
    '',                                     // col 33: PRODUCTOS (automática)
    ''                                      // col 34: Softr Record ID
  ];

  // Buscar la última fila con datos para escribir justo después
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!B:B'  // columna NOMBRE para detectar última fila con dato
  });
  const lastRow = (existing.data.values || []).length; // length ya incluye el header
  const nextRow = lastRow + 1;

  const result = await sheets.spreadsheets.values.update({
    spreadsheetId: SHEETS_ID,
    range: `PEDIDOS!A${nextRow}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [row] }
  });

  return result.data.updates;
}

async function buscarPedido(nombre) {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!A:AD'
  });
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  const matches = buscarFilasPorNombre(rows, headers, nombre);
  return matches.slice(0, 5).map(m => {
    const r = rows[m.idx];
    const obj = {};
    headers.forEach((h, i) => { if (r[i]) obj[h] = r[i]; });
    return obj;
  });
}

function idxToCol(idx) {
  // Convierte índice 0-based a letra(s) de columna: 0=A, 25=Z, 26=AA, 27=AB, 28=AC...
  if (idx < 26) return String.fromCharCode(65 + idx);
  const first  = Math.floor(idx / 26) - 1;
  const second = idx % 26;
  return String.fromCharCode(65 + first) + String.fromCharCode(65 + second);
}

// Actualiza la guía en el pedido MÁS RECIENTE sin guía que coincida con el teléfono
// dropiId: si se pasa, se guarda en col AH ("Softr Record ID") para poder sincronizar después
async function actualizarGuia(telefono, guia, envio, dropiId) {
  const sheetsApi = await getSheets();
  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!A:AJ'
  });
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  const telIdx    = headers.indexOf('TELEFONO');
  const guiaIdx   = headers.indexOf('GUIA');
  const linkIdx   = headers.indexOf('LINK RASTREO');
  const envioIdx  = headers.indexOf('ENVIO');

  console.log(`actualizarGuia: tel="${telefono}" guia="${guia}" envio="${envio}"`);
  console.log(`actualizarGuia: col indices — tel:${telIdx} guia:${guiaIdx} link:${linkIdx} envio:${envioIdx}`);

  const inputTel = String(telefono).replace(/^0/, '').replace(/^593/, '');

  // Buscar desde el final para actualizar el pedido MÁS RECIENTE
  let foundRow = -1;
  for (let i = rows.length - 1; i >= 1; i--) {
    const rowTel = String(rows[i][telIdx] || '').replace(/^0/, '').replace(/^593/, '');
    const telMatch = rowTel.length > 0 && (rowTel.endsWith(inputTel) || inputTel.endsWith(rowTel));
    const sinGuia  = !rows[i][guiaIdx]; // priorizar los que no tienen guía aún
    if (telMatch && sinGuia) { foundRow = i; break; }
  }
  // Si todos tienen guía, usar el más reciente que coincida
  if (foundRow === -1) {
    for (let i = rows.length - 1; i >= 1; i--) {
      const rowTel = String(rows[i][telIdx] || '').replace(/^0/, '').replace(/^593/, '');
      if (rowTel.length > 0 && (rowTel.endsWith(inputTel) || inputTel.endsWith(rowTel))) { foundRow = i; break; }
    }
  }

  console.log(`actualizarGuia: foundRow=${foundRow} (fila ${foundRow + 1})`);
  if (foundRow === -1) return { updated: false };

  const rowNum = foundRow + 1; // 1-indexed
  const updates = [];

  if (guiaIdx >= 0 && guia) {
    updates.push({ range: `PEDIDOS!${idxToCol(guiaIdx)}${rowNum}`, values: [[guia]] });
  }
  if (linkIdx >= 0 && guia) {
    const trackingUrl = `https://www.servientrega.com.ec/Tracking/Index/?guia=${guia}`;
    updates.push({ range: `PEDIDOS!${idxToCol(linkIdx)}${rowNum}`, values: [[trackingUrl]] });
  }
  if (envioIdx >= 0 && envio) {
    const envioNum = parseMonto(envio);
    if (envioNum !== '') {
      updates.push({ range: `PEDIDOS!${idxToCol(envioIdx)}${rowNum}`, values: [[envioNum]] });
    }
  }
  // Guardar DROPI order ID en col AH (índice 33, "Softr Record ID") para poder sincronizar después
  if (dropiId) {
    // Intentar encontrar la columna por nombre de header; fallback a índice 33 (AH)
    let dropiColIdx = headers.indexOf('Softr Record ID');
    if (dropiColIdx === -1) dropiColIdx = 33;
    updates.push({ range: `PEDIDOS!${idxToCol(dropiColIdx)}${rowNum}`, values: [[`DROPI:${dropiId}`]] });
    console.log(`actualizarGuia: guardando DROPI ID ${dropiId} en col ${idxToCol(dropiColIdx)}${rowNum}`);
  }
  if (updates.length > 0) {
    await sheetsApi.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEETS_ID,
      resource: { valueInputOption: 'USER_ENTERED', data: updates }
    });
  }

  return { updated: true, fila: rowNum };
}

// Lee el DROPI order ID guardado en col AH ("Softr Record ID") por nombre de cliente.
// Si hay múltiples coincidencias devuelve { candidatos: [...] } para que el agente pregunte.
async function getDropiOrderId(nombre) {
  const sheetsApi = await getSheets();
  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!A:AJ'
  });
  const rows = res.data.values || [];
  const headers = rows[0] || [];

  const matches = buscarFilasPorNombre(rows, headers, nombre);
  console.log(`getDropiOrderId: query="${nombre}" → ${matches.length} coincidencias`);

  if (matches.length === 0) return null;

  if (matches.length > 1) {
    // Ambiguo — devolver candidatos para que el agente pregunte
    return {
      candidatos: matches.map(m => ({
        nombre:   m.nombre,
        telefono: m.telefono,
        fecha:    m.fecha,
        guia:     m.guia
      }))
    };
  }

  // Coincidencia única
  const m = matches[0];
  console.log(`getDropiOrderId: encontrado "${m.nombre}" | tel=${m.telefono} | dropiId=${m.dropiId}`);
  return { dropiOrderId: m.dropiId, telefono: m.telefono, nombre: m.nombre };
}

// Marca la casilla AB (índice 27) como TRUE para disparar la notificación WA automática de Sheets.
// - Con nombre: marca solo el pedido más reciente de ese cliente.
// - Sin nombre: marca TODOS los pedidos de hoy que tengan guía generada y la casilla aún no marcada.
async function marcarNotificacionWA(nombre) {
  const sheetsApi = await getSheets();
  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!A:AJ'
  });
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  const nombreIdx = headers.indexOf('NOMBRE');
  const fechaIdx  = headers.indexOf('FECHA');
  const guiaIdx   = headers.indexOf('GUIA');
  // Col AB = índice 27 siempre (posición fija en el modelo de datos)
  const abColIdx  = 27;

  const hoy = new Date().toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric', timeZone: 'America/Guayaquil' });
  const updates = [];

  if (nombre) {
    // Modo individual: usar búsqueda fuzzy
    const matches = buscarFilasPorNombre(rows, headers, nombre);

    if (matches.length === 0) {
      return { marcados: 0, nombres: [] };
    }

    if (matches.length > 1) {
      // Ambiguo — devolver candidatos para que el agente pregunte
      return {
        candidatos: matches.map(m => ({
          nombre:   m.nombre,
          telefono: m.telefono,
          fecha:    m.fecha
        }))
      };
    }

    // Coincidencia única
    const m = matches[0];
    const yaNotif = rows[m.idx][abColIdx] === 'TRUE' || rows[m.idx][abColIdx] === true;
    if (yaNotif) {
      console.log(`marcarNotificacionWA: fila ${m.rowNum} ya notificada — omitiendo`);
      return { marcados: 0, nombres: [], yaNotificado: m.nombre };
    }
    updates.push({
      range: `PEDIDOS!${idxToCol(abColIdx)}${m.rowNum}`,
      values: [[true]]
    });
    console.log(`marcarNotificacionWA: marcando fila ${m.rowNum} — ${m.nombre}`);
  } else {
    // Modo batch: marcar todos los de HOY con guía y sin notificar aún
    for (let i = 1; i < rows.length; i++) {
      const esFechaHoy = rows[i][fechaIdx] === hoy;
      const tieneGuia  = !!rows[i][guiaIdx];
      const yaNotif    = rows[i][abColIdx] === 'TRUE' || rows[i][abColIdx] === true;
      if (esFechaHoy && tieneGuia && !yaNotif) {
        const rowNum = i + 1;
        updates.push({
          range: `PEDIDOS!${idxToCol(abColIdx)}${rowNum}`,
          values: [[true]]
        });
        console.log(`marcarNotificacionWA batch: marcando fila ${rowNum} — ${rows[i][nombreIdx]}`);
      }
    }
  }

  if (updates.length === 0) return { marcados: 0, nombres: [] };

  // RAW escribe el booleano puro al checkbox (más correcto que USER_ENTERED para triggers)
  await sheetsApi.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEETS_ID,
    resource: { valueInputOption: 'RAW', data: updates }
  });

  // Recopilar nombres marcados para el mensaje de confirmación
  const nombres = updates.map(u => {
    const rowNum = parseInt(u.range.replace(/[^0-9]/g, '')) - 1; // índice de rows[]
    return rows[rowNum][nombreIdx] || '(sin nombre)';
  });

  return { marcados: updates.length, nombres };
}

// Devuelve número de guía + PDF link de un pedido buscando por nombre (fuzzy).
async function obtenerGuiaPedido(nombre) {
  const sheetsApi = await getSheets();
  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!A:AJ'
  });
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  const matches = buscarFilasPorNombre(rows, headers, nombre);

  if (matches.length === 0) return null;

  if (matches.length > 1) {
    return {
      candidatos: matches.map(m => ({
        nombre: m.nombre,
        fecha:  m.fecha,
        guia:   m.guia || null,
        pdfUrl: (m.guia && m.dropiId)
          ? `https://d39ru7awumhhs2.cloudfront.net/ecuador/guias/servientrega/ORDEN-${m.dropiId}-GUIA-${m.guia}.pdf`
          : null
      }))
    };
  }

  const m = matches[0];
  const pdfUrl = (m.guia && m.dropiId)
    ? `https://d39ru7awumhhs2.cloudfront.net/ecuador/guias/servientrega/ORDEN-${m.dropiId}-GUIA-${m.guia}.pdf`
    : null;

  return { nombre: m.nombre, fecha: m.fecha, guia: m.guia || null, pdfUrl };
}

async function getPedidosHoy() {
  const sheets = await getSheets();
  const hoy = new Date().toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric', timeZone: 'America/Guayaquil' });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!A:AD'
  });
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  const fechaIdx = headers.indexOf('FECHA');
  const pedidos = rows.slice(1).filter(r => r[fechaIdx] === hoy);
  return { total: pedidos.length, pedidos: pedidos.map(r => {
    const obj = {};
    headers.forEach((h, i) => { if (r[i]) obj[h] = r[i]; });
    return obj;
  })};
}

async function registrarMovimiento(hoja, datos) {
  const sheets = await getSheets();
  const fecha = datos.fecha || new Date().toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric', timeZone: 'America/Guayaquil' });

  let row;
  if (hoja === 'TRANSFERENCIAS') {
    row = [
      fecha,                                        // FECHA
      '',                                           // MES (automática)
      (datos.sale || '').toUpperCase(),             // SALE
      (datos.entra || '').toUpperCase(),            // ENTRA
      (datos.motivo || '').toUpperCase(),           // MOTIVO
      parseMonto(datos.valor)                       // VALOR
    ];
  } else {
    // GASTOS e INGRESOS tienen la misma estructura
    row = [
      fecha,                                        // FECHA
      '',                                           // MES (automática)
      (datos.categoria || '').toUpperCase(),        // CATEGORIA
      (datos.observaciones || '').toUpperCase(),    // OBSERVACIONES
      (datos.cuenta || '').toUpperCase(),           // CUENTA
      parseMonto(datos.valor)                       // VALOR
    ];
  }

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID_FINANZAS,
    range: `${hoja}!A:A`
  });
  const lastRow = (existing.data.values || []).length;
  const nextRow = lastRow + 1;

  const result = await sheets.spreadsheets.values.update({
    spreadsheetId: SHEETS_ID_FINANZAS,
    range: `${hoja}!A${nextRow}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [row] }
  });

  return result.data.updates;
}

// Actualiza uno o más campos de un pedido existente buscando por nombre (fuzzy).
// cambios = objeto { estado: 'ENVIADO', direccion: 'nueva dir', ... }
async function actualizarPedido(nombre, cambios) {
  const sheetsApi = await getSheets();
  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!A:AJ'
  });
  const rows = res.data.values || [];
  const headers = rows[0] || [];

  const matches = buscarFilasPorNombre(rows, headers, nombre);
  if (matches.length === 0) return { found: false };
  if (matches.length > 1) {
    return {
      candidatos: matches.map(m => ({
        nombre: m.nombre,
        fecha:  m.fecha,
        estado: rows[m.idx][headers.indexOf('ESTADO')] || ''
      }))
    };
  }

  const m = matches[0];
  const rowNum = m.rowNum;

  // Mapa campo amigable → header real en la hoja
  const CAMPOS = {
    estado:         'ESTADO',
    direccion:      'DIRECCION',
    ciudad:         'CIUDAD',
    telefono:       'TELEFONO',
    notas:          'NOTAS',
    transportadora: 'TRANSPORTADORA',
    anticipo:       'ANTICIPO',
    saldo:          'SALDO',
    cuenta:         'CUENTA',
    envio:          'ENVIO',
  };
  const MONTOS = ['anticipo', 'saldo', 'envio'];

  const updates = [];
  for (const [campo, valor] of Object.entries(cambios)) {
    const headerName = CAMPOS[campo.toLowerCase()];
    if (!headerName) continue;
    const colIdx = headers.indexOf(headerName);
    if (colIdx < 0) { console.log(`actualizarPedido: col "${headerName}" no encontrada en headers`); continue; }
    const finalValor = MONTOS.includes(campo.toLowerCase())
      ? parseMonto(valor)
      : String(valor).toUpperCase();
    updates.push({ range: `PEDIDOS!${idxToCol(colIdx)}${rowNum}`, values: [[finalValor]] });
    console.log(`actualizarPedido: fila ${rowNum} — ${headerName} = "${finalValor}"`);
  }

  if (updates.length === 0) return { found: true, updated: false, nombre: m.nombre, fecha: m.fecha };

  await sheetsApi.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEETS_ID,
    resource: { valueInputOption: 'USER_ENTERED', data: updates }
  });

  return { found: true, updated: true, nombre: m.nombre, fecha: m.fecha, rowNum };
}

// Genera reportes/consultas sobre pedidos.
// tipo: PENDIENTES | PRODUCTOS_PENDIENTES | RESUMEN | POR_ESTADO
// filtroEstado: estado a filtrar (por defecto PENDIENTE)
async function reportePedidos(tipo, filtroEstado) {
  const sheetsApi = await getSheets();
  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!A:AJ'
  });
  const rows = res.data.values || [];
  const headers = rows[0] || [];

  const idxOf = h => headers.indexOf(h);
  const nombreIdx = idxOf('NOMBRE');
  const estadoIdx = idxOf('ESTADO');
  const ciudadIdx = idxOf('CIUDAD');
  const fechaIdx  = idxOf('FECHA');
  const guiaIdx   = idxOf('GUIA');
  const prodIdx   = idxOf('PRODUCTOS');
  // Productos — con fallback a posición fija si el header difiere
  const nIdx    = idxOf('N')    >= 0 ? idxOf('N')    : 6;
  const pIdx    = idxOf('P')    >= 0 ? idxOf('P')    : 7;
  const parIdx  = idxOf('PAR')  >= 0 ? idxOf('PAR')  : 8;
  const engIdx  = idxOf('ENG')  >= 0 ? idxOf('ENG')  : 9;
  const dadIdx  = idxOf('DADOS')>= 0 ? idxOf('DADOS'): 10;

  const data = rows.slice(1).filter(r => r[nombreIdx]); // filas con datos
  const tipoBig = (tipo || '').toUpperCase();

  // ── RESUMEN: conteo por estado ───────────────────────────────────────────
  if (tipoBig === 'RESUMEN') {
    const conteos = {};
    for (const r of data) {
      const e = (r[estadoIdx] || 'SIN ESTADO').toUpperCase();
      conteos[e] = (conteos[e] || 0) + 1;
    }
    return { resumen: conteos, total: data.length };
  }

  // ── PENDIENTES / POR_ESTADO: lista pedidos de un estado ─────────────────
  if (tipoBig === 'PENDIENTES' || tipoBig === 'POR_ESTADO') {
    const estado = (filtroEstado || 'PENDIENTE').toUpperCase();
    const filtrados = data.filter(r => (r[estadoIdx] || '').toUpperCase() === estado);
    return {
      estado,
      total: filtrados.length,
      pedidos: filtrados.map(r => ({
        nombre:   r[nombreIdx] || '',
        ciudad:   r[ciudadIdx] || '',
        productos: r[prodIdx]  || '',
        fecha:    r[fechaIdx]  || '',
        guia:     r[guiaIdx]   || ''
      }))
    };
  }

  // ── PRODUCTOS_PENDIENTES: suma de unidades por tipo ─────────────────────
  if (tipoBig === 'PRODUCTOS_PENDIENTES') {
    const estado = (filtroEstado || 'PENDIENTE').toUpperCase();
    const filtrados = data.filter(r => (r[estadoIdx] || '').toUpperCase() === estado);
    const totales = { normal: 0, picante: 0, parejas: 0, enganchados: 0, dados: 0 };
    for (const r of filtrados) {
      totales.normal      += parseInt(r[nIdx])   || 0;
      totales.picante     += parseInt(r[pIdx])   || 0;
      totales.parejas     += parseInt(r[parIdx]) || 0;
      totales.enganchados += parseInt(r[engIdx]) || 0;
      totales.dados       += parseInt(r[dadIdx]) || 0;
    }
    return { estado, totalPedidos: filtrados.length, productos: totales };
  }

  return { error: 'Tipo no reconocido. Usa: PENDIENTES, PRODUCTOS_PENDIENTES, RESUMEN, POR_ESTADO' };
}

// Devuelve pedidos en estado PENDIENTE que tienen guía y aún no fueron impresos.
// Requiere columna "IMPRESO" (checkbox) en el Sheet — la busca por nombre.
async function getGuiasParaImprimir() {
  const sheetsApi = await getSheets();
  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!A:AJ'
  });
  const rows = res.data.values || [];
  const headers = rows[0] || [];

  const nombreIdx  = headers.indexOf('NOMBRE');
  const estadoIdx  = headers.indexOf('ESTADO');
  const guiaIdx    = headers.indexOf('GUIA');
  const impresoIdx = headers.indexOf('IMPRESO');
  let dropiColIdx  = headers.indexOf('Softr Record ID');
  if (dropiColIdx === -1) dropiColIdx = 33;

  if (impresoIdx === -1) {
    console.warn('getGuiasParaImprimir: columna IMPRESO no encontrada en el Sheet');
  }

  const guias = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[nombreIdx]) continue;

    // Solo pedidos PENDIENTES
    if ((r[estadoIdx] || '').toUpperCase() !== 'PENDIENTE') continue;

    // Solo con guía generada
    const guia = r[guiaIdx] || '';
    if (!guia) continue;

    // Solo los que aún NO están impresos
    const impreso = r[impresoIdx];
    if (impreso === 'TRUE' || impreso === true) continue;

    // Necesitamos el DROPI order ID para la URL del PDF
    const dropiRaw = String(r[dropiColIdx] || '');
    const dropiId  = dropiRaw.startsWith('DROPI:') ? dropiRaw.replace('DROPI:', '') : null;
    if (!dropiId) continue;

    guias.push({
      nombre:  r[nombreIdx],
      guia,
      dropiId,
      rowNum:  i + 1,
      pdfUrl:  `https://d39ru7awumhhs2.cloudfront.net/ecuador/guias/servientrega/ORDEN-${dropiId}-GUIA-${guia}.pdf`
    });
  }

  return { guias, impresoIdx };
}

// Marca IMPRESO = TRUE en las filas indicadas (después de generar el PDF)
async function marcarGuiasImpresas(rowNums, impresoIdx) {
  if (!rowNums.length || impresoIdx === -1) return;
  const sheetsApi = await getSheets();
  const updates = rowNums.map(rowNum => ({
    range: `PEDIDOS!${idxToCol(impresoIdx)}${rowNum}`,
    values: [[true]]
  }));
  await sheetsApi.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEETS_ID,
    resource: { valueInputOption: 'RAW', data: updates }
  });
  console.log(`marcarGuiasImpresas: ${rowNums.length} filas marcadas`);
}

module.exports = { appendPedido, buscarPedido, actualizarGuia, actualizarPedido, getDropiOrderId, getPedidosHoy, registrarMovimiento, marcarNotificacionWA, obtenerGuiaPedido, reportePedidos, getGuiasParaImprimir, marcarGuiasImpresas };

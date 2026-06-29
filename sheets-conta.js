const { google } = require('googleapis');

const SHEET_ID = process.env.SHEETS_ID_FINANZAS;

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

function fechaEC() {
  return new Date().toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil' });
}

// ── GASTOS FIJOS ─────────────────────────────────────────────

async function leerGastosFijos() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'GASTOS FIJOS!A:E' });
  const rows = (res.data.values || []).slice(1).filter(r => r[0]);
  const items = rows.map(r => ({
    descripcion: r[0], categoria: r[1],
    mensual: parseFloat((r[2] || '0').replace(/[$,.]/g, '').replace(',', '.')) || 0,
    semanal: parseFloat((r[3] || '0').replace(/[$,.]/g, '').replace(',', '.')) || 0,
    diario: parseFloat((r[4] || '0').replace(/[$,.]/g, '').replace(',', '.')) || 0,
  }));
  const totalMensual = items.reduce((s, i) => s + i.mensual, 0);
  return { items, totalMensual };
}

async function actualizarGastoFijo(descripcion, nuevoMensual) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'GASTOS FIJOS!A:A' });
  const rows = res.data.values || [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]?.toUpperCase() === descripcion.toUpperCase()) {
      const semanal = (nuevoMensual / 4.6).toFixed(2);
      const diario = (nuevoMensual / 30).toFixed(2);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `GASTOS FIJOS!C${i + 1}:E${i + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[`$${nuevoMensual.toFixed(2)}`, `$${semanal}`, `$${diario}`]] }
      });
      return { descripcion, nuevoMensual, semanal: parseFloat(semanal), diario: parseFloat(diario) };
    }
  }
  return null;
}

async function agregarGastoFijo({ descripcion, categoria, mensual }) {
  const sheets = getSheets();
  const semanal = (mensual / 4.6).toFixed(2);
  const diario = (mensual / 30).toFixed(2);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'GASTOS FIJOS!A:E',
    valueInputOption: 'RAW',
    requestBody: { values: [[descripcion.toUpperCase(), categoria.toUpperCase(), `$${mensual.toFixed(2)}`, `$${semanal}`, `$${diario}`]] }
  });
  return { descripcion, categoria, mensual, semanal: parseFloat(semanal), diario: parseFloat(diario) };
}

// ── DEUDAS ───────────────────────────────────────────────────

async function leerDeudas() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'DEUDAS!A:F' });
  const rows = (res.data.values || []).slice(1).filter(r => r[0]);
  return rows.map(r => ({
    fecha: r[0], negocio: r[1], acreedor: r[2], descripcion: r[3],
    monto_total: parseFloat(r[4] || 0),
    monto_pagado: parseFloat(r[5] || 0),
    saldo_pendiente: parseFloat(r[4] || 0) - parseFloat(r[5] || 0)
  }));
}

async function agregarDeuda({ negocio, acreedor, descripcion, monto_total }) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'DEUDAS!A:F',
    valueInputOption: 'RAW',
    requestBody: { values: [[fechaEC(), negocio.toUpperCase(), acreedor.toUpperCase(), descripcion.toUpperCase(), monto_total, 0]] }
  });
  return { acreedor, monto_total };
}

async function registrarPagoDeuda(acreedor, monto_pago) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'DEUDAS!A:F' });
  const rows = res.data.values || [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][2]?.toUpperCase() === acreedor.toUpperCase()) {
      const pagadoActual = parseFloat(rows[i][5] || 0);
      const nuevoPagado = pagadoActual + monto_pago;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `DEUDAS!F${i + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[nuevoPagado]] }
      });
      const total = parseFloat(rows[i][4] || 0);
      return { acreedor, total, pagado: nuevoPagado, pendiente: total - nuevoPagado };
    }
  }
  return null;
}

// ── PRESUPUESTOS ─────────────────────────────────────────────

async function leerPresupuestos(mes = null, anio = null) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'PRESUPUESTOS!A:F' });
  const rows = (res.data.values || []).slice(1).filter(r => r[0]);
  let items = rows.map(r => ({
    mes: r[0], anio: r[1], negocio: r[2], categoria: r[3],
    monto: parseFloat(r[4] || 0), cuenta: r[5] || ''
  }));
  if (mes) items = items.filter(i => String(i.mes) === String(mes));
  if (anio) items = items.filter(i => String(i.anio) === String(anio));
  const total = items.reduce((s, i) => s + i.monto, 0);
  return { items, total };
}

async function agregarPresupuesto({ mes, anio, negocio, categoria, monto, cuenta = '' }) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'PRESUPUESTOS!A:F',
    valueInputOption: 'RAW',
    requestBody: { values: [[mes, anio, negocio.toUpperCase(), categoria.toUpperCase(), monto, cuenta.toUpperCase()]] }
  });
  return { mes, anio, categoria, monto };
}

// ── SALDOS REALES ────────────────────────────────────────────

async function leerSaldosReales() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'SALDOS_REALES!A:C' });
  const rows = (res.data.values || []).slice(1).filter(r => r[0]);
  const saldos = rows.map(r => ({
    cuenta: r[0], saldo: parseFloat(r[1] || 0), actualizado: r[2] || ''
  }));
  const total = saldos.reduce((s, r) => s + r.saldo, 0);
  return { saldos, total };
}

async function actualizarSaldo(cuenta, saldo) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'SALDOS_REALES!A:C' });
  const rows = res.data.values || [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]?.toUpperCase() === cuenta.toUpperCase()) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `SALDOS_REALES!B${i + 1}:C${i + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[saldo, fechaEC()]] }
      });
      return { cuenta, saldo, fecha: fechaEC() };
    }
  }
  // Si no existe la cuenta, agregarla
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'SALDOS_REALES!A:C',
    valueInputOption: 'RAW',
    requestBody: { values: [[cuenta.toUpperCase(), saldo, fechaEC()]] }
  });
  return { cuenta, saldo, fecha: fechaEC(), nueva: true };
}

module.exports = {
  leerGastosFijos, actualizarGastoFijo, agregarGastoFijo,
  leerDeudas, agregarDeuda, registrarPagoDeuda,
  leerPresupuestos, agregarPresupuesto,
  leerSaldosReales, actualizarSaldo
};

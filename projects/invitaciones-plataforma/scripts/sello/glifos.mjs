// Renderiza cada inicial en Great Vibes con Chrome headless → PNG con fondo transparente (para el relieve del sello).
// Uso: node --experimental-websocket glifos.mjs <glifo.html file://…> <carpeta_salida> <puerto_cdp>
import { mkdirSync, writeFileSync } from 'node:fs';
const [url, out, port] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let n = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++n; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
await send('Emulation.setDeviceMetricsOverride', { width: 1700, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url }); await sleep(4000);
await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(()=>document.fonts.check("520px Great Vibes"))', awaitPromise: true });
const textos = { AMP: '&', XV: 'XV', ...Object.fromEntries('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => [l, l])) };
for (const [id, texto] of Object.entries(textos)) {
  await send('Runtime.evaluate', { expression: `document.getElementById('t').textContent=${JSON.stringify(texto)}` });
  await sleep(120);
  const r = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  writeFileSync(`${out}/${id}.png`, Buffer.from(r.result.data, 'base64'));
}
console.log('glifos:', Object.keys(textos).length);
ws.close(); process.exit(0);

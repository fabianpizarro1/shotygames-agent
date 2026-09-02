require('dotenv').config();
const fs = require('fs');
const { leerPedidos } = require('../../projects/dropshipping/sheets-pedidos.js');
const norm = (t) => { let d=String(t||'').replace(/\D/g,''); if(d.startsWith('593'))d=d.slice(3); d=d.replace(/^0+/,''); return d.length===9 ? '593'+d : null; };
const EXCLUIR = 'PENDIENTE_CONFIRMACION';
(async () => {
  const p = await leerPedidos(); const C = p[0].C;
  const g = {};
  for (const x of p) {
    const e = (x.datos[C.ESTADO]||'').trim().toUpperCase();
    if (e === EXCLUIR || !e) continue;
    const k = `${(x.datos[C.TIENDA]||'').trim()}|${(x.datos[C.ID_DROPI]||'').trim()}`;
    const tel = norm(x.datos[C.TELEFONO]); if (!tel) continue;
    (g[k] = g[k] || { nombre: (x.datos[C.PRODUCTO]||'').trim(), tels: new Set(), estados: {} }).tels.add(tel);
    g[k].estados[e] = (g[k].estados[e]||0)+1;
  }
  const out = {};
  for (const k in g) { out[k] = { producto: g[k].nombre, n: g[k].tels.size, estados: g[k].estados, tels: [...g[k].tels] }; 
    console.log(k, '|', g[k].nombre, '| únicos:', g[k].tels.size, JSON.stringify(g[k].estados)); }
  fs.writeFileSync(__dirname + '/audiencias.json', JSON.stringify(out, null, 1));
})();

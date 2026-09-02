require('dotenv').config();
const { leerPedidos } = require('../../projects/dropshipping/sheets-pedidos.js');
(async () => {
  const p = await leerPedidos();
  const C = p[0].C;
  const g = {};
  for (const x of p) {
    const t = (x.datos[C.TIENDA]||'?').trim();
    const pr = (x.datos[C.PRODUCTO]||'?').trim();
    const e = (x.datos[C.ESTADO]||'?').trim().toUpperCase();
    const k = `${t} || ${pr} || ${e}`;
    g[k] = (g[k]||0)+1;
  }
  console.log('total filas:', p.length);
  Object.keys(g).sort().forEach(k=>console.log(String(g[k]).padStart(4), k));
})();

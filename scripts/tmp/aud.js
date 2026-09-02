require('dotenv').config();
const { leerPedidos } = require('../../projects/dropshipping/sheets-pedidos.js');

const norm = (t) => {
  let d = String(t||'').replace(/\D/g,'');
  if (d.startsWith('593')) d = d.slice(3);
  d = d.replace(/^0+/,'');
  if (d.length !== 9) return null;      // celular EC: 9XXXXXXXX
  return '593' + d;
};

(async () => {
  const p = await leerPedidos();
  const C = p[0].C;
  // ver productos + id dropi para confirmar equivalencias
  const ids = {};
  for (const x of p) {
    const pr = (x.datos[C.PRODUCTO]||'').trim();
    const id = (x.datos[C.ID_DROPI]||'').trim();
    (ids[pr] = ids[pr] || new Set()).add(id);
  }
  console.log('--- producto -> id dropi ---');
  for (const k in ids) console.log(k, '=>', [...ids[k]].join(','));

  console.log('--- producto2 ---');
  const p2 = {};
  for (const x of p) { const v=(x.datos[C.PRODUCTO2]||'').trim(); if(v) p2[v]=(p2[v]||0)+1; }
  console.log(p2);

  console.log('--- telefonos invalidos ---');
  for (const x of p) if (!norm(x.datos[C.TELEFONO])) console.log(x.fila, JSON.stringify(x.datos[C.TELEFONO]));
})();

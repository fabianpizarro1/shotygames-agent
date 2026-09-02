require('dotenv').config();
const { leerPedidos } = require('../../projects/dropshipping/sheets-pedidos.js');
(async () => {
  const p = await leerPedidos();
  const C = p[0].C;
  for (const x of p.slice(0,15)) console.log(JSON.stringify(x.datos[C.TELEFONO]), '|', x.datos[C.NOMBRE]);
})();

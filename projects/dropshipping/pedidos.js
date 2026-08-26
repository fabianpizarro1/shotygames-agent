/**
 * Creación de órdenes y guías en DROPI para dropshipping.
 *
 * Diferencia central con Shotygames: allá Fabián ES el proveedor, así que
 * `dropi.js` tiene 5 productos con id, nombre y peso fijos, y una sola bodega.
 * Acá el producto es de OTRO proveedor y cambia en cada test, así que todo eso
 * hay que leerlo del catálogo en el momento de crear la orden:
 *
 *   user_id               → la cuenta dropshipper (quien vende)
 *   supplier_id           → el dueño real del producto (p.user_id)
 *   warehouses_selected_id→ la bodega del proveedor (p.warehouse_product[].warehouse_id)
 *
 * Si se manda la bodega equivocada, DROPI acepta la orden pero la guía sale mal
 * o el proveedor nunca la despacha. Por eso se lee del producto y no se asume.
 *
 * Uso:
 *   const { crearPedido } = require('./pedidos');
 *   await crearPedido({ productoId: 139665, cantidad: 1, precioVenta: 44.86, cliente: {...} });
 *
 * Probar el payload SIN crear nada real:
 *   node projects/dropshipping/pedidos.js --dry-run
 */

require('dotenv').config();
const { _makeClient: makeClient, _PROVINCIAS: PROVINCIAS, _CIUDAD_DROPI: CIUDAD_DROPI, telConPais } = require('../../dropi');
const { buscar, pagina, conToken } = require('./catalogo');
const { resolverCiudad } = require('./ciudades');

const USER_ID = 12054;   // cuenta dropshipper de Fabián

/**
 * Transportadoras de DROPI Ecuador, en el orden que el proveedor recomienda
 * (verificado contra GET /distribution_companies el 2026-08-18 — no hay
 * endpoint de cotización previa, DROPI solo calcula el flete real al crear
 * la orden). Por eso no se puede comparar el costo de las 3 antes de crear
 * nada: se intenta en este orden y se usa la primera que DROPI acepte.
 */
const TRANSPORTADORAS = [
  { id: 4, name: 'GINTRACOM' },
  { id: 1, name: 'LAARCOURIER' },
  { id: 2, name: 'SERVIENTREGA' }
];

// El token se maneja con `conToken` de catalogo.js: hace login solo con las
// credenciales del .env y reintenta si expira. La primera versión de este
// archivo leía el token de un archivo en /tmp — que solo existía en la máquina
// donde se había corrido el scanner. En el servidor nunca existió y todas las
// llamadas fallaban (2026-08-12).

/** Trae el producto del catálogo con lo necesario para armar la orden. */
async function getProducto(productoId) {
  // No se puede usar GET /products/{id} con la cuenta dropshipper (devuelve 400),
  // así que se busca por keywords y se filtra por id. Ver API-DROPI.md.
  let encontrado = null;

  for (let intento = 0; intento < 3 && !encontrado; intento++) {
    const lote = await pagina({ startData: 0, pageSize: 100, keywords: String(productoId) });
    encontrado = lote.find(p => p.id === Number(productoId)) || null;
    if (!encontrado && intento === 0) {
      // Buscar por id no siempre funciona; reintentar sin filtro es carísimo,
      // así que se avisa claro en vez de barrer 33.000 productos.
      break;
    }
  }

  if (!encontrado) {
    throw new Error(
      `No se encontró el producto ${productoId} en el catálogo. ` +
      `Pasá el nombre con buscarProductoPorNombre() o verificá que siga activo.`
    );
  }
  return encontrado;
}

/** Alternativa cuando se conoce el nombre (más confiable que buscar por id). */
async function getProductoPorNombre(nombre, productoId) {
  const res = await buscar(nombre);
  const p = res.find(x => x.id === Number(productoId)) || res[0];
  if (!p) throw new Error(`No se encontró ningún producto para "${nombre}"`);
  return p;
}

/** La bodega desde la que despacha el proveedor. Sin esto la guía sale mal. */
function bodegaDe(producto) {
  const wp = producto.warehouse_product;
  if (Array.isArray(wp) && wp.length && wp[0].warehouse_id) {
    return { id: wp[0].warehouse_id, nombre: wp[0].warehouse?.name || null };
  }
  return { id: null, nombre: null };
}

/**
 * Arma el cuerpo de la orden. Separado de la creación para poder inspeccionarlo
 * sin mandar nada — el primer pedido real no es lugar para descubrir un typo.
 */
/**
 * `regalo` es un SEGUNDO producto que va en la misma orden a precio 0.
 *
 * Solo funciona si sale de la MISMA bodega que el producto principal: la orden
 * lleva un único `supplier_id` y un único `warehouses_selected_id`, así que dos
 * proveedores distintos son dos órdenes distintas — y dos fletes de $6.36, que
 * es justo lo que hace inviable el regalo.
 *
 * Por eso valida la bodega y revienta con un mensaje claro en vez de mandar una
 * orden que DROPI acepta a medias.
 */
function armarBody({ producto, cantidad, precioVenta, cliente, notas, contraEntrega = true, ciudadDropi = null, regalo = null, cantidadRegalo = 1, transportadora = TRANSPORTADORAS[0] }) {
  const partes = (cliente.nombre || '').trim().split(' ');
  const nombre = partes[0] || '';
  const apellido = partes.slice(1).join(' ') || nombre;

  // La ciudad viene resuelta contra el catálogo de la transportadora cuando se
  // crea un pedido real. El mapa de dropi.js queda como respaldo para el dry-run.
  const ciudadUpper = (cliente.ciudad || '').toUpperCase().trim();
  const cityForDropi = ciudadDropi || CIUDAD_DROPI[ciudadUpper] || cliente.ciudad;
  const state = cliente.provincia || PROVINCIAS[ciudadUpper] || cliente.ciudad;

  const bodega = bodegaDe(producto);
  if (!bodega.id) {
    throw new Error(`El producto ${producto.id} no expone bodega (warehouse_product vacío). No se puede despachar.`);
  }

  if (regalo) {
    if (regalo.user_id !== producto.user_id) {
      throw new Error(
        `El regalo ${regalo.id} es del proveedor ${regalo.user_id} y el producto del ${producto.user_id}. ` +
        `Una orden solo admite un proveedor — serían dos envíos y dos fletes.`
      );
    }
    const bodegaRegalo = bodegaDe(regalo);
    if (bodegaRegalo.id && bodegaRegalo.id !== bodega.id) {
      throw new Error(
        `El regalo ${regalo.id} despacha desde la bodega ${bodegaRegalo.id} y el producto desde la ${bodega.id}.`
      );
    }
  }

  const total = contraEntrega ? Number(precioVenta) : 0;

  // DROPI arma el "Total Orden" que se cobra al cliente sumando price × cantidad
  // de CADA línea, no el campo total_order de acá abajo (comprobado el
  // 2026-08-18 con la orden #6587069: se mandó total_order=35 y DROPI cobró
  // 36.99 — el precio del regalo se sumó aparte). Por eso, cuando hay regalo,
  // su costo se le resta al precio unitario del producto principal: así la
  // suma de las líneas cierra en precioVenta exacto y al cliente no le sube
  // ni un centavo por el regalo que "no paga".
  const costoRegaloEnLinea = regalo ? (parseFloat(regalo.sale_price) || 0) * cantidadRegalo : 0;
  const precioUnitario = parseFloat(((Number(precioVenta) - costoRegaloEnLinea) / cantidad).toFixed(2));

  const phone = telConPais(cliente.telefono);

  return {
    total_order: Math.round(total),
    notes: notas || '',
    name: nombre,
    surname: apellido,
    dir: (cliente.direccion || '').toUpperCase(),
    country: 'ECUADOR',
    state,
    city: cityForDropi,
    phone,
    client_email: cliente.email || '',
    payment_method_id: 1,
    user_id: USER_ID,                    // la cuenta que vende (dropshipper)
    supplier_id: producto.user_id,       // el dueño real del producto
    type: 'FINAL_ORDER',
    rate_type: contraEntrega ? 'CON RECAUDO' : 'SIN RECAUDO',
    products: [{
      id: producto.id,
      name: producto.name,
      weight: producto.weight || '1.00',
      quantity: cantidad,
      stock: producto.stock ?? 999,
      variation_id: null,
      price: precioUnitario,
      suggested_price: String(producto.suggested_price || '1.00'),
      sale_price: String(producto.sale_price || '1.00'),
      variations: [],
      type: producto.type || 'SIMPLE',
      user_id: producto.user_id
    },
    // El regalo NO va a price 0: DROPI rechaza la orden entera si un producto
    // se vende por debajo del costo del proveedor ("no permite vender un
    // producto por debajo del costo del proveedor, incluso si es un regalo" —
    // error real del 2026-08-18). `total_order` (arriba) es lo único que se le
    // cobra al cliente y NO se arma sumando el price de cada línea, así que
    // ponerle el costo real acá no le cobra un centavo extra al cliente —
    // solo hace que DROPI acepte la línea y que el costo del regalo quede
    // reflejado en lo que el proveedor factura.
    ...(regalo ? [{
      id: regalo.id,
      name: regalo.name,
      weight: regalo.weight || '1.00',
      quantity: cantidadRegalo,
      stock: regalo.stock ?? 999,
      variation_id: null,
      price: parseFloat(regalo.sale_price) || 0,
      suggested_price: String(regalo.suggested_price || '1.00'),
      sale_price: String(regalo.sale_price || '1.00'),
      variations: [],
      type: regalo.type || 'SIMPLE',
      user_id: regalo.user_id
    }] : [])],
    distributionCompany: { id: transportadora.id, name: transportadora.name },
    type_service: 'normal',
    zip_code: null,
    colonia: '',
    shop_id: null,
    dni: '',
    dni_type: '',
    insurance: false,
    shalom_data: null,
    warehouses_selected_id: bodega.id,   // bodega DEL PROVEEDOR, no la de Shotygames
    shipping_amount: 0,
    calculate_costs_and_shiping: true
  };
}

/**
 * Crea el pedido en DROPI y lo deja PENDIENTE.
 *
 * Diferencia clave con Shotygames: allá Fabián es el proveedor, así que genera
 * la guía él mismo en el acto. Acá el dueño del producto es otro y **la guía la
 * genera el proveedor cuando alista el paquete**. Por eso NO se hace el PUT a
 * GUIA_GENERADA: forzarlo desde acá pediría una guía de mercadería que el
 * proveedor todavía no separó.
 *
 * El número de guía y el costo real de envío aparecen después — los recoge el
 * cron de seguimiento (sincronizarGuias) y los escribe en el Sheet.
 */
async function crearPedido({ productoId, nombreProducto, cantidad = 1, precioVenta, cliente, notas, contraEntrega = true, regaloProductoId = null, cantidadRegalo = 1, transportadora = null }) {
  const producto = nombreProducto
    ? await getProductoPorNombre(nombreProducto, productoId)
    : await getProducto(productoId);

  // El regalo se busca en el catálogo igual que el producto principal: la
  // orden necesita su weight/stock/user_id reales, no solo el id de la columna.
  const regalo = regaloProductoId ? await getProducto(regaloProductoId) : null;

  // Traducir la ciudad al nombre de la transportadora ANTES de mandar nada:
  // si no la reconoce, DROPI rechaza el pedido entero.
  let ciudadDropi;
  try {
    const r = await resolverCiudad(cliente.ciudad, cliente.provincia);
    ciudadDropi = r.nombre;
  } catch (e) {
    return { ok: false, error: e.message, tipo: 'ciudad' };
  }

  // No hay endpoint de DROPI para cotizar flete antes de crear la orden (se
  // buscó — ver TRANSPORTADORAS arriba), así que no se puede elegir "la más
  // barata" comparando números. Por default se intenta en el orden que
  // recomienda el proveedor y se usa la primera que DROPI acepte; si Fabián
  // pide una transportadora puntual, se usa esa sola — sin probar las otras,
  // porque ahí la decisión ya no es "la más barata", es la que él eligió.
  const nombreForzado = transportadora ? String(transportadora).toUpperCase() : null;
  const candidatas = nombreForzado
    ? TRANSPORTADORAS.filter((t) => t.name === nombreForzado)
    : TRANSPORTADORAS;

  if (nombreForzado && !candidatas.length) {
    return { ok: false, error: `Transportadora "${transportadora}" no reconocida. Usa: ${TRANSPORTADORAS.map((t) => t.name).join(', ')}` };
  }

  let orderId, data, transportadoraUsada;
  const rechazos = [];

  for (const t of candidatas) {
    const body = armarBody({ producto, cantidad, precioVenta, cliente, notas, contraEntrega, ciudadDropi, regalo, cantidadRegalo, transportadora: t });
    data = await conToken(async (c) => (await c.post('/orders/myorders', body)).data);
    const id = data?.id || data?.objects?.id || data?.data?.id;

    if (id) {
      orderId = id;
      transportadoraUsada = t.name;
      break;
    }

    // DROPI devuelve 200 con isSuccess:false y el motivo real adentro.
    const motivo = data?.data_error || data?.message || 'DROPI no devolvió id de orden';
    rechazos.push(`${t.name}: ${motivo}`);
  }

  if (!orderId) {
    return {
      ok: false,
      error: `Ninguna transportadora aceptó el pedido:\n${rechazos.join('\n')}`,
      respuesta: data,
      ciudadEnviada: ciudadDropi
    };
  }

  // Releer la orden para tomar el flete y la ganancia que DROPI ya calculó.
  // El flete depende de ciudad y peso — usar el número exacto de esta orden en
  // vez de un promedio hace que la utilidad del Sheet sea real, no estimada.
  let flete = 0;
  let gananciaEsperada = 0;
  try {
    const o = await getOrden(orderId);
    flete = o.costoEnvio;
    gananciaEsperada = o.gananciaEsperada;
  } catch (_) {
    // Si falla, el cron lo completa en la próxima pasada. No vale la pena
    // tumbar un pedido ya creado por no poder leer un monto.
  }

  const costoRegalo = regalo ? (parseFloat(regalo.sale_price) || 0) * cantidadRegalo : 0;

  return {
    ok: true,
    orderId,
    estado: 'EN_DROPI',
    producto: producto.name,
    // Incluye el costo del regalo: es plata real que sale de la bodega del
    // proveedor aunque el cliente no la vea en su factura.
    costoProveedor: parseFloat(producto.sale_price) * cantidad + costoRegalo,
    flete,
    gananciaEsperada,
    proveedor: producto.user_id,
    bodega: bodegaDe(producto),
    regalo: regalo ? regalo.name : null,
    transportadora: transportadoraUsada
  };
}

/**
 * Movimientos de la wallet (Historial de Cartera).
 *
 * Es la única fuente que dice cuándo la plata entró de verdad. DROPI marca la
 * orden como ENTREGADA al momento de la entrega, pero acredita horas después:
 * mirar solo el estado de la orden haría contar plata que todavía no llegó.
 *
 * Cómo se mueve la plata depende del tipo de orden. Las tiendas nuevas operan
 * TODO con recaudo (COD), que es el caso de la izquierda:
 *
 *   CON RECAUDO (lo nuestro)          SIN RECAUDO
 *   ─────────────────────────         ─────────────────────────────────────
 *   crear: no se cobra nada           crear: SALIDA "SALIDA POR NUEVA ORDEN"
 *   (Fabián está en una comunidad     (le descuentan el flete al instante)
 *   DROPI: no hace falta saldo)
 *
 *   entregada: ENTRADA por            entregada: ENTRADA por ganancia
 *   ganancia YA NETA del flete        + ENTRADA "DEVOLUCION DE FLETE"
 *
 * Por eso `pagoDeOrden` busca la ENTRADA por GANANCIA y suma la devolución de
 * flete solo si existe: en COD no aparece y el total es la ganancia sola.
 *
 * Verificado 2026-08-12 contra el historial real de la cuenta 12054 (las
 * órdenes de 2024 eran sin recaudo, de ahí las SALIDA al crear).
 */
async function getMovimientosWallet({ desde, hasta, limite = 100 } = {}) {
  const hoy = new Date();
  const haceUnMes = new Date(hoy.getTime() - 45 * 86400000);
  const from = desde || haceUnMes.toISOString().slice(0, 10);
  const until = hasta || hoy.toISOString().slice(0, 10);

  const url = `/historywallet?orderBy=id&orderDirection=desc&result_number=${limite}&start=0` +
              `&textToSearch=&type=null&id=null&identification_code=null` +
              `&user_id=${USER_ID}&from=${from}&until=${until}&wallet_id=0`;

  const r = await conToken(async (c) => c.get(url));
  return (r.data?.objects || []).map((m) => ({
    id: m.id,
    orderId: m.order_id,
    tipo: m.type,                       // ENTRADA | SALIDA
    monto: parseFloat(m.amount) || 0,
    descripcion: m.description || '',
    fecha: m.created_at
  }));
}

/**
 * ¿Ya se acreditó la plata de esta orden?
 *
 * Busca la ENTRADA por GANANCIA. No sirve cualquier ENTRADA: la devolución de
 * flete y el reembolso por cancelación también son ENTRADA, y ninguna significa
 * que se cobró la venta.
 */
function pagoDeOrden(movimientos, orderId) {
  const id = String(orderId);
  const pago = movimientos.find(
    (m) =>
      String(m.orderId) === id &&
      m.tipo === 'ENTRADA' &&
      /GANANCIA/i.test(m.descripcion)
  );
  if (!pago) return null;

  // El flete devuelto va aparte; sumarlo da el total realmente acreditado.
  const flete = movimientos.find(
    (m) => String(m.orderId) === id && m.tipo === 'ENTRADA' && /DEVOLUCION DE FLETE/i.test(m.descripcion)
  );

  return {
    monto: pago.monto,
    fleteDevuelto: flete ? flete.monto : 0,
    total: pago.monto + (flete ? flete.monto : 0),
    fecha: pago.fecha
  };
}

/** Consulta una orden en DROPI. Devuelve estado, guía y costo de envío si ya existen. */
async function getOrden(orderId) {
  const r = await conToken(async (c) => c.get(`/orders/myorders/${orderId}`));
  const o = r.data?.objects || r.data?.order || r.data || {};

  const guia = o.shipping_guide || o.guide_number || o.tracking_number || null;
  const envio = parseFloat(o.shipping_amount || o.discounted_amount || 0) || 0;

  return {
    orderId,
    estadoDropi: o.status || o.state || null,
    guia,
    costoEnvio: envio,
    // Acá el proveedor puede despachar por GINTRACOM, LAARCOURIER o SERVIENTREGA
    // (a diferencia de dropi.js, que es la cuenta propia de Shotygames y siempre
    // usa Servientrega) — hay que leer la que DROPI realmente asignó.
    transportadora: o.shipping_company || null,
    // Lo que DROPI calcula que se va a ganar con esta orden, y lo que
    // efectivamente acreditó. Comparar ambos revela cualquier diferencia entre
    // lo prometido y lo cobrado, sin tener que estimar nada.
    gananciaEsperada: parseFloat(o.dropshipper_amount_to_win || 0) || 0,
    gananciaAcreditada: parseFloat(o.amount_earned_dropshipper || 0) || 0,
    // guia_urls3 es la ruta real del PDF que da DROPI — varía según la
    // transportadora (antes esto asumía siempre "servientrega" y el link
    // salía roto para pedidos despachados por GINTRACOM o LAARCOURIER).
    pdf: o.guia_urls3
      ? `https://d39ru7awumhhs2.cloudfront.net/${o.guia_urls3}`
      : (guia ? `https://d39ru7awumhhs2.cloudfront.net/ecuador/guias/servientrega/ORDEN-${orderId}-GUIA-${guia}.pdf` : null)
  };
}

// ─── Prueba en seco ──────────────────────────────────────────────────────────
// Arma el payload real y lo imprime SIN mandarlo a DROPI. Crear una orden de
// prueba genera un envío real que alguien tiene que pagar y cancelar.

async function dryRun() {
  const producto = await getProductoPorNombre('Viresta', 139665);
  const body = armarBody({
    producto,
    cantidad: 1,
    precioVenta: 44.86,
    cliente: {
      nombre: 'Juan Perez',
      telefono: '0991234567',
      ciudad: 'Machala',
      direccion: 'Av. 25 de Junio y Guayas, casa 123'
    },
    notas: 'PRUEBA EN SECO — no enviada'
  });

  console.log('\n  PAYLOAD QUE SE MANDARÍA A DROPI (no se envió nada)\n');
  console.log('  Producto:      ', producto.name, `(id ${producto.id})`);
  console.log('  Proveedor:     ', body.supplier_id, '— dueño real del producto');
  console.log('  Cuenta que vende:', body.user_id, '— dropshipper');
  console.log('  Bodega:        ', body.warehouses_selected_id, '—', bodegaDe(producto).nombre);
  console.log('  Ciudad → DROPI:', body.city, '| provincia:', body.state);
  console.log('  Teléfono:      ', body.phone);
  console.log('  Cobro:         ', body.rate_type, '$' + body.total_order);
  console.log('\n  products[]:');
  console.log('  ' + JSON.stringify(body.products[0], null, 2).replace(/\n/g, '\n  '));

  const faltantes = [];
  if (!body.warehouses_selected_id) faltantes.push('warehouses_selected_id');
  if (!body.supplier_id) faltantes.push('supplier_id');
  if (!body.city || !body.state) faltantes.push('ciudad/provincia');
  if (!body.products[0].id) faltantes.push('producto id');

  console.log('\n  ' + (faltantes.length
    ? '❌ Faltan campos: ' + faltantes.join(', ')
    : '✅ Payload completo — listo para el primer pedido real') + '\n');
}

if (require.main === module) {
  if (process.argv.includes('--dry-run')) {
    dryRun().catch(e => { console.error('❌ ' + e.message); process.exit(1); });
  } else {
    console.log('Usá --dry-run para inspeccionar el payload sin crear una orden real.');
  }
}

module.exports = { crearPedido, getOrden, getMovimientosWallet, pagoDeOrden, armarBody, getProductoPorNombre, bodegaDe };

const axios = require('axios');
const fs = require('fs');

const BASE = 'https://api.dropi.ec/api';
const USER_ID = 11362;
const WAREHOUSE_ID = 338;

// Archivo donde se persiste el token (sobrevive reinicios del contenedor)
const TOKEN_FILE = '/tmp/.dropi_token';

const PRODUCTS = {
  normal:      { id: 6007,   name: 'Torre de Shots NORMAL',  weight: '1.00' },
  picante:     { id: 6008,   name: 'Torre de Shots PICANTE', weight: '1.00' },
  parejas:     { id: 76998,  name: 'Torre de Shots PAREJAS', weight: '1.00' },
  enganchados: { id: 6010,   name: 'Enganchados',            weight: '0.50' },
  dados:       { id: 139461, name: 'Dados',                  weight: '0.10' }
};

const PROVINCIAS = {
  'GUAYAQUIL': 'Guayas', 'DURAN': 'Guayas', 'MILAGRO': 'Guayas', 'SAMBORONDON': 'Guayas', 'DAULE': 'Guayas',
  'CUENCA': 'Azuay', 'GUALACEO': 'Azuay', 'SIGSIG': 'Azuay',
  'QUITO': 'Pichincha', 'SANGOLQUI': 'Pichincha', 'CAYAMBE': 'Pichincha', 'MEJIA': 'Pichincha',
  'MACHALA': 'El Oro', 'PASAJE': 'El Oro', 'HUAQUILLAS': 'El Oro', 'SANTA ROSA': 'El Oro', 'ARENILLAS': 'El Oro', 'ZARUMA': 'El Oro',
  'PONCE ENRIQUEZ': 'El Oro', 'CAMILO PONCE ENRIQUEZ': 'El Oro',
  'PORTOVIEJO': 'Manabí', 'MANTA': 'Manabí', 'CHONE': 'Manabí', 'BAHIA DE CARAQUEZ': 'Manabí', 'PEDERNALES': 'Manabí', 'EL CARMEN': 'Manabí', 'JIPIJAPA': 'Manabí', 'MONTECRISTI': 'Manabí',
  'BABAHOYO': 'Los Ríos', 'QUEVEDO': 'Los Ríos', 'VINCES': 'Los Ríos', 'VENTANAS': 'Los Ríos', 'RICAURTE': 'Los Ríos', 'PUEBLO VIEJO': 'Los Ríos', 'URDANETA': 'Los Ríos', 'BABA': 'Los Ríos', 'MOCACHE': 'Los Ríos', 'MONTALVO': 'Los Ríos', 'PALENQUE': 'Los Ríos',
  'AMBATO': 'Tungurahua', 'BANOS': 'Tungurahua', 'PELILEO': 'Tungurahua',
  'RIOBAMBA': 'Chimborazo', 'ALAUSÍ': 'Chimborazo',
  'IBARRA': 'Imbabura', 'OTAVALO': 'Imbabura', 'COTACACHI': 'Imbabura', 'ANTONIO ANTE': 'Imbabura',
  'LOJA': 'Loja', 'CATAMAYO': 'Loja',
  'ESMERALDAS': 'Esmeraldas', 'ATACAMES': 'Esmeraldas',
  'SANTO DOMINGO': 'Santo Domingo de los Tsáchilas',
  'SALINAS': 'Santa Elena', 'LA LIBERTAD': 'Santa Elena', 'SANTA ELENA': 'Santa Elena',
  'GUARANDA': 'Bolívar',
  'AZOGUES': 'Cañar', 'CANAR': 'Cañar',
  'TULCAN': 'Carchi',
  'LATACUNGA': 'Cotopaxi', 'SALCEDO': 'Cotopaxi', 'PUJILI': 'Cotopaxi',
  'TENA': 'Napo',
  'COCA': 'Orellana', 'FRANCISCO DE ORELLANA': 'Orellana',
  'PUYO': 'Pastaza',
  'MACAS': 'Morona Santiago',
  'ZAMORA': 'Zamora Chinchipe',
  'NUEVA LOJA': 'Sucumbíos', 'LAGO AGRIO': 'Sucumbíos',
};

// Ciudades con nombre diferente en DROPI para que Servientrega quede habilitado.
// Cuando el cliente diga una ciudad que tenga variante en DROPI, se usa el nombre correcto aquí.
// Agregar más según se vayan descubriendo.
const CIUDAD_DROPI = {
  'SALINAS':               'SALINAS (SANTA ELENA)',  // evitar la SALINAS de Guayas
  'CAMILO PONCE ENRIQUEZ': 'PONCE ENRIQUEZ',          // en DROPI funciona sin "Camilo"
  // Agrega más abajo cuando encuentres casos nuevos:
  // 'NOMBRE_QUE_LLEGA': 'NOMBRE_EN_DROPI',
};

// Orden de prioridad: archivo (más reciente) > env var (deploy) > null
let _token = (() => {
  try {
    const saved = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    if (saved) { console.log('DROPI token cargado desde archivo'); return saved; }
  } catch (_) {}
  if (process.env.DROPI_TOKEN) { console.log('DROPI token cargado desde env'); return process.env.DROPI_TOKEN; }
  return null;
})();

// Actualiza el token en memoria y en archivo (sobrevive reinicios)
function setToken(token) {
  _token = token.replace(/^Bearer\s+/i, '').trim();
  try { fs.writeFileSync(TOKEN_FILE, _token, 'utf8'); } catch (e) { console.error('No se pudo guardar token en archivo:', e.message); }
  console.log('DROPI token actualizado');
}

function makeClient(token) {
  return axios.create({
    baseURL: BASE,
    headers: {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'es-EC,es;q=0.9,en;q=0.8',
      'content-type': 'application/json',
      'origin': 'https://app.dropi.ec',
      'referer': 'https://app.dropi.ec/',
      'x-authorization': `Bearer ${token}`,
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"'
    }
  });
}

// Auto-login usando credenciales del env var (para no depender de token manual)
async function autoLogin() {
  const email = process.env.DROPI_EMAIL;
  const password = process.env.DROPI_PASSWORD;
  if (!email || !password) throw new Error('Sin credenciales DROPI_EMAIL/DROPI_PASSWORD para auto-login');

  console.log('DROPI: iniciando auto-login...');
  const res = await axios.post(`${BASE}/login`, {
    email, password, white_brand_id: 1
  }, {
    headers: {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'es-EC,es;q=0.9',
      'content-type': 'application/json',
      'origin': 'https://app.dropi.ec',
      'referer': 'https://app.dropi.ec/login',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site'
    }
  });

  const token = res.data?.token;
  if (!token) throw new Error('Auto-login falló: sin token en respuesta');
  setToken(token);
  console.log('DROPI: auto-login exitoso, token guardado');
  return token;
}

async function getToken() {
  if (_token) return _token;
  // Si no hay token, intentar auto-login (requiere DROPI_EMAIL y DROPI_PASSWORD en env)
  try {
    return await autoLogin();
  } catch (e) {
    throw new Error(`Token DROPI no configurado y auto-login falló: ${e.message}`);
  }
}

async function crearOrden(pedido) {
  const token = await getToken();
  const client = makeClient(token);

  // Nombre y apellido
  const partes = (pedido.nombre || '').trim().split(' ');
  const nombre = partes[0] || '';
  const apellido = partes.slice(1).join(' ') || nombre;

  // Ciudad y provincia — normalizar nombre de ciudad para DROPI
  const ciudadUpper = (pedido.ciudad || '').toUpperCase().trim();
  const cityForDropi = CIUDAD_DROPI[ciudadUpper] || pedido.ciudad;  // nombre exacto que espera DROPI
  // Provincia: mapa local → provincia enviada por el agente → ciudad como último recurso
  const state = PROVINCIAS[ciudadUpper] || pedido.provincia || pedido.ciudad;

  // Saldo a cobrar
  const saldo = parseFloat(String(pedido.saldo).replace(',', '.')) || 0;
  const rateType = saldo > 0 ? 'CON RECAUDO' : 'SIN RECAUDO';

  // Productos
  const productosRaw = [];
  const campos = ['normal', 'picante', 'parejas', 'enganchados', 'dados'];
  for (const campo of campos) {
    const qty = parseInt(pedido[campo]) || 0;
    if (qty > 0) productosRaw.push({ ...PRODUCTS[campo], quantity: qty });
  }

  if (!productosRaw.length) throw new Error('No hay productos para crear la guía.');

  // Distribuir precio equitativamente entre todas las unidades:
  // CON RECAUDO → saldo / unidades  (lo que se cobra al entregar)
  // SIN RECAUDO → pvp_total / unidades  (precio de venta, para que DROPI vea ganancia)
  const totalUnidades = productosRaw.reduce((s, p) => s + p.quantity, 0);
  const pvpTotal = parseFloat(String(pedido.pvp_total || 0).replace(',', '.')) || 0;
  const basePrice = saldo > 0 ? saldo : (pvpTotal || saldo);
  const precioPorUnidad = basePrice > 0
    ? parseFloat((basePrice / totalUnidades).toFixed(2))
    : 1;

  const productos = productosRaw.map(p => ({
    ...p,
    stock: 999,
    variation_id: null,
    price: precioPorUnidad,
    suggested_price: '1.00',
    sale_price: '1.00',
    variations: [],
    type: 'SIMPLE',
    user_id: USER_ID
  }));

  // Teléfono con prefijo 593
  const phone = (pedido.telefono || '').replace(/^0/, '593').replace(/^\+/, '');

  const body = {
    total_order: Math.round(saldo),   // entero requerido por la API
    notes: pedido.notas || '',
    name: nombre,
    surname: apellido,
    dir: (pedido.direccion || '').toUpperCase(),
    country: 'ECUADOR',
    state,
    city: cityForDropi,
    phone,
    client_email: '',
    payment_method_id: 1,
    user_id: USER_ID,
    supplier_id: USER_ID,
    type: 'FINAL_ORDER',
    rate_type: rateType,
    products: productos,
    distributionCompany: { id: 2, name: 'SERVIENTREGA' },
    type_service: 'normal',
    zip_code: null,
    colonia: '',
    shop_id: null,
    dni: '',
    dni_type: '',
    insurance: false,
    shalom_data: null,
    warehouses_selected_id: WAREHOUSE_ID,
    shipping_amount: 0,
    calculate_costs_and_shiping: true   // DROPI calcula el envío automáticamente
  };

  // Paso 1: crear la orden (con retry automático si el token expiró)
  let res;
  try {
    res = await client.post('/orders/myorders', body);
  } catch (e) {
    const status = e.response?.status;
    if (status === 401 || status === 403) {
      // Token expirado — intentar auto-login y reintentar UNA vez
      console.log(`DROPI 401/403 — intentando auto-login y reintento...`);
      try {
        const newToken = await autoLogin();
        const newClient = makeClient(newToken);
        res = await newClient.post('/orders/myorders', body);
      } catch (e2) {
        throw new Error(`DROPI error ${status} y auto-login falló: ${e2.message}`);
      }
    } else {
      throw new Error(`DROPI error ${status}: ${JSON.stringify(e.response?.data)}`);
    }
  }

  const orderData = res.data;
  // La API devuelve el ID dentro de "objects.id"
  const orderId = orderData?.id || orderData?.objects?.id
    || orderData?.data?.id || orderData?.order?.id;

  if (!orderId) {
    console.log('DROPI create response (sin id):', JSON.stringify(orderData).substring(0, 500));
    return orderData;
  }

  console.log(`Orden DROPI creada. ID: ${orderId} — generando guía...`);

  // Paso 2: generar la guía (con retry automático si el token expiró)
  let guideRes;
  let activeClient = client; // puede ser reemplazado si hay auto-login
  try {
    guideRes = await activeClient.put(`/orders/myorders/${orderId}`, { status: 'GUIA_GENERADA' });
  } catch (e) {
    const status = e.response?.status;
    const errData = JSON.stringify(e.response?.data);
    console.error(`Error generando guía (${status}):`, errData);

    if (status === 401 || status === 403) {
      // Token expirado — intentar auto-login y reintentar UNA vez
      console.log(`DROPI PUT 401/403 — auto-login y reintento guía...`);
      try {
        const newToken = await autoLogin();
        activeClient = makeClient(newToken);
        guideRes = await activeClient.put(`/orders/myorders/${orderId}`, { status: 'GUIA_GENERADA' });
      } catch (e2) {
        const err2 = e2.response ? `${e2.response.status}: ${JSON.stringify(e2.response.data)}` : e2.message;
        return { ...orderData, _orderId: orderId, _guideError: `PUT ${status} + retry falló: ${err2}` };
      }
    } else {
      // La orden existe pero la guía no se generó — devolver error detallado
      return { ...orderData, _orderId: orderId, _guideError: `PUT ${status}: ${errData}` };
    }
  }

  const guideData = guideRes.data;
  console.log('DROPI guide response keys:', Object.keys(guideData));

  // El número de guía real está en shipping_guide; el campo sticker es el nombre del PDF
  const orderObj = guideData?.order || guideData?.objects || guideData?.data || {};
  const sticker =
    orderObj?.shipping_guide ||
    guideData?.shipping_guide ||
    orderObj?.guide_number ||
    guideData?.guide_number ||
    orderObj?.tracking_number ||
    guideData?.tracking_number;

  // Costo de envío que calculó DROPI
  const shippingAmt = orderObj?.shipping_amount || orderObj?.discounted_amount || guideData?.shipping_amount || 0;

  // URL del PDF de la guía
  const pdfUrl = sticker
    ? `https://d39ru7awumhhs2.cloudfront.net/ecuador/guias/servientrega/ORDEN-${orderId}-GUIA-${sticker}.pdf`
    : null;

  return { ...guideData, sticker, _orderId: orderId, _shipping: shippingAmt, _pdfUrl: pdfUrl };
}

// Obtiene una orden de DROPI por su ID y devuelve guía + envío
async function getOrdenPorId(orderId) {
  const token = await getToken();
  let client = makeClient(token);
  console.log(`DROPI getOrdenPorId: GET /orders/myorders/${orderId}`);
  try {
    const res = await client.get(`/orders/myorders/${orderId}`);
    const data = res.data;
    const orden = data?.order || data?.objects || data?.data || data;
    const guia = orden?.shipping_guide || orden?.guide_number || orden?.tracking_number;
    const shipping = orden?.shipping_amount || orden?.discounted_amount || 0;
    const pdfUrl = guia
      ? `https://d39ru7awumhhs2.cloudfront.net/ecuador/guias/servientrega/ORDEN-${orderId}-GUIA-${guia}.pdf`
      : null;
    console.log(`DROPI getOrdenPorId: guia=${guia} shipping=${shipping}`);
    return { guia, shipping, orderId, pdfUrl };
  } catch (e) {
    const status = e.response?.status;
    if (status === 401 || status === 403) {
      const newToken = await autoLogin();
      client = makeClient(newToken);
      const res = await client.get(`/orders/myorders/${orderId}`);
      const data = res.data;
      const orden = data?.order || data?.objects || data?.data || data;
      const guia = orden?.shipping_guide || orden?.guide_number || orden?.tracking_number;
      const shipping = orden?.shipping_amount || orden?.discounted_amount || 0;
      const pdfUrl = guia
        ? `https://d39ru7awumhhs2.cloudfront.net/ecuador/guias/servientrega/ORDEN-${orderId}-GUIA-${guia}.pdf`
        : null;
      return { guia, shipping, orderId, pdfUrl };
    }
    throw new Error(`DROPI getOrdenPorId ${status}: ${JSON.stringify(e.response?.data)?.slice(0, 200)}`);
  }
}

// Busca órdenes en DROPI por nombre o teléfono y devuelve guía + envío
async function buscarOrden(query, telefono) {
  const token = await getToken();
  let client = makeClient(token);

  function extractOrders(data) {
    if (!data) return [];
    return data?.objects || data?.data || data?.orders || (Array.isArray(data) ? data : []);
  }

  async function doGet(url) {
    console.log(`DROPI buscarOrden: GET ${url}`);
    try {
      const res = await client.get(url);
      return res.data;
    } catch (e) {
      const status = e.response?.status;
      if (status === 401 || status === 403) {
        const newToken = await autoLogin();
        client = makeClient(newToken);
        const res = await client.get(url);
        return res.data;
      }
      console.error(`DROPI buscar error ${status}:`, JSON.stringify(e.response?.data)?.slice(0, 200));
      return null;
    }
  }

  // Estrategias de búsqueda en orden de prioridad
  const strategies = [];

  // Por teléfono (más confiable) — probar con y sin prefijo 593
  if (telefono) {
    const tel = String(telefono).replace(/^0/, '593').replace(/^\+/, '');
    const tel2 = String(telefono).replace(/^593/, '0');
    strategies.push(`/orders/myorders?page=1&perPage=10&search=${encodeURIComponent(tel)}&user_id=${USER_ID}`);
    strategies.push(`/orders/myorders?page=1&perPage=10&search=${encodeURIComponent(tel2)}&user_id=${USER_ID}`);
    strategies.push(`/orders/myorders?page=1&perPage=10&q=${encodeURIComponent(tel)}&user_id=${USER_ID}`);
  }

  // Por nombre completo
  strategies.push(`/orders/myorders?page=1&perPage=10&search=${encodeURIComponent(query)}&user_id=${USER_ID}`);

  // Por primera palabra del nombre (primer nombre)
  const primerNombre = query.split(' ')[0];
  if (primerNombre !== query) {
    strategies.push(`/orders/myorders?page=1&perPage=10&search=${encodeURIComponent(primerNombre)}&user_id=${USER_ID}`);
  }

  // Por apellido (última palabra)
  const palabras = query.split(' ');
  const apellido = palabras[palabras.length - 1];
  if (apellido !== primerNombre) {
    strategies.push(`/orders/myorders?page=1&perPage=10&search=${encodeURIComponent(apellido)}&user_id=${USER_ID}`);
  }

  let orders = [];
  for (const url of strategies) {
    const data = await doGet(url);
    orders = extractOrders(data);
    console.log(`  → ${orders.length} resultados`);
    if (orders.length) break;
  }

  if (!orders.length) {
    console.log('DROPI buscarOrden: ninguna estrategia encontró resultados');
    return null;
  }

  // Filtrar por teléfono si tenemos uno
  let ordenFinal = null;
  if (telefono) {
    const telNorm = String(telefono).replace(/^0/, '').replace(/^593/, '');
    const match = orders.find(o => {
      const oTel = String(o.phone || '').replace(/^0/, '').replace(/^593/, '').replace(/^\+593/, '');
      return oTel.endsWith(telNorm) || telNorm.endsWith(oTel);
    });
    if (match) ordenFinal = match;
  }

  // Si no hay match por teléfono, buscar la más reciente con guía
  if (!ordenFinal) {
    ordenFinal = orders.find(o => o.shipping_guide || o.guide_number || o.tracking_number) || orders[0];
  }

  const guia = ordenFinal?.shipping_guide || ordenFinal?.guide_number || ordenFinal?.tracking_number;
  const shipping = ordenFinal?.shipping_amount || ordenFinal?.discounted_amount || 0;
  const orderId = ordenFinal?.id;
  const pdfUrl = guia && orderId
    ? `https://d39ru7awumhhs2.cloudfront.net/ecuador/guias/servientrega/ORDEN-${orderId}-GUIA-${guia}.pdf`
    : null;

  console.log(`DROPI buscarOrden resultado: guia=${guia} shipping=${shipping} orderId=${orderId}`);
  return { guia, shipping, orderId, pdfUrl, nombre: `${ordenFinal?.name || ''} ${ordenFinal?.surname || ''}`.trim() };
}

// Genera la guía de una orden DROPI ya existente (sin crear nueva orden).
// Útil para reintentar cuando la guía falló en el primer intento.
async function generarGuia(orderId) {
  const token = await getToken();
  let client = makeClient(token);
  console.log(`DROPI generarGuia: PUT /orders/myorders/${orderId}`);

  async function doGenerate(c) {
    const guideRes = await c.put(`/orders/myorders/${orderId}`, { status: 'GUIA_GENERADA' });
    const guideData = guideRes.data;
    const orderObj = guideData?.order || guideData?.objects || guideData?.data || {};
    const sticker =
      orderObj?.shipping_guide || guideData?.shipping_guide ||
      orderObj?.guide_number   || guideData?.guide_number   ||
      orderObj?.tracking_number || guideData?.tracking_number;
    const shippingAmt = orderObj?.shipping_amount || orderObj?.discounted_amount || guideData?.shipping_amount || 0;
    const pdfUrl = sticker
      ? `https://d39ru7awumhhs2.cloudfront.net/ecuador/guias/servientrega/ORDEN-${orderId}-GUIA-${sticker}.pdf`
      : null;
    console.log(`generarGuia: guia=${sticker} shipping=${shippingAmt}`);
    return { guia: sticker, shipping: shippingAmt, orderId, pdfUrl };
  }

  try {
    return await doGenerate(client);
  } catch (e) {
    const status = e.response?.status;
    if (status === 401 || status === 403) {
      const newToken = await autoLogin();
      client = makeClient(newToken);
      return await doGenerate(client);
    }
    const errData = JSON.stringify(e.response?.data)?.slice(0, 200);
    throw new Error(`DROPI generarGuia ${status}: ${errData}`);
  }
}

// Verifica la reputación de un cliente en toda la plataforma DROPI por teléfono.
// Útil para decidir si aceptar un pedido con contraentrega.
async function verificarCliente(telefono) {
  const token = await getToken();
  let client = makeClient(token);

  // Normalizar teléfono al formato que usa DROPI internamente: 993154462 (sin 0, sin 593, sin +)
  // Acepta: 0993154462 | 993154462 | 593993154462 | +593993154462
  const tel = String(telefono).trim()
    .replace(/^\+/, '')   // quitar +
    .replace(/^593/, '')  // quitar código de país 593
    .replace(/^0/, '');   // quitar 0 inicial
  console.log(`verificarCliente: tel normalizado = ${tel} (original: ${telefono})`);

  async function doPost(c) {
    // DROPI usa los productos del pedido actual para buscar historial — pasar uno real
    // para que el endpoint no devuelva vacío por no encontrar coincidencias de producto
    const sampleProducts = [{
      id: PRODUCTS.normal.id,
      name: PRODUCTS.normal.name,
      quantity: 1,
      price: 23,
      type: 'SIMPLE',
      user_id: USER_ID,
    }];
    const res = await c.post('/orders/getclientclasification', {
      phone: tel,
      products: sampleProducts,
    });
    return res.data;
  }

  let data;
  try {
    data = await doPost(client);
  } catch (e) {
    const status = e.response?.status;
    if (status === 401 || status === 403) {
      const newToken = await autoLogin();
      client = makeClient(newToken);
      data = await doPost(client);
    } else {
      throw new Error(`DROPI verificarCliente ${status}: ${JSON.stringify(e.response?.data)?.slice(0, 200)}`);
    }
  }

  // Loguear respuesta completa para debug
  console.log('DROPI verificarCliente raw response:', JSON.stringify(data));

  // Extraer el objeto de datos — DROPI puede envolverlo en distintas estructuras
  const obj = data?.objects ?? data?.data ?? data?.client ?? data ?? {};

  // Busca un campo numérico en el objeto cuyos keys contengan alguna de las palabras
  function findField(o, ...words) {
    for (const key of Object.keys(o)) {
      const k = key.toLowerCase();
      if (words.some(w => k.includes(w))) {
        const val = o[key];
        if (val !== null && val !== undefined) return val;
      }
    }
    return null;
  }

  const total      = findField(obj, 'total')      ?? null;
  const entregados = findField(obj, 'deliver', 'entregad') ?? null;
  const devueltos  = findField(obj, 'return', 'devolu')    ?? null;
  const pendientes = findField(obj, 'pending', 'pendient') ?? null;
  const clasificacion = obj.classification ?? obj.clasification ?? obj.category ?? obj.clasificacion ?? null;
  const nombre     = obj.name ?? obj.full_name ?? obj.fullname ?? null;

  return {
    raw: data,
    total,
    entregados,
    devueltos,
    pendientes,
    clasificacion,
    nombre,
    // Campos crudos del objeto para debug cuando no matchea nada
    _keys: Object.keys(obj),
  };
}

module.exports = { crearOrden, buscarOrden, getOrdenPorId, generarGuia, setToken, verificarCliente, _getToken: getToken, _autoLogin: autoLogin, _makeClient: makeClient };

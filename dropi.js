const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');

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
  dados:       { id: 139461, name: 'Dados',                  weight: '0.10' },
  comboParejas: { id: 175606, name: 'Combo Parejas',          weight: '1.10' }
};

// ─── Normalización de teléfonos ecuatorianos ─────────────────────────────────
// Fabián pega números desde WhatsApp, que vienen con espacios, guiones, "+" y
// caracteres invisibles de dirección de texto (U+202A…U+202E, U+200E/F, NBSP).
// Todo eso hacía que DROPI no encontrara al cliente. Se limpia a dígitos puros.

// "‪+593 98 077 3933‬" | "0993154462" | "593993154462" → "993154462"
function telNacional(tel) {
  let s = String(tel || '').replace(/\D/g, '');
  if (s.startsWith('00')) s = s.slice(2);
  // Solo quitar el código de país si al hacerlo queda un número usable (9 dígitos)
  if (s.startsWith('593') && s.length >= 12) s = s.slice(3);
  return s.replace(/^0+/, '');
}

// → "593993154462" (formato que usa DROPI para crear órdenes)
function telConPais(tel) {
  const n = telNacional(tel);
  return n ? '593' + n : '';
}

// → "0993154462" (formato local, el que muestra DROPI en algunos listados)
function telLocal(tel) {
  const n = telNacional(tel);
  return n ? '0' + n : '';
}

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

// ─── Ciudades: catálogo real de DROPI ────────────────────────────────────────
// El mapa CIUDAD_DROPI de arriba crecía de a una ciudad cada vez que se perdía
// un pedido ("Agrega más abajo cuando encuentres casos nuevos"). Con 871
// ciudades en el catálogo y 2 entradas escritas a mano, el resto se mandaba a
// la suerte: si el nombre no coincidía exacto, DROPI rechazaba con "la ciudad
// no existe en el departamento ingresado" — aunque a mano sí se pudiera crear.
// Se consulta el catálogo (GET /city), igual que ya hace la web y
// projects/dropshipping/ciudades.js, y se busca el nombre real.
let _ciudades = null;
let _ciudadesAt = 0;
const CIUDADES_TTL = 12 * 60 * 60 * 1000;   // el catálogo casi no cambia

const normCiudad = (v) => String(v || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

async function getCiudades() {
  if (_ciudades && Date.now() - _ciudadesAt < CIUDADES_TTL) return _ciudades;
  const token = await getToken();
  let client = makeClient(token);
  let res;
  try {
    res = await client.get('/city');
  } catch (e) {
    if (e.response?.status === 401 || e.response?.status === 403) {
      client = makeClient(await autoLogin());
      res = await client.get('/city');
    } else throw e;
  }
  const crudas = res.data?.objects || res.data || [];
  _ciudades = crudas.map((c) => {
    let tarifas = c.rate_type;
    if (!Array.isArray(tarifas)) { try { tarifas = JSON.parse(tarifas || '[]'); } catch (_) { tarifas = []; } }
    return {
      nombre: c.name,
      provincia: c.department?.name || '',
      tarifas,
      nNombre: normCiudad(c.name),
      nProvincia: normCiudad(c.department?.name)
    };
  });
  _ciudadesAt = Date.now();
  console.log(`DROPI: catálogo de ciudades cargado (${_ciudades.length})`);
  return _ciudades;
}

/**
 * Nombre y provincia exactos que espera DROPI para una ciudad.
 *
 * Solo considera destinos con la tarifa que se va a usar: acertarle al nombre
 * no sirve si la transportadora no lleva contra entrega hasta ahí. Si no
 * resuelve, devuelve null y se cae al mapa a mano de siempre — nunca peor
 * que antes.
 */
async function resolverCiudad(ciudad, provincia, rateType) {
  const nCiudad = normCiudad(ciudad);
  if (!nCiudad) return null;

  try {
    const todas = await getCiudades();
    const conTarifa = todas.filter((c) => c.tarifas.includes(rateType));
    const universo = conTarifa.length ? conTarifa : todas;

    const nProv = normCiudad(provincia);
    const deLaProvincia = nProv ? universo.filter((c) => c.nProvincia === nProv) : [];

    // Si se sabe la provincia y el catálogo la conoce, la búsqueda NO sale de
    // ahí. Hay una SAN MIGUEL en Cañar y una SAN MIGUEL DE BOLIVAR en Bolívar:
    // buscar "SAN MIGUEL" en todo el país devuelve la de Cañar y el paquete
    // se va a 300 km del cliente. Sin provincia sí se busca en todo el país.
    const ambito = deLaProvincia.length ? deLaProvincia : universo;

    const exacta = ambito.find((c) => c.nNombre === nCiudad);
    let hit = exacta;
    if (!hit) {
      const parciales = ambito.filter((c) => c.nNombre.startsWith(nCiudad) || nCiudad.startsWith(c.nNombre));
      if (parciales.length === 1) hit = parciales[0];
      else if (parciales.length > 1) {
        console.log(`resolverCiudad: "${ciudad}" es ambigua (${parciales.map((c) => `${c.nombre}/${c.provincia}`).join(', ')}) — no se adivina`);
        return null;
      }
    }
    if (!hit) {
      console.log(`resolverCiudad: "${ciudad}" no está en el catálogo con tarifa ${rateType}`);
      return null;
    }
    return { ciudad: hit.nombre, provincia: hit.provincia };
  } catch (e) {
    console.error('resolverCiudad: no se pudo consultar el catálogo:', e.message);
    return null;
  }
}

// Orden de prioridad: archivo (más reciente) > env var (deploy) > null
let _token = (() => {
  try {
    const saved = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    if (saved) { console.log('DROPI token cargado desde archivo'); return saved; }
  } catch (_) {}
  if (process.env.DROPI_TOKEN) { console.log('DROPI token cargado desde env'); return process.env.DROPI_TOKEN; }
  return null;
})();

// Generador TOTP (RFC 6238) sin dependencias externas — evita el bug de otplib@13
// (@otplib/plugin-base32-scure es ESM-only y rompe con require() en Node 18).
function base32Decode(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = input.toUpperCase().replace(/=+$/, '');
  let bits = '';
  for (const char of clean) {
    const val = alphabet.indexOf(char);
    if (val === -1) throw new Error('Caracter base32 inválido: ' + char);
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTotp(base32Secret, { digits = 6, step = 30 } = {}) {
  const counter = Math.floor(Date.now() / 1000 / step);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', base32Decode(base32Secret)).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return (code % (10 ** digits)).toString().padStart(digits, '0');
}

// Lee los claims de un JWT sin verificar firma (solo para inspeccionar token_type)
function decodeJwtPayload(token) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  } catch (_) {
    return null;
  }
}

// Actualiza el token en memoria y en archivo (sobrevive reinicios)
function setToken(token) {
  _token = token.replace(/^Bearer\s+/i, '').trim();
  try { fs.writeFileSync(TOKEN_FILE, _token, 'utf8'); } catch (e) { console.error('No se pudo guardar token en archivo:', e.message); }
  console.log('DROPI token actualizado');
}

function makeClient(token) {
  return axios.create({
    baseURL: BASE,
    // Sin esto, una conexión que se queda colgada (sin error, sin respuesta)
    // hace que el proceso espere para siempre — el reintento de
    // `paginaConReintento` en catalogo.js nunca se dispara porque nunca llega
    // un error que atrapar. Pasó de verdad el 2026-08-30: la corrida de las
    // 5 AM quedó viva 6+ horas colgada en el producto 1500 de ~34.500.
    timeout: 30000,
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
  const totpSecret = process.env.DROPI_TOTP_SECRET;
  if (!email || !password) throw new Error('Sin credenciales DROPI_EMAIL/DROPI_PASSWORD para auto-login');
  if (!totpSecret) throw new Error('Sin DROPI_TOTP_SECRET para auto-login (DROPI exige 2FA)');

  const loginHeaders = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'es-EC,es;q=0.9',
    'content-type': 'application/json',
    'origin': 'https://app.dropi.ec',
    'referer': 'https://app.dropi.ec/login',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site'
  };

  console.log('DROPI: iniciando auto-login...');
  const otp = generateTotp(totpSecret);
  const res = await axios.post(`${BASE}/login`, {
    email, password, white_brand_id: 1, brand: '', otp, with_cdc: false
  }, { headers: loginHeaders });

  let token = res.data?.token;
  if (!token) throw new Error('Auto-login falló: sin token en respuesta de /login');

  // El token de /login puede ser uno temporal de solo-2FA (no sirve para la API).
  // Se detecta decodificando su propio payload, no adivinando la forma del JSON de respuesta.
  const claims = decodeJwtPayload(token);
  if (claims?.token_type === '2FA') {
    console.log('DROPI: login requiere verificación 2FA adicional, completando...');
    const verifyRes = await axios.post(`${BASE}/auth/2fa/verify`, {
      token, code: otp
    }, { headers: loginHeaders });
    token = verifyRes.data?.token;
  }

  if (!token) throw new Error('Auto-login falló: sin token final tras verificación 2FA');
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

// DROPI no siempre devuelve la guía en la misma respuesta del PUT: acepta el
// cambio a GUIA_GENERADA con 200, deja la orden en PENDIENTE y emite el número
// unos segundos después. Por eso el bot fallaba "a veces": la orden 6835495
// se reportó sin guía y minutos más tarde tenía la 189590671 tranquila en
// DROPI. Releer con reintentos convierte ese "a veces" en "siempre".
async function esperarGuia(orderId, intentos = 5) {
  const esperas = [1500, 3000, 5000, 8000, 12000];
  for (let i = 0; i < intentos; i++) {
    await new Promise((r) => setTimeout(r, esperas[Math.min(i, esperas.length - 1)]));
    try {
      const o = await getOrdenPorId(orderId);
      if (o?.guia) {
        console.log(`esperarGuia: guía ${o.guia} apareció en el intento ${i + 1}`);
        return o;
      }
      console.log(`esperarGuia: intento ${i + 1}/${intentos} — sigue sin guía (status ${o?.status || '?'})`);
    } catch (e) {
      console.log(`esperarGuia: intento ${i + 1} falló: ${e.message}`);
    }
  }
  return null;
}

async function crearOrden(pedido) {
  const token = await getToken();
  const client = makeClient(token);

  // Nombre y apellido
  const partes = (pedido.nombre || '').trim().split(' ');
  const nombre = partes[0] || '';
  const apellido = partes.slice(1).join(' ') || nombre;

  // Ciudad y provincia — el catálogo real de DROPI manda; el mapa a mano queda
  // solo como red de seguridad si el catálogo no se puede consultar.
  const ciudadUpper = (pedido.ciudad || '').toUpperCase().trim();
  let cityForDropi = CIUDAD_DROPI[ciudadUpper] || pedido.ciudad;
  let state = PROVINCIAS[ciudadUpper] || pedido.provincia || pedido.ciudad;

  // Saldo a cobrar. El monto llega formateado para Sheets ("$29,99"): con un
  // replace de coma pelado, parseFloat("$29.99") da NaN y el saldo caía a 0 —
  // o sea la orden salía SIN RECAUDO y con precio $1, y DROPI la rechazaba
  // entera ("el monto a ganar es menor o igual a cero"). Limpiar TODO lo que
  // no sea número antes de parsear.
  const aNumero = (v) => parseFloat(String(v ?? '').replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
  const saldo = aNumero(pedido.saldo);
  const rateType = saldo > 0 ? 'CON RECAUDO' : 'SIN RECAUDO';

  const resuelta = await resolverCiudad(pedido.ciudad, state, rateType);
  if (resuelta) {
    if (resuelta.ciudad !== cityForDropi || resuelta.provincia !== state) {
      console.log(`crearOrden: ciudad "${pedido.ciudad}" → "${resuelta.ciudad}" (${resuelta.provincia}) según catálogo DROPI`);
    }
    cityForDropi = resuelta.ciudad;
    state = resuelta.provincia;
  }

  // Productos
  // Combo Parejas: si el pedido trae Torre Parejas + Dados juntos, ya no se
  // mandan como 2 productos sueltos a DROPI — hay un SKU armado para esto
  // (id 175606). Emparejados no cuenta para el combo, es digital, no pesa.
  const cantidades = {
    normal: parseInt(pedido.normal) || 0,
    picante: parseInt(pedido.picante) || 0,
    parejas: parseInt(pedido.parejas) || 0,
    enganchados: parseInt(pedido.enganchados) || 0,
    dados: parseInt(pedido.dados) || 0
  };

  const productosRaw = [];
  const comboQty = Math.min(cantidades.parejas, cantidades.dados);
  if (comboQty > 0) {
    productosRaw.push({ ...PRODUCTS.comboParejas, quantity: comboQty });
    cantidades.parejas -= comboQty;
    cantidades.dados -= comboQty;
  }

  const campos = ['normal', 'picante', 'parejas', 'enganchados', 'dados'];
  for (const campo of campos) {
    const qty = cantidades[campo];
    if (qty > 0) productosRaw.push({ ...PRODUCTS[campo], quantity: qty });
  }

  if (!productosRaw.length) throw new Error('No hay productos para crear la guía.');

  // Distribuir precio equitativamente entre todas las unidades:
  // CON RECAUDO → saldo / unidades  (lo que se cobra al entregar)
  // SIN RECAUDO → pvp_total / unidades  (precio de venta, para que DROPI vea ganancia)
  const totalUnidades = productosRaw.reduce((s, p) => s + p.quantity, 0);
  const pvpTotal = aNumero(pedido.pvp_total);
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

  // El total que se le cobra al cliente es la suma REAL de las líneas, no el
  // saldo pelado: DROPI rechaza la orden entera si no cuadran. Dividir un
  // saldo entre varias unidades deja centavos colgando (29,99 ÷ 2 = 14,995 →
  // 15,00 c/u = 30,00), y ese descuadre de un centavo tumba el pedido.
  // Se cobra la suma; la diferencia con el saldo nunca pasa de unos centavos.
  const totalLineas = parseFloat(
    productos.reduce((acc, p) => acc + p.price * p.quantity, 0).toFixed(2)
  );
  if (Math.abs(totalLineas - saldo) > 0.001 && saldo > 0) {
    console.log(`crearOrden: saldo ${saldo.toFixed(2)} → se cobra ${totalLineas.toFixed(2)} (redondeo entre ${totalUnidades} unidades)`);
  }

  // Teléfono con prefijo 593
  const phone = telConPais(pedido.telefono);

  const body = {
    // NO redondear. El comentario viejo decía "entero requerido por la API" y
    // era falso: las órdenes que DROPI acepta llevan el decimal exacto. Con
    // saldo 29,99 esto mandaba 30 y DROPI rechazaba la orden entera con
    // "el monto a ganar es menor o igual a cero(0)" — total_order tiene que
    // cuadrar con la suma de las líneas (price × quantity), y 30 ≠ 29,99.
    // Nunca se había notado porque las órdenes salían SIN RECAUDO por el bug
    // del saldo, y ahí total_order va en 0 y DROPI no valida nada.
    total_order: saldo > 0 ? totalLineas : 0,
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
    // DROPI rechaza órdenes devolviendo HTTP 200 con isSuccess:false y el
    // motivo real adentro (mismo patrón que projects/dropshipping/pedidos.js).
    // Antes esto se devolvía crudo y el flujo de arriba lo leía como "orden
    // creada, guía pendiente" — el 2026-09-03 Fabián recibió "Orden creada en
    // DROPI, se generará la guía en los próximos momentos" cuando en realidad
    // DROPI no había creado nada. Una orden rechazada tiene que doler, no
    // parecerse a una orden creada.
    const motivo = orderData?.data_error || orderData?.message || orderData?.error
      || 'DROPI no devolvió id de orden';
    console.log('DROPI create RECHAZADA:', JSON.stringify(orderData).substring(0, 500));
    throw new Error(`DROPI rechazó la orden: ${motivo}`);
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

  // Sin número en la respuesta, la guía puede estar en camino: se relee.
  if (!sticker) {
    console.log(`crearOrden: PUT sin número de guía — reintentando lectura de la orden ${orderId}`);
    const tardia = await esperarGuia(orderId);
    if (tardia?.guia) {
      return {
        ...guideData,
        sticker: tardia.guia,
        _orderId: orderId,
        _shipping: tardia.shipping || shippingAmt,
        _pdfUrl: tardia.pdfUrl
      };
    }
  }

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
    const status = orden?.status || null;
    const pdfUrl = guia
      ? `https://d39ru7awumhhs2.cloudfront.net/ecuador/guias/servientrega/ORDEN-${orderId}-GUIA-${guia}.pdf`
      : null;
    console.log(`DROPI getOrdenPorId: guia=${guia} shipping=${shipping} status=${status}`);
    return { guia, shipping, orderId, pdfUrl, status };
  } catch (e) {
    const httpStatus = e.response?.status;
    if (httpStatus === 401 || httpStatus === 403) {
      const newToken = await autoLogin();
      client = makeClient(newToken);
      const res = await client.get(`/orders/myorders/${orderId}`);
      const data = res.data;
      const orden = data?.order || data?.objects || data?.data || data;
      const guia = orden?.shipping_guide || orden?.guide_number || orden?.tracking_number;
      const shipping = orden?.shipping_amount || orden?.discounted_amount || 0;
      const status = orden?.status || null;
      const pdfUrl = guia
        ? `https://d39ru7awumhhs2.cloudfront.net/ecuador/guias/servientrega/ORDEN-${orderId}-GUIA-${guia}.pdf`
        : null;
      return { guia, shipping, orderId, pdfUrl, status };
    }
    throw new Error(`DROPI getOrdenPorId ${httpStatus}: ${JSON.stringify(e.response?.data)?.slice(0, 200)}`);
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
  // El listado NO acepta page/perPage/search: pide result_number + start y
  // filtra con textToSearch. Con perPage la API responde 400 ("pageSize or
  // result_number is required") y buscarOrden devolvía "0 resultados" para
  // TODO — o sea sincronizar_guia_dropi llevaba tiempo roto en silencio.
  // Este shape es el mismo que ya usa projects/dropshipping/pedidos.js.
  const url = (q) => `/orders/myorders?result_number=20&start=0&orderBy=id&orderDirection=desc`
    + `&user_id=${USER_ID}&textToSearch=${encodeURIComponent(q)}`;

  if (telefono) {
    strategies.push(url(telConPais(telefono)));
    strategies.push(url(telLocal(telefono)));
  }

  // Por nombre completo
  strategies.push(url(query));

  // Por primera palabra del nombre (primer nombre)
  const primerNombre = query.split(' ')[0];
  if (primerNombre !== query) strategies.push(url(primerNombre));

  // Por apellido (última palabra)
  const palabras = query.split(' ');
  const apellido = palabras[palabras.length - 1];
  if (apellido !== primerNombre) strategies.push(url(apellido));

  // Una orden anulada en DROPI conserva su número de guía, pero esa guía ya no
  // sirve para despachar nada. Si se la copiara a un pedido vivo, el Sheet
  // quedaría con guía y nadie notaría que el paquete no va a salir.
  const ANULADAS = ['RECHAZADO', 'CANCELADO', 'ANULADO', 'DEVOLUCION', 'DEVUELTO'];
  const estaAnulada = (o) => ANULADAS.includes(String(o?.status || '').toUpperCase());

  let orders = [];
  for (const url of strategies) {
    const data = await doGet(url);
    const crudas = extractOrders(data);
    orders = crudas.filter((o) => !estaAnulada(o));
    const descartadas = crudas.length - orders.length;
    console.log(`  → ${orders.length} resultados${descartadas ? ` (${descartadas} anuladas descartadas)` : ''}`);
    if (orders.length) break;
  }

  if (!orders.length) {
    console.log('DROPI buscarOrden: ninguna estrategia encontró resultados');
    return null;
  }

  // Filtrar por teléfono si tenemos uno
  let ordenFinal = null;
  if (telefono) {
    const telNorm = telNacional(telefono);
    const match = orders.find(o => {
      const oTel = telNacional(o.phone);
      return oTel.endsWith(telNorm) || telNorm.endsWith(oTel);
    });
    if (match) ordenFinal = match;

    // Con teléfono a mano, ninguna orden que no sea de ese teléfono es la que
    // se busca. Las estrategias de fallback buscan por primer nombre y por
    // apellido: "EDUARDO" devuelve 17 órdenes de 17 clientes distintos, y
    // quedarse con la primera le copiaba al pedido la guía de otra persona.
    // Mejor no encontrar nada que devolver la orden equivocada.
    if (!ordenFinal) {
      console.log(`DROPI buscarOrden: hay resultados pero ninguno con el teléfono ${telefono} — se descartan todos`);
      return null;
    }
  }

  // Sin teléfono no hay forma de desambiguar: la más reciente con guía.
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
    const r = await doGenerate(client);
    if (!r.guia) {
      const tardia = await esperarGuia(orderId);
      if (tardia?.guia) return { guia: tardia.guia, shipping: tardia.shipping, orderId, pdfUrl: tardia.pdfUrl };
    }
    return r;
  } catch (e) {
    const status = e.response?.status;
    if (status === 401 || status === 403) {
      const newToken = await autoLogin();
      client = makeClient(newToken);
      const r = await doGenerate(client);
      if (!r.guia) {
        const tardia = await esperarGuia(orderId);
        if (tardia?.guia) return { guia: tardia.guia, shipping: tardia.shipping, orderId, pdfUrl: tardia.pdfUrl };
      }
      return r;
    }
    const errData = JSON.stringify(e.response?.data)?.slice(0, 200);
    throw new Error(`DROPI generarGuia ${status}: ${errData}`);
  }
}

// Marca una orden DROPI como impresa (campo printed: true)
async function marcarImpresaDropi(dropiId) {
  const token = await getToken();
  let client = makeClient(token);
  async function doMark(c) {
    const r = await c.put(`/orders/myorders/${dropiId}`, { printed: true });
    return r.data?.isSuccess === true;
  }
  try {
    return await doMark(client);
  } catch (e) {
    if (e.response?.status === 401 || e.response?.status === 403) {
      const newToken = await autoLogin();
      client = makeClient(newToken);
      return await doMark(client);
    }
    console.error(`marcarImpresaDropi ${dropiId}:`, e.message);
    return false;
  }
}

// Verifica la reputación de un cliente en toda la plataforma DROPI por teléfono.
// Útil para decidir si aceptar un pedido con contraentrega.
async function verificarCliente(telefono) {
  const token = await getToken();
  let client = makeClient(token);

  // Normalizar teléfono al formato que usa DROPI internamente: 993154462 (sin 0, sin 593, sin +)
  // Acepta: 0993154462 | 993154462 | 593993154462 | +593993154462
  const tel = telNacional(telefono);
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

// Consulta el saldo en DROPI — está en /users/:id dentro del campo wallets[]
async function getSaldoDropi() {
  const token = await getToken();
  let client = makeClient(token);
  async function doGet(c) {
    const res = await c.get(`/users/${USER_ID}`);
    const obj = res.data?.objects || {};
    const wallets = obj.wallets || [];
    if (!wallets.length) return { saldo: 0, congelado: false };
    const wallet = wallets[0];
    return {
      saldo: parseFloat(wallet.amount || 0),
      congelado: wallet.is_frozen || false
    };
  }
  try {
    return await doGet(client);
  } catch (e) {
    if (e.response?.status === 401 || e.response?.status === 403) {
      const newToken = await autoLogin();
      client = makeClient(newToken);
      return await doGet(client);
    }
    throw e;
  }
}

// Historial de movimientos de la wallet — hace falta para saber cuándo se
// acredita REALMENTE la plata de un pedido. o.status dice "ENTREGADO" horas
// o días antes de que DROPI pague; solo la wallet dice cuándo entró la plata.
// Mismo endpoint y misma lógica que projects/dropshipping/pedidos.js, pero
// con el USER_ID de la cuenta propia de Shotygames.
async function getMovimientosWallet({ desde, hasta, limite = 100 } = {}) {
  const token = await getToken();
  let client = makeClient(token);
  const hoy = new Date();
  const haceUnMes = new Date(hoy.getTime() - 45 * 86400000);
  const from = desde || haceUnMes.toISOString().slice(0, 10);
  const until = hasta || hoy.toISOString().slice(0, 10);
  const url = `/historywallet?orderBy=id&orderDirection=desc&result_number=${limite}&start=0` +
              `&textToSearch=&type=null&id=null&identification_code=null` +
              `&user_id=${USER_ID}&from=${from}&until=${until}&wallet_id=0`;

  async function doGet(c) {
    const r = await c.get(url);
    return (r.data?.objects || []).map((m) => ({
      id: m.id,
      orderId: m.order_id,
      tipo: m.type,                       // ENTRADA | SALIDA
      monto: parseFloat(m.amount) || 0,
      descripcion: m.description || '',
      fecha: m.created_at
    }));
  }
  try {
    return await doGet(client);
  } catch (e) {
    if (e.response?.status === 401 || e.response?.status === 403) {
      client = makeClient(await autoLogin());
      return await doGet(client);
    }
    throw e;
  }
}

/**
 * ¿Ya se acreditó la plata de esta orden? Busca la ENTRADA por GANANCIA —
 * no sirve cualquier ENTRADA: la devolución de flete y el reembolso por
 * cancelación también son ENTRADA, y ninguna significa que se cobró la venta.
 */
function pagoDeOrden(movimientos, orderId) {
  const id = String(orderId);
  // En la cuenta propia de Shotygames, Fabián es dropshipper Y proveedor del
  // mismo producto — DROPI acredita DOS entradas por GANANCIA por pedido
  // pagado ("...COMO DROPSHIPPER" + "...COMO PROVEEDOR"), no una. Con find()
  // se perdía la mitad de la plata real acreditada; hay que sumar todas.
  const pagos = movimientos.filter(
    (m) => String(m.orderId) === id && m.tipo === 'ENTRADA' && /GANANCIA/i.test(m.descripcion)
  );
  if (!pagos.length) return null;
  const fletes = movimientos.filter(
    (m) => String(m.orderId) === id && m.tipo === 'ENTRADA' && /DEVOLUCION DE FLETE/i.test(m.descripcion)
  );
  const monto = pagos.reduce((s, p) => s + p.monto, 0);
  const fleteDevuelto = fletes.reduce((s, f) => s + f.monto, 0);
  return {
    monto,
    fleteDevuelto,
    total: monto + fleteDevuelto,
    fecha: pagos[0].fecha
  };
}

module.exports = { telNacional, telConPais, telLocal, crearOrden, resolverCiudad, getCiudades, buscarOrden, getOrdenPorId, generarGuia, marcarImpresaDropi, setToken, verificarCliente, getSaldoDropi, getMovimientosWallet, pagoDeOrden, _getToken: getToken, _autoLogin: autoLogin, _makeClient: makeClient, _generateTotp: generateTotp, _PROVINCIAS: PROVINCIAS, _CIUDAD_DROPI: CIUDAD_DROPI };

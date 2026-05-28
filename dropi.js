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
  dados:       { id: 139461, name: 'Dados Digitales',        weight: '0.10' }
};

const PROVINCIAS = {
  'GUAYAQUIL': 'Guayas', 'DURAN': 'Guayas', 'MILAGRO': 'Guayas', 'SAMBORONDON': 'Guayas', 'DAULE': 'Guayas',
  'CUENCA': 'Azuay', 'GUALACEO': 'Azuay', 'SIGSIG': 'Azuay',
  'QUITO': 'Pichincha', 'SANGOLQUI': 'Pichincha', 'CAYAMBE': 'Pichincha', 'MEJIA': 'Pichincha',
  'MACHALA': 'El Oro', 'PASAJE': 'El Oro', 'HUAQUILLAS': 'El Oro', 'SANTA ROSA': 'El Oro', 'ARENILLAS': 'El Oro', 'ZARUMA': 'El Oro',
  'PORTOVIEJO': 'Manabí', 'MANTA': 'Manabí', 'CHONE': 'Manabí', 'BAHIA DE CARAQUEZ': 'Manabí', 'PEDERNALES': 'Manabí', 'EL CARMEN': 'Manabí', 'JIPIJAPA': 'Manabí', 'MONTECRISTI': 'Manabí',
  'BABAHOYO': 'Los Ríos', 'QUEVEDO': 'Los Ríos', 'VINCES': 'Los Ríos', 'VENTANAS': 'Los Ríos',
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

async function getToken() {
  if (_token) return _token;
  throw new Error('Token DROPI no configurado. Manda por WhatsApp: DROPI TOKEN: eyJ...');
}

async function crearOrden(pedido) {
  const token = await getToken();
  const client = makeClient(token);

  // Nombre y apellido
  const partes = (pedido.nombre || '').trim().split(' ');
  const nombre = partes[0] || '';
  const apellido = partes.slice(1).join(' ') || nombre;

  // Provincia
  const ciudadUpper = (pedido.ciudad || '').toUpperCase();
  const state = PROVINCIAS[ciudadUpper] || pedido.ciudad;

  // Saldo a cobrar
  const saldo = parseFloat(String(pedido.saldo).replace(',', '.')) || 0;
  const rateType = saldo > 0 ? 'CON RECAUDO' : 'SIN RECAUDO';

  // Productos
  const productos = [];
  const campos = ['normal', 'picante', 'parejas', 'enganchados', 'dados'];
  for (const campo of campos) {
    const qty = parseInt(pedido[campo]) || 0;
    if (qty > 0) {
      productos.push({
        ...PRODUCTS[campo],
        stock: 999,
        variation_id: null,
        quantity: qty,
        price: saldo,
        suggested_price: '1.00',
        sale_price: '1.00',
        variations: [],
        type: 'SIMPLE',
        user_id: USER_ID
      });
    }
  }

  if (!productos.length) throw new Error('No hay productos válidos para crear la guía');

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
    city: pedido.ciudad,
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

  // Paso 1: crear la orden
  let res;
  try {
    res = await client.post('/orders/myorders', body);
  } catch (e) {
    if (e.response?.status === 401) {
      throw new Error('El token de DROPI expiró. Mandame por WhatsApp: DROPI TOKEN: eyJ...');
    }
    throw new Error(`DROPI error ${e.response?.status}: ${JSON.stringify(e.response?.data)}`);
  }

  const orderData = res.data;
  const orderId = orderData?.id || orderData?.data?.id || orderData?.order?.id;

  if (!orderId) {
    console.log('DROPI create response (sin id):', JSON.stringify(orderData));
    return orderData;
  }

  console.log(`Orden DROPI creada. ID: ${orderId} — generando guía...`);

  // Paso 2: generar la guía (paso separado según la API)
  let guideRes;
  try {
    guideRes = await client.put(`/orders/myorders/${orderId}`, { status: 'GUIA_GENERADA' });
  } catch (e) {
    console.error('Error generando guía:', e.response?.status, JSON.stringify(e.response?.data));
    // La orden existe, pero la guía no se pudo generar aún — devolver lo que hay
    return { ...orderData, _orderId: orderId, _guideError: `${e.response?.status}: ${JSON.stringify(e.response?.data)}` };
  }

  const guideData = guideRes.data;
  console.log('DROPI guide response:', JSON.stringify(guideData));

  // El número de guía viene en el campo sticker
  const sticker =
    guideData?.sticker ||
    guideData?.data?.sticker ||
    guideData?.guide_number ||
    guideData?.data?.guide_number ||
    guideData?.tracking_number ||
    guideData?.data?.tracking_number;

  return { ...guideData, sticker, _orderId: orderId };
}

module.exports = { crearOrden, setToken };

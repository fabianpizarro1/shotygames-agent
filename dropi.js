const axios = require('axios');

const BASE = 'https://api.dropi.ec/api';
const USER_ID = 11362;
const WAREHOUSE_ID = 338;

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
  'PORTOVIEJO': 'Manabí', 'MANTA': 'Manabí', 'CHONE': 'Manabí', 'BAHIA DE CARAQUEZ': 'Manabí', 'PEDERNALES': 'Manabí',
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

let _token = null;
let _tokenExpiry = 0;

function makeClient(token) {
  return axios.create({
    baseURL: BASE,
    headers: {
      'accept': 'application/json, text/plain, */*',
      'content-type': 'application/json',
      'origin': 'https://app.dropi.ec',
      'referer': 'https://app.dropi.ec/',
      'x-authorization': `Bearer ${token}`,
      'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5) AppleWebKit/537.36 Chrome/148.0.0.0 Mobile Safari/537.36'
    }
  });
}

async function getToken() {
  // Usar token manual si está configurado (login automático bloqueado por IP de servidor)
  if (process.env.DROPI_TOKEN) return process.env.DROPI_TOKEN;
  throw new Error('DROPI_TOKEN no configurado. Ve a app.dropi.ec → Network → copia el valor de x-authorization → pégalo en EasyPanel como DROPI_TOKEN y redespliega.');
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
    total_order: saldo,
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
    shipping_amount: 0
  };

  let res;
  try {
    res = await client.post('/orders/myorders', body);
  } catch (e) {
    if (e.response?.status === 401) {
      throw new Error('El token de DROPI expiró. Copia un token nuevo desde el navegador y actualízalo en EasyPanel como DROPI_TOKEN.');
    }
    throw new Error(`DROPI error ${e.response?.status}: ${JSON.stringify(e.response?.data)}`);
  }
  return res.data;
}

module.exports = { crearOrden };

require('dotenv').config();
const axios = require('axios');

const BASE = 'https://api.dropi.ec/api';
const USER_ID = 11362;

async function run() {
  // Login
  console.log('Haciendo login...');
  const loginRes = await axios.post(`${BASE}/login`, {
    email: process.env.DROPI_EMAIL,
    password: process.env.DROPI_PASSWORD,
    white_brand_id: 1
  }, { headers: { 'content-type': 'application/json', 'origin': 'https://app.dropi.ec', 'referer': 'https://app.dropi.ec/login' } });

  const token = loginRes.data?.token;
  console.log('Token obtenido:', token ? 'OK' : 'FALLO');

  const client = axios.create({
    baseURL: BASE,
    headers: {
      'accept': 'application/json, text/plain, */*',
      'content-type': 'application/json',
      'origin': 'https://app.dropi.ec',
      'referer': 'https://app.dropi.ec/',
      'x-authorization': `Bearer ${token}`,
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'sec-fetch-dest': 'empty', 'sec-fetch-mode': 'cors', 'sec-fetch-site': 'same-site'
    }
  });

  const endpoints = [
    `/orders/myorders?page=1&perPage=5&user_id=${USER_ID}`,
    `/orders/myorders?page=1&perPage=5&supplier_id=${USER_ID}`,
    `/orders/myorders?page=1&perPage=5`,
    `/orders/myorders?page=1&perPage=5&search=Darwin&user_id=${USER_ID}`,
    `/orders/myorders?page=1&perPage=5&q=Darwin&user_id=${USER_ID}`,
    `/orders?page=1&perPage=5&user_id=${USER_ID}`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await client.get(ep);
      const data = res.data;
      const orders = data?.objects || data?.data || data?.orders || (Array.isArray(data) ? data : []);
      const keys = Object.keys(data || {});
      console.log(`\nGET ${ep}`);
      console.log(`  → status: ${res.status} | keys: [${keys}] | orders: ${orders.length}`);
      if (orders.length > 0) {
        const o = orders[0];
        console.log(`  → primer pedido: id=${o.id} name="${o.name} ${o.surname}" phone="${o.phone}" guia="${o.shipping_guide}" envio=${o.shipping_amount}`);
      } else {
        console.log(`  → respuesta: ${JSON.stringify(data).slice(0, 300)}`);
      }
    } catch (e) {
      console.log(`\nGET ${ep}`);
      console.log(`  → ERROR ${e.response?.status}: ${JSON.stringify(e.response?.data)?.slice(0, 200)}`);
    }
  }
}

run().catch(e => { console.error('ERROR FATAL:', e.message); process.exit(1); });

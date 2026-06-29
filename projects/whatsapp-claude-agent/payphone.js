const axios = require('axios');

const PAYPHONE_TOKEN = process.env.PAYPHONE_TOKEN;
const PAYPHONE_STORE_ID = process.env.PAYPHONE_STORE_ID;
const BASE_URL = 'https://shotygames-agent-appclaude.hetaxg.easypanel.host';

async function generarLinkPago(monto, descripcion) {
  const amountCentavos = Math.round(monto * 100);
  const clientTransactionId = `SG-${Date.now()}`;

  const response = await axios.post(
    'https://pay.payphonetodoesposible.com/api/button/Appointment',
    {
      amount: amountCentavos,
      amountWithoutTax: amountCentavos,
      tax: 0,
      currency: 'USD',
      clientTransactionId,
      storeId: PAYPHONE_STORE_ID,
      responseUrl: `${BASE_URL}/payphone/response`,
      cancellationUrl: `${BASE_URL}/payphone/cancel`,
      reference: descripcion,
    },
    {
      headers: {
        Authorization: `Bearer ${PAYPHONE_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const url = response.data?.payWithPayPhone;
  if (!url) throw new Error('PayPhone no devolvió URL: ' + JSON.stringify(response.data));

  return { url, transactionId: clientTransactionId };
}

module.exports = { generarLinkPago };

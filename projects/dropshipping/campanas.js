/**
 * Mapeo PRODUCTO (ID DROPI) → campaña(s) de Meta, para la hoja PUBLICIDAD.
 *
 * El Sheet de pedidos no guarda de qué campaña vino cada pedido (no hay
 * fbclid/campaign_id por fila) — por eso el join se hace por ID DROPI, no por
 * el texto de PRODUCTO (que además varía: "Olla Freidora con Canasta" vs
 * "Mini Olla Freidora con Canasta Acero Inoxidable" son el mismo 133468).
 *
 * Cuando un producto tiene más de una campaña activa a la vez (ver Freidora),
 * el gasto/CPM/frecuencia SÍ son exactos por campaña (vienen de Meta), pero
 * pedidos/CPA/ROAS/tasa de compra solo se pueden calcular a nivel de producto
 * — no hay forma de saber cuál campaña generó cuál pedido.
 *
 * Mantener a mano: agregar una fila cuando se lance una campaña nueva, y
 * borrar/mover a un historial cuando se pause una que ya no importa medir.
 * Verificar el estado real con `ads_get_ad_entities` (level: campaign) antes
 * de asumir que algo sigue activo — ESTADO.md puede estar desactualizado.
 */

module.exports = [
  {
    idDropi: '168103',
    tienda: 'avanora',
    producto: 'Drenaje Linfático Aurelys',
    adAccountId: '1284579892343452',
    campañas: [
      { id: '120251984830830787', nombre: 'Sonda CPA' },
    ],
  },
  {
    idDropi: '155190',
    tienda: 'avanora',
    producto: 'Reparador de Esmalte Dental',
    adAccountId: '1284579892343452',
    campañas: [
      { id: '120252312991320787', nombre: 'TEST VIDEOS 31/08' },
    ],
  },
  {
    idDropi: '104158',
    tienda: 'truquito',
    producto: 'Ejercitador Pélvico',
    adAccountId: '28155166654115477',
    campañas: [
      { id: '120259681996790456', nombre: '29/08 TEST' },
    ],
  },
  {
    idDropi: '133468',
    tienda: 'truquito',
    producto: 'Freidora con Canasta',
    adAccountId: '28155166654115477',
    campañas: [
      { id: '120259646554010456', nombre: '28/08 ABO TEST' },
      { id: '120259485872680456', nombre: '18/08 Ventas - Copia' },
    ],
  },
];

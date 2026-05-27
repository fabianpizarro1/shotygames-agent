const tools = [
  {
    name: "registrar_pedido",
    description: "Registra un nuevo pedido de Shotygames en Google Sheets. Úsalo cuando el usuario confirme un pedido con todos los datos del cliente.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Nombre completo del cliente" },
        telefono: { type: "string", description: "Teléfono del cliente (con o sin 0 adelante)" },
        ciudad: { type: "string", description: "Ciudad de destino" },
        direccion: { type: "string", description: "Dirección exacta de entrega" },
        normal: { type: "string", description: "Cantidad de Torres Normales" },
        picante: { type: "string", description: "Cantidad de Torres Picantes" },
        parejas: { type: "string", description: "Cantidad de Torres Parejas" },
        enganchados: { type: "string", description: "Cantidad de Enganchados" },
        dados: { type: "string", description: "Cantidad de Dados Digitales" },
        productos: { type: "string", description: "Descripción de productos ej: 1 NORMAL, 1 PAREJA" },
        anticipo: { type: "string", description: "Monto pagado por anticipado" },
        saldo: { type: "string", description: "Monto pendiente de cobro" },
        cuenta: { type: "string", description: "Banco o método de pago: PICHINCHA, PAYPHONE, etc." },
        estado: { type: "string", description: "PAGADO, PENDIENTE o ANTICIPO" },
        envio: { type: "string", description: "Costo del envío" },
        transportadora: { type: "string", description: "SERVIENTREGA u otra transportadora" },
        notas: { type: "string", description: "Notas adicionales del pedido" }
      },
      required: ["nombre", "telefono", "ciudad", "productos", "anticipo", "cuenta", "estado"]
    }
  },
  {
    name: "buscar_pedido",
    description: "Busca un pedido en Google Sheets por nombre del cliente.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Nombre o parte del nombre del cliente a buscar" }
      },
      required: ["nombre"]
    }
  },
  {
    name: "actualizar_guia",
    description: "Actualiza el número de guía de envío de un pedido en Google Sheets.",
    input_schema: {
      type: "object",
      properties: {
        telefono: { type: "string", description: "Teléfono del cliente para identificar el pedido" },
        guia: { type: "string", description: "Número de guía de envío de Servientrega u otra transportadora" }
      },
      required: ["telefono", "guia"]
    }
  },
  {
    name: "pedidos_hoy",
    description: "Obtiene todos los pedidos registrados hoy en Google Sheets.",
    input_schema: {
      type: "object",
      properties: {}
    }
  }
];

module.exports = tools;

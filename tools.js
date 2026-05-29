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
      required: ["nombre", "telefono", "ciudad", "anticipo", "cuenta", "estado"]
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
    name: "crear_guia_dropi",
    description: "Crea una guía de envío en DROPI con los datos del pedido. Úsalo cuando Fabián pida crear la guía de un pedido.",
    input_schema: {
      type: "object",
      properties: {
        nombre:      { type: "string", description: "Nombre completo del cliente" },
        telefono:    { type: "string", description: "Teléfono del cliente" },
        ciudad:      { type: "string", description: "Ciudad de destino" },
        direccion:   { type: "string", description: "Dirección exacta de entrega" },
        normal:      { type: "string", description: "Cantidad de Torres Normales" },
        picante:     { type: "string", description: "Cantidad de Torres Picantes" },
        parejas:     { type: "string", description: "Cantidad de Torres Parejas" },
        enganchados: { type: "string", description: "Cantidad de Enganchados" },
        dados:       { type: "string", description: "Cantidad de Dados" },
        provincia:   { type: "string", description: "Provincia de Ecuador del destino. Deducirla del conocimiento geográfico si no se indica explícitamente." },
        saldo:       { type: "string", description: "Monto pendiente a cobrar (CON RECAUDO). Vacío o 0 si pagado." },
        pvp_total:   { type: "string", description: "Precio de venta total del pedido. Requerido para SIN RECAUDO." },
        notas:       { type: "string", description: "Notas adicionales" }
      },
      required: ["nombre", "telefono", "ciudad", "direccion"]
    }
  },
  {
    name: "registrar_gasto",
    description: "Registra un gasto en la hoja GASTOS del Sheet de finanzas.",
    input_schema: {
      type: "object",
      properties: {
        categoria: { type: "string", description: "Categoría del gasto (ej: MADERA, PUBLICIDAD, ENVIO, ARRIENDO)" },
        observaciones: { type: "string", description: "Descripción o detalle del gasto" },
        cuenta: { type: "string", description: "Cuenta desde donde se pagó: PICHINCHA, PAYPHONE, EFECTIVO, etc." },
        valor: { type: "string", description: "Monto del gasto" },
        fecha: { type: "string", description: "Fecha del gasto (dd/mm/yyyy). Si no se indica, usa hoy." }
      },
      required: ["valor"]
    }
  },
  {
    name: "registrar_ingreso",
    description: "Registra un ingreso en la hoja INGRESOS del Sheet de finanzas.",
    input_schema: {
      type: "object",
      properties: {
        categoria: { type: "string", description: "Categoría del ingreso (ej: VENTA, DIGITAL, OTRO)" },
        observaciones: { type: "string", description: "Descripción o detalle del ingreso" },
        cuenta: { type: "string", description: "Cuenta donde se recibió: PICHINCHA, PAYPHONE, EFECTIVO, etc." },
        valor: { type: "string", description: "Monto del ingreso" },
        fecha: { type: "string", description: "Fecha del ingreso (dd/mm/yyyy). Si no se indica, usa hoy." }
      },
      required: ["valor"]
    }
  },
  {
    name: "registrar_transferencia",
    description: "Registra una transferencia entre cuentas en la hoja TRANSFERENCIAS del Sheet de finanzas.",
    input_schema: {
      type: "object",
      properties: {
        sale: { type: "string", description: "Cuenta desde donde sale el dinero: PICHINCHA, PAYPHONE, EFECTIVO, etc." },
        entra: { type: "string", description: "Cuenta donde entra el dinero" },
        motivo: { type: "string", description: "Motivo o descripción de la transferencia" },
        valor: { type: "string", description: "Monto de la transferencia" },
        fecha: { type: "string", description: "Fecha (dd/mm/yyyy). Si no se indica, usa hoy." }
      },
      required: ["valor", "sale", "entra"]
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

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
    description: "Actualiza el número de guía y/o costo de envío de un pedido en Google Sheets. Úsalo cuando Fabián diga el número de guía y/o envío de un pedido existente.",
    input_schema: {
      type: "object",
      properties: {
        telefono: { type: "string", description: "Teléfono del cliente para identificar el pedido" },
        guia: { type: "string", description: "Número de guía de envío de Servientrega u otra transportadora" },
        envio: { type: "string", description: "Costo del envío en dólares, ej: 5.50" }
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
    name: "sincronizar_guia_dropi",
    description: "Busca en DROPI la guía y costo de envío de un pedido existente y los actualiza en Google Sheets. Solo necesitas el nombre — el tool busca el teléfono en Sheets y la guía en DROPI automáticamente. Úsalo cuando Fabián diga 'ponle la guía al pedido de X'.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Nombre del cliente (o parte del nombre)" }
      },
      required: ["nombre"]
    }
  },
  {
    name: "pedidos_hoy",
    description: "Obtiene ÚNICAMENTE los pedidos registrados HOY. NO usar para consultas sobre pedidos pendientes, totales o de otras fechas — para eso usar reporte_pedidos.",
    input_schema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "obtener_guia_pedido",
    description: "Busca el número de guía y el link del PDF de envío de un pedido en Sheets. Úsalo cuando Fabián pregunte la guía de un cliente: 'dame la guía de X', 'qué guía tiene X', 'cuál es la guía de X'.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Nombre del cliente (o parte del nombre)" }
      },
      required: ["nombre"]
    }
  },
  {
    name: "notificar_guia_clientes",
    description: "Activa la casilla AB en Sheets para que el sistema envíe automáticamente la notificación de guía por WhatsApp al cliente. Con nombre: marca solo ese pedido. Sin nombre (o 'todos'): marca todos los pedidos de hoy que tengan guía y aún no hayan sido notificados.",
    input_schema: {
      type: "object",
      properties: {
        nombre: {
          type: "string",
          description: "Nombre del cliente. Dejar vacío para notificar a todos los pedidos de hoy con guía."
        }
      },
      required: []
    }
  },
  {
    name: "actualizar_pedido",
    description: "Actualiza uno o más campos de un pedido existente en Google Sheets buscando por nombre del cliente. Úsalo cuando Fabián pida cambiar estado (ENVIADO, ENTREGADO, PENDIENTE), dirección, ciudad, teléfono, notas, transportadora u otros datos de un pedido.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Nombre del cliente (búsqueda fuzzy)" },
        cambios: {
          type: "object",
          description: "Campos a cambiar. Keys válidos: estado, direccion, ciudad, telefono, notas, transportadora, anticipo, saldo, cuenta, envio",
          properties: {
            estado:         { type: "string", description: "Nuevo estado: PENDIENTE, ENVIADO, ENTREGADO" },
            direccion:      { type: "string", description: "Nueva dirección de entrega" },
            ciudad:         { type: "string", description: "Nueva ciudad" },
            telefono:       { type: "string", description: "Nuevo teléfono" },
            notas:          { type: "string", description: "Nuevas notas" },
            transportadora: { type: "string", description: "Nueva transportadora" },
            anticipo:       { type: "string", description: "Nuevo monto de anticipo" },
            saldo:          { type: "string", description: "Nuevo saldo pendiente" },
            cuenta:         { type: "string", description: "Nueva cuenta de pago" },
            envio:          { type: "string", description: "Nuevo costo de envío" }
          }
        }
      },
      required: ["nombre", "cambios"]
    }
  },
  {
    name: "imprimir_guias",
    description: "Descarga los PDFs de todos los pedidos en estado PENDIENTE que aún no han sido impresos, los combina en un PDF con 4 guías por hoja A4 y te lo envía por WhatsApp. Úsalo cuando Fabián diga 'imprime las guías', 'mándame las guías', 'necesito las guías para imprimir', etc. NO necesita ningún parámetro — USA INMEDIATAMENTE sin pedir confirmación.",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "reporte_pedidos",
    description: "Consultas y reportes sobre pedidos de TODAS las fechas (no solo hoy). Lee el historial completo de Sheets. Úsalo cuando Fabián pregunte cuántos pedidos hay pendientes en total, qué productos faltan enviar, resumen general de estados, pedidos enviados, etc.",
    input_schema: {
      type: "object",
      properties: {
        tipo: {
          type: "string",
          description: "Tipo de consulta: PENDIENTES (lista pedidos de un estado), PRODUCTOS_PENDIENTES (suma de unidades por tipo pendientes de envío), RESUMEN (conteo total por estado), POR_ESTADO (pedidos filtrando por estado específico)"
        },
        filtro_estado: {
          type: "string",
          description: "Estado a filtrar. Por defecto: PENDIENTE. Opciones: PENDIENTE, ENVIADO, ENTREGADO"
        }
      },
      required: ["tipo"]
    }
  }
];

module.exports = tools;

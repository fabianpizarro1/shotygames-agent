import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, MessageCircle, Package, Gift } from "lucide-react";

const WHATSAPP_VENTAS = "593993154462";

/**
 * El mensaje lo manda el CLIENTE, no nosotros — mismo patrón que Truquito y
 * Avanora (ver decisions/log.md, cambio de flujo 2026-08-21): sube la tasa de
 * confirmación real porque quien lo escribe de su puño y letra se compromete
 * más a estar pendiente del repartidor. Cada pedido no confirmado/no recibido
 * cuesta el flete de ida en contraentrega.
 */
function construirMensaje(pedido: any): string {
  const nombre = pedido?.nombre?.trim() || "un cliente";
  const producto = pedido?.productoPrincipal || "mi pedido";
  const total = pedido?.total ? `$${Number(pedido.total).toFixed(2)}` : "";
  const provinciaCiudad = [pedido?.provincia, pedido?.ciudad].filter(Boolean).join(", ");
  const calleReferencia = [pedido?.direccion, pedido?.referencias].filter(Boolean).join(" — ");

  const bloques = [
    `¡Hola! Soy *${nombre}*${pedido?.idPedido ? ` y quiero confirmar mi pedido *#${pedido.idPedido}*` : " y quiero confirmar mi pedido"}`,
    `*${producto}*${total ? ` por *${total}*` : ""}`,
    ["Dirección de entrega:", provinciaCiudad, calleReferencia].filter(Boolean).join("\n"),
    "*Confirmo mi pedido y me comprometo a estar pendiente al celular hasta que llegue y recibirlo.*",
    "Muchas gracias",
  ].filter(Boolean);

  return bloques.join("\n\n");
}

export const ConfirmacionContraentrega = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pedido = location.state?.pedido;

  useEffect(() => {
    if (!pedido) {
      navigate("/");
    }
  }, [pedido, navigate]);

  const linkConfirmar = pedido
    ? `https://wa.me/${WHATSAPP_VENTAS}?text=${encodeURIComponent(construirMensaje(pedido))}`
    : "";

  // Redirección automática a WhatsApp con el mensaje ya escrito — mismo
  // patrón que Truquito/Avanora. Navegación en la misma pestaña (no
  // window.open): no la bloquea ningún bloqueador de pop-ups y en móvil abre
  // la app de WhatsApp directo. Retraso corto para que el cliente alcance a
  // leer qué está pasando antes de sacarlo de la pestaña.
  useEffect(() => {
    if (!pedido?.idPedido) return;
    const t = setTimeout(() => {
      window.location.href = linkConfirmar;
    }, 1400);
    return () => clearTimeout(t);
  }, [pedido?.idPedido, linkConfirmar]);

  if (!pedido) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold">
            ¡Ya casi! Falta confirmar 🙌
          </h1>

          <div className="bg-muted/50 rounded-lg p-6 space-y-3">
            <div className="flex items-center justify-center gap-2 text-primary">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Te llevamos a WhatsApp</span>
            </div>

            <p className="text-muted-foreground">
              Falta un último paso: confirmar tu pedido de <strong>{pedido.productoPrincipal}</strong> por WhatsApp para que salga a despacho. Te llevamos allá en un momento…
            </p>
          </div>

          <div className="bg-background rounded-lg p-4 border-2 border-primary/20 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pagas en efectivo al recibir</span>
              <span className="font-semibold">${Number(pedido.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-primary/10 rounded-lg p-4 space-y-2 border-2 border-primary/20">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Gift className="w-5 h-5" />
              <span className="font-semibold">Beneficios de tu compra</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>🚀 Entrega en 2-4 días hábiles</li>
              {pedido.productoPrincipal === "Combo Parejas" ? (
                <>
                  <li>🎁 Guía 30 Posiciones — <strong>incluida</strong></li>
                  <li>🎁 Guía Digital del Placer — <strong>incluida</strong></li>
                  <li>📦 Emparejados y las guías llegan dentro del paquete, en tarjetas con código QR</li>
                </>
              ) : (
                <li>🎁 Regalo incluido: <strong>Guía Digital</strong></li>
              )}
            </ul>
          </div>

          <div className="border-t pt-6 space-y-3">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <Package className="w-5 h-5" />
              <span className="font-medium">Detalles de tu pedido</span>
            </div>

            <div className="bg-background rounded-lg p-4 space-y-3 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 pb-2 border-b">
                <span className="text-muted-foreground">Número de pedido:</span>
                <span className="font-mono font-bold text-primary">{pedido.idPedido}</span>
              </div>

              <div className="space-y-2 pb-3 border-b">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-muted-foreground flex-1">{pedido.productoPrincipal}</span>
                  <span className="font-semibold whitespace-nowrap">${Number(pedido.precioPrincipal).toFixed(2)}</span>
                </div>

                {pedido.upsellTorreNormalSelected && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground flex-1">+ Torre La Previa</span>
                    <span className="whitespace-nowrap">${pedido.upsellTorreNormalPrice.toFixed(2)}</span>
                  </div>
                )}
                {pedido.upsellTorrePicanteSelected && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground flex-1">+ Torre Picante</span>
                    <span className="whitespace-nowrap">${pedido.upsellTorrePicantePrice.toFixed(2)}</span>
                  </div>
                )}
                {pedido.upsellTorreParejasSelected && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground flex-1">+ Torre Parejas</span>
                    <span className="whitespace-nowrap">${pedido.upsellTorreParejasPrice.toFixed(2)}</span>
                  </div>
                )}
                {pedido.upsellEnganchadosSelected && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground flex-1">+ Enganchados</span>
                    <span className="whitespace-nowrap">${pedido.upsellEnganchadosPrice.toFixed(2)}</span>
                  </div>
                )}
                {pedido.upsellEmparejadosSelected && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground flex-1">+ Emparejados (Digital)</span>
                    <span className="whitespace-nowrap">${pedido.upsellEmparejadosPrice.toFixed(2)}</span>
                  </div>
                )}
                {pedido.upsellDadosPlacerSelected && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground flex-1">+ Dados del Placer</span>
                    <span className="whitespace-nowrap">${pedido.upsellDadosPlacerPrice.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-base">Total a pagar:</span>
                <span className="font-bold text-primary text-xl">${Number(pedido.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Importante: si no confirmas por WhatsApp, no podemos despachar tu pedido.
          </p>

          <div className="pt-4 space-y-3">
            <Button asChild variant="whatsapp" size="lg" className="w-full h-auto whitespace-normal py-3.5 leading-snug text-center">
              <a href={linkConfirmar}>
                <MessageCircle className="w-5 h-5 mr-2 shrink-0" />
                Confirmar mi pedido por WhatsApp
              </a>
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Volver al inicio
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmacionContraentrega;

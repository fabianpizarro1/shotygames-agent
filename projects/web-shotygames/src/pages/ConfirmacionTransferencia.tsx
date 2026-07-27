import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, MessageCircle, Package, Zap } from "lucide-react";

export const ConfirmacionTransferencia = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pedido = location.state?.pedido;
  const isDigitalProduct = pedido?.esProductoDigital;
  const isEbook = pedido?.productoPrincipal?.toLowerCase().includes('ebook') || pedido?.productoPrincipal?.toLowerCase().includes('guía digital de 25');
  const hasMultipleItems = !!(
    pedido?.upsellTorreNormalSelected ||
    pedido?.upsellTorrePicanteSelected ||
    pedido?.upsellTorreParejasSelected ||
    pedido?.upsellEnganchadosSelected ||
    pedido?.upsellEmparejadosSelected ||
    pedido?.upsellDadosPlacerSelected ||
    pedido?.productoPrincipal?.toLowerCase().includes('combo') ||
    pedido?.productoPrincipal?.toLowerCase().includes('promo')
  );

  useEffect(() => {
    if (!pedido) {
      navigate("/");
    }
  }, [pedido, navigate]);

  if (!pedido) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold">
            {isDigitalProduct ? '¡Compra confirmada! 🎉' : '¡Pedido recibido! 🎉'}
          </h1>
          
          <div className="bg-primary/10 rounded-lg p-6 space-y-3 border-2 border-primary/20">
            <div className="flex items-center justify-center gap-2 text-primary">
              <MessageCircle className="w-6 h-6" />
              <span className="font-semibold text-lg">Revisa tu WhatsApp</span>
            </div>
            
            <p className="text-foreground font-medium">
              En unos segundos recibirás un mensaje por WhatsApp con:
            </p>
            
            <ul className="text-sm space-y-2 text-left max-w-md mx-auto">
              <li>✅ El resumen completo de tu {isDigitalProduct ? 'compra' : 'pedido'}</li>
              <li>✅ Las cuentas bancarias para hacer el pago</li>
              <li>✅ Instrucciones para enviar el comprobante</li>
              {isDigitalProduct && !isEbook && <li>✅ El acceso a tu juego una vez confirmado el pago</li>}
              {isEbook && <li>✅ El link de descarga del Ebook una vez confirmado el pago</li>}
            </ul>
          </div>

          <div className="bg-primary/10 rounded-lg p-4 space-y-2 border-2 border-primary/20">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Zap className="w-5 h-5" />
              <span className="font-semibold">Beneficios de tu compra</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              {isDigitalProduct ? (
                isEbook ? (
                  <>
                    <li>📄 Producto 100% digital <strong>(PDF)</strong></li>
                    <li>⚡ Descarga <strong>INSTANTÁNEA</strong> una vez confirmado el pago</li>
                    <li>♾️ Tuyo <strong>PARA SIEMPRE</strong></li>
                  </>
                ) : (
                  <>
                    <li>⚡ Acceso <strong>INMEDIATO</strong> una vez confirmado el pago</li>
                    <li>♾️ Acceso <strong>DE POR VIDA</strong> al juego</li>
                    <li>🔄 Actualizaciones <strong>GRATUITAS</strong></li>
                    <li>📱 Juega desde cualquier dispositivo</li>
                  </>
                )
              ) : (
                <>
                  <li>🚀 Envío <strong>PRIORITARIO</strong> en 24 a 48 horas laborables</li>
                  {hasMultipleItems && <li>🎁 Regalo incluido: <strong>Shot BIDU</strong></li>}
                  <li>✨ Prioridad en despacho</li>
                </>
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
                  <span className="font-semibold whitespace-nowrap">${pedido.precioPrincipal.toFixed(2)}</span>
                </div>
                
                {pedido.upsellTorreNormalSelected && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground flex-1">+ Torre Normal</span>
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
                {pedido.upsellEmparejadosDigital && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground flex-1">+ Emparejados (Digital)</span>
                    <span className="whitespace-nowrap">${pedido.upsellEmparejadosDigitalPrice.toFixed(2)}</span>
                  </div>
                )}
                {pedido.upsellDadosDigital && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground flex-1">+ Dados Digitales de Posiciones</span>
                    <span className="whitespace-nowrap">${pedido.upsellDadosDigitalPrice.toFixed(2)}</span>
                  </div>
                )}
                {pedido.upsellGuiaPlacerDigital && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground flex-1">+ Guía Digital del Placer</span>
                    <span className="whitespace-nowrap">${pedido.upsellGuiaPlacerDigitalPrice.toFixed(2)}</span>
                  </div>
                )}
                {pedido.upsellEmparejadosGuia && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground flex-1">+ Emparejados (Digital)</span>
                    <span className="whitespace-nowrap">${pedido.upsellEmparejadosGuiaPrice.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-base">Total a pagar:</span>
                <span className="font-bold text-primary text-xl">${pedido.total.toFixed(2)}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 pt-2 border-t text-xs">
                <span className="text-muted-foreground">Método de pago:</span>
                <span className="font-medium">Transferencia bancaria</span>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Una vez que hagas el pago y envíes el comprobante, procesaremos tu pedido de inmediato.
            </p>
            
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmacionTransferencia;

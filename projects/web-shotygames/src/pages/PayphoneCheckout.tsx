import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, ArrowLeft } from "lucide-react";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const PayphoneCheckout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  
  // Get pedido from readable URL params
  const pedido = useMemo(() => {
    const id = searchParams.get('id');
    const monto = searchParams.get('monto');
    const producto = searchParams.get('producto');
    const nombre = searchParams.get('nombre');
    const telefono = searchParams.get('telefono');
    
    if (id && monto && producto && nombre && telefono) {
      return {
        idPedido: id,
        total: parseFloat(monto),
        productoPrincipal: producto,
        nombre: nombre,
        telefono: telefono
      };
    }
    
    return null;
  }, [searchParams]);

  // Handle back button
  const handleBack = () => {
    navigate(-1);
  };

  // Listen for PayPhone completion message from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PAYPHONE_COMPLETE') {
        const { id, clientTransactionId } = event.data.params;
        // Navigate to confirmation page with PayPhone params
        navigate(`/confirmacion-tarjeta?id=${id}&clientTransactionId=${clientTransactionId}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  useEffect(() => {
    if (!pedido) {
      setError('No se encontraron datos del pedido. Por favor intenta de nuevo desde el inicio.');
      setIsLoading(false);
      return;
    }

    // Get PayPhone credentials and build iframe URL
    const initialize = async () => {
      try {
        const { data, error: fetchError } = await invokeFunction<{ token: string; storeId: string; error?: string }>('payphone-config');
        
        if (fetchError || data?.error) {
          setError('Error al cargar configuración de pago');
          setIsLoading(false);
          return;
        }
        
        // Format phone number for Ecuador
        let phoneNumber = pedido.telefono;
        if (phoneNumber.startsWith('0')) {
          phoneNumber = '+593' + phoneNumber.slice(1);
        } else if (!phoneNumber.startsWith('+')) {
          phoneNumber = '+593' + phoneNumber;
        }
        
        // Amount in cents
        const amountInCents = Math.round(pedido.total * 100);
        
        // Use payphone-success.html as the response URL (inside iframe)
        // This page will send a postMessage to parent window
        const responseUrl = `${window.location.origin}/payphone-success.html`;
        
        const params = new URLSearchParams({
          token: data!.token,
          storeId: data!.storeId,
          clientTransactionId: pedido.idPedido,
          amount: amountInCents.toString(),
          reference: `${pedido.productoPrincipal} - ${pedido.nombre}`,
          phoneNumber: phoneNumber,
          responseUrl: responseUrl
        });
        
        setIframeUrl(`/payphone-frame.html?${params.toString()}`);
        setIsLoading(false);
        
      } catch (err) {
        console.error('Error initializing PayPhone:', err);
        setError('Error al inicializar el sistema de pagos');
        setIsLoading(false);
      }
    };

    initialize();
  }, [pedido]);

  if (!pedido && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-6 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Pago con Tarjeta</h1>
          </div>
        </div>

        {pedido && (
          /* Order Summary */
          <div className="bg-muted/30 rounded-lg p-4 space-y-3 border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pedido:</span>
              <span className="font-mono font-bold">{pedido.idPedido}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{pedido.productoPrincipal}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total:</span>
              <span className="text-primary text-xl">${pedido.total?.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* PayPhone iframe Container */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando formulario de pago...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => navigate('/')}>
              Volver al inicio
            </Button>
          </div>
        ) : iframeUrl ? (
          <iframe
            src={iframeUrl}
            className="w-full min-h-[450px] border-0 rounded-lg"
            title="PayPhone Payment"
          />
        ) : null}

        <p className="text-xs text-center text-muted-foreground">
          Pago seguro procesado por PayPhone. Aceptamos Visa, Mastercard, Diners Club y Discover.
        </p>
      </Card>
    </div>
  );
};

export default PayphoneCheckout;
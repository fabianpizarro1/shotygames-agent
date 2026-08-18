import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import emparejadosPortada from "@/assets/thumbs/emparejados-portada.webp";
import dadosDigitalesPrincipal from "@/assets/thumbs/dados-digitales-principal.webp";
import guiaPlacerPortada from "@/assets/thumbs/guia-placer-portada.webp";
import torreNormalImg from "@/assets/thumbs/torre-normal-brillo.webp";
import torrePicanteImg from "@/assets/thumbs/torre-picante.webp";
import torreParejasImg from "@/assets/thumbs/torre-parejas.webp";
import { Gift, Truck, ShoppingBag, CreditCard, Banknote } from "lucide-react";

interface UpsellConfig {
  id: 'torreNormal' | 'torrePicante' | 'torreParejas' | 'enganchados' | 'emparejados' | 'dadosPlacer';
  name: string;
  price: number;
  image: string;
}

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  productPrice: number;
  productImage: string;
  productId?: 'torreNormal' | 'torrePicante' | 'torreParejas' | 'enganchados' | 'emparejados' | 'dadosDigitales' | 'partyshots' | 'promo-hoy' | 'torres' | 'chuchaqui' | 'previa' | 'ebook-25-juegos' | 'guia-placer' | 'comboParejas';
  upsells?: UpsellConfig[];
  isCombo?: boolean;
  comboIncludes?: string[];
  originalPrice?: number;
  torreSelection?: {
    required: boolean;
    count: number;
  };
  // Antes esto se inferia de `isCombo`, pero eso metia el Shot Bidu de regalo
  // en CUALQUIER combo (ej. Combo Parejas, que no lo promete en ningun lado).
  // Ahora cada landing lo declara a proposito. Los combos de 2+ torres siguen
  // funcionando solos via `torreSelection.count >= 2` (ver mas abajo), esto
  // es solo para combos SIN selector de torres (ej. Chuchaqui, Combo Torres).
  incluyeShotBidu?: boolean;
}

interface FormData {
  nombre: string;
  telefono: string;
  email?: string;
  provincia?: string;
  ciudad?: string;
  direccion?: string;
  referencias?: string;
  metodoPago: "contraentrega" | "transferencia" | "tarjeta";
}

const provincias = [
  "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi", "El Oro", 
  "Esmeraldas", "Galápagos", "Guayas", "Imbabura", "Loja", "Los Ríos", "Manabí",
  "Morona Santiago", "Napo", "Orellana", "Pastaza", "Pichincha", "Santa Elena",
  "Santo Domingo de los Tsáchilas", "Sucumbíos", "Tungurahua", "Zamora Chinchipe"
];

const ciudadesPorProvincia: Record<string, string[]> = {
  "Azuay": ["Cuenca", "Gualaceo", "Paute", "Santa Isabel", "Sigsig", "Girón", "Chordeleg", "San Fernando", "Nabón", "Oña", "Pucará", "Camilo Ponce Enríquez", "Sevilla de Oro", "El Pan", "Guachapala"],
  "Bolívar": ["Guaranda", "San Miguel", "Chillanes", "Chimbo", "Echeandía", "Caluma", "Las Naves"],
  "Cañar": ["Azogues", "Cañar", "La Troncal", "Biblián", "Déleg", "El Tambo", "Suscal"],
  "Carchi": ["Tulcán", "San Gabriel", "Montúfar", "Bolívar", "Espejo", "Mira", "Huaca"],
  "Chimborazo": ["Riobamba", "Alausí", "Guano", "Colta", "Pallatanga", "Penipe", "Cumandá", "Chambo", "Chunchi", "Guamote"],
  "Cotopaxi": ["Latacunga", "La Maná", "Saquisilí", "Pujilí", "Salcedo", "Sigchos", "Pangua"],
  "El Oro": ["Machala", "Huaquillas", "Pasaje", "Santa Rosa", "Piñas", "Arenillas", "Zaruma", "Portovelo", "Atahualpa", "Balsas", "Chilla", "El Guabo", "Marcabelí", "Las Lajas"],
  "Esmeraldas": ["Esmeraldas", "Atacames", "Muisne", "Eloy Alfaro", "Quinindé", "Río Verde", "San Lorenzo"],
  "Galápagos": ["Puerto Baquerizo Moreno", "Puerto Ayora", "Puerto Villamil"],
  "Guayas": ["Guayaquil", "Durán", "Samborondón", "Daule", "Milagro", "Naranjal", "Naranjito", "El Triunfo", "Yaguachi", "Balao", "Balzar", "Colimes", "Palestina", "Pedro Carbo", "Santa Lucía", "Simón Bolívar", "Coronel Marcelino Maridueña", "Lomas de Sargentillo", "Nobol", "General Antonio Elizalde", "Isidro Ayora", "Alfredo Baquerizo Moreno", "Playas", "Salitre"],
  "Imbabura": ["Ibarra", "Otavalo", "Cotacachi", "Atuntaqui", "Pimampiro", "Urcuquí"],
  "Loja": ["Loja", "Catamayo", "Macará", "Cariamanga", "Catacocha", "Celica", "Alamor", "Gonzanamá", "Zapotillo", "Puyango", "Paltas", "Calvas", "Pindal", "Quilanga", "Saraguro", "Sozoranga"],
  "Los Ríos": ["Babahoyo", "Quevedo", "Ventanas", "Vinces", "Baba", "Buena Fe", "Mocache", "Montalvo", "Palenque", "Pueblo Viejo", "Urdaneta", "Valencia"],
  "Manabí": ["Manta", "Portoviejo", "Chone", "Bahía de Caráquez", "Jipijapa", "Montecristi", "El Carmen", "Pedernales", "Calceta", "Tosagua", "Rocafuerte", "Santa Ana", "Sucre", "24 de Mayo", "Paján", "Pichincha", "Flavio Alfaro", "Jama", "Jaramijó", "Junín", "Olmedo", "Puerto López"],
  "Morona Santiago": ["Macas", "Gualaquiza", "Sucúa", "Méndez", "Santiago", "Limón Indanza", "Palora", "San Juan Bosco", "Logroño", "Pablo Sexto", "Huamboya", "Taisha", "Tiwintza"],
  "Napo": ["Tena", "Archidona", "El Chaco", "Quijos", "Carlos Julio Arosemena Tola"],
  "Orellana": ["Francisco de Orellana", "Coca", "La Joya de los Sachas", "Loreto", "Aguarico"],
  "Pastaza": ["Puyo", "Shell", "Mera", "Santa Clara", "Arajuno"],
  "Pichincha": ["Quito", "Cayambe", "Sangolquí", "Machachi", "Tabacundo", "Pedro Moncayo", "Puerto Quito", "San Miguel de los Bancos", "Pedro Vicente Maldonado", "Rumiñahui"],
  "Santa Elena": ["Salinas", "La Libertad", "Santa Elena"],
  "Santo Domingo de los Tsáchilas": ["Santo Domingo"],
  "Sucumbíos": ["Nueva Loja", "Lago Agrio", "Shushufindi", "Cascales", "Cuyabeno", "Gonzalo Pizarro", "Putumayo", "Sucumbíos"],
  "Tungurahua": ["Ambato", "Baños", "Pelileo", "Píllaro", "Patate", "Quero", "Cevallos", "Mocha", "Tisaleo"],
  "Zamora Chinchipe": ["Zamora", "Yantzaza", "Zumbi", "Chinchipe", "El Pangui", "Nangaritza", "Palanda", "Paquisha", "Centinela del Cóndor"]
};

export const CheckoutModal = ({ open, onOpenChange, productName, productPrice, productImage, productId, upsells = [], isCombo = false, comboIncludes = [], originalPrice, torreSelection, incluyeShotBidu: incluyeShotBiduProp = false }: CheckoutModalProps) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedUpsells, setSelectedUpsells] = useState<Record<string, boolean>>({});
  const [selectedProvincia, setSelectedProvincia] = useState("");
  const [selectedTorres, setSelectedTorres] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const metodoPago = watch("metodoPago");
  const isDigitalProduct = productId === 'emparejados' || productId === 'dadosDigitales' || productId === 'ebook-25-juegos' || productId === 'guia-placer';

  // Restore checkout state when coming back from PayPhone
  useEffect(() => {
    if (open) {
      const shouldRestore = localStorage.getItem('restoreCheckout');
      const checkoutContextString = localStorage.getItem('checkoutContext');
      
      if (shouldRestore === 'true' && checkoutContextString) {
        const context = JSON.parse(checkoutContextString);
        
        // Restore form data
        if (context.formData) {
          setValue('nombre', context.formData.nombre || '');
          setValue('telefono', context.formData.telefono || '');
          setValue('email', context.formData.email || '');
          setValue('provincia', context.formData.provincia || '');
          setValue('ciudad', context.formData.ciudad || '');
          setValue('direccion', context.formData.direccion || '');
          setValue('referencias', context.formData.referencias || '');
          setValue('metodoPago', context.formData.metodoPago || 'transferencia');
        }
        
        // Restore upsells
        if (context.selectedUpsells) {
          setSelectedUpsells(context.selectedUpsells);
        }
        
        // Restore torres selection
        if (context.selectedTorres) {
          setSelectedTorres(context.selectedTorres);
        }
        
        // Restore provincia
        if (context.selectedProvincia) {
          setSelectedProvincia(context.selectedProvincia);
        }
        
        // Clear the restore flag
        localStorage.removeItem('restoreCheckout');
      }
    }
  }, [open, setValue]);

  // Handle browser back button to close modal
  useEffect(() => {
    if (open) {
      // Push a state when modal opens
      window.history.pushState({ modalOpen: true }, '');
      
      const handlePopState = () => {
        // Close modal when back button is pressed
        onOpenChange(false);
      };
      
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [open, onOpenChange]);

  const torreOptions = [
    { id: 'torreNormal', name: 'Torre La Previa (para grupos)', image: torreNormalImg },
    { id: 'torrePicante', name: 'Torre Picante (para grupos)', image: torrePicanteImg },
    { id: 'torreParejas', name: 'Torre Parejas', image: torreParejasImg },
  ];

  const getGiftText = () => {
    if (productId === 'torreParejas' || productId === 'emparejados' || productId === 'dadosDigitales') {
      return "Guía Digital de 30 Posiciones";
    }
    return "Guía Digital de 20 Juegos para Fiestas";
  };

  const calculateTotal = () => {
    let total = productPrice;
    // Upsells de productos físicos
    upsells.forEach(upsell => {
      if (selectedUpsells[upsell.id]) {
        total += upsell.price;
      }
    });
    // Upsell especial para dados digitales
    if (productId === 'dadosDigitales' && selectedUpsells['emparejados-digital']) {
      total += 2.90;
    }
    // Upsell especial para emparejados
    if (productId === 'emparejados' && selectedUpsells['dados-digital']) {
      total += 2.90;
    }
    // Upsell Guía Digital del Placer (para emparejados y dados digitales)
    if ((productId === 'emparejados' || productId === 'dadosDigitales') && selectedUpsells['guia-placer-digital']) {
      total += 2.90;
    }
    // Upsell especial para ebook 25 juegos
    if (productId === 'ebook-25-juegos' && selectedUpsells['bingo-navideno']) {
      total += 2.90;
    }
    // Upsell especial para guia-placer
    if (productId === 'guia-placer' && selectedUpsells['emparejados-digital']) {
      total += 2.90;
    }
    return total;
  };

  // El total ya no cambia según método de pago (se quitó el descuento por
  // transferencia). getFinalTotal se mantiene como función porque el resto
  // del componente ya la usa en varios puntos, pero ahora es un passthrough.
  const getFinalTotal = (_metodo?: string) => calculateTotal();

  // "Pago mixto" (antes "contraentrega" a secas): historial real de 2025
  // mostró 22.4% de fallo en contraentrega 100% libre vs 2.9% en pagos
  // anticipados (ver decisions/log.md). La reserva filtra a quien pide sin
  // intención real, sin ser una barrera grande para el que sí quiere comprar.
  // Solo aplica a productos físicos — los digitales no tienen contraentrega.
  const RESERVA_MIXTO = 5;
  const getSaldoMixto = () => +(calculateTotal() - RESERVA_MIXTO).toFixed(2);

  const handleTorreSelection = (torreId: string) => {
    if (!torreSelection) return;
    
    setSelectedTorres(prev => {
      if (prev.includes(torreId)) {
        return prev.filter(id => id !== torreId);
      } else {
        if (prev.length >= torreSelection.count) {
          // Si ya tiene el máximo, reemplazar el primero
          return [...prev.slice(1), torreId];
        }
        return [...prev, torreId];
      }
    });
  };

  const onSubmit = async (data: FormData) => {
    // Prevenir doble click
    if (isSubmitting) return;
    
    // Validar selección de torres si es requerido
    if (torreSelection?.required && selectedTorres.length !== torreSelection.count) {
      toast({
        title: "Selección incompleta",
        description: `Por favor selecciona ${torreSelection.count} torres para continuar.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    // Generar ID único con formato PED-XXXXX (5 dígitos aleatorios)
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const idPedido = `PED-${randomDigits}`;
    
    // Método de pago: usa el seleccionado por el usuario
    // El fallback tiene que coincidir con el defaultValue del RadioGroup que se
    // muestra: si no, quien deja el default sin tocarlo termina en el flujo
    // equivocado. Digitales no tienen contraentrega.
    const metodoPagoFinal = data.metodoPago || "transferencia";
    
    let pedido: any;
    
    if (isDigitalProduct) {
      // Pedido simplificado para productos digitales
      pedido = {
        idPedido,
        productoPrincipal: productName,
        precioPrincipal: productPrice,
        // Upsell de Emparejados para Dados Digitales
        upsellEmparejadosDigital: productId === 'dadosDigitales' ? (selectedUpsells['emparejados-digital'] || false) : false,
        upsellEmparejadosDigitalPrice: selectedUpsells['emparejados-digital'] ? 2.90 : 0,
        // Upsell de Dados Digitales para Emparejados
        upsellDadosDigital: productId === 'emparejados' ? (selectedUpsells['dados-digital'] || false) : false,
        upsellDadosDigitalPrice: selectedUpsells['dados-digital'] ? 2.90 : 0,
        // Upsell de Bingo Navideño para Ebook 25 Juegos
        upsellBingoNavideno: productId === 'ebook-25-juegos' ? (selectedUpsells['bingo-navideno'] || false) : false,
        upsellBingoNavidenoPrice: selectedUpsells['bingo-navideno'] ? 2.90 : 0,
        // Upsell de Emparejados para Guía del Placer
        upsellEmparejadosGuia: productId === 'guia-placer' ? (selectedUpsells['emparejados-digital'] || false) : false,
        upsellEmparejadosGuiaPrice: productId === 'guia-placer' && selectedUpsells['emparejados-digital'] ? 2.90 : 0,
        // Upsell de Guía Digital del Placer (para Emparejados y Dados Digitales)
        upsellGuiaPlacerDigital: (productId === 'emparejados' || productId === 'dadosDigitales') ? (selectedUpsells['guia-placer-digital'] || false) : false,
        upsellGuiaPlacerDigitalPrice: (productId === 'emparejados' || productId === 'dadosDigitales') && selectedUpsells['guia-placer-digital'] ? 2.90 : 0,
        total: calculateTotal(),
        nombre: data.nombre,
        telefono: data.telefono,
        email: data.email,
        metodoPago: metodoPagoFinal,
        esProductoDigital: true,
        fechaHoraPedido: new Date().toISOString()
      };
    } else {
      // Crear objeto con todos los campos de upsells (siempre presentes)
      const upsellTorreNormal = upsells.find(u => u.id === 'torreNormal');
      const upsellTorrePicante = upsells.find(u => u.id === 'torrePicante');
      const upsellTorreParejas = upsells.find(u => u.id === 'torreParejas');
      const upsellEnganchados = upsells.find(u => u.id === 'enganchados');
      const upsellEmparejados = upsells.find(u => u.id === 'emparejados');
      const upsellDadosPlacer = upsells.find(u => u.id === 'dadosPlacer');
      
      pedido = {
        idPedido,
        productoPrincipal: productName,
        precioPrincipal: productPrice,
        // Torres seleccionadas del combo (si aplica)
        torresSeleccionadas: torreSelection?.required ? selectedTorres.join(', ') : '',
        // El Shot Bidu solo va con combos que lo prometen a proposito
        // (declarado por la landing con `incluyeShotBidu`) o con 2+ torres
        // seleccionadas — NO con cualquier `isCombo` (Combo Parejas es un
        // combo real y no lo incluye).
        // Boolean(...) a propósito: sin esto, cuando torreSelection es
        // undefined el `&&` corta en `undefined` (no en `false`) y
        // JSON.stringify BORRA la key completa del payload en vez de mandar
        // `false` — bug preexistente que dejaba el campo ausente en el
        // webhook de cualquier producto sin combo ni selector de torres.
        incluyeShotBidu: Boolean(incluyeShotBiduProp || (torreSelection?.required && (torreSelection?.count ?? 0) >= 2)),
        // Campos de upsells (siempre presentes en el webhook)
        upsellTorreNormalSelected: selectedUpsells['torreNormal'] || false,
        upsellTorreNormalPrice: upsellTorreNormal?.price || 0,
        upsellTorrePicanteSelected: selectedUpsells['torrePicante'] || false,
        upsellTorrePicantePrice: upsellTorrePicante?.price || 0,
        upsellTorreParejasSelected: selectedUpsells['torreParejas'] || false,
        upsellTorreParejasPrice: upsellTorreParejas?.price || 0,
        upsellEnganchadosSelected: selectedUpsells['enganchados'] || false,
        upsellEnganchadosPrice: upsellEnganchados?.price || 0,
        upsellEmparejadosSelected: selectedUpsells['emparejados'] || false,
        upsellEmparejadosPrice: upsellEmparejados?.price || 0,
        upsellDadosPlacerSelected: selectedUpsells['dadosPlacer'] || false,
        upsellDadosPlacerPrice: upsellDadosPlacer?.price || 0,
        total: calculateTotal(),
        // Pago mixto: se reserva un monto fijo (coordinado por WhatsApp) y el
        // resto se cobra en efectivo al recibir. Solo aplica a contraentrega.
        // Mismos nombres de campo que usa el Sheet (ANTICIPO/SALDO) para que
        // n8n los pueda mapear directo sin renombrar nada.
        anticipo: metodoPagoFinal === 'contraentrega' ? RESERVA_MIXTO : 0,
        saldo: metodoPagoFinal === 'contraentrega' ? getSaldoMixto() : 0,
        nombre: data.nombre,
        telefono: data.telefono,
        provincia: data.provincia,
        ciudad: data.ciudad,
        direccion: data.direccion,
        referencias: data.referencias,
        metodoPago: metodoPagoFinal,
        esProductoDigital: false,
        fechaHoraPedido: new Date().toISOString()
      };
    }

    try {
      // Enviar webhook a n8n
      const webhookUrl = "https://shotygames-n8n.hetaxg.easypanel.host/webhook/shotygames/pedido-web";
      
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pedido),
      });

      // Meta Pixel - Lead + Purchase
      // Decisión explícita de Fabián (2026-08-04): disparar Purchase al
      // completar el pedido en la web, sin esperar confirmación de pago real.
      // Esto es más simple (no requiere backend/CAPI) pero mete señal falsa:
      // ~20-22% de los pedidos de pago mixto no se cobran al final (ver
      // decisions/log.md). Si más adelante se arma el envío por Conversions
      // API cuando se llena GUIA en Sheets, hay que quitar este Purchase de
      // acá para no duplicar la conversión — o reusar el mismo eventID
      // (idPedido) para que Meta deduplique entre pixel y CAPI.
      if (typeof (window as any).fbq !== 'undefined') {
        (window as any).fbq('track', 'Lead', {
          value: getFinalTotal(metodoPagoFinal),
          currency: 'USD',
          content_name: productName,
          content_type: 'product'
        });
        (window as any).fbq('track', 'Purchase', {
          value: getFinalTotal(metodoPagoFinal),
          currency: 'USD',
          content_name: productName,
          content_type: 'product'
        }, { eventID: idPedido });
      }

      // Redirigir según método de pago
      if (metodoPagoFinal === "contraentrega") {
        navigate("/confirmacion-contraentrega", { state: { pedido } });
      } else if (metodoPagoFinal === "transferencia") {
        navigate("/confirmacion-transferencia", { state: { pedido } });
      } else if (metodoPagoFinal === "tarjeta") {
        // Para pago con tarjeta, ir a confirmación
        // El link de pago de PayPhone ya fue enviado en el webhook
        navigate("/confirmacion-tarjeta", { state: { pedido } });
      }
    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu pedido. Por favor intenta de nuevo.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-y-auto">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
            Completa tu pedido
          </DialogTitle>
        </DialogHeader>

        {/* Resumen del pedido */}
        <div className="bg-muted/30 rounded-lg p-5 border-2 border-primary/10">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src={productImage} 
              alt={productName} 
              className="w-20 h-20 object-cover rounded-lg border-2 border-primary/20"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{productName}</h3>
              <div className="flex items-center gap-2">
                {originalPrice && (
                  <p className="text-lg text-muted-foreground line-through">${originalPrice.toFixed(2)}</p>
                )}
                <p className="text-2xl font-bold text-primary">${productPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          {/* Beneficios del pedido */}
          {isCombo ? (
            <div className="bg-background/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-bold text-primary mb-2">Incluye:</p>
              {comboIncludes.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                    <ShoppingBag className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          ) : !isDigitalProduct ? (
            <div className="bg-background/50 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-full p-1.5">
                  <Truck className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-semibold">Entrega en 2-4 días</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-full p-1.5">
                  <Gift className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <span className="text-sm font-semibold">Regalo: {getGiftText()}</span>
              </div>
            </div>
          ) : productId === 'ebook-25-juegos' || productId === 'guia-placer' ? (
            <div className="bg-background/50 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-full p-1.5">
                  <Gift className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <span className="text-sm font-semibold">Producto 100% digital (PDF)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-full p-1.5">
                  <Gift className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <span className="text-sm font-semibold">Descarga instantánea</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-full p-1.5">
                  <Gift className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <span className="text-sm font-semibold">{productId === 'ebook-25-juegos' ? 'Perfecto para Navidad 🎄' : 'Tuyo para siempre ❤️'}</span>
              </div>
            </div>
          ) : (
            <div className="bg-background/50 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-full p-1.5">
                  <Gift className="w-4 h-4 text-primary animate-pulse" />
                </div>
                {/* La entrega no es automática: el acceso se manda por WhatsApp
                    apenas se confirma el pago. No prometer "inmediato". */}
                <span className="text-sm font-semibold">Recibes el acceso apenas confirmamos tu pago</span>
              </div>
              {productId === 'emparejados' && (
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-1.5">
                    <Gift className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <span className="text-sm font-semibold">Regalo: Guía digital de 30 posiciones por hoy</span>
                </div>
              )}
              {productId === 'dadosDigitales' && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-1.5">
                      <Gift className="w-4 h-4 text-primary animate-pulse" />
                    </div>
                    <span className="text-sm font-semibold">🎁 Regalo: Dados Digitales de Acciones</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-1.5">
                      <Gift className="w-4 h-4 text-primary animate-pulse" />
                    </div>
                    <span className="text-sm font-semibold">🎁 Regalo: Guía Digital de 30 Posiciones (PDF)</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Selector de Torres - Solo para combos con torres a elección */}
        {torreSelection?.required && (
          <div className="bg-muted/30 rounded-lg p-5 border-2 border-primary/10 space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">Elige tus {torreSelection.count} Torres</h3>
              <p className="text-sm text-muted-foreground">
                Seleccionadas: {selectedTorres.length}/{torreSelection.count}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {torreOptions.map((torre) => (
                <div
                  key={torre.id}
                  onClick={() => handleTorreSelection(torre.id)}
                  className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                    selectedTorres.includes(torre.id)
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-square rounded-md overflow-hidden mb-2">
                    <img 
                      src={torre.image} 
                      alt={torre.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-medium text-center">{torre.name}</p>
                  {selectedTorres.includes(torre.id) && (
                    <div className="flex items-center justify-center mt-2">
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-muted-foreground -mt-2">
          Ingresa tus datos para realizar el pedido 📦
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campo oculto registrado a mano: el RadioGroup de método de pago
              solo llama setValue() en onValueChange, RHF no lo "ve" como
              obligatorio si no está registrado. Sin esto, el submit pasaba
              igual aunque nadie hubiera elegido nada. Solo es obligatorio en
              productos físicos — los digitales no tienen contraentrega y ya
              vienen con un método preseleccionado en su propio RadioGroup. */}
          <input
            type="hidden"
            {...register("metodoPago", {
              required: !isDigitalProduct ? "Selecciona un método de pago" : false,
            })}
          />

          {/* Datos personales */}
          <div className="space-y-5 sm:space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input
                id="nombre"
                placeholder="Nombre y apellido"
                autoComplete="name"
                inputMode="text"
                enterKeyHint="next"
                {...register("nombre", { required: "El nombre es requerido" })}
              />
              {errors.nombre && (
                <p className="text-sm text-destructive mt-1">{errors.nombre.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono (con WhatsApp)</Label>
              <Input
                id="telefono"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                enterKeyHint="next"
                placeholder="0991234567"
                {...register("telefono", {
                  required: "El teléfono es requerido",
                  pattern: {
                    value: /^[0-9]{9,10}$/,
                    message: "Debe tener 9 o 10 dígitos"
                  }
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                A este número te llegará la confirmación por WhatsApp.
              </p>
              {errors.telefono && (
                <p className="text-sm text-destructive mt-1">{errors.telefono.message}</p>
              )}
            </div>

            {isDigitalProduct && (
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  enterKeyHint="done"
                  placeholder="tu@email.com"
                  {...register("email", {
                    required: "El email es requerido",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email inválido"
                    }
                  })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {productId === 'guia-placer' || productId === 'ebook-25-juegos'
                    ? 'A este correo te enviaremos el enlace de descarga.'
                    : 'Este correo será tu usuario para entrar al juego. El acceso te llega por WhatsApp.'}
                </p>
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>
            )}

            {!isDigitalProduct && (
              <>
                <div>
                  <Label htmlFor="provincia">Provincia</Label>
              <Select
                onValueChange={(value) => {
                  setValue("provincia", value);
                  setSelectedProvincia(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu provincia" />
                </SelectTrigger>
                <SelectContent>
                  {provincias.map((prov) => (
                    <SelectItem key={prov} value={prov}>
                      {prov}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.provincia && (
                <p className="text-sm text-destructive mt-1">{errors.provincia.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                placeholder="Ingresa tu ciudad"
                autoComplete="address-level2"
                inputMode="text"
                enterKeyHint="next"
                {...register("ciudad", { required: "La ciudad es requerida" })}
              />
              {errors.ciudad && (
                <p className="text-sm text-destructive mt-1">{errors.ciudad.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="direccion">Dirección completa</Label>
              <Textarea
                id="direccion"
                placeholder="Calle principal, calle secundaria, barrio, zona, piso, número de casa…"
                autoComplete="street-address"
                inputMode="text"
                enterKeyHint="next"
                {...register("direccion", { required: "La dirección es requerida" })}
              />
              {errors.direccion && (
                <p className="text-sm text-destructive mt-1">{errors.direccion.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="referencias">Referencias de la dirección</Label>
              <Textarea
                id="referencias"
                placeholder="Color de la casa, cerca de qué, al lado de qué local, esquina, etc."
                inputMode="text"
                enterKeyHint="done"
                {...register("referencias", { required: "Las referencias son requeridas" })}
              />
              {errors.referencias && (
                <p className="text-sm text-destructive mt-1">{errors.referencias.message}</p>
              )}
            </div>
              </>
            )}
          </div>

          {/* Upsell para Dados Digitales - Emparejados */}
          {productId === 'dadosDigitales' && (
            <>
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Mejora tu pedido 🛒</h3>
                
                <Label htmlFor="upsell-emparejados-digital" className={`flex items-center gap-3 border-2 rounded-lg p-4 transition-all cursor-pointer mb-0 ${
                  selectedUpsells['emparejados-digital']
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}>
                  <Checkbox
                    id="upsell-emparejados-digital"
                    checked={selectedUpsells['emparejados-digital'] || false}
                    onCheckedChange={(checked) =>
                      setSelectedUpsells(prev => ({ ...prev, 'emparejados-digital': checked as boolean }))
                    }
                  />
                  <img
                    src={emparejadosPortada}
                    alt="Emparejados"
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                  <span className="flex-1 font-normal">
                    Agregar <strong>EMPAREJADOS (72 cartas para parejas)</strong> por solo <strong className="text-primary">$2,90</strong> adicionales.
                  </span>
                </Label>

                <Label htmlFor="upsell-guia-placer-dados" className={`flex items-center gap-3 border-2 rounded-lg p-4 transition-all cursor-pointer mb-0 ${
                  selectedUpsells['guia-placer-digital']
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}>
                  <Checkbox
                    id="upsell-guia-placer-dados"
                    checked={selectedUpsells['guia-placer-digital'] || false}
                    onCheckedChange={(checked) =>
                      setSelectedUpsells(prev => ({ ...prev, 'guia-placer-digital': checked as boolean }))
                    }
                  />
                  <img
                    src={guiaPlacerPortada}
                    alt="Guía Digital del Placer"
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                  <span className="flex-1 font-normal">
                    Agregar <strong>Guía Digital del Placer</strong> (guía completa para recuperar la chispa y salir de la rutina) por solo <strong className="text-primary">$2,90</strong> adicionales.
                  </span>
                </Label>
              </div>

              {/* Resumen del pedido para Dados Digitales */}
              <div className="bg-muted/50 rounded-lg p-5 border-2 border-primary/20 space-y-3">
                <h4 className="font-semibold text-base mb-3">Resumen de tu pedido</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{productName}</span>
                    <span className="font-semibold">${productPrice.toFixed(2)}</span>
                  </div>
                  
                  {selectedUpsells['emparejados-digital'] && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">+ Emparejados (Digital)</span>
                      <span className="font-semibold">$2.90</span>
                    </div>
                  )}
                  {selectedUpsells['guia-placer-digital'] && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">+ Guía Digital del Placer</span>
                      <span className="font-semibold">$2.90</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total a pagar:</span>
                    <span className="text-2xl font-bold text-primary">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Método de pago - Para Dados Digitales */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-lg font-semibold">Elige cómo quieres pagar:</Label>
                <RadioGroup
                  onValueChange={(value) => setValue("metodoPago", value as any)}
                  defaultValue="transferencia"
                  className="space-y-3"
                >
                  <Label htmlFor="transferencia-dados" className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer mb-0">
                  <RadioGroupItem value="transferencia" id="transferencia-dados" className="mt-1" />
                  <div className="flex-1">
                    <span className="font-semibold flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Transferencia bancaria
                      </span>
                    <p className="text-sm text-muted-foreground mt-1">
                        Acceso inmediato tras confirmar el pago
                      </p>
                  </div>
                </Label>
                  
                  <Label htmlFor="tarjeta-dados" className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer mb-0">
                  <RadioGroupItem value="tarjeta" id="tarjeta-dados" className="mt-1" />
                  <div className="flex-1">
                    <span className="font-semibold flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Pagar con tarjeta
                      </span>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pago seguro con tarjeta de crédito o débito a través de PayPhone
                      </p>
                  </div>
                </Label>
                </RadioGroup>
              </div>
            </>
          )}

          {/* Upsell para Emparejados - Dados Digitales */}
          {productId === 'emparejados' && (
            <>
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Mejora tu pedido 🛒</h3>
                
                <Label htmlFor="upsell-dados-digital" className={`flex items-center gap-3 border-2 rounded-lg p-4 transition-all cursor-pointer mb-0 ${
                  selectedUpsells['dados-digital']
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}>
                  <Checkbox
                    id="upsell-dados-digital"
                    checked={selectedUpsells['dados-digital'] || false}
                    onCheckedChange={(checked) =>
                      setSelectedUpsells(prev => ({ ...prev, 'dados-digital': checked as boolean }))
                    }
                  />
                  <img
                    src={dadosDigitalesPrincipal}
                    alt="Dados Digitales de Posiciones"
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                  <span className="flex-1 font-normal">
                    <span className="block font-semibold text-foreground">
                      Agregar Dados Digitales <span className="text-primary">+$2,90</span>
                    </span>
                    <span className="block text-sm text-muted-foreground mt-0.5">
                      Posiciones y acciones — 8.942 combinaciones.
                    </span>
                  </span>
                </Label>

                <Label htmlFor="upsell-guia-placer-emparejados" className={`flex items-center gap-3 border-2 rounded-lg p-4 transition-all cursor-pointer mb-0 ${
                  selectedUpsells['guia-placer-digital']
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}>
                  <Checkbox
                    id="upsell-guia-placer-emparejados"
                    checked={selectedUpsells['guia-placer-digital'] || false}
                    onCheckedChange={(checked) =>
                      setSelectedUpsells(prev => ({ ...prev, 'guia-placer-digital': checked as boolean }))
                    }
                  />
                  <img
                    src={guiaPlacerPortada}
                    alt="Guía Digital del Placer"
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                  <span className="flex-1 font-normal">
                    <span className="block font-semibold text-foreground">
                      [EBOOK] Guía Digital del Placer <span className="text-primary">+$2,90</span>
                    </span>
                    <span className="block text-sm text-muted-foreground mt-0.5">
                      Para recuperar la chispa y salir de la rutina.
                    </span>
                  </span>
                </Label>
              </div>
              <div className="bg-muted/50 rounded-lg p-5 border-2 border-primary/20 space-y-3">
                <h4 className="font-semibold text-base mb-3">Resumen de tu pedido</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{productName}</span>
                    <span className="font-semibold">${productPrice.toFixed(2)}</span>
                  </div>

                  {/* El regalo prometido en la landing tiene que verse acá, si no
                      el cliente cree que le están cobrando lo que le ofrecieron gratis */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">+ PDF imprimible de las 72 cartas</span>
                    <span className="font-semibold text-primary">GRATIS</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">+ Guía de 30 Posiciones</span>
                    <span className="font-semibold text-primary">GRATIS</span>
                  </div>

                  {selectedUpsells['dados-digital'] && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">+ Dados Digitales</span>
                      <span className="font-semibold">$2.90</span>
                    </div>
                  )}
                  {selectedUpsells['guia-placer-digital'] && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">+ [EBOOK] Guía Digital del Placer</span>
                      <span className="font-semibold">$2.90</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total a pagar:</span>
                    <span className="text-2xl font-bold text-primary">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Método de pago - Para productos digitales */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-lg font-semibold">Elige cómo quieres pagar:</Label>
                <RadioGroup
                  onValueChange={(value) => setValue("metodoPago", value as any)}
                  defaultValue="transferencia"
                  className="space-y-3"
                >
                  <Label htmlFor="transferencia-digital" className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer mb-0">
                  <RadioGroupItem value="transferencia" id="transferencia-digital" className="mt-1" />
                  <div className="flex-1">
                    <span className="font-semibold flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Transferencia bancaria
                      </span>
                    <p className="text-sm text-muted-foreground mt-1">
                        Acceso inmediato tras confirmar el pago
                      </p>
                  </div>
                </Label>
                  
                  <Label htmlFor="tarjeta-digital" className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer mb-0">
                  <RadioGroupItem value="tarjeta" id="tarjeta-digital" className="mt-1" />
                  <div className="flex-1">
                    <span className="font-semibold flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Pagar con tarjeta
                      </span>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pago seguro con tarjeta de crédito o débito a través de PayPhone
                      </p>
                  </div>
                </Label>
                </RadioGroup>
              </div>
            </>
          )}

          {/* Checkout para guia-placer con upsell Emparejados */}
          {productId === 'guia-placer' && (
            <>
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Mejora tu pedido 🛒</h3>
                
                <Label htmlFor="upsell-emparejados-guia" className={`flex items-center gap-3 border-2 rounded-lg p-4 transition-all cursor-pointer mb-0 ${
                  selectedUpsells['emparejados-digital']
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}>
                  <Checkbox
                    id="upsell-emparejados-guia"
                    checked={selectedUpsells['emparejados-digital'] || false}
                    onCheckedChange={(checked) =>
                      setSelectedUpsells(prev => ({ ...prev, 'emparejados-digital': checked as boolean }))
                    }
                  />
                  <img
                    src={emparejadosPortada}
                    alt="Emparejados"
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                  <span className="flex-1 font-normal">
                    Agregar <strong>Emparejados (72 cartas para parejas)</strong> por solo <strong className="text-primary">$2,90</strong> adicionales.
                  </span>
                </Label>
              </div>

              <div className="bg-muted/50 rounded-lg p-5 border-2 border-primary/20 space-y-3">
                <h4 className="font-semibold text-base mb-3">Resumen de tu pedido</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{productName}</span>
                    <span className="font-semibold">${productPrice.toFixed(2)}</span>
                  </div>
                  
                  {selectedUpsells['emparejados-digital'] && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">+ Emparejados</span>
                      <span className="font-semibold">$2.90</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total a pagar:</span>
                    <span className="text-2xl font-bold text-primary">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="text-lg font-semibold">Elige cómo quieres pagar:</Label>
                <RadioGroup
                  onValueChange={(value) => setValue("metodoPago", value as any)}
                  defaultValue="transferencia"
                  className="space-y-3"
                >
                  <Label htmlFor="transferencia-guia" className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer mb-0">
                  <RadioGroupItem value="transferencia" id="transferencia-guia" className="mt-1" />
                  <div className="flex-1">
                    <span className="font-semibold flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Transferencia bancaria
                      </span>
                    <p className="text-sm text-muted-foreground mt-1">
                        Acceso inmediato tras confirmar el pago
                      </p>
                  </div>
                </Label>
                  
                  <Label htmlFor="tarjeta-guia" className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer mb-0">
                  <RadioGroupItem value="tarjeta" id="tarjeta-guia" className="mt-1" />
                  <div className="flex-1">
                    <span className="font-semibold flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Pagar con tarjeta
                      </span>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pago seguro con tarjeta de crédito o débito a través de PayPhone
                      </p>
                  </div>
                </Label>
                </RadioGroup>
              </div>
            </>
          )}

          {/* Checkout para Ebook 25 Juegos */}
          {productId === 'ebook-25-juegos' && (
            <>
              <div className="bg-muted/50 rounded-lg p-5 border-2 border-primary/20 space-y-3">
                <h4 className="font-semibold text-base mb-3">Resumen de tu pedido</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{productName}</span>
                    <span className="font-semibold">${productPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total a pagar:</span>
                    <span className="text-2xl font-bold text-primary">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="text-lg font-semibold">Elige cómo quieres pagar:</Label>
                <RadioGroup
                  onValueChange={(value) => setValue("metodoPago", value as any)}
                  defaultValue="transferencia"
                  className="space-y-3"
                >
                  <Label htmlFor="transferencia-ebook" className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer mb-0">
                  <RadioGroupItem value="transferencia" id="transferencia-ebook" className="mt-1" />
                  <div className="flex-1">
                    <span className="font-semibold flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Transferencia bancaria
                      </span>
                    <p className="text-sm text-muted-foreground mt-1">
                        Acceso inmediato tras confirmar el pago
                      </p>
                  </div>
                </Label>
                  
                  <Label htmlFor="tarjeta-ebook" className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer mb-0">
                  <RadioGroupItem value="tarjeta" id="tarjeta-ebook" className="mt-1" />
                  <div className="flex-1">
                    <span className="font-semibold flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Pagar con tarjeta
                      </span>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pago seguro con tarjeta de crédito o débito a través de PayPhone
                      </p>
                  </div>
                </Label>
                </RadioGroup>
              </div>
            </>
          )}

          {/* Upsells - Solo para productos físicos */}
          {!isDigitalProduct && upsells.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Mejora tu pedido 🛒</h3>
              
              {upsells.map((upsell) => (
                <Label
                  key={upsell.id}
                  htmlFor={`upsell-${upsell.id}`}
                  className={`flex items-center gap-3 border rounded-lg p-4 transition-colors cursor-pointer mb-0 ${
                    selectedUpsells[upsell.id] ? 'border-primary bg-primary/5' : 'hover:border-primary'
                  }`}
                >
                  <Checkbox
                    id={`upsell-${upsell.id}`}
                    checked={selectedUpsells[upsell.id] || false}
                    onCheckedChange={(checked) =>
                      setSelectedUpsells(prev => ({ ...prev, [upsell.id]: checked as boolean }))
                    }
                  />
                  <img
                    src={upsell.image}
                    alt={upsell.name}
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                  <span className="flex-1 font-normal">
                    Agregar <strong>{upsell.name}</strong> por solo <strong className="text-primary">${upsell.price}</strong> adicionales.
                  </span>
                </Label>
              ))}
            </div>
          )}

          {/* Resumen del pedido - Solo para productos físicos con upsells */}
          {!isDigitalProduct && (
            <div className="bg-muted/50 rounded-lg p-5 border-2 border-primary/20 space-y-3">
              <h4 className="font-semibold text-base mb-3">Resumen de tu pedido</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{productName}</span>
                  <span className="font-semibold">${productPrice.toFixed(2)}</span>
                </div>
                
                {upsells.map((upsell) => (
                  selectedUpsells[upsell.id] && (
                    <div key={upsell.id} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">+ {upsell.name}</span>
                      <span className="font-semibold">${upsell.price.toFixed(2)}</span>
                    </div>
                  )
                ))}
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  <span className="font-semibold text-primary">INCLUIDO</span>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total a pagar:</span>
                  <span className="text-2xl font-bold text-primary">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
                {metodoPago === 'contraentrega' && (
                  <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-dashed">
                    <span className="text-muted-foreground">
                      Reserva ahora ${RESERVA_MIXTO.toFixed(2)} + ${getSaldoMixto().toFixed(2)} en efectivo al recibir
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Método de pago - Solo para productos físicos y combos */}
          {!isDigitalProduct && (
            <div className="space-y-4 border-t pt-4">
              <Label className="text-lg font-semibold">Elige cómo quieres pagar:</Label>
              <RadioGroup
                onValueChange={(value) => setValue("metodoPago", value as any, { shouldValidate: true })}
                className="space-y-3"
              >
                <Label htmlFor="contraentrega" className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer mb-0">
                  <RadioGroupItem value="contraentrega" id="contraentrega" className="mt-1" />
                  <div className="flex-1">
                    <span className="font-semibold flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Pago mixto
                      <Badge variant="secondary" className="text-[10px] px-2 py-0">RESERVA ${RESERVA_MIXTO}</Badge>
                    </span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reservas tu pedido con ${RESERVA_MIXTO} y pagas el resto en efectivo cuando lo recibes.
                      Te coordinamos la reserva por WhatsApp.
                    </p>
                    {/* Solo Combo Parejas: acá lo digital NO se manda por
                        WhatsApp, viaja dentro del paquete en tarjetas QR —
                        hay que dejarlo claro en el momento en que se elige el
                        método de pago, no solo en la landing. */}
                    {productId === 'comboParejas' && (
                      <p className="text-xs text-muted-foreground/80 mt-2 flex items-start gap-1.5">
                        <span aria-hidden>📦</span>
                        Emparejados y las 2 guías digitales te llegan dentro del paquete, en tarjetas con código QR.
                      </p>
                    )}
                  </div>
                </Label>

                <Label htmlFor="transferencia" className="flex items-start space-x-3 border-2 border-green-500/40 bg-green-500/5 rounded-lg p-4 hover:border-green-500 transition-colors cursor-pointer mb-0">
                  <RadioGroupItem value="transferencia" id="transferencia" className="mt-1" />
                  <div className="flex-1">
                    <span className="font-semibold flex items-center gap-2">
                      <Truck className="w-4 h-4 text-green-600" />
                      Pago anticipado por transferencia/depósito
                      <Badge className="bg-green-600 text-white text-[10px] px-2 py-0">ENVÍO PRIORITARIO</Badge>
                    </span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pagas antes del envío y tu pedido sale primero: te llega en 24-48 horas laborables.
                    </p>
                    {productId === 'comboParejas' && (
                      <p className="text-xs font-semibold text-green-700 mt-2 flex items-start gap-1.5">
                        <span aria-hidden>⚡</span>
                        Emparejados y las 2 guías digitales te llegan por WhatsApp de inmediato, sin esperar el paquete.
                      </p>
                    )}
                  </div>
                </Label>

                <Label htmlFor="tarjeta" className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer mb-0">
                  <RadioGroupItem value="tarjeta" id="tarjeta" className="mt-1" />
                  <div className="flex-1">
                    <span className="font-semibold flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Pagar con tarjeta
                    </span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pago seguro con tarjeta de crédito o débito a través de PayPhone
                    </p>
                    {productId === 'comboParejas' && (
                      <p className="text-xs font-semibold text-primary mt-2 flex items-start gap-1.5">
                        <span aria-hidden>⚡</span>
                        Emparejados y las 2 guías digitales te llegan por WhatsApp de inmediato, sin esperar el paquete.
                      </p>
                    )}
                  </div>
                </Label>
              </RadioGroup>
              {errors.metodoPago && (
                <p className="text-sm text-destructive">{errors.metodoPago.message}</p>
              )}
            </div>
          )}

          {/* Botón de confirmación */}
          <Button 
            type="submit" 
            size="lg" 
            className="w-full text-lg py-6 gradient-party"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando pedido...
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5 mr-2" />
                {isDigitalProduct ? 'Realizar compra' : 'Realizar Pedido'}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

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
import { supabase } from "@/integrations/supabase/client";
import emparejadosPortada from "@/assets/emparejados-portada.jpg";
import dadosDigitalesPrincipal from "@/assets/dados-digitales-principal.webp";
import guiaPlacerPortada from "@/assets/guia-placer-portada.webp";
import torreNormalImg from "@/assets/torre-normal.jpg";
import torrePicanteImg from "@/assets/torre-picante.jpg";
import torreParejasImg from "@/assets/torre-parejas.jpg";
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
  productId?: 'torreNormal' | 'torrePicante' | 'torreParejas' | 'enganchados' | 'emparejados' | 'dadosDigitales' | 'partyshots' | 'promo-hoy' | 'torres' | 'chuchaqui' | 'previa' | 'ebook-25-juegos' | 'guia-placer';
  upsells?: UpsellConfig[];
  isCombo?: boolean;
  comboIncludes?: string[];
  originalPrice?: number;
  torreSelection?: {
    required: boolean;
    count: number;
  };
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

export const CheckoutModal = ({ open, onOpenChange, productName, productPrice, productImage, productId, upsells = [], isCombo = false, comboIncludes = [], originalPrice, torreSelection }: CheckoutModalProps) => {
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
    { id: 'torreNormal', name: 'Torre Normal', image: torreNormalImg },
    { id: 'torrePicante', name: 'Torre Picante', image: torrePicanteImg },
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
      total += 0.90;
    }
    // Upsell especial para emparejados
    if (productId === 'emparejados' && selectedUpsells['dados-digital']) {
      total += 0.90;
    }
    // Upsell Guía Digital del Placer (para emparejados y dados digitales)
    if ((productId === 'emparejados' || productId === 'dadosDigitales') && selectedUpsells['guia-placer-digital']) {
      total += 0.90;
    }
    // Upsell especial para ebook 25 juegos
    if (productId === 'ebook-25-juegos' && selectedUpsells['bingo-navideno']) {
      total += 2.90;
    }
    // Upsell especial para guia-placer
    if (productId === 'guia-placer' && selectedUpsells['emparejados-digital']) {
      total += 3.90;
    }
    return total;
  };

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
        upsellEmparejadosDigitalPrice: selectedUpsells['emparejados-digital'] ? 0.90 : 0,
        // Upsell de Dados Digitales para Emparejados
        upsellDadosDigital: productId === 'emparejados' ? (selectedUpsells['dados-digital'] || false) : false,
        upsellDadosDigitalPrice: selectedUpsells['dados-digital'] ? 0.90 : 0,
        // Upsell de Bingo Navideño para Ebook 25 Juegos
        upsellBingoNavideno: productId === 'ebook-25-juegos' ? (selectedUpsells['bingo-navideno'] || false) : false,
        upsellBingoNavidenoPrice: selectedUpsells['bingo-navideno'] ? 2.90 : 0,
        // Upsell de Emparejados para Guía del Placer
        upsellEmparejadosGuia: productId === 'guia-placer' ? (selectedUpsells['emparejados-digital'] || false) : false,
        upsellEmparejadosGuiaPrice: productId === 'guia-placer' && selectedUpsells['emparejados-digital'] ? 3.90 : 0,
        // Upsell de Guía Digital del Placer (para Emparejados y Dados Digitales)
        upsellGuiaPlacerDigital: (productId === 'emparejados' || productId === 'dadosDigitales') ? (selectedUpsells['guia-placer-digital'] || false) : false,
        upsellGuiaPlacerDigitalPrice: (productId === 'emparejados' || productId === 'dadosDigitales') && selectedUpsells['guia-placer-digital'] ? 0.90 : 0,
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

      // Meta Pixel - Purchase event
      if (typeof (window as any).fbq !== 'undefined') {
        (window as any).fbq('track', 'Purchase', {
          value: calculateTotal(),
          currency: 'USD',
          content_name: productName,
          content_type: 'product'
        });
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
                <span className="text-sm font-semibold">Acceso inmediato al juego digital</span>
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
                  {productId === 'guia-placer' || productId === 'ebook-25-juegos' ? 'A este correo te enviaremos el enlace de descarga.' : 'A este correo te enviaremos el acceso al juego.'}
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
                
                <div className={`flex items-center gap-3 border-2 rounded-lg p-4 transition-all ${
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
                  <Label htmlFor="upsell-emparejados-digital" className="cursor-pointer flex-1">
                    Agregar <strong>EMPAREJADOS (juego de cartas digital para Parejas)</strong> por solo <strong className="text-primary">$0,90</strong> adicionales.
                  </Label>
                </div>

                <div className={`flex items-center gap-3 border-2 rounded-lg p-4 transition-all ${
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
                  <Label htmlFor="upsell-guia-placer-dados" className="cursor-pointer flex-1">
                    Agregar <strong>Guía Digital del Placer</strong> por solo <strong className="text-primary">$0,90</strong> adicionales.
                  </Label>
                </div>
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
                      <span className="font-semibold">$0.90</span>
                    </div>
                  )}
                  {selectedUpsells['guia-placer-digital'] && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">+ Guía Digital del Placer</span>
                      <span className="font-semibold">$0.90</span>
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
                  <div className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors">
                    <RadioGroupItem value="transferencia" id="transferencia-dados" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="transferencia-dados" className="font-semibold cursor-pointer flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Transferencia bancaria
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Acceso inmediato tras confirmar el pago
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors">
                    <RadioGroupItem value="tarjeta" id="tarjeta-dados" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="tarjeta-dados" className="font-semibold cursor-pointer flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Pagar con tarjeta
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pago seguro con tarjeta de crédito o débito a través de PayPhone
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          {/* Upsell para Emparejados - Dados Digitales */}
          {productId === 'emparejados' && (
            <>
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Mejora tu pedido 🛒</h3>
                
                <div className={`flex items-center gap-3 border-2 rounded-lg p-4 transition-all ${
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
                  <Label htmlFor="upsell-dados-digital" className="cursor-pointer flex-1">
                    Agregar <strong>Dados Digitales de Posiciones</strong> por solo <strong className="text-primary">$0,90</strong> adicionales.
                  </Label>
                </div>

                <div className={`flex items-center gap-3 border-2 rounded-lg p-4 transition-all ${
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
                  <Label htmlFor="upsell-guia-placer-emparejados" className="cursor-pointer flex-1">
                    Agregar <strong>Guía Digital del Placer</strong> por solo <strong className="text-primary">$0,90</strong> adicionales.
                  </Label>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-5 border-2 border-primary/20 space-y-3">
                <h4 className="font-semibold text-base mb-3">Resumen de tu pedido</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{productName}</span>
                    <span className="font-semibold">${productPrice.toFixed(2)}</span>
                  </div>
                  
                  {selectedUpsells['dados-digital'] && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">+ Dados Digitales de Posiciones</span>
                      <span className="font-semibold">$0.90</span>
                    </div>
                  )}
                  {selectedUpsells['guia-placer-digital'] && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">+ Guía Digital del Placer</span>
                      <span className="font-semibold">$0.90</span>
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
                  <div className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors">
                    <RadioGroupItem value="transferencia" id="transferencia-digital" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="transferencia-digital" className="font-semibold cursor-pointer flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Transferencia bancaria
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Acceso inmediato tras confirmar el pago
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors">
                    <RadioGroupItem value="tarjeta" id="tarjeta-digital" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="tarjeta-digital" className="font-semibold cursor-pointer flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Pagar con tarjeta
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pago seguro con tarjeta de crédito o débito a través de PayPhone
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          {/* Checkout para guia-placer con upsell Emparejados */}
          {productId === 'guia-placer' && (
            <>
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Mejora tu pedido 🛒</h3>
                
                <div className={`flex items-center gap-3 border-2 rounded-lg p-4 transition-all ${
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
                  <Label htmlFor="upsell-emparejados-guia" className="cursor-pointer flex-1">
                    Agregar <strong>Emparejados</strong> por solo <strong className="text-primary">$3,90</strong>
                  </Label>
                </div>
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
                      <span className="font-semibold">$3.90</span>
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
                  <div className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors">
                    <RadioGroupItem value="transferencia" id="transferencia-guia" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="transferencia-guia" className="font-semibold cursor-pointer flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Transferencia bancaria
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Acceso inmediato tras confirmar el pago
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors">
                    <RadioGroupItem value="tarjeta" id="tarjeta-guia" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="tarjeta-guia" className="font-semibold cursor-pointer flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Pagar con tarjeta
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pago seguro con tarjeta de crédito o débito a través de PayPhone
                      </p>
                    </div>
                  </div>
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
                  <div className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors">
                    <RadioGroupItem value="transferencia" id="transferencia-ebook" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="transferencia-ebook" className="font-semibold cursor-pointer flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Transferencia bancaria
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Acceso inmediato tras confirmar el pago
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors">
                    <RadioGroupItem value="tarjeta" id="tarjeta-ebook" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="tarjeta-ebook" className="font-semibold cursor-pointer flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Pagar con tarjeta
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pago seguro con tarjeta de crédito o débito a través de PayPhone
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          {/* Upsells - Solo para productos físicos */}
          {!isDigitalProduct && upsells.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Mejora tu pedido 🛒</h3>
              
              {upsells.map((upsell) => (
                <div key={upsell.id} className="flex items-center gap-3 border rounded-lg p-4 hover:border-primary transition-colors">
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
                  <Label htmlFor={`upsell-${upsell.id}`} className="cursor-pointer flex-1">
                    Agregar <strong>{upsell.name}</strong> por solo <strong className="text-primary">${upsell.price}</strong> adicionales.
                  </Label>
                </div>
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
                  <span className="text-2xl font-bold text-primary">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Método de pago - Solo para productos físicos y combos */}
          {!isDigitalProduct && (
            <div className="space-y-4 border-t pt-4">
              <Label className="text-lg font-semibold">Elige cómo quieres pagar:</Label>
              <RadioGroup
                onValueChange={(value) => setValue("metodoPago", value as any)}
                defaultValue="transferencia"
                className="space-y-3"
              >
                {/* Contraentrega: el backend y /confirmacion-contraentrega ya existían,
                    pero no había opción para elegirlo. Va primero porque es la que
                    menos fricción tiene en tráfico frío (no piden tarjeta por adelantado). */}
                <div className="flex items-start space-x-3 border-2 border-green-500/40 bg-green-500/5 rounded-lg p-4 hover:border-green-500 transition-colors">
                  <RadioGroupItem value="contraentrega" id="contraentrega" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="contraentrega" className="font-semibold cursor-pointer flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-green-600" />
                      Pago contraentrega
                      <Badge className="bg-green-600 text-white text-[10px] px-2 py-0">SIN RIESGO</Badge>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pagas en efectivo cuando recibes el paquete. No necesitas tarjeta.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors">
                  <RadioGroupItem value="transferencia" id="transferencia" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="transferencia" className="font-semibold cursor-pointer flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Transferencia bancaria
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Envío prioritario en 24-48 horas laborables
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary transition-colors">
                  <RadioGroupItem value="tarjeta" id="tarjeta" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="tarjeta" className="font-semibold cursor-pointer flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Pagar con tarjeta
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pago seguro con tarjeta de crédito o débito a través de PayPhone
                    </p>
                  </div>
                </div>
              </RadioGroup>
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

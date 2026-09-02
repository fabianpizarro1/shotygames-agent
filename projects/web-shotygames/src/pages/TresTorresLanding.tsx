import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ShoppingCart, Star, Gift, Truck, Clock, Users, Heart, Zap,
  CheckCircle2, MessageCircle, Package, Grid3x3, Lock, Banknote,
} from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";
import { LazyCheckoutModal as CheckoutModal } from "@/components/LazyCheckoutModal";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

// OJO: no usar combo-torres.webp — esa imagen tiene impreso "$45" (precio
// viejo, el actual es $49). Se usan fotos sin precio impreso para evitar
// contradicciones si el precio vuelve a cambiar.
import torreNormalBrillo from "@/assets/torre-normal-brillo.webp";
import torreNormalImg from "@/assets/torre-normal.jpg";
import torrePicanteImg from "@/assets/torre-picante.jpg";

// Fotos reales del producto: bloques en mano con los retos legibles.
// Convierten mucho mejor que los creativos de marketing.
import torreNormal2 from "@/assets/torre-normal-2.webp";
import torreNormal3 from "@/assets/torre-normal-3.webp";
import torreNormal4 from "@/assets/torre-normal-4.webp";
import torreNormal5 from "@/assets/torre-normal-5.webp";
import torreNormal6 from "@/assets/torre-normal-6.webp";
import torreNormal7 from "@/assets/torre-normal-7.webp";
import torreNormal8 from "@/assets/torre-normal-8.webp";
import torreNormal9 from "@/assets/torre-normal-9.webp";
import torreNormal10 from "@/assets/torre-normal-10.webp";

import torrePicante1 from "@/assets/torre-picante-1.webp";
import torrePicante2 from "@/assets/torre-picante-2.webp";
import torrePicante3 from "@/assets/torre-picante-3.webp";
import torrePicante4 from "@/assets/torre-picante-4.webp";
import torrePicante5 from "@/assets/torre-picante-5.webp";
import torrePicante6 from "@/assets/torre-picante-6.webp";
import torrePicante7 from "@/assets/torre-picante-7.webp";
import torrePicante8 from "@/assets/torre-picante-8.webp";
import torrePicante9 from "@/assets/torre-picante-9.webp";
import torrePicante10 from "@/assets/torre-picante-10.webp";

import torreParejasImg from "@/assets/torre-parejas.jpg";
import torreParejas1 from "@/assets/torre-parejas-1.webp";
import torreParejas2 from "@/assets/torre-parejas-2.webp";
import torreParejas3 from "@/assets/torre-parejas-3.webp";
import torreParejas4 from "@/assets/torre-parejas-4.webp";
import torreParejas5 from "@/assets/torre-parejas-5.webp";
import torreParejas6 from "@/assets/torre-parejas-6.webp";
import torreParejas7 from "@/assets/torre-parejas-7.webp";
import torreParejas8 from "@/assets/torre-parejas-8.webp";
import torreParejas9 from "@/assets/torre-parejas-9.webp";
import torreParejas10 from "@/assets/torre-parejas-10.webp";
import torreParejas11 from "@/assets/torre-parejas-11.webp";

import ebook30Posiciones from "@/assets/ebook-30-posiciones.webp";
import dadosDelPlacerImg from "@/assets/dados-del-placer.webp";
import emparejadosPortada from "@/assets/emparejados-portada.jpg";
import dadosDelPlacerImgThumb from "@/assets/thumbs/dados-del-placer.webp";
import emparejadosPortadaThumb from "@/assets/thumbs/emparejados-portada.webp";

/** Planes de compra. El de 3 torres es el que se empuja. */
type PlanId = "una" | "dos" | "tres";

interface Plan {
  id: PlanId;
  nombre: string;
  precio: number;
  precioAntes?: number;
  ahorro?: number;
  productId: "torreNormal" | "torres" | "chuchaqui";
  destacado?: boolean;
  etiqueta?: string;
  incluye: string[];
  cta: string;
  torreSelection?: { required: boolean; count: number };
  isCombo?: boolean;
  incluyeShotBidu?: boolean;
  comboIncludes?: string[];
  imagen: string;
  microcopy?: string;
}

// Orden de negocio (2026-07-27): se empuja el plan de 2 torres como
// "Recomendado" — antes era el de 3 ("Más elegido"). En móvil las tarjetas
// se reordenan con CSS (order-*) sin tocar este array; en escritorio se
// mantiene el orden natural 1/2/3.
const PLANES: Plan[] = [
  {
    id: "una",
    nombre: "Una Torre",
    precio: 29.99,
    productId: "torreNormal",
    imagen: torreNormalImg,
    etiqueta: "OPCIÓN INDIVIDUAL",
    torreSelection: { required: true, count: 1 },
    incluye: [
      "La torre que elijas",
      "51 bloques con retos",
      "1 vaso tequilero",
      "Guía digital: 20 juegos para fiestas",
    ],
    cta: "ELEGIR MI TORRE",
  },
  {
    id: "dos",
    nombre: "Dos Torres",
    precio: 39,
    precioAntes: 59.98,
    ahorro: 20.98,
    productId: "torres",
    imagen: torreNormalBrillo,
    destacado: true,
    etiqueta: "RECOMENDADO",
    torreSelection: { required: true, count: 2 },
    incluye: [
      "2 torres a elección (puedes repetir)",
      "2 vasos tequileros",
      "Guía digital: 20 juegos para fiestas",
      "Guía digital: 30 posiciones",
      "1 Shot Bidu de regalo",
    ],
    cta: "ELEGIR MIS 2 TORRES",
    microcopy: "El más pedido. Ahorras $20.98 sobre el precio individual.",
  },
  {
    id: "tres",
    nombre: "Las Tres Torres",
    precio: 49,
    precioAntes: 89.97,
    ahorro: 40.97,
    productId: "chuchaqui",
    imagen: torreNormalBrillo,
    etiqueta: "PACK COMPLETO",
    isCombo: true,
    incluyeShotBidu: true,
    comboIncludes: [
      "Torre La Previa",
      "Torre de Shots Picante",
      "Torre de Shots Parejas",
      "3 vasos tequileros",
      "Guía digital: 20 juegos para fiestas",
      "Guía digital: 30 posiciones",
      "1 Shot Bidu",
    ],
    incluye: [
      "La Previa + Picante + Parejas",
      "3 vasos tequileros",
      "Guía digital: 20 juegos para fiestas",
      "Guía digital: 30 posiciones",
      "1 Shot Bidu de regalo",
      "Lista para cualquier plan: amigos, previa o pareja",
    ],
    cta: "LAS QUIERO LAS 3",
    microcopy: "El pack completo. Te sale a $16 por torre.",
  },
];

/** Las 3 torres, con retos reales.
 * "La Previa" es el nombre nuevo de lo que era Torre Normal (2026-07-27).
 * Ojo: el Combo "La Previa" ya existe con ese nombre en otras landings —
 * Fabián confirmó que los combos se van a renombrar después para no chocar. */
const TORRES = [
  {
    id: "normal",
    nombre: "La Previa",
    emoji: "🎉",
    para: "Grupos, amigos, cualquier reunión",
    vibra: "Divertida · Rompe el hielo · Apta para todos",
    descripcion:
      "El clásico. Funciona con los amigos de toda la vida y con los que recién conociste.",
    imagen: torreNormalImg,
    galeria: [
      torreNormalImg, torreNormal2, torreNormal3, torreNormal4, torreNormal5,
      torreNormal6, torreNormal7, torreNormal8, torreNormal9, torreNormal10,
    ],
    color: "#ff7b00",
    retos: [
      "LLAMA A TU EX",
      "TOMA EL MÁS CACHUD@",
      "ESCRÍBELE A TU CRUSH",
      "TOMA 1 SHOT POR CADA VEZ QUE TE PUSIERON LOS CACHOS",
      "ESCRÍBELES A TUS PADRES Y DILES QUE SERÁN ABUELOS",
      "SUBE UNA HISTORIA Y PON QUE EXTRAÑAS A TU EX",
    ],
    censurados: 0,
  },
  {
    id: "picante",
    nombre: "Torre Picante",
    emoji: "🌶️",
    para: "Grupos con confianza, gente sin vergüenza",
    vibra: "Atrevida · Sube la temperatura del grupo",
    descripcion:
      "Cuando el grupo ya se conoce y nadie se va a hacer el tímido.",
    imagen: torrePicanteImg,
    galeria: [
      torrePicanteImg, torrePicante1, torrePicante2, torrePicante3, torrePicante4,
      torrePicante5, torrePicante6, torrePicante7, torrePicante8, torrePicante9, torrePicante10,
    ],
    color: "#ff3d00",
    // Retos tomados de la propia imagen del producto (torre-picante.jpg)
    retos: [
      "FINGE UN ORGASMO",
      "BESO DE 3",
      "SÁCATE UNA PRENDA",
      "MUESTRA TU ROPA INTERIOR",
      "TOMAN LOS QUE HAYAN MANDADO NUDES",
      "DALE UN PICO AL JUGADOR QUE QUIERAS",
    ],
    censurados: 0,
    extra: "…y 45 retos más que prefieres descubrir en la mesa.",
  },
  {
    id: "parejas",
    nombre: "Torre Parejas",
    emoji: "💘",
    para: "Ustedes dos, en casa",
    vibra: "+18 · Sube de nivel rápido",
    descripcion:
      'Para cuando "¿y qué hacemos hoy?" ya no tiene respuesta.',
    // Decisión de Fabián (2026-07-27): sin censura por ahora. Antes se filtraban
    // fotos con retos explícitos por riesgo en Meta Ads — revertido a pedido
    // suyo, revisar más adelante si Meta rechaza anuncios.
    imagen: torreParejasImg,
    galeria: [
      torreParejasImg, torreParejas1, torreParejas2, torreParejas3, torreParejas4,
      torreParejas5, torreParejas6, torreParejas7, torreParejas8, torreParejas9,
      torreParejas10, torreParejas11,
    ],
    color: "#e11d48",
    retos: [
      "HAZLE UN MASAJE POR 2 MINUTOS",
      "DILE ALGO SEXY AL OÍDO",
      "TOMA UN SHOT EN SU OMBLIGO",
      "HAZ UN BAILE SEXY",
      "DI TU FANTASÍA SEXUAL",
    ],
    censurados: 0,
  },
];

const FAQS = [
  {
    q: "¿De verdad pago cuando me llega?",
    a: "Sí. Haces el pedido con tus datos, te llega el paquete a tu casa y pagas en efectivo al recibirlo. No necesitas tarjeta ni transferencia.",
  },
  {
    q: "¿Cuánto se demora en llegar?",
    a: "Despachamos desde Machala a todo Ecuador. Si pides antes de las 15:00, tu pedido sale el mismo día. Después de las 15:00 sale al siguiente día hábil. Normalmente llega en 2 a 4 días según tu ciudad.",
  },
  {
    q: "¿Puedo pedir dos torres iguales?",
    a: "Sí. Si quieres dos Picantes o dos Parejas, no hay problema. Eliges la combinación que quieras.",
  },
  {
    q: "¿Cómo me llegan las guías digitales?",
    a: "Dentro de la misma caja, en tarjetas con código QR. Escaneas y las descargas al toque, sin costo extra.",
  },
  {
    q: "¿Qué diferencia hay entre las tres torres?",
    a: "La Previa tiene retos divertidos para cualquier grupo. La Picante sube el nivel con retos atrevidos, ideal para gente con confianza. La de Parejas es +18 y está pensada solo para dos.",
  },
  {
    q: "¿El envío tiene costo?",
    a: "No. El envío va incluido en el precio a todo Ecuador, tanto en torres individuales como en los combos.",
  },
  {
    q: "¿Se puede jugar sin alcohol?",
    a: "Claro. Muchos retos no involucran tomar, y los que sí se pueden cambiar por una penitencia. El juego funciona igual de bien.",
  },
  {
    q: "¿Cuántas personas pueden jugar?",
    a: "La Previa y la Picante funcionan desde 3 personas en adelante, sin límite. La de Parejas está diseñada para dos.",
  },
];

/** Tarjeta de una torre: galería + retos. Se usa en pestañas (móvil) y grid (escritorio). */
const TorreCard = ({ torre }: { torre: (typeof TORRES)[number] }) => (
  <Card className="overflow-hidden border-2 flex flex-col hover:shadow-2xl transition-all">
    {/* Galería propia: fotos reales con los retos legibles */}
    <div className="relative bg-muted">
      <Carousel opts={{ align: "center", loop: true }} className="w-full">
        <CarouselContent>
          {torre.galeria.map((foto, i) => (
            <CarouselItem key={i}>
              <div className="aspect-square overflow-hidden">
                <img
                  src={foto}
                  alt={`${torre.nombre} — foto ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 h-9 w-9" />
        <CarouselNext className="right-2 h-9 w-9" />
      </Carousel>
      <Badge className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white border-none text-[11px] px-2 py-0.5 pointer-events-none">
        📸 {torre.galeria.length} fotos reales
      </Badge>
    </div>

    <div className="p-5 md:p-6 flex flex-col flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{torre.emoji}</span>
        <h3 className="text-xl md:text-2xl font-bold">{torre.nombre}</h3>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: torre.color }}>
        {torre.vibra}
      </p>

      <p className="text-sm md:text-base text-muted-foreground mb-2">
        <span className="font-semibold text-foreground">Para: </span>
        {torre.para}
      </p>
      <p className="text-sm md:text-base text-muted-foreground mb-5">{torre.descripcion}</p>

      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
        Retos que te van a tocar
      </p>
      <ul className="space-y-2 mb-4">
        {torre.retos.map((reto) => (
          <li
            key={reto}
            className="text-xs md:text-sm font-semibold bg-muted/70 rounded-lg px-3 py-2 border"
          >
            {reto}
          </li>
        ))}
      </ul>

      {torre.extra && <p className="text-sm text-muted-foreground italic mb-4">{torre.extra}</p>}

      {torre.censurados > 0 && (
        <div className="relative rounded-xl border-2 border-dashed p-4 mb-4 overflow-hidden">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3 z-10">
            <Lock className="w-5 h-5 mb-2" style={{ color: torre.color }} />
            <p className="text-xs md:text-sm font-bold">
              Hay {torre.censurados} retos que no podemos mostrarte aquí
            </p>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-1">
              Instagram no nos deja. Pero vienen en la caja 😏
            </p>
          </div>
          <div className="blur-sm select-none opacity-40 space-y-2" aria-hidden="true">
            <p className="text-xs font-semibold bg-muted rounded px-2 py-1">████████ ███ ██████</p>
            <p className="text-xs font-semibold bg-muted rounded px-2 py-1">███████ ██ ████████</p>
            <p className="text-xs font-semibold bg-muted rounded px-2 py-1">██████████ ███ ███</p>
          </div>
        </div>
      )}

      <div className="mt-auto pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Incluye 51 bloques · 1 vaso tequilero · instrucciones · guía digital de 20 juegos
        </p>
      </div>
    </div>
  </Card>
);

const TresTorresLanding = () => {
  const navigate = useNavigate();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [planActivo, setPlanActivo] = useState<Plan>(PLANES[2]);
  const [torreActiva, setTorreActiva] = useState<string>("normal");
  const { shouldOpenCheckout, setShouldOpenCheckout } = useCheckoutRestore();

  useEffect(() => {
    if (shouldOpenCheckout) {
      setCheckoutOpen(true);
      setShouldOpenCheckout(false);
    }
  }, [shouldOpenCheckout, setShouldOpenCheckout]);

  useEffect(() => {
    if (typeof (window as any).fbq !== "undefined") {
      (window as any).fbq("track", "ViewContent", {
        content_name: "Las 3 Torres de Shots",
        content_category: "Juegos de Mesa",
        value: 49,
        currency: "USD",
      });
    }
  }, []);

  const abrirCheckout = (plan: Plan) => {
    setPlanActivo(plan);
    if (typeof (window as any).fbq !== "undefined") {
      (window as any).fbq("track", "InitiateCheckout", {
        content_name: plan.nombre,
        content_category: "Juegos de Mesa",
        value: plan.precio,
        currency: "USD",
      });
    }
    setCheckoutOpen(true);
  };

  const irAOferta = () => {
    document.getElementById("oferta")?.scrollIntoView({ behavior: "smooth" });
  };

  const carrusel = [
    { src: torreNormalBrillo, badge: "La Previa 🎉", alt: "Torre La Previa con sus retos" },
    { src: torreNormal2, badge: "Reto Real 🔥", alt: "Reto: llama a tu ex" },
    { src: torrePicanteImg, badge: "Torre Picante 🌶️", alt: "Torre de Shots Picante con sus retos" },
    { src: torrePicante6, badge: "Reto Real 😈", alt: "Reto: besa apasionadamente 30 segundos" },
    { src: torreParejasImg, badge: "Torre Parejas 💘", alt: "Torre de Shots Parejas con sus retos" },
    { src: torreParejas3, badge: "Reto Real 🔥", alt: "Reto: juegas en ropa interior 3 rondas" },
    { src: torreNormal7, badge: "Reto Real 🍊", alt: "Reto: toma el más mandarina" },
    { src: torrePicante3, badge: "Reto Real 🌶️", alt: "Reto atrevido de la torre picante" },
    { src: torreParejas5, badge: "Reto Real 💘", alt: "Reto de la torre parejas" },
    { src: torreNormal5, badge: "Reto Real 😈", alt: "Reto: toma el más cachudo" },
    { src: torreNormal9, badge: "Reto Real 📱", alt: "Reto: muestra tu último mensaje" },
    { src: torrePicante8, badge: "Reto Real 🔥", alt: "Reto de la torre picante" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Seo
        title="Las 3 Torres de Shots | Desde $29.99 con Envío Gratis | ShotyGames Ecuador"
        description="La Previa, Picante y Parejas. 51 retos en cada una. Llévate las 3 por $49 con envío gratis a todo Ecuador."
        canonical="https://www.shotygames.com/landing/3-torres"
        type="product"
      />

      {/* ══ Barra superior fija ══ */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] text-white py-2 md:py-3 px-4 text-center font-semibold shadow-lg">
        <p className="text-xs md:text-base">
          🚚 Envío GRATIS a todo Ecuador · Pagas cuando lo recibes
        </p>
      </div>
      <div className="h-10 md:h-14" />

      {/* ══ 1 · HERO ══ */}
      <section className="py-8 md:py-12 bg-gradient-to-br from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-row justify-between mb-6 md:mb-8">
              <Button
                onClick={() => {
                  navigate("/");
                  setTimeout(() => {
                    document.querySelector('[data-section="products"]')?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 font-semibold hover:scale-105 transition-all"
              >
                <Grid3x3 className="w-5 h-5" />
                Ver Juegos
              </Button>
              <Button
                onClick={() => {
                  navigate("/");
                  setTimeout(() => {
                    document.getElementById("combos")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 font-semibold hover:scale-105 transition-all"
              >
                <Package className="w-5 h-5" />
                Ver Combos
              </Button>
            </div>

            <div className="relative mb-6 md:mb-8">
              <Carousel opts={{ align: "center", loop: true }} className="w-full">
                <CarouselContent>
                  {carrusel.map((img, i) => (
                    <CarouselItem key={i}>
                      <div className="relative aspect-square md:aspect-video rounded-2xl overflow-hidden bg-muted shadow-2xl">
                        <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                        <Badge className="absolute top-4 right-4 bg-[#ff3d00] text-white border-none text-sm md:text-base px-3 py-1">
                          {img.badge}
                        </Badge>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2 md:left-4" />
                <CarouselNext className="right-2 md:right-4" />
              </Carousel>
              <div className="text-center mt-3 text-sm text-muted-foreground">
                📸 Desliza para ver retos reales del juego
              </div>
            </div>

            <div className="text-center space-y-4 md:space-y-6">
              <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-[#ff3d00] uppercase">
                51 retos en cada torre
              </p>
              <h1 className="text-3xl md:text-6xl font-bold gradient-text leading-tight">
                Las 3 Torres de Shots
              </h1>
              <p className="text-base md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                La que prende la fiesta, la que sube la temperatura,
                <br className="hidden md:block" /> y la que es solo para dos.
              </p>

              <div className="flex items-baseline justify-center gap-3 md:gap-4 pt-2">
                <span className="text-lg md:text-xl text-muted-foreground">Desde</span>
                <span className="text-4xl md:text-6xl font-bold text-[#ff3d00]">$29.99</span>
                <Badge className="bg-green-600 text-white text-sm md:text-base px-3 py-1">
                  Envío GRATIS
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
                <Card className="p-3 md:p-4 border-2 border-green-500/20 bg-green-500/5">
                  <div className="flex flex-col items-center gap-2">
                    <Banknote className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                    <p className="text-xs md:text-sm font-bold text-center">Pagas al recibir</p>
                  </div>
                </Card>
                <Card className="p-3 md:p-4 border-2 border-blue-500/20 bg-blue-500/5">
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                    <p className="text-xs md:text-sm font-bold text-center">Todo Ecuador</p>
                  </div>
                </Card>
                <Card className="p-3 md:p-4 border-2 border-[#ff3d00]/20 bg-[#ff3d00]/5">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-6 h-6 md:w-8 md:h-8 text-[#ff3d00]" />
                    <p className="text-xs md:text-sm font-bold text-center">51 retos por torre</p>
                  </div>
                </Card>
                <Card className="p-3 md:p-4 border-2 border-purple-500/20 bg-purple-500/5">
                  <div className="flex flex-col items-center gap-2">
                    <Gift className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                    <p className="text-xs md:text-sm font-bold text-center">Regalos incluidos</p>
                  </div>
                </Card>
              </div>

              <Button
                onClick={irAOferta}
                size="lg"
                className="w-full md:w-auto bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] hover:from-[#ff3d00]/90 hover:to-[#ff7b00]/90 text-white text-lg md:text-2xl font-bold px-8 md:px-16 py-6 md:py-8 rounded-xl shadow-2xl hover:scale-105 transition-all mt-4"
              >
                <ShoppingCart className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                VER LAS 3 TORRES
                <Zap className="ml-2 h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2 · EL DOLOR ══ */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-6 md:px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-[#ff3d00] uppercase mb-3">
                Seamos honestos
              </p>
              <h2 className="text-2xl md:text-5xl font-bold leading-tight">
                Ya sabes cómo termina
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              <Card className="p-5 md:p-6 border-2">
                <div className="text-3xl md:text-4xl mb-3">📱</div>
                <h3 className="font-bold text-base md:text-lg mb-2">Todos en el celular</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Se juntaron para pasarla bien y a los 40 minutos cada uno está scrolleando.
                  Nadie lo dice, pero todos lo notan.
                </p>
              </Card>
              <Card className="p-5 md:p-6 border-2">
                <div className="text-3xl md:text-4xl mb-3">🔊</div>
                <h3 className="font-bold text-base md:text-lg mb-2">"Pongan música"</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  La solución de siempre. Sube el volumen, baja la conversación, y la reunión
                  se queda exactamente igual de muerta.
                </p>
              </Card>
              <Card className="p-5 md:p-6 border-2">
                <div className="text-3xl md:text-4xl mb-3">🍺</div>
                <h3 className="font-bold text-base md:text-lg mb-2">La previa que nunca arrancó</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Compraron el trago, llegaron temprano, y a las 11 ya estaban viendo la hora.
                  Otra vez.
                </p>
              </Card>
            </div>

            <p className="text-center text-lg md:text-2xl font-bold gradient-text mt-8 md:mt-12 px-2">
              No falta gente. No falta trago. Falta algo que los obligue a soltarse.
            </p>
          </div>
        </div>
      </section>

      {/* ══ 3 · CÓMO FUNCIONA ══ */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-[#ff3d00] uppercase mb-3">
                Cómo funciona
              </p>
              <h2 className="text-2xl md:text-5xl font-bold leading-tight mb-3">
                Se explica en 30 segundos.
                <br />
                Se juega toda la noche.
              </h2>
              <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Es la torre de bloques que ya conoces — pero cada bloque tiene un reto escrito.
                Nadie sabe cuál le va a tocar.
              </p>
            </div>

            {/* Móvil: lista horizontal compacta con línea conectora.
                Desktop: 3 columnas. En móvil el layout vertical desperdiciaba
                casi 3 pantallas de scroll para 3 pasos simples. */}
            <div className="relative md:grid md:grid-cols-3 md:gap-8">
              {/* Línea conectora — solo móvil */}
              <div
                className="absolute left-[27px] top-8 bottom-8 w-px bg-gradient-to-b from-[#ff3d00] via-[#ff7b00] to-transparent md:hidden"
                aria-hidden="true"
              />

              {[
                { n: "1", t: "Arma la torre", d: "51 bloques de madera. Se apila y listo, ya están jugando." },
                { n: "2", t: "Saca un bloque", d: "El reto está escrito ahí mismo. Lo lees en voz alta y lo cumples. Sin excusas." },
                { n: "3", t: "No la tumbes", d: "El que tumba la torre, penitencia. Ahí es donde se pone bueno de verdad." },
              ].map((paso) => (
                <div
                  key={paso.n}
                  className="relative flex items-start gap-4 mb-6 last:mb-0 md:block md:mb-0"
                >
                  <div className="relative z-10 w-14 h-14 md:w-14 md:h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-[#ff3d00] to-[#ff7b00] text-white grid place-items-center text-2xl font-bold shadow-lg md:mb-4">
                    {paso.n}
                  </div>
                  <div className="pt-1 md:pt-0">
                    <h3 className="font-bold text-lg md:text-xl mb-1 md:mb-2">{paso.t}</h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {paso.d}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 4 · ¿CUÁL ES LA TUYA? ══ */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-[#ff3d00]/5 to-[#ff7b00]/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-14 max-w-3xl mx-auto">
            <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-[#ff3d00] uppercase mb-3">
              Elige tu nivel
            </p>
            <h2 className="text-2xl md:text-5xl font-bold leading-tight mb-3">
              Tres torres. Tres formas de arruinar la noche
              <span className="text-muted-foreground"> (en el buen sentido)</span>.
            </h2>
            <p className="text-base md:text-xl text-muted-foreground">
              Cada una tiene sus propios 51 retos. Elige según con quién vas a jugar.
            </p>
          </div>

          {/* MÓVIL: pestañas — las 3 tarjetas apiladas ocupaban 4 pantallas
              de scroll antes de llegar al precio. Con pestañas baja a ~1.3
              y además obliga a interactuar, que sube el engagement. */}
          <div className="md:hidden max-w-md mx-auto">
            <div className="grid grid-cols-3 gap-2 mb-5">
              {TORRES.map((torre) => {
                const activa = torre.id === torreActiva;
                return (
                  <button
                    key={torre.id}
                    onClick={() => setTorreActiva(torre.id)}
                    className={`rounded-xl px-2 py-3 text-center transition-all active:scale-[0.97] ${
                      activa
                        ? "text-white shadow-lg"
                        : "bg-muted text-muted-foreground border"
                    }`}
                    style={activa ? { backgroundColor: torre.color } : undefined}
                    aria-pressed={activa}
                  >
                    <span className="block text-xl leading-none mb-1">{torre.emoji}</span>
                    <span className="block text-[11px] font-bold leading-tight">
                      {torre.nombre.replace("Torre ", "")}
                    </span>
                  </button>
                );
              })}
            </div>

            <TorreCard torre={TORRES.find((t) => t.id === torreActiva)!} />
          </div>

          {/* ESCRITORIO: las 3 en grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {TORRES.map((torre) => (
              <TorreCard key={torre.id} torre={torre} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5 · LA OFERTA ══ */}
      <section id="oferta" className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-14 max-w-3xl mx-auto">
            <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-[#ff3d00] uppercase mb-3">
              Arma tu pedido
            </p>
            <h2 className="text-2xl md:text-5xl font-bold leading-tight">
              Una alcanza. Dos ya es fiesta.
              <br />
              Tres es no tener excusa nunca.
            </h2>
          </div>

          {/* Móvil: orden de negocio es Dos (recomendado) → Tres (pack) → Una
              (individual), distinto del orden natural del array (escritorio
              vuelve a 1/2/3 con md:order-*). */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto items-start">
            {PLANES.map((plan) => {
              const ordenMovil =
                plan.id === "dos" ? "order-1" : plan.id === "tres" ? "order-2" : "order-3";
              const ordenDesktop =
                plan.id === "una" ? "md:order-1" : plan.id === "dos" ? "md:order-2" : "md:order-3";
              return (
              <Card
                key={plan.id}
                className={`relative p-6 md:p-8 border-2 flex flex-col transition-all hover:shadow-2xl ${ordenMovil} ${ordenDesktop} ${
                  plan.destacado
                    ? "border-[#ff3d00] shadow-2xl md:scale-105 bg-gradient-to-br from-[#ff3d00]/5 to-transparent"
                    : ""
                }`}
              >
                {plan.etiqueta && plan.destacado && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff3d00] text-white px-4 py-1 text-xs font-bold whitespace-nowrap">
                    ⭐ {plan.etiqueta}
                  </Badge>
                )}
                {plan.etiqueta && !plan.destacado && (
                  <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold whitespace-nowrap">
                    {plan.etiqueta}
                  </Badge>
                )}

                <h3 className="text-xl md:text-2xl font-bold mb-3 mt-2">{plan.nombre}</h3>

                <div className="flex items-baseline gap-2 flex-wrap mb-1">
                  {plan.precioAntes && (
                    <span className="text-lg text-muted-foreground line-through">
                      ${plan.precioAntes}
                    </span>
                  )}
                  <span className="text-4xl md:text-5xl font-bold text-[#ff3d00]">
                    ${plan.precio}
                  </span>
                </div>

                {plan.ahorro ? (
                  <Badge className="bg-green-600 text-white w-fit mb-4">
                    AHORRAS ${plan.ahorro}
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">Envío GRATIS</p>
                )}

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.incluye.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm md:text-base">
                      <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => abrirCheckout(plan)}
                  size="lg"
                  className={`w-full font-bold text-base md:text-lg py-6 rounded-xl transition-all hover:scale-105 ${
                    plan.destacado
                      ? "bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] text-white shadow-xl"
                      : "bg-foreground text-background hover:bg-foreground/90"
                  }`}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {plan.cta}
                </Button>

                {plan.microcopy && (
                  <p className="text-xs text-center text-muted-foreground mt-3">{plan.microcopy}</p>
                )}
              </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ 6 · LOS REGALOS ══ */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-[#ff3d00] uppercase mb-3">
                Incluido sin costo
              </p>
              <h2 className="text-2xl md:text-5xl font-bold leading-tight">
                Lo que viene además de la torre
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="p-5 text-center border-2">
                <div className="text-4xl mb-3">🥃</div>
                <h3 className="font-bold mb-1">Vaso tequilero</h3>
                <p className="text-sm text-muted-foreground">Uno por cada torre</p>
                <Badge variant="secondary" className="mt-3">Siempre</Badge>
              </Card>

              <Card className="p-5 text-center border-2">
                <div className="text-4xl mb-3">📱</div>
                <h3 className="font-bold mb-1">Guía: 20 juegos</h3>
                <p className="text-sm text-muted-foreground">Para cuando la torre se acabó y la noche no</p>
                <Badge variant="secondary" className="mt-3">Siempre</Badge>
              </Card>

              <Card className="p-5 text-center border-2 border-[#ff3d00]/30">
                <div className="aspect-square w-20 mx-auto mb-3 rounded-lg overflow-hidden">
                  <img src={ebook30Posiciones} alt="Guía de 30 posiciones" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold mb-1">Guía: 30 posiciones</h3>
                <p className="text-sm text-muted-foreground">Digital, de regalo</p>
                <Badge className="mt-3 bg-[#ff3d00] text-white">Con 2 o 3 torres</Badge>
              </Card>

              <Card className="p-5 text-center border-2 border-[#ff3d00]/30">
                <div className="text-4xl mb-3">🍹</div>
                <h3 className="font-bold mb-1">Shot Bidu</h3>
                <p className="text-sm text-muted-foreground">Para empezar con algo</p>
                <Badge className="mt-3 bg-[#ff3d00] text-white">Con 2 o 3 torres</Badge>
              </Card>
            </div>

            <p className="text-center text-sm md:text-base text-muted-foreground mt-6">
              📦 Las guías digitales viajan dentro de la caja, en tarjetas con código QR. Escaneas y las descargas.
            </p>
          </div>
        </div>
      </section>

      {/* ══ 7 · CÓMO PAGAS ══ */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-[#ff3d00] uppercase mb-3">
                Sin riesgo
              </p>
              <h2 className="text-2xl md:text-5xl font-bold leading-tight">
                Pagas cuando lo tengas en la mano
              </h2>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card className="p-6 md:p-8 border-2 border-green-500/30 bg-green-500/5">
                <Banknote className="w-10 h-10 text-green-600 mb-4" />
                <h3 className="text-xl md:text-2xl font-bold mb-2">Paga al recibir</h3>
                <p className="text-sm md:text-base text-muted-foreground mb-4">
                  Pagas en efectivo cuando el paquete llega a tu casa. No adelantas nada y no
                  necesitas tarjeta: para confirmar el pedido solo te llevamos a WhatsApp con el
                  mensaje ya escrito.
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-500">
                  <CheckCircle2 className="w-4 h-4" />
                  Entrega estimada: 48-72h laborables*
                </div>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              *Tiempos estimados, sujetos a la ruta de Servientrega en tu ciudad.
            </p>
          </div>
        </div>
      </section>

      {/* ══ 7.5 · GARANTÍA ══ */}
      <section className="py-10 md:py-14 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto p-6 md:p-8 border-2 flex flex-col md:flex-row gap-5 items-start md:items-center">
            <div className="w-14 h-14 rounded-xl bg-green-500/10 grid place-items-center flex-shrink-0">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold mb-1">Garantía de 30 días</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Si falta una pieza o llega con un defecto de fabricación, te la reponemos.
                Solo necesitamos una foto o video del problema — escríbenos por WhatsApp.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* ══ 8 · PRUEBA SOCIAL ══ */}
      <div className="text-center pt-10 md:pt-14">
        <Badge variant="secondary" className="text-xs font-semibold px-3 py-1">
          🇪🇨 Hecho en Ecuador · Shotygames desde 2017
        </Badge>
      </div>
      <Testimonials />

      {/* ══ 9 · FAQ ══ */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-[#ff3d00] uppercase mb-3">
                Dudas
              </p>
              <h2 className="text-2xl md:text-5xl font-bold leading-tight">
                Lo que todos preguntan
              </h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left font-bold text-base md:text-lg">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm md:text-base text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ══ 10 · CIERRE ══ */}
      <section className="py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 to-black/65" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white space-y-6 md:space-y-8">
            <h2 className="text-3xl md:text-6xl font-bold leading-tight">
              El próximo finde puede ser
              <br />
              igual que el anterior.
              <br />
              <span className="text-[#ff7b00]">O no.</span>
            </h2>

            <p className="text-base md:text-xl text-white/90">
              Envío gratis a todo Ecuador · Pagas cuando lo recibes
              <br />
              Confirmación inmediata por WhatsApp
            </p>

            <Button
              onClick={() => abrirCheckout(PLANES[2])}
              size="lg"
              className="bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] hover:from-[#ff3d00]/90 hover:to-[#ff7b00]/90 text-white text-lg md:text-2xl font-bold px-10 md:px-16 py-6 md:py-8 rounded-2xl shadow-2xl hover:scale-105 transition-all"
            >
              <ShoppingCart className="mr-2 h-5 w-5 md:h-6 md:w-6" />
              PEDIR LAS 3 TORRES
              <Zap className="ml-2 h-5 w-5 md:h-6 md:w-6" />
            </Button>

            <p className="text-xs md:text-sm text-white/70">
              ⚡ Confirmación inmediata por WhatsApp · 🔒 Compra 100% segura
            </p>
          </div>
        </div>
      </section>

      <Footer />

      {/* ══ Sticky CTA mobile / flotante desktop ══ */}
      <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 z-50 md:w-auto">
        <div className="md:hidden bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] p-3 shadow-2xl flex items-center gap-3">
          <div className="text-white leading-tight flex-shrink-0">
            <p className="text-lg font-bold">$49</p>
            <p className="text-[10px] opacity-90">las 3 torres</p>
          </div>
          <Button
            onClick={irAOferta}
            size="lg"
            className="flex-1 bg-white text-[#ff3d00] hover:bg-white/90 font-bold text-base py-6 rounded-xl shadow-xl"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            PEDIR AHORA
          </Button>
        </div>

        <Button
          onClick={irAOferta}
          className="hidden md:flex w-16 h-16 rounded-full shadow-2xl hover:scale-110 bg-[#25D366] hover:bg-[#20BA5A]"
          size="icon"
          aria-label="Ver planes"
        >
          <MessageCircle className="w-8 h-8" />
        </Button>
      </div>

      {/* ══ Checkout ══ */}
      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        productName={planActivo.nombre}
        productPrice={planActivo.precio}
        productImage={planActivo.imagen}
        productId={planActivo.productId}
        originalPrice={planActivo.precioAntes}
        isCombo={planActivo.isCombo}
        incluyeShotBidu={planActivo.incluyeShotBidu}
        comboIncludes={planActivo.comboIncludes}
        torreSelection={planActivo.torreSelection}
        upsells={[
          { id: "dadosPlacer", name: "Dados del Placer", price: 5, image: dadosDelPlacerImgThumb },
          { id: "emparejados", name: "Emparejados (juego digital)", price: 2.90, image: emparejadosPortadaThumb },
        ]}
      />
    </div>
  );
};

export default TresTorresLanding;

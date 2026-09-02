import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import NotFound from "./pages/NotFound";

const Index = lazyWithRetry(() => import("./pages/Index"));
const ProductDetail = lazyWithRetry(() => import("./pages/ProductDetail"));
const TorreNormalLanding = lazyWithRetry(() => import("./pages/TorreNormalLanding"));
const TorrePicanteLanding = lazyWithRetry(() => import("./pages/TorrePicanteLanding"));
const TorreParejasLanding = lazyWithRetry(() => import("./pages/TorreParejasLanding"));
const TorreParejasV2Landing = lazyWithRetry(() => import("./pages/TorreParejasV2Landing"));
const PartyshotsLanding = lazyWithRetry(() => import("./pages/PartyshotsLanding"));
const EnganchadosLanding = lazyWithRetry(() => import("./pages/EnganchadosLanding"));
const EmparejadosLanding = lazyWithRetry(() => import("./pages/EmparejadosLanding"));
const EmparejadosV2Landing = lazyWithRetry(() => import("./pages/EmparejadosV2Landing"));
const EmparejadosImprimibleLanding = lazyWithRetry(() => import("./pages/EmparejadosImprimibleLanding"));
const EmparejadosInternacionalLanding = lazyWithRetry(() => import("./pages/EmparejadosInternacionalLanding"));
const DadosDigitalesLanding = lazyWithRetry(() => import("./pages/DadosDigitalesLanding"));
const PromoHoyLanding = lazyWithRetry(() => import("./pages/PromoHoyLanding"));
const ComboTorresLanding = lazyWithRetry(() => import("./pages/ComboTorresLanding"));
const TresTorresLanding = lazyWithRetry(() => import("./pages/TresTorresLanding"));
const ComboChuchaquiLanding = lazyWithRetry(() => import("./pages/ComboChuchaquiLanding"));
const ComboLaPreviaLanding = lazyWithRetry(() => import("./pages/ComboLaPreviaLanding"));
const ComboParejasLanding = lazyWithRetry(() => import("./pages/ComboParejasLanding"));
const Ebook25JuegosLanding = lazyWithRetry(() => import("./pages/Ebook25JuegosLanding"));
const GuiaPlacerLanding = lazyWithRetry(() => import("./pages/GuiaPlacerLanding"));
const ConfirmacionContraentrega = lazyWithRetry(() => import("./pages/ConfirmacionContraentrega"));
const ConfirmacionTransferencia = lazyWithRetry(() => import("./pages/ConfirmacionTransferencia"));
const ConfirmacionTarjeta = lazyWithRetry(() => import("./pages/ConfirmacionTarjeta"));
const PayphoneCheckout = lazyWithRetry(() => import("./pages/PayphoneCheckout"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <ScrollToTop />
        <RouteErrorBoundary>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/landing/torre-normal" element={<TorreNormalLanding />} />
        <Route path="/landing/torre-picante" element={<TorrePicanteLanding />} />
          <Route path="/landing/torre-parejas" element={<TorreParejasLanding />} />
          <Route path="/landing/torre-parejas-v2" element={<TorreParejasV2Landing />} />
        <Route path="/landing/partyshots" element={<PartyshotsLanding />} />
        <Route path="/landing/enganchados" element={<EnganchadosLanding />} />
        <Route path="/landing/emparejados" element={<EmparejadosLanding />} />
          <Route path="/landing/emparejados-v2" element={<EmparejadosV2Landing />} />
          <Route path="/landing/emparejados-imprimible" element={<EmparejadosImprimibleLanding />} />
          <Route path="/landing/emparejados-internacional" element={<EmparejadosInternacionalLanding />} />
          <Route path="/landing/dados-digitales" element={<DadosDigitalesLanding />} />
          <Route path="/landing/promo-hoy" element={<PromoHoyLanding />} />
          <Route path="/landing/combo-torres" element={<ComboTorresLanding />} />
          <Route path="/landing/3-torres" element={<TresTorresLanding />} />
          <Route path="/landing/combo-chuchaqui" element={<ComboChuchaquiLanding />} />
          <Route path="/landing/combo-la-previa" element={<ComboLaPreviaLanding />} />
          <Route path="/landing/combo-parejas" element={<ComboParejasLanding />} />
          <Route path="/landing/25-juegos-fiestas" element={<Ebook25JuegosLanding />} />
          <Route path="/landing/guia-del-placer" element={<GuiaPlacerLanding />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/confirmacion-contraentrega" element={<ConfirmacionContraentrega />} />
          <Route path="/confirmacion-transferencia" element={<ConfirmacionTransferencia />} />
          <Route path="/confirmacion-tarjeta" element={<ConfirmacionTarjeta />} />
          <Route path="/pago-tarjeta" element={<PayphoneCheckout />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </RouteErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
);

export default App;

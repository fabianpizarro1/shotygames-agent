import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const TorreNormalLanding = lazy(() => import("./pages/TorreNormalLanding"));
const TorrePicanteLanding = lazy(() => import("./pages/TorrePicanteLanding"));
const TorreParejasLanding = lazy(() => import("./pages/TorreParejasLanding"));
const PartyshotsLanding = lazy(() => import("./pages/PartyshotsLanding"));
const EnganchadosLanding = lazy(() => import("./pages/EnganchadosLanding"));
const EmparejadosLanding = lazy(() => import("./pages/EmparejadosLanding"));
const EmparejadosInternacionalLanding = lazy(() => import("./pages/EmparejadosInternacionalLanding"));
const DadosDigitalesLanding = lazy(() => import("./pages/DadosDigitalesLanding"));
const PromoHoyLanding = lazy(() => import("./pages/PromoHoyLanding"));
const ComboTorresLanding = lazy(() => import("./pages/ComboTorresLanding"));
const TresTorresLanding = lazy(() => import("./pages/TresTorresLanding"));
const ComboChuchaquiLanding = lazy(() => import("./pages/ComboChuchaquiLanding"));
const ComboLaPreviaLanding = lazy(() => import("./pages/ComboLaPreviaLanding"));
const Ebook25JuegosLanding = lazy(() => import("./pages/Ebook25JuegosLanding"));
const GuiaPlacerLanding = lazy(() => import("./pages/GuiaPlacerLanding"));
const ConfirmacionContraentrega = lazy(() => import("./pages/ConfirmacionContraentrega"));
const ConfirmacionTransferencia = lazy(() => import("./pages/ConfirmacionTransferencia"));
const ConfirmacionTarjeta = lazy(() => import("./pages/ConfirmacionTarjeta"));
const PayphoneCheckout = lazy(() => import("./pages/PayphoneCheckout"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/landing/torre-normal" element={<TorreNormalLanding />} />
        <Route path="/landing/torre-picante" element={<TorrePicanteLanding />} />
          <Route path="/landing/torre-parejas" element={<TorreParejasLanding />} />
        <Route path="/landing/partyshots" element={<PartyshotsLanding />} />
        <Route path="/landing/enganchados" element={<EnganchadosLanding />} />
        <Route path="/landing/emparejados" element={<EmparejadosLanding />} />
          <Route path="/landing/emparejados-internacional" element={<EmparejadosInternacionalLanding />} />
          <Route path="/landing/dados-digitales" element={<DadosDigitalesLanding />} />
          <Route path="/landing/promo-hoy" element={<PromoHoyLanding />} />
          <Route path="/landing/combo-torres" element={<ComboTorresLanding />} />
          <Route path="/landing/3-torres" element={<TresTorresLanding />} />
          <Route path="/landing/combo-chuchaqui" element={<ComboChuchaquiLanding />} />
          <Route path="/landing/combo-la-previa" element={<ComboLaPreviaLanding />} />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // El manifest resuelve "src/assets/foo.webp" -> "/assets/foo-<hash>.webp":
  // scripts/prerender-seo.mjs lo usa para armar el og:image real de cada
  // landing sin tener que hardcodear hashes que cambian en cada build.
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        // Sin agrupar, Rollup emite un chunk propio por cada módulo que
        // compartan dos o más landings: ~40 pedidos HTTP, la mitad de ~100
        // bytes (una URL de imagen y nada más). En móvil lo que duele es el
        // round-trip por pedido, no esos bytes.
        //
        // Ojo: NO usar `experimentalMinChunkSize` para esto — fusiona los
        // chunks chicos dentro de chunks de página, y entonces abrir la
        // landing de Torre Parejas se lleva puesto el chunk entero de otra
        // landing. Agrupar a mano es explícito y no cruza páginas.
        manualChunks(id) {
          // Las URLs de imágenes compartidas entre landings: un solo chunk.
          if (/[\\/]src[\\/]assets[\\/]/.test(id)) return "asset-urls";
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return "icons";
          // React y el router no cambian entre deploys: en chunk propio, el
          // visitante que vuelve los reusa de caché aunque el resto cambie.
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id))
            return "react-vendor";
        },
      },
    },
  },
}));

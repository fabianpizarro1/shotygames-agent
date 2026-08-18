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
  },
}));

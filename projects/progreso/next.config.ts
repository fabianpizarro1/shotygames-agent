import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Evita que Turbopack suba a buscar un lockfile fuera de este repo (KEPLER
  // tiene el suyo propio un nivel arriba, pero este proyecto es un repo aparte).
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;

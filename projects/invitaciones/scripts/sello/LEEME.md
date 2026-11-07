# Sello de cera realista

Se renderiza una vez (relieve + iluminación en numpy) y se usa como imagen: `public/sello/<color>.webp`.

1. `glifo.html` + `glifo.mjs` (Chrome headless, `node --experimental-websocket`): renderiza la inicial en Great Vibes -> `J.png`.
2. `python3 render.py <carpeta_salida> J.png`: genera `sello-<color>.png` (vino, rojo, dorado, rosa, azul, negro).
3. Recortar al canal alfa, escalar a 340 px y guardar como WebP en `public/sello/`.

Solo existe la inicial J; para otra inicial `Sobre.tsx` usa el sello SVG de respaldo (`SelloCera.tsx`).

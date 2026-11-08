# Sellos de cera realistas

Imágenes WebP en `public/sello/<id>/<color>.webp` (id: A-Z, `XV`, `AMP` = «&»; colores: vino, rojo, dorado, rosa, azul, negro).
Se generan una sola vez (relieve + iluminación en numpy), no en cada visita.

1. `glifos.mjs` (Chrome headless, `node --experimental-websocket`) renderiza cada inicial en Great Vibes → PNG con fondo transparente (`glifo.html` define la letra y el tamaño).
2. `python3 render-lote.py <carpeta_glifos> <salida> [ancho]` arma el sello de cada letra en los 6 colores (~8 min para las 28). `IDS=XV,AMP` repite solo algunos.
3. Copiar la salida a `public/sello/`.

`Sobre.tsx` elige la imagen con `idSello(inicial)`; si la inicial no está (número, símbolo) usa el sello dibujado (`SelloCera.tsx`). La boda usa `&`, la quinceañera `XV`, el cumpleaños la inicial del nombre.

# Por qué vercel.json cachea lo que cachea

`vercel.json` no admite comentarios (JSON puro, y Vercel además rechaza claves
que no estén en su esquema), así que la explicación vive acá.

| Ruta | Caché | Razón |
|---|---|---|
| `/assets/(.*)` | 1 año, `immutable` | Todo lo que sale de Vite lleva hash en el nombre. Si cambia el contenido, cambia la URL — no hay forma de servir algo viejo. |
| `/fonts/(.*)` | 1 año, `immutable` | Los `.woff2` los referencia el CSS por nombre fijo, sin hash. Se cachean fuerte igual porque solo cambian si se corre `scripts/descargar-fuentes.mjs`, y ahí conviene renombrarlos. |
| `logo-32/180.png`, `og-image.jpg`, `favicon.ico` | 1 día + `stale-while-revalidate` de 7 días | Sin hash y cambian de vez en cuando. El navegador los sirve de caché al instante y revalida en segundo plano. |
| `index.html` y los `index.html` por landing | **sin cachear** (lo pone Vercel solo) | Nunca cachear el HTML fuerte: quedaría apuntando a chunks de JS que un deploy nuevo ya borró — es la causa clásica de la pantalla en blanco. |

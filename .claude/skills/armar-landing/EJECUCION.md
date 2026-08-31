# Cómo se ejecuta — manual operativo

`SKILL.md` dice **qué** hacer y por qué. Este archivo dice **cómo**: en qué repo agregar el
producto, el patrón de datos, y los pasos de verificación y despliegue.

Estado del proyecto y todos los identificadores: `projects/dropshipping/ESTADO.md`.

---

## 0. Primero: ¿Avanora o Truquito?

Las dos tiendas comparten la misma máquina (landing, checkout, bot, cron) pero son **repos
separados**, y el esquema de `productos.ts` de cada una **no es idéntico** — Truquito es la
más evolucionada al 2026-08-28 (`BloqueVisual` con `texto`/`chips`/`badge`/`cta`/`alto`,
`tema`, `cadenciaCta`, `dolores`, `usos`, `regalo`, `queRecibes`). No asumir que un campo que
existe en una existe en la otra.

| Tienda | Repo | Criterio |
|---|---|---|
| Avanora | `projects/avanora/` (`src/data/productos.ts`) | Salud, suplementos, bienestar |
| Truquito | `projects/truquito/` (`src/data/productos.ts`) | Hogar, gadgets, utilidad diaria — tiene que ser Meta-safe |

Mismo criterio que usa `candidatos-tienda.js` en el dashboard. Si el producto viene del
dashboard, ya trae la etiqueta de tienda — usar esa, no reclasificar a ojo.

**Antes de tocar nada: leer el `export type Producto` completo del `productos.ts` del repo que
corresponda.** El esquema de abajo es orientativo — el archivo real es la fuente de verdad y
cambia con el tiempo. No copiar un esquema de memoria.

---

## 1. Agregar el producto

Todo el contenido vive en `productos.ts`. Se agrega un objeto al array y queda publicado en
`/p/{slug}`. **No se toca ningún componente** — si el contenido recibido pide algo que el
esquema no soporta, se avisa a Fabián antes de improvisar un campo nuevo o tocar un layout.

Campos que están en las dos tiendas (base común):

```ts
{
  slug, dropiId, nombre, titular, subtitular,
  costoProveedor, precio, precioTachado,
  imagenes: [...],                    // fotos reales, ya limpias
  combos: [{unidades, precio, etiqueta?, destacado?}],
  garantiaDias,
  resenasEjemplo: [{nombre, ciudad, estrellas, texto, foto?}],
  resenasSonReales: true,             // false = son de ejemplo, avisar antes de encender campaña
  variantes: { a?, b?, c?: { nombre, bloques: BloqueVisual[], cadenciaCta? } }
}
```

`BloqueVisual` (la pieza que más se reusa — imagen + remate corto, no un párrafo):

```ts
{ src, alt, texto?, chips?: string[], badge?, cta?: boolean, alto? }
```

**`alto` en px es importante** — sin eso el navegador reserva mal el espacio y la página salta
al cargar (CLS). Ancho de referencia: 940.

**`cadenciaCta`**: cada cuántos bloques se fuerza un botón. Ojo con el 0 — es la forma de
APAGARLO del todo; cualquier otro número sigue metiendo el automático (`i % N === 1` da true
en `i=1` incluso con N grande).

El resto de campos (`dolores`, `mecanismo`, `usos`, `expectativas`, `comparativa`, `ficha`,
`regalo`, `tema`, `cierre`, `queRecibes`, `resenasDe`, `sellos`) son **opcionales** — un
producto los lleva solo si el contenido recibido los necesita. Leer los comentarios de cada
uno en el `productos.ts` real: explican POR QUÉ existen (varios nacieron de errores reales,
como `resenasDe`, que existe porque el layout tenía copy de otro producto escrito a mano).

**Nunca escribir copy de producto dentro de un componente/layout.** Todo el texto sale de
`productos.ts`. Ese error ya pasó (ver `investigacion-producto/SKILL.md`, historial).

### Imágenes

Mismo criterio que en `investigacion-producto`:
- Revisar cada una antes de usarla — sello de DROPI, claims incrustados, marca de otra tienda.
- Recortar con PIL si hace falta (no `sips` — no ancla el crop arriba):
  ```python
  from PIL import Image
  im = Image.open('foto.jpg').convert('RGB')
  w, h = im.size
  im.crop((0, 0, w, int(h*0.715))).save('salida.jpg', quality=88, optimize=True)
  ```
- Comprimir antes de subir. `loading="lazy"` en todas salvo la primera; `fetchPriority="high"`
  en la del hero.

---

## 2. Verificar

```bash
cd projects/<avanora|truquito>
npx tsc --noEmit
npx vite build
```

Con el navegador (`preview_start {name:"avanora"|"truquito"}`, tabId que devuelva), en 375px:

```js
(()=>{const w=document.documentElement.clientWidth, h=window.innerHeight;
 const h1=document.querySelector('h1');
 const cta=[...document.querySelectorAll('button')].find(b=>/Lo quiero|Pedir|Comprar/.test(b.textContent));
 return JSON.stringify({h1:h1?.textContent.slice(0,40), ctaTop:Math.round(cta.getBoundingClientRect().top),
   enPliegue:cta.getBoundingClientRect().top<h, sinScrollH:document.body.scrollWidth<=w});})()
```

Checklist de concordancia — esto es lo que más veces hubo que corregir, y siempre lo cazó
Fabián, no el agente. **Recorrer la página entera de arriba a abajo antes de entregarla**, no
sección por sección aislada:

- Nada repetido en dos lugares (ni foto, ni sección con contenido distinto).
- El precio de la landing, el checkout y el anuncio dicen lo mismo.
- Ninguna reseña repite nombre; ninguna ciudad se repite de más; no todas son 5 estrellas.
- La cantidad/gramaje es la misma en fotos, copy y ficha real de DROPI.
- Las tres variantes cargan y son distintas; una `?v=` desconocida cae en la A.
- Todas las imágenes responden 200.
- El checkout abre en la opción más barata y el total se actualiza al cambiarla.

---

## 3. Desplegar

```bash
git add -A && git commit -F - <<'EOF' ... EOF
git push origin main       # si el repo tiene remote — Truquito hoy despliega sin remote
npx vercel --prod --yes
```

Después, `curl` a las URLs y a los assets nuevos — **verificar el bundle en vivo, no el
local**:

```bash
JS=$(curl -sL "https://<dominio>/p/SLUG" | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -1)
curl -sL "https://<dominio>$JS" -o /tmp/b.js
python3 -c "b=open('/tmp/b.js',encoding='utf-8',errors='replace').read(); print('precio:', b.count('PRECIO_REAL'))"
```

Dominios: `avanora.vercel.app` / `truquito-ec.vercel.app` (o el custom domain si ya está
comprado — revisar `ESTADO.md` antes de asumir).

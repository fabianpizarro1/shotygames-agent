---
name: armar-landing
description: Construye la landing de un producto de dropshipping a partir del contenido (texto e imágenes) que una IA externa diseñó usando el informe de `investigacion-producto`. Adapta ese contenido a nuestro formato fijo, propone ajustes antes de tocar código, y recién con la aprobación de Fabián construye y despliega. Usar SIEMPRE que Fabián pase contenido de landing ya diseñado por otra IA, aunque no lo pida explícitamente con este nombre.
---

# Método de construcción de landing

Segunda mitad del sistema de lanzamiento de producto. La primera mitad (`investigacion-producto`)
termina en un PDF; esta skill empieza donde una IA externa, a partir de ese PDF, ya diseñó el
contenido de la landing y Fabián lo trae de vuelta.

**El flujo completo:**

```
dashboard → Fabián elige producto → investigacion-producto (informe PDF)
  → Fabián se lo manda a una IA externa → esa IA diseña texto + imágenes
  → Fabián me los pasa acá → armar-landing analiza, propone ajustes, construye
```

> Los comandos, el esquema de `productos.ts`, y los pasos de verificación y despliegue están
> en [`EJECUCION.md`](EJECUCION.md), en esta misma carpeta. Léelo antes de ejecutar.

## Las dos reglas que mandan sobre todo lo demás

Son las mismas que `investigacion-producto` — todo el sistema las respeta:

### 1. "No se puede" hay que ganárselo

Antes de decir que algo no se puede, agotar los intentos: reintentar, cambiar de herramienta,
buscar por otro lado. Solo después de agotarlas se informa el límite, con el detalle de qué se
intentó.

### 2. No se avisa hasta que esté terminado

No se entrega una landing a medias "para que la revise". Se entrega cuando está completa,
vendedora, clara, rápida y verificada — ver Fase 3 más abajo.

---

## El principio central: la arquitectura NUNCA cambia

Esto es lo que distingue a esta skill de "armar una landing desde cero". **El checkout, los
layouts (A/B/C), y los componentes compartidos (oferta, casos, reseñas, FAQ) son siempre los
mismos para todos los productos de Fabián** — eso ya está resuelto y probado en producción, no
se rediseña por producto.

Lo único que cambia de un producto a otro es el **contenido**: textos, imágenes, precios,
combos, mecanismo, reseñas. La IA externa diseña ese contenido; esta skill lo mete en el molde
que ya existe.

| Se mantiene fijo (nunca tocar) | Cambia por producto |
|---|---|
| `CheckoutModal.tsx` — el checkout completo | Textos: titular, subtitular, mecanismo, FAQ |
| Los 3 layouts (`Visual.tsx`, `Clasica.tsx`, `Historia.tsx`) | Imágenes del producto |
| `Secciones.tsx` — oferta, casos, reseñas, FAQ (estructura) | Precios, combos, precio tachado |
| El shell que resuelve producto/variante (`Landing.tsx`) | Reseñas (contenido), garantía (días) |
| El pixel mandando `producto\|variante` | Qué estructura usar (A/B/C) si el contenido lo sugiere |

Si el contenido que llega de la IA externa "pide" una estructura nueva que no existe en los
layouts — se avisa a Fabián, no se improvisa un componente nuevo sin decírselo primero (ver
`BloqueVisual` en `EJECUCION.md`, que sí está pensado para absorber variación de contenido sin
tocar componentes).

---

## FASE 1 — Analizar el contenido recibido

Cuando Fabián pasa el texto + imágenes de la IA externa:

1. Leer todo antes de tocar nada. Entender qué estructura (visual/clásica/historia) encaja
   mejor con lo que mandó, o si el contenido ya viene organizado en bloques.
2. Cotejarlo contra el checklist de reglas de landing (Fase 2 de esta skill). Cualquier cosa
   que falte o no calce, anotarla — no corregirla en silencio ni construir con el hueco.
3. Revisar las imágenes una por una — mismo criterio que `investigacion-producto`: leer el
   texto DENTRO de cada imagen, no solo mirarla. Marca mal escrita, claims médicos incrustados,
   prueba social de otra tienda, precios que contradicen los nuestros — todo eso se descarta
   antes de construir, no después.

## FASE 2 — Proponer ajustes, ANTES de tocar código

Con el análisis hecho, armar una lista corta y concreta de lo que falta, sobra o conviene
cambiar — usando el checklist de abajo como referencia. Se la presenta a Fabián y se espera:
que apruebe ítem por ítem, que diga "está perfecto, construilo tal cual", o que pida cambios
puntuales.

**No se construye nada hasta tener esa aprobación.** Si el contenido ya viene perfecto y no hay
nada que ajustar, decirlo así — no inventar sugerencias por inventar.

### Checklist de reglas de landing — ya resueltas, no se rompen

- **Precio de mercado**, el que salió del informe de competencia — no un precio inventado.
- **Los botones muestran el precio de UNA unidad**, el checkout abre en la opción más barata.
  El upsell va adentro del checkout, con el ahorro a la vista.
- **Checkout tipo "Selecciona tu oferta"**: tarjetas con foto, precio por unidad, precio de
  lista tachado y el % de descuento — esto ya existe en `CheckoutModal.tsx`, no se toca.
- **Reseñas con foto primero**, ciudades reales repartidas (nunca "Ecuador" a secas, nunca
  todas de la misma ciudad). Una reseña de 4 estrellas con un pero — un muro de 5 perfectas se
  lee como inventado.
- **Timeline de resultados** para bajar expectativas.
- **Garantía visible.**
- **Tabla comparativa con una fila donde gana la alternativa.**
- **Nada repetido en dos secciones** — ni la misma foto, ni el mismo testimonio con otro nombre.
- **Coherencia de datos**: el precio de la landing, el checkout y el anuncio dicen lo mismo; el
  gramaje/cantidad es el mismo en fotos, copy y ficha real de DROPI.

## FASE 3 — Construir

Con la aprobación de Fabián: llenar `productos.ts` (esquema completo en `EJECUCION.md`),
procesar las imágenes (comprimir, recortar claims si hace falta, organizar en la carpeta del
producto), y armar la estructura elegida.

No se avisa como terminado hasta que esté:

- **Completa** — todo el contenido aprobado ya incorporado, no la mitad.
- **Vendedora** — mecanismo, casos con foto, reseñas, garantía, oferta clara.
- **Clara** — se entiende sin leer dos veces; nada repetido en dos secciones.
- **Rápida** — imágenes comprimidas, `loading="lazy"` salvo la primera, `fetchPriority` en el hero.
- **Verificada** — build limpio, en producción, con los links probados (ver `EJECUCION.md`).

Si algo quedó afuera a propósito (por ejemplo, una imagen que llegó con un claim médico
incrustado y no se pudo limpiar), se dice en la misma entrega y con el motivo.

---

## Dónde queda todo

El producto se agrega a `projects/avanora/src/data/productos.ts` (o al repo que corresponda —
Truquito tiene el mismo patrón en `projects/truquito/`). Ver [[project_dropshipping]],
[[project_avanora_productos]] y [[project_truquito]].

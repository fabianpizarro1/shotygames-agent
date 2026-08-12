# Flujo de trabajo — versión de Fabián

_Dictado por Fabián el 2026-08-08 de madrugada. Pendiente de iterar y cerrar._
_Lo marcado con ⚠️ necesita decisión suya antes de construirse._

---

## Ciclo semanal

### Domingo — Informe de candidatos
El bot manda el **top 10 de productos para testear**, ya filtrado por rentabilidad y por velocidad de venta real (delta de stock).

Por cada producto:
- Proveedor, ID, stock, costo, PVP recomendado por DROPI
- **Biblioteca de Anuncios de Meta:** qué anuncios están corriendo de ese producto, desde cuándo, cuántos, qué ángulos usan
- **Investigación en internet:** características, reseñas, a qué precio lo venden otras tiendas, fotos disponibles, todo lo que dé contexto
- **Cálculo:** CPA máximo, utilidad esperada, margen a distintas tasas de entrega

Al final: **3 recomendados de los 10**, con el razonamiento de por qué esos y no los otros.

### Fabián aprueba
Elige cuáles se testean.

---

## Ciclo diario

```
Día anterior          Se define el producto del día siguiente
                      Landing lista y aprobada, campaña creada

06:00                 Campañas encendidas
                      (Fabián entra al administrador y las activa)

Durante el día        Reportes periódicos de rendimiento
                      + sugerencias de acción (frecuencia por definir)

22:00 ⚠️              Informe diario del catálogo: qué productos se
                      movieron más ese día, para cazar futuros ganadores
```

---

## Al aprobar un producto

1. **Landing completa**, clonando la estructura de la landing ganadora. Solo cambian: info, fotos, reseñas, precios.
2. **Imágenes generadas** con las herramientas de generación conectadas.
3. **Reseñas de ejemplo** para ver cómo se ve el diseño ⚠️ (ver abajo).
4. Fabián revisa → pide cambios o aprueba.
5. **Campaña en Meta** creada (estructura y presupuestos por definir).
6. Aviso a Fabián → él entra al administrador y la enciende.
7. **Ficha de estadísticas del producto**: CPA máximo permitido, utilidad promedio, margen según % de entrega — lo mismo que muestra la calculadora.

---

## Operación de pedidos

- Los pedidos se registran en un **Google Sheet** propio del dropshipping, igual que Shotygames
- Las **guías en DROPI** se generan con el mismo procedimiento que ya funciona
- Revisión de pedidos en paralelo a la revisión de campañas
- **Bot de Telegram separado**, exclusivo de dropshipping, para no mezclarlo con el de Shotygames

---

## ⚠️ Puntos a cerrar mañana

### 1. Reseñas inventadas
Fabián: "pon reseñas inventadas por el momento para ver cómo se vería, después te mando unas reales."

**Cómo se resuelve:** las pongo como texto de ejemplo **visiblemente marcado** (`RESEÑA DE EJEMPLO — reemplazar`) mientras la landing es un borrador que solo ve Fabián. Sirve perfecto para evaluar el diseño.

Lo que no se hace: dejar reseñas inventadas presentadas como reales en una landing en vivo a la que apunten los anuncios. Eso es publicidad engañosa — riesgo con Meta (rechazo de anuncios o cierre de cuenta) y con el consumidor. Las reales que mande Fabián entran antes de encender la campaña.

Sin conflicto con lo que él pidió: él mismo dijo que después manda las reales.

### 2. Biblioteca de Anuncios de Meta
Sí se puede consultar, pero **no hay API limpia** para anuncios comerciales — la API oficial cubre principalmente anuncios políticos. Para productos hay que leer la web pública de la Biblioteca de Anuncios con automatización de navegador. Funciona, pero es más frágil que una API y puede romperse si Meta cambia la página.

**A decidir:** si vale la pena, o si con el delta de stock + investigación web ya alcanza para decidir.

### 3. Profundidad de la investigación
Investigar a fondo 10 productos cada domingo (reseñas, precios de otras tiendas, fotos, anuncios) es mucho trabajo por producto.

**Propuesta:** investigación ligera sobre los 10, profunda solo sobre los 3 finalistas. Mismo resultado, una fracción del tiempo.

### 4. Imágenes generadas vs fotos reales
Las fotos del producto salen de la galería de DROPI — son del producto real que el cliente va a recibir. Las generadas sirven para fondos, escenas de uso y banners.

**Lo que no se hace:** generar una imagen de un producto que se ve distinto al que llega. El cliente recibe otra cosa, reclama, y en COD eso se traduce directo en devoluciones — que es justo la variable que más margen destruye.

### 5. Hora del informe de catálogo
Fabián pidió las 22:00. Su propia rutina dice: nada de trabajo después de las 21:00, dormir máximo a las 23:00.

**Propuesta:** 20:00. Se lee igual, y no invita a quedarse trabajando a medianoche — que es exactamente el ciclo que quiere romper.

### 6. Primer top 10 (domingo 9 de agosto)
Solo habrá **1 día** de delta de stock. Sirve para arrancar, pero el ranking se vuelve realmente bueno con una semana acumulada. El del domingo 16 valdrá mucho más que el del 9.

---

## Lo que ya está resuelto y no hay que discutir

- Conexión al catálogo (32.939 productos) ✅
- Calculadora de rentabilidad, terminal y web ✅
- Filtro de entrada: múltiplo 4.5x ✅
- Campañas siempre creadas en pausa, las enciende Fabián ✅

# Datos Reales del Catálogo y Embudo Nuevo (verificado 2026-08-02)

> **Este documento tiene prioridad sobre `01-shotygames.md`** en todo lo que se contradiga.
> Los datos de acá salen del código de los repos y de los registros de ventas reales, no de notas viejas.

---

## 1. CAMBIO CRÍTICO: el CTA ya NO va a WhatsApp

**Embudo viejo (obsoleto):** Ad → WhatsApp → Nicole cierra la venta.

**Embudo nuevo (vigente desde agosto 2026):**
```
Ad → Landing del producto → Formulario (datos + método de pago)
   → WhatsApp automático según método elegido
   → Registro automático en Google Sheets
```

- Si elige **transferencia** → le llega resumen del pedido + datos de las cuentas
- Si elige **contraentrega** → le llega aviso pidiendo que confirme solo si va a poder recibir (porque el envío se cobra igual)

**Implicación para los creativos:** los CTA ahora mandan a la **landing**, no a WhatsApp.
- ✅ "Pedilo acá 👆", "Hacé tu pedido acá 👆", "Comprá y jugá ya 👆"
- ❌ "Escríbenos al WhatsApp", "Pide el tuyo por WhatsApp"

**Por qué se hizo el cambio:** para capturar los datos de todos los interesados (aunque no paguen) y poder construir base de clientes, audiencias de retargeting y seguimiento de los que abandonan.

---

## 2. Catálogo digital — contenido REAL leído del código

### Emparejados — $6,90
Repo: `projects/emparejados` · Archivo: `src/data/cards.ts`

**72 cartas** en 3 categorías:

| Categoría | Nombre visible | Cartas |
|---|---|---|
| `spicy` | **Deseo** | 32 |
| `emotional` | **Conexión** | 22 |
| `fun` | **Diversión** | 18 |

Incluye: acceso al juego digital + **PDF imprimible** de las cartas + guía de regalo.

> ⚠️ Fabián mencionó 69 cartas; el código tiene 72. Confirmar cuál es el número oficial antes de publicarlo en un anuncio.

### Entre-Dados — $2,90 (upsell de Emparejados)
Repo: `projects/entredados` · Archivo: `src/types/game.ts`

**NO son 2 dados ni 4 dados.** Son **2 modos de juego, 3 dados cada uno**:

| Modo | Dados | Opciones | Combinaciones |
|---|---|---|---|
| **Acciones** | Acción × Zona × Tiempo | 19 × 26 × 13 | **6.422** |
| **Posiciones** | Posición × Lugar × Duración | 18 × 10 × 14 | **2.520** |
| | | **TOTAL** | **8.942** |

**Las 8.942 combinaciones son un argumento de venta enorme que no se está usando en ningún material.** Es real, verificable y diferenciador.

### Precios y upsell
| Compra | Precio |
|---|---|
| Emparejados solo | $6,90 |
| Entre-Dados (upsell en checkout) | +$2,90 |
| **Ambos** | **$9,80** |

Tasa histórica de toma del upsell: **50,5%** (335 de 663 ventas cobradas).
Ticket promedio real cobrado: **$6,96**.

---

## 3. Regalos por producto (corregido)

| Producto | Regalo |
|---|---|
| Torre Normal | Guía digital de juegos |
| Torre Picante | Guía digital de juegos |
| Torre Parejas | Guía digital de 30 posiciones |
| Emparejados | Guía de regalo + PDF imprimible |

Se usa siempre con urgencia: *"si pedís hoy te la regalo"*.

---

## 4. El PDF imprimible — el mecanismo único más fuerte del catálogo

Emparejados incluye un PDF listo para imprimir en cualquier impresora doméstica. El cliente puede jugar digital **o** imprimir las cartas y jugar físico.

**Por qué es el ángulo más potente:** mata la única objeción real del producto digital.

| Objeción | Cómo la mata |
|---|---|
| "Prefiero algo físico" | Lo tenés físico — solo lo imprimís |
| "No sirve para regalar" | Imprimís, cortás y envolvés en 10 minutos |
| "Si pierdo el acceso, lo perdí" | Reimprimible las veces que quieras |
| "Es menos por el mismo precio" | Son dos versiones por el precio de una, sin envío |

Ningún competidor local ofrece digital + imprimible.

---

## 5. Estilo visual de los creativos — SIN PERSONAS

Los creativos de Shotygames **no llevan personas**. Siguen el lenguaje visual de la web y del juego: **ilustración plana, minimalista, el reto o la carta como protagonista**.

**Paleta de marca** (leída de los assets del repo):
| Color | Hex | Uso |
|---|---|---|
| Crema | `#FDF0DC` | Fondo principal |
| Vino | `#7B1F1F` | Categoría Deseo, fondos de impacto |
| Terracota | `#B5695E` | Ilustración secundaria |

Tipografía serif con carácter · iconografía de línea fina.

**Implicación para los prompts:** NO generar prompts fotorrealistas de personas ecuatorianas. En su lugar, describir composiciones gráficas: la carta con el reto, el bloque de madera con el reto, infográficos de "cómo se juega", tipografía como protagonista, comparaciones con íconos de línea.

**Ventaja operativa:** estos creativos se hacen en Canva con los assets que ya existen — sin IA, sin sesión de fotos, costo cero.

**Ventaja de algoritmo:** mostrar el reto real genera curiosidad y **compartidos**, que es la señal proxy #1 que usa Meta para decidir si escalar un anuncio (ver doc 07).

---

## 6. Economía real por producto (agosto 2026)

| Producto | CPA techo | CPA real | Colchón |
|---|---|---|---|
| Torre individual con COD (20% devolución) | $13,56 | $12,15 | $1,41 |
| Digital (mezcla actual, ticket $6,96) | $6,54 | $3,87 | $2,67 |

- **Torres:** $28 venta, $4 costo producto, $5,47 envío promedio, $0,86 reposición de caja en devoluciones. El envío se paga aunque el cliente no reciba.
- **Digitales:** costo marginal cero, solo ~6% de comisión de pasarela.
- Subir la toma del upsell al 75% lleva el CPA techo digital a **$8,53**.

---

## 7. Repositorios de producto

| Repo | Ruta local | Qué es |
|---|---|---|
| `emparejados` | `projects/emparejados` | Juego de 72 cartas para parejas. React + Vite + Supabase (Lovable) |
| `entredados` | `projects/entredados` | Juego de dados, 2 modos × 3 dados. React + Vite (Lovable) |

Ambos clonados el 2026-08-02 para poder trabajarlos junto con el marketing.

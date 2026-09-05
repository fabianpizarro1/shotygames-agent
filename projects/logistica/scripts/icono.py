"""
Genera los iconos de la app de logística.

Sin dependencias externas más allá de PIL. Se dibuja a 4x y se reduce, que es
la forma barata de tener bordes suaves sin antialiasing manual.

El icono NO lleva transparencia ni esquinas redondeadas: iOS enmascara solo, y
un PNG con alpha termina con el fondo en negro en la pantalla de inicio.
"""
from PIL import Image, ImageDraw

FONDO_ARRIBA = (16, 26, 21)    # verde muy oscuro
FONDO_ABAJO  = (7, 10, 9)
VERDE        = (52, 209, 126)

def dibujar(lado, margen_rel=0.0):
    S = lado * 4
    img = Image.new('RGB', (S, S), FONDO_ABAJO)
    d = ImageDraw.Draw(img)

    # Degradado vertical: le da cuerpo al icono sobre fondos oscuros del iPhone.
    for y in range(S):
        t = y / (S - 1)
        d.line([(0, y), (S, y)], fill=tuple(
            round(a + (b - a) * t) for a, b in zip(FONDO_ARRIBA, FONDO_ABAJO)
        ))

    # `margen_rel` es la zona segura del icono "maskable" de Android, que
    # recorta hasta un 20% del borde.
    m = S * margen_rel
    util = S - 2 * m

    # La composición entera (estela + caja) se centra como un bloque; centrar
    # solo la caja dejaba las líneas comidas por el borde izquierdo.
    an = util * 0.50
    al = util * 0.46
    estela_total = util * 0.24          # lo que ocupan las líneas + su separación
    x0 = m + (util - an - estela_total) / 2 + estela_total
    y0 = m + (util - al) / 2
    x1, y1 = x0 + an, y0 + al
    grosor = max(2, round(util * 0.062))
    radio = util * 0.055

    d.rounded_rectangle([x0, y0, x1, y1], radius=radio, outline=VERDE, width=grosor)

    # La tapa: línea horizontal al primer tercio.
    yt = y0 + al * 0.34
    d.line([(x0 + grosor / 2, yt), (x1 - grosor / 2, yt)], fill=VERDE, width=grosor)

    # La cinta: baja desde el borde superior hasta la tapa.
    xc = (x0 + x1) / 2
    d.line([(xc, y0 + grosor / 2), (xc, yt)], fill=VERDE, width=grosor)

    # Estela de movimiento a la izquierda — es una app de cosas que viajan.
    # Los largos caben dentro de `estela_total` para que nada toque el borde.
    for largo, sep in ((0.17, 0.30), (0.11, 0.52), (0.07, 0.74)):
        yy = y0 + al * sep
        xe = x0 - util * 0.05
        d.line([(xe - util * largo, yy), (xe, yy)], fill=VERDE, width=max(2, round(grosor * 0.6)))

    return img.resize((lado, lado), Image.LANCZOS)

import os
os.makedirs('public', exist_ok=True)

# Convención de Next 16: estos dos se enlazan solos desde src/app/.
dibujar(180).save('src/app/apple-icon.png')      # pantalla de inicio de iOS
dibujar(512).save('src/app/icon.png')            # favicon y el resto

dibujar(192).save('public/icon-192.png')
dibujar(512).save('public/icon-512.png')
dibujar(512, margen_rel=0.14).save('public/icon-maskable-512.png')
print('iconos generados')

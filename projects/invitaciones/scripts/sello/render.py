import numpy as np, sys
from PIL import Image
from scipy import ndimage as ndi

N = 560           # lienzo
C = N / 2
R = 205.0         # radio medio del sello
rng = np.random.default_rng(7)

y, x = np.mgrid[0:N, 0:N].astype(np.float64)
dx, dy = x - C, y - C
r = np.hypot(dx, dy)
th = np.arctan2(dy, dx)

# --- contorno irregular de cera ---
R_th = R * (1 + 0.040*np.sin(5*th + 0.6) + 0.030*np.sin(7*th + 2.1) + 0.022*np.sin(11*th + 0.9)
            + 0.014*np.sin(17*th + 3.3) + 0.010*np.sin(3*th + 1.2))
d_in = R_th - r                       # distancia hacia adentro desde el borde (px)
mask = np.clip(d_in / 1.6 + 0.5, 0, 1)  # alfa con borde suave

# --- mapa de alturas (px) ---
W = 20.0
t = np.clip(d_in / W, 0, 1)
H = 15.0 * np.sqrt(np.clip(1 - (1 - t) ** 2, 0, 1))           # borde redondeado de la cera
H += 5.0 * np.clip(1 - (r / R) ** 2, 0, 1)                    # leve domo

rd = 0.80 * R                                                  # disco hundido
s = np.clip((rd + 5 - r) / 10, 0, 1); s = s*s*(3-2*s)
H -= 10.5 * s
H += 6.0 * np.exp(-((r - rd) / 3.6) ** 2)                      # aro en relieve
H += 2.5 * np.exp(-((r - (rd + 13)) / 2.4) ** 2)               # hilo fino exterior

# laurel: hojas en relieve sobre el disco hundido
def hoja(cx, cy, ang, largo, ancho, alto):
    """campo de altura de una hoja elíptica puntiaguda, orientada por ang (rad), punta hacia +u"""
    u = (x - cx) * np.cos(ang) + (y - cy) * np.sin(ang)
    v = -(x - cx) * np.sin(ang) + (y - cy) * np.cos(ang)
    uu = np.clip(u / largo, 0, 1)
    w = ancho * np.sin(np.pi * uu) ** 0.8 * (1 - 0.25 * uu)
    inside = (u >= 0) & (u <= largo)
    prof = np.where(inside & (w > 0.5), np.clip(1 - (v / np.maximum(w, 0.5)) ** 2, 0, 1) ** 0.6, 0)
    nervio = np.where(inside, np.exp(-(v / 1.2) ** 2) * 0.35, 0)   # nervadura central
    return alto * (prof * (1 - 0.25 * nervio) )
rl = 0.665 * R
for lado in (1, -1):
    for i in range(11):
        ang_pos = np.radians(-66 + i * 13.2)                       # a lo largo del aro (lado derecho)
        px = C + lado * rl * np.cos(ang_pos)
        py = C + rl * np.sin(ang_pos)
        # dirección tangente hacia arriba; hojas alternando hacia afuera/adentro
        base = np.pi / 2 + ang_pos - np.pi / 2  # tangente
        tan_up = np.arctan2(-np.cos(ang_pos), np.sin(ang_pos)) if lado == 1 else np.arctan2(-np.cos(ang_pos), -np.sin(ang_pos))
        for k, off in enumerate((-0.62, 0.62)):
            a = tan_up + off
            f = 1.0 - i * 0.025
            H += hoja(px, py, a, 40 * f, 10.5 * f, 5.5)
# inicial centrada por su caja de tinta
g = Image.open(sys.argv[2]).convert('RGBA').getchannel('A')
bb = g.getbbox(); g = g.crop(bb)
alto_J = 0.80 * rd * 1.45
esc = alto_J / g.height
g = g.resize((max(1, int(g.width * esc)), max(1, int(g.height * esc))), Image.LANCZOS)
lienzo = Image.new('L', (N, N), 0)
lienzo.paste(g, (int(C - g.width / 2), int(C - g.height / 2)))     # centrada en la caja de tinta
Jm = np.asarray(lienzo, dtype=np.float64) / 255
Jm = ndi.gaussian_filter(Jm, 1.3)
H += 8.0 * Jm

# textura de cera: ondulación suave + grano fino
def ruido(sig, amp):
    a = ndi.gaussian_filter(rng.standard_normal((N, N)), sig)
    return amp * a / a.std()
H += ruido(22, 0.85) * mask + ruido(2.0, 0.05) * mask
H *= mask

# --- sombreado ---
Hs = ndi.gaussian_filter(H, 0.8)
gy, gx = np.gradient(Hs)
k = 1.55
nx, ny, nz = -gx * k, -gy * k, np.ones_like(Hs)
nl = np.sqrt(nx*nx + ny*ny + nz*nz); nx, ny, nz = nx/nl, ny/nl, nz/nl
L = np.array([-0.52, -0.62, 0.59]); L /= np.linalg.norm(L)
V = np.array([0, 0, 1.0])
Hh = (L + V); Hh /= np.linalg.norm(Hh)
dif = np.clip(nx*L[0] + ny*L[1] + nz*L[2], 0, 1)
ndh = np.clip(nx*Hh[0] + ny*Hh[1] + nz*Hh[2], 0, 1)
spec = 0.95 * ndh ** 70 + 0.22 * ndh ** 14
# oclusión ambiental: lo hundido se oscurece
amb = ndi.gaussian_filter(H, 9) - H
ao = np.clip(1 - np.clip(amb, 0, 12) / 16, 0.55, 1)
# luz de relleno desde abajo-derecha (rebote)
L2 = np.array([0.6, 0.55, 0.58]); L2 /= np.linalg.norm(L2)
dif2 = np.clip(nx*L2[0] + ny*L2[1] + nz*L2[2], 0, 1)

def pintar(col, salida):
    col = np.array(col, dtype=np.float64)
    # variación de tono (cera no uniforme) y translucidez en el borde delgado
    var = 1 + ruido(30, 0.07) * mask
    fino = np.clip(1 - d_in / 26, 0, 1)
    base = col[None, None, :] * var[..., None]
    luz = (0.30 + 0.95 * dif + 0.14 * dif2)[..., None] * ao[..., None]
    rgb = base * luz
    rgb = rgb + (col * 0.22)[None, None, :] * fino[..., None]          # subsuperficial en el borde
    rgb = rgb + spec[..., None] * 255 * 0.85 * (1 - 0.35 * (col / 255.0).mean())
    rgb = np.clip(rgb, 0, 255)
    # sombra de contacto (debajo, desplazada)
    sh = ndi.shift(mask, (7, 3), order=1)
    sh = ndi.gaussian_filter(sh, 7) * 0.42
    a_out = mask + sh * (1 - mask)
    rgb_out = (rgb * mask[..., None]) / np.maximum(a_out[..., None], 1e-6)
    rgb_out = np.where((mask > 0)[..., None], rgb_out, 0)
    img = np.dstack([np.clip(rgb_out, 0, 255), np.clip(a_out, 0, 1) * 255]).astype(np.uint8)
    Image.fromarray(img).save(salida)

colores = {
    'vino': (128, 14, 30), 'rojo': (172, 24, 38), 'dorado': (190, 150, 62),
    'rosa': (214, 96, 134), 'azul': (36, 52, 96), 'negro': (28, 26, 28),
}
for nombre, col in colores.items():
    pintar(col, f'{sys.argv[1]}/sello-{nombre}.png')
print('ok')

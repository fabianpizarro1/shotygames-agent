#!/usr/bin/env python3
"""
Extrae la clave secreta TOTP (base32) de un QR de 2FA, en local.

Para qué sirve: cuando el 2FA de una cuenta ya está activo y escaneado en
Google Authenticator, DROPI (y casi cualquier servicio) no vuelve a mostrar la
clave. Pero Google Authenticator sí puede re-exportarla:

    Google Authenticator → ⋮ (3 puntos) → "Transferir cuentas" → "Exportar cuentas"
    → seleccionar SOLO la cuenta que interesa → sale un QR

Ese QR contiene `otpauth-migration://offline?data=...`, un protobuf en base64
con los secretos reales. Este script lo decodifica sin mandar nada a internet.

  ⚠️ NUNCA pegar ese QR ni esa URL en un decodificador online: contiene el
  secreto 2FA real, que es acceso permanente a la cuenta.

Uso:
    python3 scripts/decodificar-qr-2fa.py ~/Downloads/IMG_1866.PNG

Historia: se armó a mano el 2026-07-24 para la cuenta principal de DROPI
(DROPI_TOTP_SECRET) y se volvió a necesitar el 2026-08-30 para la cuenta de
dropshipping (DROPI2_TOTP_SECRET). A la segunda vez, se guarda.
"""

import base64
import sys
import urllib.parse

try:
    import cv2
except ImportError:
    sys.exit("Falta opencv. Instalar con:  pip3 install --user opencv-python-headless")


def leer_qr(ruta):
    """Lee el QR probando varias transformaciones — las capturas de celular
    suelen venir enormes y el detector falla a resolución completa."""
    img = cv2.imread(ruta)
    if img is None:
        sys.exit(f"No se pudo abrir la imagen: {ruta}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    detector = cv2.QRCodeDetector()

    def intentar(im):
        data, _, _ = detector.detectAndDecode(im)
        if data:
            return data
        ok, infos, _, _ = detector.detectAndDecodeMulti(im)
        if ok:
            for d in infos:
                if d:
                    return d
        return None

    candidatos = [img, gray]
    for escala in (0.5, 0.35, 0.25, 0.2):
        candidatos.append(cv2.resize(gray, None, fx=escala, fy=escala,
                                     interpolation=cv2.INTER_AREA))
    _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    candidatos.append(otsu)

    for im in candidatos:
        res = intentar(im)
        if res:
            return res
    sys.exit("No se pudo leer ningún QR en esa imagen. Probá con una captura más nítida o recortada.")


# ── Protobuf mínimo (solo lo que usa el formato de migración) ────────────────

def _varint(buf, i):
    resultado, desplazamiento = 0, 0
    while True:
        b = buf[i]
        i += 1
        resultado |= (b & 0x7F) << desplazamiento
        if not b & 0x80:
            return resultado, i
        desplazamiento += 7


def _mensaje(buf):
    campos = {}
    i = 0
    while i < len(buf):
        tag, i = _varint(buf, i)
        numero, tipo = tag >> 3, tag & 0x7
        if tipo == 0:
            valor, i = _varint(buf, i)
        elif tipo == 2:
            largo, i = _varint(buf, i)
            valor, i = buf[i:i + largo], i + largo
        else:
            raise ValueError(f"wire type no soportado: {tipo}")
        campos.setdefault(numero, []).append(valor)
    return campos


def cuentas_de_migracion(uri):
    data_b64 = urllib.parse.parse_qs(urllib.parse.urlparse(uri).query)["data"][0]
    crudo = base64.b64decode(data_b64 + "=" * (-len(data_b64) % 4))

    for bloque in _mensaje(crudo).get(1, []):
        otp = _mensaje(bloque)
        texto = lambda campo: (otp.get(campo, [b""])[0] or b"").decode("utf8", "replace")
        yield {
            "cuenta": texto(2),
            "emisor": texto(3),
            "secreto": base64.b32encode(otp.get(1, [b""])[0]).decode().rstrip("="),
        }


def main():
    if len(sys.argv) != 2:
        sys.exit(f"Uso: python3 {sys.argv[0]} <ruta-de-la-captura-del-QR>")

    uri = leer_qr(sys.argv[1])

    if uri.startswith("otpauth-migration://"):
        cuentas = list(cuentas_de_migracion(uri))
    elif uri.startswith("otpauth://"):
        # QR de alta normal (el que se ve al activar el 2FA por primera vez)
        params = urllib.parse.parse_qs(urllib.parse.urlparse(uri).query)
        cuentas = [{
            "cuenta": urllib.parse.unquote(urllib.parse.urlparse(uri).path.lstrip("/")),
            "emisor": params.get("issuer", [""])[0],
            "secreto": params.get("secret", [""])[0],
        }]
    else:
        sys.exit(f"El QR no es de 2FA. Contenido: {uri[:80]}")

    print(f"\n{len(cuentas)} cuenta(s) en el QR:\n")
    for c in cuentas:
        print(f"  cuenta : {c['cuenta']}")
        print(f"  emisor : {c['emisor']}")
        print(f"  SECRETO: {c['secreto']}\n")
    print("Guardar el SECRETO en .env (ej. DROPI2_TOTP_SECRET=...) y borrar la captura.\n")


if __name__ == "__main__":
    main()

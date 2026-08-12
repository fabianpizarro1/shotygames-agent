# API de DROPI — reglas que no están documentadas

Todo esto se descubrió a golpes entre el 8 y el 10 de agosto de 2026. **Leer esto antes de tocar cualquier integración con DROPI** — descubrirlo de nuevo cuesta días.

Base: `https://api.dropi.ec/api` (Ecuador). Colombia es `api.dropi.co` y rechaza tokens de Ecuador con `401 Token is Invalid`.

---

## Regla 1 — Nunca escribir un cliente nuevo

Usar siempre el de `dropi.js`:

```js
const { _makeClient } = require('../../dropi');
const client = _makeClient(token);
```

Las dos reglas de abajo son la razón. Si se escribe un cliente nuevo, se vuelven a pisar los mismos rastrillos.

## Regla 2 — Solo `x-authorization`, jamás `authorization`

En llamadas autenticadas:

| Headers enviados | Resultado |
|---|---|
| `x-authorization: Bearer <token>` | ✅ 200 |
| `authorization` + `x-authorization` | ❌ 403 Access denied |
| `x-authorization` sin `Bearer` | ❌ 401 token could not be parsed |

El `403` no dice nada útil: es el mismo error para "cuenta sin permisos", "token vencido" y "mandaste un header de más".

## Regla 3 — El login exige los headers `sec-fetch-*`

`POST /login` con `{ email, password, white_brand_id: 1, brand: '', with_cdc: false }` **falla con `403 Access denied` si faltan**:

```
sec-fetch-dest: empty
sec-fetch-mode: cors
sec-fetch-site: same-site
```

Con credenciales perfectamente válidas. Este fue el que costó 2 días y medio.

## Regla 4 — El login devuelve 200 aunque la contraseña esté mal

No sirve mirar el status. La única verificación válida es **si vino un token usable** en `res.data.token`. Con contraseña incorrecta responde 200 sin token.

Además, si la cuenta tiene 2FA, el token que llega puede ser temporal — se detecta decodificando su payload (`token_type === '2FA'`) y hay que completar con `POST /auth/2fa/verify`. La cuenta dropshipper (12054) no tiene 2FA; la principal sí.

## Regla 5 — Buscar productos: el parámetro es `keywords`

```js
await client.post('/products/index', { pageSize: 100, startData: 0, keywords: 'audifonos' });
```

- `textToSearch` se acepta pero **se ignora en silencio** y devuelve el catálogo completo. Es la peor clase de bug: parece funcionar.
- La paginación por `startData` sí funciona.
- El campo `count` de la respuesta siempre viene en `0`. No sirve para saber el total — hay que paginar hasta que vuelva vacío.
- Catálogo de Ecuador el 2026-08-08: **32.939 productos**.

## Regla 6 — `GET /products/{id}` se traga cualquier ruta

`GET /products/index`, `/products/search`, `/products/list` no son endpoints: caen todos en la ruta de "ver producto" y devuelven `"Ha ocurrido un error al obtener el producto"`. Eso **no** significa que el endpoint no exista — significa que se está pidiendo un producto con ese nombre como id.

## Regla 7 — Los tokens duran poco y se invalidan solos

El JWT trae 4 horas de vigencia, pero DROPI los invalida antes (probablemente al refrescar la sesión del navegador). No sirve guardar un token a mano: hay que tener el login automático funcionando.

---

## Cómo diagnosticar un fallo nuevo

En este orden, sin saltarse pasos:

1. **Diffear contra `dropi.js`** campo por campo, header por header. La mayoría de los fallos mueren acá.
2. Probar la **misma función** con las credenciales de la cuenta que sí funciona. Si esa pasa y la otra no, recién ahí es problema de cuenta.
3. Probar con un correo inventado, para ver cómo se ve un error de credenciales de verdad. En DROPI se ve igual que todo lo demás (`403`), así que ese error **no prueba nada**.
4. Recién entonces considerar causas externas (plan, permisos, bloqueo).

Lo que **no** hay que hacer: pedirle a Fabián que copie tokens del navegador, corra snippets en la consola o hable con soporte antes de agotar los pasos 1 y 2. Eso ya pasó y costó dos días y medio.

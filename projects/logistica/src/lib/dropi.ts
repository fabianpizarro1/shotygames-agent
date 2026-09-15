// ============================================================
// CLIENTE DE LA API DE DROPI (solo servidor)
//
// Hay DOS cuentas de DROPI y NO se pueden mezclar: un token de una no sirve
// para consultar órdenes de la otra.
//
//   · `dropiShotygames`  → `DROPI_*`  — Fabián es el PROVEEDOR, despacha lo suyo
//   · `dropiDropshipper` → `DROPI2_*` — Fabián COMPRA a otros proveedores
//
// Cada una tiene su propio token en memoria y su propia clave de caché.
//
// Reglas que se descubrieron a golpes (ver `KEPLER/projects/dropshipping/API-DROPI.md`).
// Romper cualquiera de estas da un error que no dice nada:
//
//  1. Header `x-authorization`, NUNCA `authorization`. Mandar los dos → 403.
//  2. El login exige los `sec-fetch-*`. Sin ellos → 403 con credenciales válidas.
//  3. `/login` responde 200 aunque la contraseña esté mal: la única prueba de
//     éxito es que venga un token usable.
//  4. La cuenta tiene 2FA desde el 2026-08-30: el token de `/login` puede ser
//     temporal (`token_type === '2FA'`) y hay que completarlo en `/auth/2fa/verify`.
//  5. Un rechazo puede llegar como HTTP 200 con `isSuccess:false` en el cuerpo.
//     Sin ese chequeo, el `status: 400` del error se lee como estado de envío.
//  6. Los tokens caducan sin aviso → ante 401/403 se re-loguea una vez.
//
// El token vive en memoria del lambda. Vercel recicla instancias, así que un
// re-login ocasional es normal y esperado, no un error.
// ============================================================

import crypto from 'crypto';
import { unstable_cache } from 'next/cache';
import type { Movimiento, Tracking, HistorialEstado } from './tipos';

const BASE = 'https://api.dropi.ec/api';

// ─── TOTP (RFC 6238) sin dependencias ────────────────────────────────────────

function base32Decode(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = input.toUpperCase().replace(/=+$/, '');
  let bits = '';
  for (const char of clean) {
    const val = alphabet.indexOf(char);
    if (val === -1) throw new Error('Caracter base32 inválido: ' + char);
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function generateTotp(secret: string, digits = 6, step = 30): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 1000 / step)));
  const hmac = crypto.createHmac('sha1', base32Decode(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 10 ** digits).toString().padStart(digits, '0');
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

const HEADERS_BASE: Record<string, string> = {
  accept: 'application/json, text/plain, */*',
  'accept-language': 'es-EC,es;q=0.9',
  'content-type': 'application/json',
  origin: 'https://app.dropi.ec',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
};

/** Qué credenciales usa cada cuenta y con qué nombre se la identifica. */
interface Cuenta {
  /** Solo para mensajes de error y claves de caché. */
  id: string;
  varEmail: string;
  varPassword: string;
  varTotp: string;
}

async function login(cuenta: Cuenta): Promise<string> {
  const email = process.env[cuenta.varEmail];
  const password = process.env[cuenta.varPassword];
  const totpSecret = process.env[cuenta.varTotp];

  if (!email || !password) {
    throw new Error(`Faltan ${cuenta.varEmail} / ${cuenta.varPassword} (cuenta ${cuenta.id})`);
  }
  if (!totpSecret) {
    throw new Error(
      `Falta ${cuenta.varTotp}. La cuenta ${cuenta.id} usa 2FA. Si ya está escaneado en ` +
        'Google Authenticator, la clave se recupera sin desactivar nada: exportar la cuenta ' +
        'desde Authenticator y decodificar el QR con KEPLER/scripts/decodificar-qr-2fa.py'
    );
  }

  const otp = generateTotp(totpSecret);
  const headers = { ...HEADERS_BASE, referer: 'https://app.dropi.ec/login' };

  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, white_brand_id: 1, brand: '', otp, with_cdc: false }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string };
  let token = data?.token;
  if (!token) {
    throw new Error(
      `Login DROPI (${cuenta.id}) falló: sin token (¿contraseña incorrecta? responde 200 igual)`
    );
  }

  if (decodeJwtPayload(token)?.token_type === '2FA') {
    const verify = await fetch(`${BASE}/auth/2fa/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ token, code: otp }),
      signal: AbortSignal.timeout(20_000),
    });
    token = ((await verify.json().catch(() => ({}))) as { token?: string })?.token;
    if (!token) throw new Error(`Login DROPI (${cuenta.id}) falló: sin token tras verificar 2FA`);
  }

  return token.replace(/^Bearer\s+/i, '').trim();
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Ritmo global hacia api.dropi.ec ─────────────────────────────────────────
//
// El límite lo pone el HOST, no la cuenta. Cuando cada cliente traía su propio
// lote de 6, con una sola cuenta andaba; al sumar la segunda, las dos disparaban
// a la vez, el ritmo se duplicó y DROPI empezó a devolver 429: 19 de 82 pedidos
// se quedaron sin tracking (2026-09-03).
//
// Por eso el control es global y no por cliente: como mucho MAX_EN_VUELO
// llamadas simultáneas y un mínimo de ESPACIO_MS entre arranques, sin importar
// cuántas cuentas estén pidiendo.

const MAX_EN_VUELO = 6;
const ESPACIO_MS = 150;

let enVuelo = 0;
let ultimoArranque = 0;
const esperando: (() => void)[] = [];

function liberar() {
  enVuelo--;
  esperando.shift()?.();
}

async function conRitmo<T>(fn: () => Promise<T>): Promise<T> {
  if (enVuelo >= MAX_EN_VUELO) {
    await new Promise<void>((r) => esperando.push(r));
  }
  enVuelo++;
  try {
    const desde = Date.now() - ultimoArranque;
    if (desde < ESPACIO_MS) await dormir(ESPACIO_MS - desde);
    ultimoArranque = Date.now();
    return await fn();
  } finally {
    liberar();
  }
}

/**
 * El estado de sesión de una cuenta.
 *
 * `login` guarda el login EN CURSO, no solo el token ya obtenido. Sin eso, al
 * arrancar con la caché vacía las ~30 consultas salían todas juntas, veían
 * `token: null` y disparaban 30 logins simultáneos de la misma cuenta: DROPI
 * los rechazaba ("sin token") y el resto moría por timeout. Con el login
 * compartido, las 30 esperan el mismo y entra uno solo.
 */
interface Sesion {
  token: string | null;
  login: Promise<string> | null;
}

async function conSesion(cuenta: Cuenta, sesion: Sesion, forzar = false): Promise<string> {
  if (!forzar && sesion.token) return sesion.token;
  if (!sesion.login) {
    sesion.login = login(cuenta)
      .then((t) => {
        sesion.token = t;
        return t;
      })
      .finally(() => {
        sesion.login = null;
      });
  }
  return sesion.login;
}

/**
 * GET autenticado contra DROPI. `sesion` guarda el token de ESTA cuenta — el
 * token es por cuenta y usar el de la otra da 403 sin mensaje útil.
 */
async function apiGet(
  cuenta: Cuenta,
  sesion: Sesion,
  path: string
): Promise<Record<string, unknown>> {
  const call = (token: string) =>
    conRitmo(() =>
      fetch(`${BASE}${path}`, {
        headers: {
          ...HEADERS_BASE,
          referer: 'https://app.dropi.ec/',
          'x-authorization': `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(20_000),
      })
    );

  let token = await conSesion(cuenta, sesion);
  let res = await call(token);

  if (res.status === 401 || res.status === 403) {
    token = await conSesion(cuenta, sesion, true);
    res = await call(token);
  }

  // 429: DROPI corta cuando se le piden ~50 órdenes de corrido. No es un error
  // del pedido, es la API pidiendo aire — se espera y se reintenta. Sin esto,
  // media cola aparecía "sin tracking" y con una alerta falsa de id cambiado.
  for (let intento = 0; res.status === 429 && intento < 3; intento++) {
    await dormir(700 * (intento + 1));
    res = await call(token);
  }

  if (!res.ok) {
    const err = new Error(`DROPI ${path} → ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// ─── Limpieza de los campos sucios ───────────────────────────────────────────

/**
 * `nom_conc` es texto libre que llena el repartidor: llega con ".", "{}" y
 * cosas tipeadas a mano que no son un motivo. El motivo confiable es
 * `nom_mov` + `novedad_servientrega`.
 */
function limpiarMotivo(v: unknown): string {
  const t = String(v ?? '').trim();
  if (!t || t === '.' || t === '{}' || t === 'null' || t === 'undefined') return '';
  return t;
}

const num = (v: unknown) => {
  const n = parseFloat(String(v ?? '0').replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown) => (v === null || v === undefined || v === '' ? null : String(v));

// ─── Lectura de órdenes ──────────────────────────────────────────────────────

/**
 * Resultado de consultar una orden. Los dos modos de "no hay tracking" NO son
 * lo mismo y confundirlos hacía que la app le dijera a Fabián "revisá este
 * pedido a mano" por un simple 429 de la API:
 *
 *   · `no-existe` → DROPI dice que esa orden no está. Pasa de verdad: cuando
 *     Fabián edita un pedido en el panel, DROPI no lo edita, lo vuelve a crear
 *     con id nuevo. Eso sí hay que ir a resolverlo.
 *   · `fallo` → no se pudo preguntar (429, timeout, red). El pedido está bien;
 *     el que falló fue el intento. Se reintenta solo en la próxima carga.
 */
export type Resultado =
  | { tipo: 'ok'; t: Tracking }
  | { tipo: 'no-existe' }
  | { tipo: 'fallo'; motivo: string };

async function consultarOrden(
  cuenta: Cuenta,
  sesion: Sesion,
  ordenId: number
): Promise<Resultado> {
  try {
    const data = await apiGet(cuenta, sesion, `/orders/myorders/${ordenId}`);

    // Rechazo disfrazado de éxito: HTTP 200 + isSuccess:false.
    if ((data as { isSuccess?: boolean }).isSuccess === false) return { tipo: 'no-existe' };

    const o = ((data.objects ?? data.order ?? data) ?? {}) as Record<string, unknown>;
    if (!o || typeof o !== 'object' || !o.id) return { tipo: 'no-existe' };

    return { tipo: 'ok', t: normalizar(o, ordenId) };
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 404) return { tipo: 'no-existe' };
    const motivo = e instanceof Error ? e.message : String(e);
    console.error(`DROPI ${cuenta.id} tracking ${ordenId}:`, motivo);
    return { tipo: 'fallo', motivo: status === 429 ? 'DROPI está limitando las consultas' : motivo };
  }
}

function normalizar(o: Record<string, unknown>, ordenId: number): Tracking {
  const guia = str(o.shipping_guide ?? o.tracking_number);

  // Los movimientos vienen en `servientrega_movements` aunque despache
  // GINTRACOM o LAARCOURIER — el nombre del campo quedó de cuando DROPI solo
  // trabajaba con Servientrega. Verificado el 2026-09-03 en órdenes reales.
  const crudos = (
    Array.isArray(o.servientrega_movements) ? o.servientrega_movements : []
  ) as Record<string, unknown>[];

  const movimientos: Movimiento[] = crudos
    .map((m) => {
      const movimiento = String(m.nom_mov ?? '').trim();
      const motivo = limpiarMotivo(m.nom_conc);
      return {
        movimiento,
        // GINTRACOM manda `nom_mov` y `nom_conc` idénticos, así que el detalle
        // salía repetido debajo del título en cada paso del recorrido. Solo se
        // muestra el motivo cuando dice algo que el nombre no dice ya.
        motivo: motivo.toUpperCase() === movimiento.toUpperCase() ? '' : motivo,
        fecha: String(m.serv_date ?? m.created_at ?? ''),
      };
    })
    .filter((m) => m.movimiento)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  const historial: HistorialEstado[] = (
    Array.isArray(o.history) ? o.history : []
  )
    .map((h) => {
      const x = h as Record<string, unknown>;
      return { estado: String(x.status ?? '').trim(), fecha: String(x.created_at ?? '') };
    })
    .filter((h) => h.estado)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  // `guia_urls3` es la ruta real del PDF y varía según la transportadora. La
  // versión vieja asumía siempre "servientrega" y el link salía roto para todo
  // lo despachado por GINTRACOM o LAARCOURIER.
  const pdf = o.guia_urls3
    ? `https://d39ru7awumhhs2.cloudfront.net/${o.guia_urls3}`
    : null;

  return {
    ordenId,
    guia,
    // Se usa `status`, NO `estatus`: en las órdenes de GINTRACOM `estatus`
    // queda congelado en "EN BODEGA ORIGEN" incluso ya entregadas.
    estado: str(o.status),
    novedad: str(o.novedad_servientrega),
    fechaUltimaNovedad: str(o.date_last_incidence),
    transportadora: str(o.shipping_company),
    movimientos,
    historial,
    direccion: str(o.dir),
    fletePorCobrar: num(o.shipping_amount),
    pdf,
    fuente: 'dropi',
    destino: null,
    cliente:
      o.client_total_orders !== undefined
        ? {
            pedidos: num(o.client_total_orders),
            entregados: num(o.client_total_orders_delivered),
            devueltos: num(o.client_total_orders_returneds),
          }
        : null,
  };
}

// ─── Caché ───────────────────────────────────────────────────────────────────
//
// Consultar las órdenes en movimiento una por una tarda ~15 segundos. Sin caché
// eso pasaba en CADA carga de la cola y después de CADA cambio de estado, que
// es lo que convierte una herramienta en algo que da pereza abrir.
//
// El TTL es de 10 minutos y no cuesta frescura: DROPI se actualiza con unas 5
// horas de retraso respecto a la transportadora, así que un dato de hace 10
// minutos y uno de hace 10 segundos son literalmente el mismo dato.
//
// ⚠️ Va en la Data Cache de Next (`unstable_cache`), NO en un Map en memoria.
// La primera versión usaba un Map y en local andaba perfecto — pero Vercel
// levanta varias instancias del lambda y cada una arrancaba con su Map vacío:
// en producción la misma pantalla tardaba 13 s, 18 s y 5 s en tres cargas
// seguidas. La Data Cache la comparten todas las instancias.

const TTL_S = 10 * 60;

export interface Lote {
  tracking: Map<number, Tracking>;
  /** Órdenes que DROPI dice que no existen — el id cambió, hay que resolverlo. */
  inexistentes: Set<number>;
  /** Órdenes que no se pudieron consultar ahora. No es problema del pedido. */
  fallaron: Map<number, string>;
}

export interface ClienteDropi {
  id: string;
  getTrackingBatch(ids: number[]): Promise<Lote>;
}

/**
 * Un cliente atado a UNA cuenta de DROPI.
 *
 * El token y la clave de caché llevan el id de la cuenta adentro. Sin eso, la
 * orden 6843328 de ShotyGames y una del mismo número en la cuenta dropshipper
 * compartirían entrada de caché y la app mostraría el paquete de otro negocio.
 */
function crearCliente(cuenta: Cuenta): ClienteDropi {
  // El token vive en memoria del lambda. Vercel recicla instancias, así que un
  // re-login ocasional es normal y esperado, no un error.
  const sesion: Sesion = { token: null, login: null };

  /**
   * Una orden, pasando por la Data Cache.
   *
   * **Solo se guarda el resultado bueno.** Los otros dos se propagan como
   * excepción a propósito, porque `unstable_cache` guarda lo que la función
   * devuelva:
   *
   *   · un `fallo` cacheado dejaría un 429 de un segundo pegado 10 minutos;
   *   · un `no-existe` cacheado haría que, después de que Fabián arregle la
   *     orden en el panel de DROPI, la app siguiera diciendo que no existe.
   *
   * Los dos casos son raros, así que reconsultarlos siempre no cuesta nada.
   */
  async function consultarConCache(ordenId: number): Promise<Resultado> {
    try {
      return await unstable_cache(
        async () => {
          const r = await consultarOrden(cuenta, sesion, ordenId);
          if (r.tipo !== 'ok') throw new Error(r.tipo === 'fallo' ? r.motivo : 'no-existe');
          return r;
        },
        ['dropi-orden', cuenta.id, String(ordenId)],
        { revalidate: TTL_S, tags: [`dropi-tracking-${cuenta.id}`] }
      )();
    } catch (e) {
      const motivo = e instanceof Error ? e.message : 'no se pudo consultar';
      return motivo === 'no-existe' ? { tipo: 'no-existe' } : { tipo: 'fallo', motivo };
    }
  }

  /**
   * El tracking de todas las órdenes en movimiento.
   *
   * Se piden todas de una: quien decide el ritmo real es `conRitmo`, que es
   * global al proceso. Espaciarlas también acá haría que dos negocios en
   * paralelo se sumaran igual, que es exactamente el bug que hubo.
   *
   * Lo que sale de la caché no toca la red, así que una cola ya cacheada se
   * resuelve sin esperar nada.
   *
   * **No hay forma de forzar un refresco, y es a propósito.** La primera
   * versión tenía un `?fresco=1` que llamaba a `revalidateTag` y volvía a pedir
   * todo en el mismo request: invalidar y repoblar a la vez hace que Next
   * descarte lo recién escrito, y la carga SIGUIENTE tardaba 34 segundos.
   */
  async function getTrackingBatch(ids: number[]): Promise<Lote> {
    const tracking = new Map<number, Tracking>();
    const inexistentes = new Set<number>();
    const fallaron = new Map<number, string>();

    const res = await Promise.all(ids.map((id) => consultarConCache(id)));

    res.forEach((r, j) => {
      const id = ids[j];
      if (r.tipo === 'ok') tracking.set(id, r.t);
      else if (r.tipo === 'no-existe') inexistentes.add(id);
      else fallaron.set(id, r.motivo);
    });

    return { tracking, inexistentes, fallaron };
  }

  return { id: cuenta.id, getTrackingBatch };
}

/** Cuenta de ShotyGames — Fabián es el PROVEEDOR y despacha su propio producto. */
export const dropiShotygames = crearCliente({
  id: 'shotygames',
  varEmail: 'DROPI_EMAIL',
  varPassword: 'DROPI_PASSWORD',
  varTotp: 'DROPI_TOTP_SECRET',
});

/** Cuenta dropshipper — Fabián COMPRA a otros proveedores (Truquito y Avanora). */
export const dropiDropshipper = crearCliente({
  id: 'dropshipper',
  varEmail: 'DROPI2_EMAIL',
  varPassword: 'DROPI2_PASSWORD',
  varTotp: 'DROPI2_TOTP_SECRET',
});

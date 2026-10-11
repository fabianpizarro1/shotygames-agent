'use client';

import { useEffect, useRef, useState } from 'react';
import TextoIA from './TextoIA';

interface Mensaje {
  role: 'user' | 'assistant';
  content: string;
  /** Mandó una foto. La imagen vive solo en memoria: en localStorage no entra. */
  foto?: boolean;
  imagen?: string;
  /** Lo mandó por audio. */
  voz?: boolean;
}

const RAPIDAS = ['¿Qué debería hacer ahora?', '¿Cómo voy esta semana?', 'Estoy saturado, ¿qué hago?', '¿Qué puedo dejar de hacer yo?'];
const CLAVE_VOZ = 'progreso-voz';
const MAX_GRABACION_S = 180;

// 0,1 s de silencio en WAV. iOS solo deja reproducir audio si el elemento ya
// sonó dentro de un toque del usuario; la respuesta en voz llega segundos
// después, así que en el toque se "desbloquea" el elemento con esto.
function silencio(): string {
  const n = 800;
  const b = new ArrayBuffer(44 + n);
  const v = new DataView(b);
  const s = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  s(0, 'RIFF');
  v.setUint32(4, 36 + n, true);
  s(8, 'WAVE');
  s(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true);
  v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  s(36, 'data');
  v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}

// Las fotos del iPhone pesan 3-5 MB y Vercel corta en 4,5: se achican a lo
// que Claude igual usaría (lado mayor 1568 px).
async function reducir(archivo: File): Promise<string> {
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const escala = Math.min(1, 1568 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * escala);
    c.height = Math.round(img.naturalHeight * escala);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function Icono({ d, relleno = false }: { d: string; relleno?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill={relleno ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
const MIC = 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM19 11a7 7 0 0 1-14 0M12 18v3';
const CAMARA = 'M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z';
const PARLANTE = 'M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13';
const PARAR = 'M7 7h10v10H7z';

// El chat vive en el teléfono (localStorage, uno por día): el estado real ya
// lo trae la foto del momento en cada pregunta, el historial no necesita servidor.
export default function ChatIA({ fecha }: { fecha: string }) {
  const clave = `progreso-chat-${fecha}`;
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [grabando, setGrabando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [transcribiendo, setTranscribiendo] = useState(false);
  const [siempreVoz, setSiempreVoz] = useState(false);
  const [sonando, setSonando] = useState<number | null>(null);
  const [cargandoVoz, setCargandoVoz] = useState<number | null>(null);
  const [aviso, setAviso] = useState('');
  const fin = useRef<HTMLDivElement>(null);
  const inputFoto = useRef<HTMLInputElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const grabadora = useRef<{ rec: MediaRecorder; trozos: Blob[]; cancelar: boolean; reloj: number } | null>(null);

  useEffect(() => {
    try {
      setMensajes(JSON.parse(localStorage.getItem(clave) ?? '[]'));
      setSiempreVoz(localStorage.getItem(CLAVE_VOZ) === '1');
    } catch {}
  }, [clave]);

  useEffect(() => {
    try {
      localStorage.setItem(clave, JSON.stringify(mensajes.map((m) => ({ ...m, imagen: undefined }))));
    } catch {}
    fin.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensajes, clave]);

  // ── Audio de salida ────────────────────────────────────

  function desbloquearAudio() {
    if (audio.current) return;
    const a = new Audio();
    a.src = silencio();
    a.play().catch(() => {});
    audio.current = a;
  }

  function pararVoz() {
    audio.current?.pause();
    setSonando(null);
  }

  async function escuchar(i: number, contenido: string) {
    desbloquearAudio();
    pararVoz();
    setCargandoVoz(i);
    try {
      const r = await fetch('/api/ia/voz', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ texto: contenido }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `Error ${r.status}`);
      const url = URL.createObjectURL(await r.blob());
      const a = audio.current!;
      a.src = url;
      a.onended = () => {
        setSonando(null);
        URL.revokeObjectURL(url);
      };
      await a.play();
      setSonando(i);
    } catch (e) {
      setAviso(`No pude leerlo en voz: ${e instanceof Error ? e.message : 'error'}`);
    } finally {
      setCargandoVoz(null);
    }
  }

  // ── Enviar ─────────────────────────────────────────────

  async function enviar(pregunta: string, { porVoz = false }: { porVoz?: boolean } = {}) {
    const imagen = foto;
    const q = pregunta.trim() || (imagen ? 'Mira esta foto.' : '');
    if (!q || enviando) return;
    desbloquearAudio();
    pararVoz();
    setAviso('');
    const nuevo: Mensaje = { role: 'user', content: q, ...(imagen && { foto: true, imagen }), ...(porVoz && { voz: true }) };
    const historial: Mensaje[] = [...mensajes, nuevo];
    const indice = historial.length;
    setMensajes([...historial, { role: 'assistant', content: '' }]);
    setTexto('');
    setFoto(null);
    setEnviando(true);
    const conVoz = porVoz || siempreVoz;
    let acumulado = '';
    try {
      const r = await fetch('/api/ia/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          // Las fotos viejas no se reenvían: queda dicho que hubo una.
          mensajes: historial.map((m, i) => ({
            role: m.role,
            content: m.foto && i < historial.length - 1 ? `[Mandé una foto] ${m.content}` : m.content,
          })),
          imagen: imagen ?? undefined,
          voz: conVoz,
        }),
      });
      if (!r.ok || !r.body) throw new Error(r.status === 401 ? 'Sesión vencida, vuelve a entrar.' : `Error ${r.status}`);
      const lector = r.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        acumulado += dec.decode(value, { stream: true });
        setMensajes([...historial, { role: 'assistant', content: acumulado }]);
      }
    } catch (e) {
      acumulado = '';
      setMensajes([...historial, { role: 'assistant', content: `⚠️ ${e instanceof Error ? e.message : 'Error'}` }]);
    } finally {
      setEnviando(false);
    }
    if (conVoz && acumulado.trim() && !acumulado.includes('⚠️')) escuchar(indice, acumulado);
  }

  // ── Grabar ─────────────────────────────────────────────

  async function empezarGrabacion() {
    desbloquearAudio();
    pararVoz();
    setAviso('');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setAviso('No tengo permiso para el micrófono. Actívalo en los ajustes del navegador.');
      return;
    }
    const tipo = ['audio/webm', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
    const estado = { rec, trozos: [] as Blob[], cancelar: false, reloj: 0 };
    rec.ondataavailable = (e) => e.data.size && estado.trozos.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      clearInterval(estado.reloj);
      setGrabando(false);
      grabadora.current = null;
      if (estado.cancelar || !estado.trozos.length) return;
      setTranscribiendo(true);
      try {
        const form = new FormData();
        form.append('audio', new Blob(estado.trozos, { type: rec.mimeType || tipo || 'audio/mp4' }));
        const r = await fetch('/api/ia/transcribir', { method: 'POST', body: form });
        const j = (await r.json().catch(() => ({}))) as { texto?: string; error?: string };
        if (!r.ok) throw new Error(j.error ?? `Error ${r.status}`);
        if (!j.texto) throw new Error('No se escuchó nada');
        setTranscribiendo(false);
        await enviar(j.texto, { porVoz: true });
      } catch (e) {
        setAviso(`No entendí el audio: ${e instanceof Error ? e.message : 'error'}`);
      } finally {
        setTranscribiendo(false);
      }
    };
    rec.start();
    setSegundos(0);
    setGrabando(true);
    estado.reloj = window.setInterval(() => {
      setSegundos((s) => {
        if (s + 1 >= MAX_GRABACION_S && rec.state === 'recording') rec.stop();
        return s + 1;
      });
    }, 1000);
    grabadora.current = estado;
  }

  function terminarGrabacion(cancelar: boolean) {
    const g = grabadora.current;
    if (!g) return;
    if (!cancelar) desbloquearAudio();
    g.cancelar = cancelar;
    if (g.rec.state === 'recording') g.rec.stop();
  }

  async function elegirFoto(archivo: File | undefined) {
    if (!archivo) return;
    try {
      setFoto(await reducir(archivo));
    } catch {
      setAviso('No pude abrir esa foto.');
    }
  }

  function alternarVoz() {
    const v = !siempreVoz;
    setSiempreVoz(v);
    if (v) desbloquearAudio();
    else pararVoz();
    try {
      localStorage.setItem(CLAVE_VOZ, v ? '1' : '0');
    } catch {}
  }

  const ocupado = enviando || transcribiendo;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-[var(--color-texto-suave)]">
          {mensajes.length ? '' : 'Conoce tu agenda, tus proyectos, tus tareas y cómo vas en la semana. Háblale, mándale fotos o escríbele.'}
        </p>
        <button
          onClick={alternarVoz}
          aria-pressed={siempreVoz}
          className={`pulsable flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
            siempreVoz ? 'border-[var(--color-acento)] bg-[var(--color-acento-tenue)] text-[var(--color-acento)]' : 'border-[var(--color-borde)] text-[var(--color-texto-suave)]'
          }`}
        >
          <Icono d={PARLANTE} />
          {siempreVoz ? 'Responde en voz' : 'Voz apagada'}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {mensajes.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="ml-10 flex flex-col items-end gap-1 self-end">
              {m.imagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.imagen} alt="Foto enviada" className="max-h-56 rounded-2xl rounded-br-md object-cover" />
              ) : (
                m.foto && <span className="text-xs text-[var(--color-texto-tenue)]">📷 foto</span>
              )}
              <p className="rounded-2xl rounded-br-md bg-[var(--color-acento)] px-3.5 py-2 text-sm text-white">
                {m.voz && '🎤 '}
                {m.content}
              </p>
            </div>
          ) : (
            <div key={i} className="tarjeta mr-4 px-3.5 py-2.5">
              {m.content ? <TextoIA texto={m.content} /> : <p className="text-sm text-[var(--color-texto-tenue)]">Pensando…</p>}
              {m.content && !(enviando && i === mensajes.length - 1) && !m.content.startsWith('⚠️') && (
                <button
                  onClick={() => (sonando === i ? pararVoz() : escuchar(i, m.content))}
                  disabled={cargandoVoz !== null && cargandoVoz !== i}
                  className="pulsable mt-2 flex items-center gap-1.5 text-xs text-[var(--color-texto-tenue)] disabled:opacity-40"
                >
                  <Icono d={sonando === i ? PARAR : PARLANTE} relleno={sonando === i} />
                  {cargandoVoz === i ? 'Preparando voz…' : sonando === i ? 'Parar' : 'Escuchar'}
                </button>
              )}
            </div>
          )
        )}
        {transcribiendo && <p className="self-end text-xs text-[var(--color-texto-tenue)]">Entendiendo tu audio…</p>}
        <div ref={fin} />
      </div>

      {aviso && <p className="rounded-lg bg-[var(--color-ambar-tenue)] px-3 py-2 text-xs text-[var(--color-ambar)]">{aviso}</p>}

      {!grabando && (
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4">
          {RAPIDAS.map((q) => (
            <button
              key={q}
              onClick={() => enviar(q)}
              disabled={ocupado}
              className="pulsable shrink-0 rounded-full border border-[var(--color-borde)] px-3 py-1.5 text-xs disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {foto && !grabando && (
        <div className="relative self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={foto} alt="Foto por enviar" className="h-24 rounded-xl object-cover" />
          <button
            onClick={() => setFoto(null)}
            aria-label="Quitar foto"
            className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-[var(--color-texto)] text-xs text-[var(--color-fondo)]"
          >
            ✕
          </button>
        </div>
      )}

      {grabando ? (
        <div className="flex items-center gap-2">
          <button onClick={() => terminarGrabacion(true)} className="pulsable boton">
            Cancelar
          </button>
          <p className="flex flex-1 items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--color-rojo)]" />
            Grabando {mmss(segundos)}
          </p>
          <button onClick={() => terminarGrabacion(false)} className="pulsable boton-primario">
            Enviar
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar(texto);
          }}
          className="flex gap-2"
        >
          <input
            ref={inputFoto}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              elegirFoto(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button type="button" onClick={() => inputFoto.current?.click()} disabled={ocupado} aria-label="Mandar foto" className="pulsable boton px-3 disabled:opacity-40">
            <Icono d={CAMARA} />
          </button>
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={foto ? 'Dile algo de la foto…' : 'Pregúntale lo que sea…'} className="campo min-w-0 flex-1" />
          {texto.trim() || foto ? (
            <button type="submit" disabled={ocupado} className="pulsable boton-primario">
              {enviando ? '…' : 'Enviar'}
            </button>
          ) : (
            <button type="button" onClick={empezarGrabacion} disabled={ocupado} aria-label="Grabar audio" className="pulsable boton-primario px-3">
              <Icono d={MIC} />
            </button>
          )}
        </form>
      )}

      {mensajes.length > 0 && !ocupado && !grabando && (
        <button
          onClick={() => {
            pararVoz();
            setMensajes([]);
          }}
          className="self-center text-xs text-[var(--color-texto-tenue)] underline"
        >
          Nueva conversación
        </button>
      )}
    </div>
  );
}

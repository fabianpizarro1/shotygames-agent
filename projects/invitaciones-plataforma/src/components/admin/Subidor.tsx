'use client';

// Etapa 1: sin subida de archivos todavía (llega con el almacenamiento de la plataforma).
// Mientras tanto la imagen o el audio se pegan como enlace.

interface Props {
  valor: string;
  onChange: (v: string) => void;
  tipo: 'imagen' | 'audio';
  multiple?: boolean;
  maxLado?: number;
}

const campo = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-900';

export function Subidor({ valor, onChange, tipo, multiple = false }: Props) {
  const urls = valor.split('\n').map((u) => u.trim()).filter(Boolean);
  return (
    <div className="space-y-2">
      {tipo === 'imagen' && urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((u) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={u} src={u} alt="" className="h-20 w-auto rounded-md object-cover ring-1 ring-stone-200" />
          ))}
        </div>
      )}
      {multiple ? (
        <textarea rows={3} className={campo} placeholder="Un enlace por línea (https://…)" value={valor} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={campo} placeholder={tipo === 'audio' ? 'Enlace al audio (https://…)' : 'Enlace a la imagen (https://…)'} value={valor} onChange={(e) => onChange(e.target.value)} />
      )}
      <p className="text-xs text-stone-500">Subir archivos desde tu celular llega pronto; por ahora pega el enlace.</p>
    </div>
  );
}

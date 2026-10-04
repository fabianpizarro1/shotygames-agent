// Markdown mínimo (bullets, **negrita**, encabezados) — lo único que usa el
// asistente. Sin librería: no vale la pena el peso para esto.

function enLinea(texto: string) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') ? <strong key={i}>{parte.slice(2, -2)}</strong> : parte
  );
}

export default function TextoIA({ texto }: { texto: string }) {
  const lineas = texto.split('\n');
  return (
    <div className="prosa flex flex-col gap-1 text-sm leading-relaxed">
      {lineas.map((l, i) => {
        const t = l.trim();
        if (!t) return <div key={i} className="h-1" />;
        if (/^#{1,4}\s/.test(t)) return <p key={i} className="mt-1 font-semibold">{enLinea(t.replace(/^#+\s/, ''))}</p>;
        const bullet = t.match(/^([-*•]|\d+[.)])\s+(.*)$/);
        if (bullet)
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-[var(--color-texto-tenue)]">{/^\d/.test(bullet[1]) ? bullet[1] : '•'}</span>
              <span>{enLinea(bullet[2])}</span>
            </div>
          );
        return <p key={i}>{enLinea(t)}</p>;
      })}
    </div>
  );
}

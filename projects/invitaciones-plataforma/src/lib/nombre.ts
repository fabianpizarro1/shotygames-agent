// Ayudas para mostrar el nombre del invitado sin que se salga ni se vea ilegible.

/** "ALEXANDRO ROMAN" → "Alexandro Roman" (respeta apóstrofes y guiones). */
export function nombreBonito(n: string): string {
  return n
    .trim()
    .toLowerCase()
    .replace(/(^|[\s'’-])(\p{L})/gu, (_, sep: string, l: string) => sep + l.toUpperCase())
    // partículas en minúscula ("de", "del", "la", "los", "y"), salvo al inicio
    .replace(/(?<=\s)(De|Del|La|Las|Los|Y|E)(?=\s)/g, (m) => m.toLowerCase());
}

/** Tamaño de letra (px) para que `texto` quepa en una sola línea de `disponible` px; nunca baja de `min`. */
export function tamNombre(texto: string, em: number, max: number, min: number, disponible: number): number {
  const largo = Math.max(1, texto.trim().length);
  return Math.round(Math.min(max, Math.max(min, disponible / (em * largo))));
}

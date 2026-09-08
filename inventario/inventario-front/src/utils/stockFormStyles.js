/** Clases CSS compartidas para formularios de stock (lotes y PCs trazables). */

const RING = {
  teal: 'focus:ring-teal-600',
  blue: 'focus:ring-blue-600',
  emerald: 'focus:ring-emerald-600',
};

export function stockInputClass(accent = 'blue', { mono = false, readonly = false } = {}) {
  if (readonly) {
    return 'w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-500 font-mono bg-slate-50 cursor-not-allowed';
  }
  const font = mono ? 'font-mono font-bold' : 'font-semibold';
  const ring = RING[accent] ?? RING.blue;
  return `w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 ${font} focus:outline-none focus:ring-2 ${ring} focus:border-transparent`;
}

export function stockSelectClass(accent = 'blue') {
  const ring = RING[accent] ?? RING.blue;
  return `w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 ${ring} focus:border-transparent`;
}

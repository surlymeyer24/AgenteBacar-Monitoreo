/** @param {{ seconds?: number; nanoseconds?: number } | null | undefined} ts */
export function formatTimestamp(ts) {
  if (!ts || typeof ts.seconds !== 'number') return '—';
  const d = new Date(ts.seconds * 1000);
  return d.toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

/** Opciones de PC para asignar periféricos de stock. */

const LABEL_ORIGEN = {
  STOCK: 'Stock',
  DETECTADA_POR_AGENTE: 'Agente',
  DETECTADA_VINCULADA_RETRO: 'Vinc. retro',
  LEGACY: 'Legacy',
};

export function labelPcAsignable(pc) {
  const host = pc.hostname?.trim() || 'Sin hostname';
  const origen = LABEL_ORIGEN[pc.origenAlta] || pc.origenAlta || '';
  const estado = pc.estadoActual?.trim();
  const prep = pc.estadoPreparacion?.trim();
  const extras = [origen, estado, prep === 'ARMADO' ? 'Baseline' : null].filter(Boolean);
  const sufijo = extras.length ? ` · ${extras.join(' · ')}` : '';
  return `${host}${sufijo}`;
}

export function opcionesPcAsignable(pcs) {
  return [
    { value: '', label: 'Seleccionar computadora…' },
    ...(pcs ?? []).map(pc => ({
      value: pc.uuid,
      label: labelPcAsignable(pc),
    })),
  ];
}

export function filtrarPcsAsignables(lista) {
  return (lista ?? []).filter(pc => pc.uuid);
}

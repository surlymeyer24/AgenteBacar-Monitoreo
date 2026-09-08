/** Opciones de PC trazable para asignar periféricos de stock (Fase E). */

export function labelPcAsignable(pc) {
  const host = pc.hostname?.trim() || 'Sin hostname';
  const estado = pc.estadoActual?.trim();
  const conc = pc.estadoConciliacion?.trim();
  const extras = [estado, conc === 'BASELINE_LISTO' ? 'Baseline' : null].filter(Boolean);
  const sufijo = extras.length ? ` · ${extras.join(' · ')}` : '';
  return `${host}${sufijo}`;
}

export function opcionesPcAsignable(pcs) {
  return [
    { value: '', label: 'Seleccionar PC…' },
    ...(pcs ?? []).map(pc => ({
      value: pc.uuid,
      label: labelPcAsignable(pc),
    })),
  ];
}

export function filtrarPcsAsignables(lista) {
  return (lista ?? []).filter(pc => pc.origenAlta === 'STOCK' && pc.uuid);
}

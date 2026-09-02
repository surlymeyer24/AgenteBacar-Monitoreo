export const FASES = [
  { id: 'etiquetado', orden: 1, label: 'Etiquetado', descripcion: 'Sticker QR pegado en el equipo' },
  { id: 'embalado', orden: 2, label: 'Embalado', descripcion: 'Desconectado y guardado en la caja' },
  { id: 'destino', orden: 3, label: 'En destino', descripcion: 'Ubicado y reconectado en el puesto nuevo' },
];

export const ESTADOS_PUESTO = {
  PENDIENTE: 'PENDIENTE',
  EN_CURSO: 'EN_CURSO',
  ETIQUETADO: 'ETIQUETADO',
  EMBALADO: 'EMBALADO',
  EN_DESTINO: 'EN_DESTINO',
};

function estadoGeneral(porFase) {
  if (porFase.destino.pct === 100) return ESTADOS_PUESTO.EN_DESTINO;
  if (porFase.embalado.pct === 100) return ESTADOS_PUESTO.EMBALADO;
  if (porFase.etiquetado.pct === 100) return ESTADOS_PUESTO.ETIQUETADO;
  const algo = FASES.some(f => porFase[f.id].marcadas > 0);
  return algo ? ESTADOS_PUESTO.EN_CURSO : ESTADOS_PUESTO.PENDIENTE;
}

/** Resumen de avance de un puesto a partir de sus marcas y de los ids de sus elementos. */
export function calcularResumenProgreso(marcas, itemIds) {
  const ids = Array.isArray(itemIds) ? itemIds : [];
  const total = ids.length;
  const porFase = {};

  for (const fase of FASES) {
    const marcadas = ids.filter(id => marcas?.[fase.id]?.[id]).length;
    porFase[fase.id] = {
      marcadas,
      total,
      pct: total > 0 ? Math.round((marcadas / total) * 100) : 0,
    };
  }

  return {
    total,
    porFase,
    etiquetadoPct: porFase.etiquetado.pct,
    embaladoPct: porFase.embalado.pct,
    destinoPct: porFase.destino.pct,
    estado: estadoGeneral(porFase),
  };
}

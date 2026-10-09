/** Ubicación física por defecto en depósito/stock. */
export const UBICACION_DEPOSITO_DEFAULT = 'stock';

/** Helpers para stock de PCs por cantidad (especificacionStock). */

export function buildNombreFromSpec(spec) {
  if (!spec) return '';
  const parts = [];
  if (spec.cpuModelo?.trim()) parts.push(spec.cpuModelo.trim());
  const ramNum = Number(spec.ramTotalGb);
  if (Number.isFinite(ramNum) && ramNum > 0) parts.push(`${ramNum} GB RAM`);
  if (spec.discoResumen?.trim()) parts.push(spec.discoResumen.trim());
  return parts.join(' · ');
}

export function formatSpecResumen(spec) {
  const resumen = buildNombreFromSpec(spec);
  return resumen || '—';
}

export function specToPayload({ cpuModelo, ramTotalGb, discoResumen, tipoEquipo, condicion }) {
  const cpu = (cpuModelo ?? '').trim();
  const ram = parseInt(String(ramTotalGb ?? ''), 10);
  const disco = (discoResumen ?? '').trim();
  const tipo = (tipoEquipo ?? '').trim();
  const cond = (condicion ?? '').trim();

  if (!cpu && (!Number.isFinite(ram) || ram <= 0) && !disco && !tipo && !cond) {
    return null;
  }

  return {
    cpuModelo: cpu || undefined,
    ramTotalGb: Number.isFinite(ram) && ram > 0 ? ram : undefined,
    discoResumen: disco || undefined,
    tipoEquipo: tipo || undefined,
    condicion: cond || undefined,
  };
}

/**
 * Reconstruye specs desde el nombre comercial cuando falta especificacionStock
 * (ítems legacy o altas sin el mapa estructurado en Firestore).
 */
export function parseSpecFromNombre(nombre) {
  const raw = (nombre ?? '').trim().replace(/[–—−]/g, '-');
  if (!raw) {
    return { cpuModelo: '', ramTotalGb: '', discoResumen: '' };
  }

  const result = { cpuModelo: '', ramTotalGb: '', discoResumen: '' };

  if (raw.includes('·')) {
    for (const part of raw.split('·').map(p => p.trim()).filter(Boolean)) {
      const ramMatch = part.match(/^(\d+)\s*GB\s*RAM$/i);
      if (ramMatch) {
        result.ramTotalGb = ramMatch[1];
        continue;
      }
      if (!result.cpuModelo) {
        result.cpuModelo = part;
      } else if (!result.discoResumen) {
        result.discoResumen = part;
      }
    }
    return result;
  }

  const ramTail = raw.match(/-\s*(\d+)\s*(?:GB\s*)?RAM\s*$/i);
  if (ramTail) {
    result.ramTotalGb = ramTail[1];
    const cpu = raw.slice(0, ramTail.index).replace(/[-\s]+$/g, '').trim();
    if (cpu) result.cpuModelo = cpu;
    return result;
  }

  const ramInline = raw.match(/(\d+)\s*(?:GB\s*)?RAM\b/i);
  if (ramInline) {
    result.ramTotalGb = ramInline[1];
    const cpu = raw.slice(0, ramInline.index).replace(/[-–—\s]+$/g, '').trim();
    if (cpu) result.cpuModelo = cpu;
    return result;
  }

  result.cpuModelo = raw;
  return result;
}

function mergeSpecFields(stored, fallback) {
  return {
    cpuModelo: stored?.cpuModelo?.trim() || fallback.cpuModelo || '',
    ramTotalGb: stored?.ramTotalGb != null && stored.ramTotalGb > 0
      ? String(stored.ramTotalGb)
      : (fallback.ramTotalGb || ''),
    discoResumen: stored?.discoResumen?.trim() || fallback.discoResumen || '',
    tipoEquipo: stored?.tipoEquipo?.trim() || '',
    condicion: stored?.condicion?.trim() || '',
  };
}

function hasStoredSpec(stored) {
  if (!stored) return false;
  return Boolean(
    stored.cpuModelo?.trim()
    || (stored.ramTotalGb != null && stored.ramTotalGb > 0)
    || stored.discoResumen?.trim()
    || stored.tipoEquipo?.trim()
    || stored.condicion?.trim(),
  );
}

/** Spec resuelta: prioriza Firestore; solo parsea nombre si no hay spec guardada (legacy). */
export function resolveSpecFromItem(item) {
  const stored = item?.especificacionStock;
  const fromNombre = hasStoredSpec(stored)
    ? { cpuModelo: '', ramTotalGb: '', discoResumen: '' }
    : parseSpecFromNombre(item?.nombre);
  return mergeSpecFields(stored, fromNombre);
}

/** Spec resuelta para computadora trazable (especificacion_esperada o hostname legacy). */
export function resolveSpecFromComputadora(pc) {
  const stored = pc?.especificacionEsperada;
  const fromHostname = hasStoredSpec(stored)
    ? { cpuModelo: '', ramTotalGb: '', discoResumen: '' }
    : parseSpecFromNombre(pc?.hostname);
  return mergeSpecFields(
    stored ? {
      cpuModelo: stored.cpuModelo,
      ramTotalGb: stored.ramTotalGb != null ? String(stored.ramTotalGb) : '',
      discoResumen: stored.discoResumen,
      tipoEquipo: stored.tipoEquipo,
      condicion: stored.condicion,
    } : null,
    fromHostname,
  );
}

/** Descripción libre de una PC trazable (independiente de la etiqueta auto). */
export function descripcionFromComputadora(pc) {
  if (pc?.descripcionStock?.trim()) return pc.descripcionStock.trim();
  return descripcionFromItem({
    nombre: pc?.hostname,
    especificacionStock: pc?.especificacionEsperada,
  });
}

/** Etiqueta visual auto-generada (CPU + RAM + disco). Independiente de la descripción. */
export function etiquetaFromItem(item) {
  const spec = resolveSpecFromItem(item);
  return buildNombreFromSpec({
    cpuModelo: spec.cpuModelo,
    ramTotalGb: spec.ramTotalGb,
    discoResumen: spec.discoResumen,
  });
}

/**
 * Descripción libre del ítem (`nombre` en Firestore).
 * No reutiliza la etiqueta auto-generada desde specs.
 */
export function descripcionFromItem(item) {
  const nombre = (item?.nombre ?? '').trim();
  if (!nombre) return '';
  const autoLabel = etiquetaFromItem(item);
  if (autoLabel && nombre.toLowerCase() === autoLabel.toLowerCase()) return '';
  return nombre;
}

/** Normaliza valor de catálogo para matchear el select (case-insensitive). */
export function normalizeCatalogValue(value, options = []) {
  const raw = (value ?? '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  const match = options.find(o => String(o.value).toLowerCase() === lower || String(o.label).toLowerCase() === lower);
  return match ? match.value : raw;
}

/** Normaliza ubicación de sede (enum Firestore) para el select del catálogo. */
export function specSearchText(spec) {
  if (!spec) return '';
  return [
    spec.cpuModelo,
    spec.ramTotalGb != null ? `${spec.ramTotalGb} gb` : '',
    spec.discoResumen,
    spec.tipoEquipo,
    spec.condicion,
  ].filter(Boolean).join(' ').toLowerCase();
}

/** Hostname sugerido al sacar 1 unidad de un lote de stock. */
export function buildDefaultHostname(lote) {
  const resolved = resolveSpecFromItem(lote);
  const cpu = resolved.cpuModelo?.trim();
  if (cpu) {
    const slug = cpu.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 28);
    const sufijo = crypto.randomUUID().slice(0, 8);
    return `PC-${slug}-${sufijo}`;
  }
  const nombre = (lote?.nombre ?? 'PC-STOCK').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20);
  return `${nombre}-${crypto.randomUUID().slice(0, 8)}`;
}

export function computadoraDesdeSacarUnidad(dto, lote) {
  if (!dto) return null;
  const specLote = resolveSpecFromItem(lote);
  const specPayload = specToPayload(specLote);
  return {
    uuid: dto.uuid,
    hostname: dto.hostname,
    estadoActual: dto.estadoActual ?? 'Sin Asignar',
    tipoEquipo: dto.tipoEquipo ?? dto.especificacionEsperada?.tipoEquipo ?? specLote.tipoEquipo ?? null,
    condicion: dto.condicion ?? dto.especificacionEsperada?.condicion ?? specLote.condicion ?? null,
    origenAlta: dto.origenAlta ?? 'STOCK',
    estadoConciliacion: dto.estadoConciliacion ?? 'SIN_BASELINE',
    estadoPreparacion: dto.estadoPreparacion ?? 'SIN_ARMAR',
    estadoReporteAgente: dto.estadoReporteAgente ?? 'SIN_REPORTE',
    ubicacionStock: dto.ubicacionStock ?? lote?.ubicacion ?? 'stock',
    especificacionEsperada: dto.especificacionEsperada ?? specPayload ?? null,
    loteOrigenId: dto.loteOrigenId ?? lote?.id ?? null,
  };
}

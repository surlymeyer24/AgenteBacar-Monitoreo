import { labelDisponibilidad } from '../components/StockEstadoBadges';

/** Columnas del ciclo de vida en orden operativo. */
export const PIPELINE_COLUMNS = [
  {
    id: 'deposito',
    title: 'En depósito',
    hint: 'Unidad trazable sin combo armado',
    headerCls: 'bg-slate-100 border-slate-200 text-slate-700',
    dotCls: 'bg-slate-400',
  },
  {
    id: 'armando',
    title: 'Armando',
    hint: 'Combo armado — esperando reporte del agente',
    headerCls: 'bg-violet-50 border-violet-200 text-violet-800',
    dotCls: 'bg-violet-500',
  },
  {
    id: 'agente_pendiente',
    title: 'Agente pendiente',
    hint: 'Match sugerido o discrepancia — revisar conciliación',
    headerCls: 'bg-amber-50 border-amber-200 text-amber-900',
    dotCls: 'bg-amber-500',
  },
  {
    id: 'lista',
    title: 'Lista',
    hint: 'Conciliada con AgenteBacar — lista para asignar',
    headerCls: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    dotCls: 'bg-emerald-500',
  },
  {
    id: 'asignada',
    title: 'Asignada',
    hint: 'Entregada a un responsable',
    headerCls: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    dotCls: 'bg-indigo-500',
  },
];

function resolverEstadoRaw(pc) {
  const e = pc?.estadoActual;
  if (e && typeof e === 'object') {
    return e.nombre ?? e.Nombre ?? '';
  }
  return e ?? '';
}

function normalizarEstadoPc(estadoActual) {
  return String(estadoActual ?? '').trim().toUpperCase().replace(/\s+/g, '_');
}

function esEstadoSinAsignar(pc) {
  const e = normalizarEstadoPc(resolverEstadoRaw(pc));
  return !e || e === 'SIN_ASIGNAR';
}

function tieneEspecificacionStock(pc) {
  const spec = pc?.especificacionEsperada;
  if (!spec) return Boolean(pc?.descripcionStock?.trim());
  return Boolean(
    spec.cpuModelo?.trim()
    || spec.cpu_modelo?.trim()
    || spec.ramTotalGb
    || spec.ram_total_gb,
  );
}

/** Sin sync real del agente (estadoAgente "Desconectado" no cuenta como reporte). */
function sinReporteAgente(pc) {
  return !pc?.ultimaSincronizacion;
}

function esPreparacionNoAplica(pc) {
  return (pc?.estadoPreparacion ?? pc?.estadoConciliacion) === 'NO_APLICA';
}

/**
 * Unidad en depósito (solo Stock de PCs), no en inventario operativo.
 */
export function esUnidadStockEnDeposito(pc) {
  if (!pc?.uuid || !esEstadoSinAsignar(pc)) return false;
  if (pc.origenAlta === 'DETECTADA_POR_AGENTE' || pc.origenAlta === 'DETECTADA_VINCULADA_RETRO') {
    return false;
  }
  if (esPreparacionNoAplica(pc)) return false;
  if (pc.origenAlta === 'STOCK' || pc.loteOrigenId) return true;
  if (sinReporteAgente(pc) && (tieneEspecificacionStock(pc) || pc.descripcionStock?.trim())) {
    return true;
  }
  return false;
}

/**
 * Inventario operativo (/computadoras): oculta unidades del flujo stock en depósito.
 * Las PCs STOCK asignadas o en mantenimiento/baja siguen visibles.
 */
export function esPcVisibleEnInventario(pc) {
  if (!pc?.uuid) return false;
  return !esUnidadStockEnDeposito(pc);
}

export function filtrarPcsInventarioOperativo(pcs) {
  return (pcs ?? []).filter(esPcVisibleEnInventario);
}

/**
 * PCs que participan del flujo stock (origen STOCK o aún en depósito).
 */
export function esPcPipelineStock(pc) {
  if (!pc?.uuid) return false;
  if (esPreparacionNoAplica(pc)) return false;
  if (pc.origenAlta === 'STOCK' || pc.loteOrigenId) return true;
  return esEstadoSinAsignar(pc);
}

/** Puede devolverse al lote de Stock de PCs (sale de /computadoras y del pipeline). */
export function puedeSacarDePipeline(pc) {
  if (!pc?.uuid || !esEstadoSinAsignar(pc)) return false;
  return Boolean(pc.loteOrigenId) || pc.origenAlta === 'STOCK' || esUnidadStockEnDeposito(pc);
}

/**
 * Deriva la columna del pipeline a partir de los ejes existentes (sin badges en UI).
 */
export function getPipelineColumn(pc, estadoLabels = {}) {
  const disp = labelDisponibilidad(pc?.estadoActual, estadoLabels);
  if (disp === 'Asignada') return 'asignada';

  const prep = pc?.estadoPreparacion || 'SIN_ARMAR';
  const agente = pc?.estadoReporteAgente || 'SIN_REPORTE';

  if (agente === 'CONFIRMADA') return 'lista';
  if (agente === 'MATCH_SUGERIDO' || agente === 'DISCREPANCIA') return 'agente_pendiente';
  if (prep === 'ARMADO') return 'armando';
  return 'deposito';
}

export function agruparPorPipeline(pcs, estadoLabels = {}) {
  const groups = Object.fromEntries(PIPELINE_COLUMNS.map(c => [c.id, []]));
  for (const pc of pcs) {
    const col = getPipelineColumn(pc, estadoLabels);
    if (groups[col]) groups[col].push(pc);
  }
  return groups;
}

/** Transiciones manuales permitidas al soltar una tarjeta. */
export function transicionPipelinePermitida(fromCol, toCol, pc, estadoLabels) {
  if (fromCol === toCol) return null;
  const actual = getPipelineColumn(pc, estadoLabels);
  if (actual !== fromCol) return null;

  if (fromCol === 'deposito' && toCol === 'armando') return 'armar';
  if (fromCol === 'lista' && toCol === 'asignada') return 'asignar';
  if (toCol === 'agente_pendiente' && fromCol === 'armando') return 'conciliaciones';
  return null;
}

export function puedeArmarEnPipeline(pc) {
  return pc?.origenAlta === 'STOCK' && pc?.estadoPreparacion === 'SIN_ARMAR';
}

export function puedeAsignarEnPipeline(pc, estadoLabels) {
  return getPipelineColumn(pc, estadoLabels) === 'lista';
}

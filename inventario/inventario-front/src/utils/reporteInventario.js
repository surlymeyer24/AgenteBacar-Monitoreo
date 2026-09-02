import { ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import { labelUbicacionEnum } from '../constants/ubicaciones';
import { nivelActividadSync } from './syncActividad';

const ESTADOS_PC = ['ASIGNADA', 'SIN_ASIGNAR', 'EN_MANTENIMIENTO', 'BAJA', 'ACTIVA', 'INACTIVA'];

const TIPO_LABELS_MAQUINA = {
  VALIDADORA: 'Validadora',
  BOLSILLOS: 'Bolsillos',
  RECONTADORA: 'Recontadora',
  ENVASADORA: 'Envasadora',
  FAJADORA: 'Fajadora',
};

function labelTipoMaquina(tipo) {
  const k = (tipo ?? '').trim().toUpperCase();
  return TIPO_LABELS_MAQUINA[k] ?? ((tipo ?? '').trim() || 'Sin tipo');
}

/** Compara `estadoActual` del DTO con la clave del enum (misma lógica que Asignaciones). */
export function resolverEstadoPc(estadoActual) {
  const raw = (estadoActual ?? '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  for (const key of ESTADOS_PC) {
    const label = ESTADO_OPERATIVO_LABELS[key];
    if (
      raw === label
      || raw === key
      || lower === label.toLowerCase()
      || lower === key.toLowerCase()
    ) {
      return key;
    }
  }
  return null;
}

/** BOX2 se clasifica mal como notebook en datos; se trata como PC. */
function esExcepcionNotebook(c) {
  const host = (c?.hostname ?? '').trim().toLowerCase();
  return host === 'box2';
}

export function esNotebook(c) {
  if (esExcepcionNotebook(c)) return false;
  return (c?.tipoEquipo ?? '').toLowerCase().includes('notebook');
}

/** Ítems de stock manual categorizados como computadora (PC, notebook, etc.). */
export function esTipoComputadoraStock(p) {
  const t = (p?.tipo ?? '').trim().toUpperCase();
  if (!t) return false;
  return (
    t === 'COMPUTADORA'
    || t === 'COMPUTADORAS'
    || t === 'PC'
    || t === 'PCS'
    || t === 'NOTEBOOK'
    || t === 'NOTEBOOKS'
    || t === 'LAPTOP'
    || t === 'LAPTOPS'
    || t.startsWith('COMPUTADOR')
  );
}

function contarPorClave(items, getter) {
  const map = new Map();
  for (const item of items ?? []) {
    const raw = getter(item);
    const key = raw != null && String(raw).trim() ? String(raw).trim() : 'Sin dato';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')),
  );
}

function sumarCantidadPerifericos(items, filtroEstado, excluirComputadoras = false) {
  return (items ?? [])
    .filter(p => {
      if (excluirComputadoras && esTipoComputadoraStock(p)) return false;
      return !filtroEstado || p.estado === filtroEstado;
    })
    .reduce((sum, p) => sum + (Number(p.cantidad) || 1), 0);
}

function sumarCantidadComputadorasManual(items, filtroEstado) {
  return (items ?? [])
    .filter(p => esTipoComputadoraStock(p) && (!filtroEstado || p.estado === filtroEstado))
    .reduce((sum, p) => sum + (Number(p.cantidad) || 1), 0);
}

function contarStockManualPorTipo(items, filtroEstado, excluirComputadoras = false) {
  const map = new Map();
  for (const p of items ?? []) {
    if (excluirComputadoras && esTipoComputadoraStock(p)) continue;
    if (filtroEstado && p.estado !== filtroEstado) continue;
    const tipo = (p.tipo ?? 'Otro').trim() || 'Otro';
    const qty = Number(p.cantidad) || 1;
    map.set(tipo, (map.get(tipo) ?? 0) + qty);
  }
  return Object.fromEntries(
    [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')),
  );
}

export function camarasPorNvrDesdeLista(camaras, nvrs) {
  const list = Array.isArray(camaras) ? camaras : [];
  const nvrList = Array.isArray(nvrs) ? nvrs : [];
  const countBy = new Map();
  for (const cam of list) {
    const raw = cam?.nvrId;
    const id = raw != null && String(raw).trim() ? String(raw).trim() : '';
    countBy.set(id, (countBy.get(id) ?? 0) + 1);
  }
  const idsCatalogo = new Set(nvrList.map(n => n.id).filter(Boolean));
  const rows = [];
  for (const nvr of nvrList) {
    const c = countBy.get(nvr.id) ?? 0;
    rows.push({ label: nvr.nombre ?? nvr.id, count: c });
  }
  const sin = countBy.get('') ?? 0;
  if (sin > 0) rows.push({ label: 'Sin NVR', count: sin });
  for (const [id, c] of countBy) {
    if (!id || c === 0) continue;
    if (!idsCatalogo.has(id)) rows.push({ label: id, count: c });
  }
  rows.sort((a, b) => b.count - a.count);
  const out = {};
  for (const r of rows) out[r.label] = r.count;
  return out;
}

function mapaConEtiquetas(porClave, usarLabelUbicacion = false) {
  const out = {};
  for (const [k, v] of Object.entries(porClave ?? {})) {
    if (Number(v) <= 0) continue;
    const label = usarLabelUbicacion ? labelUbicacionEnum(k) : k;
    out[label] = Number(v);
  }
  return out;
}

function contarEstadosPcDesdeLista(computadoras) {
  const acc = {};
  for (const key of ESTADOS_PC) acc[key] = 0;
  let otros = 0;
  for (const c of computadoras ?? []) {
    const k = resolverEstadoPc(c.estadoActual);
    if (k && acc[k] !== undefined) acc[k] += 1;
    else otros += 1;
  }
  if (otros > 0) acc.otros = otros;
  return acc;
}

export function contarMaquinasPorTipo(maquinas) {
  const map = new Map();
  for (const m of maquinas ?? []) {
    const label = labelTipoMaquina(m.tipo);
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')),
  );
}

function armarDetalleMaquinas(maquinas) {
  return (maquinas ?? []).map(m => ({
    id: m.id ?? m.nroSerie ?? '—',
    tipo: labelTipoMaquina(m.tipo),
    modelo: m.modelo ?? '—',
    nroSerie: m.nroSerie ?? '—',
    estado: m.estadoActual ?? m.estado ?? '—',
    vida: m.vida ?? '—',
  })).sort((a, b) => a.tipo.localeCompare(b.tipo, 'es') || (a.nroSerie || '').localeCompare(b.nroSerie || '', 'es'));
}

function contarSyncPc(computadoras) {
  let activas = 0;
  let inactivas = 0;
  for (const c of computadoras ?? []) {
    if (nivelActividadSync(c) === 'activo') activas += 1;
    else inactivas += 1;
  }
  return { activas, inactivas };
}

function armarDetalleComputadoras(pcs) {
  return (pcs ?? []).map(c => {
    const sync = nivelActividadSync(c);
    return {
      hostname: c.hostname ?? c.uuid ?? '—',
      tipo: esNotebook(c) ? 'Notebook' : ((c.tipoEquipo ?? '').trim() || 'PC'),
      estado: c.estadoActual ?? '—',
      area: c.ubicacion ? labelUbicacionEnum(c.ubicacion) : '—',
      procesador: c.procesadorNombre ?? '—',
      arquitectura: c.arquitectura ?? '—',
      sync: sync === 'activo' ? 'Activa' : sync === 'intermedio' ? 'Intermedio' : sync === 'sin_actividad' ? 'Inactiva' : 'Sin datos',
      origen: 'Agente',
    };
  }).sort((a, b) => (a.hostname || '').localeCompare(b.hostname || '', 'es'));
}

/**
 * Arma el objeto de reporte a partir de datos crudos de las APIs.
 */
export function construirReporteInventario({
  stats,
  computadoras,
  perifericosManual,
  nvrs,
  camaras,
  maquinasTesoreria,
}) {
  const pcs = Array.isArray(computadoras) ? computadoras : [];
  const manual = Array.isArray(perifericosManual) ? perifericosManual : [];
  const maquinas = Array.isArray(maquinasTesoreria) ? maquinasTesoreria : [];
  const s = stats ?? {};

  const notebook = pcs.filter(esNotebook).length;
  const desktop = pcs.length - notebook;

  const porEstadoStats = s.porEstadoComputadoras ?? {};
  const porEstado = contarEstadosPcDesdeLista(pcs);
  const { activas: syncActivas, inactivas: syncInactivas } = contarSyncPc(pcs);

  const stockManualComputadoras = sumarCantidadComputadorasManual(manual, ESTADO_OPERATIVO_LABELS.SIN_ASIGNAR);
  const stockManualComputadorasTotal = sumarCantidadComputadorasManual(manual);
  const asignadasManualComputadoras = sumarCantidadComputadorasManual(manual, ESTADO_OPERATIVO_LABELS.ASIGNADA);

  const registradas = pcs.length;
  const total = registradas + stockManualComputadorasTotal;
  const enStockRegistradas = porEstado.SIN_ASIGNAR ?? porEstadoStats.SIN_ASIGNAR ?? 0;
  const enStock = enStockRegistradas + stockManualComputadoras;
  const asignadas = (porEstado.ASIGNADA ?? porEstadoStats.ASIGNADA ?? 0) + asignadasManualComputadoras;

  const porArquitectura = contarPorClave(pcs, c => c.arquitectura);
  const porProcesador = contarPorClave(
    pcs,
    c => c.procesadorNombre,
  );

  const porArea = mapaConEtiquetas(s.porUbicacionComputadoras ?? {}, true);
  if (!Object.keys(porArea).length) {
    Object.assign(porArea, mapaConEtiquetas(contarPorClave(pcs, c => c.ubicacion), true));
  }

  const perifericosConPc = Number(s.totalPerifericos ?? 0);
  const perifericosPorTipoAgente = {};
  for (const [k, v] of Object.entries(s.perifericosPorTipo ?? {})) {
    if (Number(v) > 0) perifericosPorTipoAgente[k] = Number(v);
  }

  const stockManual = sumarCantidadPerifericos(manual, ESTADO_OPERATIVO_LABELS.SIN_ASIGNAR, true);
  const asignadosManual = sumarCantidadPerifericos(manual, ESTADO_OPERATIVO_LABELS.ASIGNADA, true);
  const stockManualPorTipo = contarStockManualPorTipo(manual, ESTADO_OPERATIVO_LABELS.SIN_ASIGNAR, true);
  const asignadosManualPorTipo = contarStockManualPorTipo(manual, ESTADO_OPERATIVO_LABELS.ASIGNADA, true);

  const camarasPorNvr = camarasPorNvrDesdeLista(camaras, nvrs);
  const listaNvrs = Array.isArray(nvrs) ? nvrs : [];
  const listaCamaras = Array.isArray(camaras) ? camaras : [];

  return {
    generadoEn: new Date(),
    computadoras: {
      total,
      registradas,
      stockManualComputadoras,
      stockManualComputadorasTotal,
      notebook,
      desktop,
      activas: Number(s.computadorasSyncMenos10Min ?? syncActivas),
      inactivas: Math.max(0, registradas - Number(s.computadorasSyncMenos10Min ?? syncActivas)),
      syncActivas,
      syncInactivas,
      porEstado,
      porEstadoStats,
      asignadas,
      enStock,
      enStockRegistradas,
      enMantenimiento: porEstado.EN_MANTENIMIENTO ?? porEstadoStats.EN_MANTENIMIENTO ?? 0,
      baja: porEstado.BAJA ?? porEstadoStats.BAJA ?? 0,
      porArquitectura,
      porProcesador,
      porArea,
      porTipoEquipo: { Notebook: notebook, PC: desktop },
      detalle: armarDetalleComputadoras(pcs),
    },
    perifericos: {
      conPcAgente: perifericosConPc,
      porTipoAgente: perifericosPorTipoAgente,
      stockManual,
      asignadosManual,
      stockManualPorTipo,
      asignadosManualPorTipo,
    },
    infraestructura: {
      totalNvrs: listaNvrs.length,
      totalCamaras: listaCamaras.length,
      camarasPorNvr,
      totalRouters: Number(s.totalRouters ?? 0),
      totalSwitches: Number(s.totalSwitches ?? 0),
      totalAccessPoints: Number(s.totalAccessPoints ?? 0),
      /** Cantidad por tipo de equipo de red (no por ubicación). */
      routersSwitchesPorTipo: {
        Routers: Number(s.totalRouters ?? 0),
        Switches: Number(s.totalSwitches ?? 0),
      },
    },
    tesoreria: {
      total: maquinas.length,
      porTipo: contarMaquinasPorTipo(maquinas),
      detalle: armarDetalleMaquinas(maquinas),
    },
  };
}

/** Convierte un mapa { etiqueta: cantidad } en filas [etiqueta, cantidad] para tablas. */
export function filasDesdeMapa(mapa) {
  return Object.entries(mapa ?? {})
    .filter(([, n]) => Number(n) > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));
}

/** Convierte un mapa en array { name, value } para Recharts. */
export function chartDataDesdeMapa(mapa, limit = 12) {
  return filasDesdeMapa(mapa)
    .slice(0, limit)
    .map(([name, value]) => ({ name, value: Number(value) || 0 }));
}

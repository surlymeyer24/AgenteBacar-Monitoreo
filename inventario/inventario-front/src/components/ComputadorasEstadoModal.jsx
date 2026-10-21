import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  X,
  Monitor,
  ExternalLink,
  Package,
  Save,
  CheckCircle,
  Search,
  RotateCw,
  User,
  Building2,
  Laptop,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { esSyncActivo, normalizarUltimaSincronizacion } from '../utils/syncActividad';
import { labelUbicacion } from '../constants/ubicaciones';
import { useComputadoras, usePerifericosM } from '../hooks/useQueries';
import { useCatalogo } from '../hooks/useCatalogo';
import { updateResponsableInventario } from '../api/computadoraApi';
import { normalizarTipoStock } from '../constants/tiposStock';
import { usePermisos } from '../hooks/usePermisos';
import { esUnidadStockEnDeposito, filtrarPcsInventarioOperativo } from '../utils/pipelinePcHelpers';

const TABS = [
  { id: 'todas', label: 'Todas' },
  { id: 'activas', label: 'Activas', dot: 'bg-emerald-500' },
  { id: 'inactivas', label: 'Inactivas', dot: 'bg-rose-500' },
  { id: 'stock', label: 'Stock / Almacén', dot: 'bg-amber-500' },
];

function formatSyncParts(c) {
  const iso = normalizarUltimaSincronizacion(c?.ultimaSincronizacion ?? c?.ultima_sincronizacion);
  if (!iso) return { fecha: '—', hora: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { fecha: '—', hora: '' };
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const seg = String(d.getSeconds()).padStart(2, '0');
  return {
    fecha: `${dia}/${mes}/${anio}`,
    hora: `${hora}:${min}:${seg}`,
  };
}

function valorAsignadoDraft(c, draft) {
  if (draft[c.uuid] !== undefined) return draft[c.uuid];
  return c.responsableInventario ?? '';
}

export default function ComputadorasEstadoModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  const [asignadoDraft, setAsignadoDraft] = useState({});
  const [savingAsignado, setSavingAsignado] = useState(null);
  const [savedSuccessUuid, setSavedSuccessUuid] = useState(null);
  const [msgAsignado, setMsgAsignado] = useState(null);

  const { puedeEscribir } = usePermisos();
  const queryClient = useQueryClient();
  const { items: ubicCompItems } = useCatalogo('ubicaciones_computadora');
  const { data: computadoras = [] } = useComputadoras({}, { enabled: isOpen });
  const { data: perifM = [] } = usePerifericosM({ enabled: isOpen });

  const stockManualPcs = useMemo(
    () => perifM.filter((p) => normalizarTipoStock(p.tipo) === 'computadora'),
    [perifM],
  );

  const pcsOperativas = useMemo(
    () => filtrarPcsInventarioOperativo(computadoras),
    [computadoras],
  );

  const pcsStockDeposito = useMemo(
    () => computadoras.filter(esUnidadStockEnDeposito),
    [computadoras],
  );

  const conteos = useMemo(() => {
    let activas = 0;
    for (const c of pcsOperativas) {
      if (esSyncActivo(c)) activas += 1;
    }
    const stockManualCount = stockManualPcs.reduce((sum, p) => sum + (p.cantidad ?? 1), 0);
    const stock = pcsStockDeposito.length + stockManualCount;
    return {
      todas: pcsOperativas.length + stock,
      activas,
      inactivas: pcsOperativas.length - activas,
      stock,
    };
  }, [pcsOperativas, pcsStockDeposito, stockManualPcs]);

  const stockRows = useMemo(() => {
    const liberadas = pcsStockDeposito.map((c) => ({ ...c, _origen: 'liberada' }));
    const manuales = stockManualPcs.map((p) => ({
      uuid: p.id,
      hostname: p.nombre || p.fabricante || 'PC Stock',
      ubicacion: p.ubicacion,
      estadoActual: 'Nueva (stock)',
      cantidad: p.cantidad ?? 1,
      _origen: 'manual',
    }));
    return [...liberadas, ...manuales];
  }, [pcsStockDeposito, stockManualPcs]);

  const filtradas = useMemo(() => {
    let base = [];
    if (tab === 'activas') base = pcsOperativas.filter((c) => esSyncActivo(c));
    else if (tab === 'inactivas') base = pcsOperativas.filter((c) => !esSyncActivo(c));
    else if (tab === 'stock') base = stockRows;
    else base = [...pcsOperativas, ...stockRows.filter((r) => r._origen === 'manual')];

    if (!busqueda.trim()) return base;
    const q = busqueda.toLowerCase().trim();
    return base.filter((c) => {
      const h = (c.hostname || '').toLowerCase();
      const r = (c.responsableInventario || '').toLowerCase();
      const u = (c.ubicacion ? labelUbicacion(c.ubicacion, ubicCompItems) : '').toLowerCase();
      return h.includes(q) || r.includes(q) || u.includes(q);
    });
  }, [pcsOperativas, stockRows, tab, busqueda, ubicCompItems]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaValida = Math.min(Math.max(1, pagina), totalPaginas);

  const paginadas = useMemo(() => {
    const start = (paginaValida - 1) * porPagina;
    return filtradas.slice(start, start + porPagina);
  }, [filtradas, paginaValida, porPagina]);

  const startRecord = filtradas.length === 0 ? 0 : (paginaValida - 1) * porPagina + 1;
  const endRecord = Math.min(filtradas.length, paginaValida * porPagina);

  function handleTabChange(newTab) {
    setTab(newTab);
    setPagina(1);
  }

  function handleSearchChange(e) {
    setBusqueda(e.target.value);
    setPagina(1);
  }

  function setAsignado(uuid, texto) {
    setAsignadoDraft((prev) => ({ ...prev, [uuid]: texto }));
  }

  async function guardarAsignado(uuid) {
    const raw =
      asignadoDraft[uuid] !== undefined
        ? asignadoDraft[uuid]
        : computadoras.find((x) => x.uuid === uuid)?.responsableInventario ?? '';

    setSavingAsignado(uuid);
    setMsgAsignado(null);
    try {
      const dto = await updateResponsableInventario(uuid, raw.trim() || null);
      if (!dto) {
        setMsgAsignado('No se encontró la computadora.');
        return;
      }
      queryClient.setQueryData(['computadoras', {}], (prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((p) => (p.uuid === uuid ? { ...p, ...dto } : p));
      });
      setAsignadoDraft((prev) => {
        const next = { ...prev };
        delete next[uuid];
        return next;
      });
      setSavedSuccessUuid(uuid);
      setTimeout(() => setSavedSuccessUuid(null), 2000);
    } catch {
      setMsgAsignado('No se pudo guardar la asignación.');
    } finally {
      setSavingAsignado(null);
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-[9999]">
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          className="bg-white border border-slate-200/90 rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        >
          {/* Cabecera del modal */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                    Equipamiento Asignado
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    {conteos.todas} Equipos
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Asignación rápida y vinculación inmediata de puestos de trabajo a colaboradores de la organización.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={busqueda}
                  onChange={handleSearchChange}
                  placeholder="Filtrar hostname o usuario..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fila de Tabs + Sincronización en tiempo real */}
          <div className="px-5 sm:px-6 pt-3.5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-white">
            <div className="flex flex-wrap items-center gap-2">
              {TABS.map((t) => {
                const isActive = tab === t.id;
                const count = conteos[t.id] ?? 0;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTabChange(t.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0c66e4] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t.dot && !isActive && <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />}
                    <span>{t.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 self-end sm:self-auto">
              <RotateCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Sincronización en tiempo real</span>
            </div>
          </div>

          {/* Cuerpo: Tabla de equipos */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0">
            {msgAsignado && (
              <p className="mb-3 text-xs text-red-600 font-semibold" role="status">
                {msgAsignado}
              </p>
            )}

            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-slate-400" />
                        <span>Hostname</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 min-w-[210px]">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Asignado a</span>
                      </div>
                    </th>
                    <th className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Área</span>
                      </div>
                    </th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Última Sync</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginadas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        No se encontraron equipos registrados con estos criterios.
                      </td>
                    </tr>
                  ) : (
                    paginadas.map((c) => {
                      const esManual = c._origen === 'manual';
                      const activa = !esManual && esSyncActivo(c);
                      const esStock = c._origen === 'liberada' || esManual;
                      const sync = formatSyncParts(c);

                      return (
                        <tr key={c.uuid ?? c.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Hostname */}
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            <span className="inline-flex items-center gap-2">
                              {esManual ? (
                                <Package className="w-4 h-4 text-amber-500 shrink-0" />
                              ) : (
                                <Monitor className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span>{c.hostname ?? '—'}</span>
                              {esManual && c.cantidad > 1 && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 rounded">
                                  x{c.cantidad}
                                </span>
                              )}
                            </span>
                          </td>

                          {/* Asignado a con botón de solo icono */}
                          <td className="px-4 py-3 text-slate-600">
                            {esManual ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <div
                                className="flex items-center gap-1.5 max-w-[240px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={valorAsignadoDraft(c, asignadoDraft)}
                                  onChange={(e) => setAsignado(c.uuid, e.target.value)}
                                  placeholder="Nombre o referencia"
                                  aria-label={`Asignado a para ${c.hostname ?? c.uuid}`}
                                  disabled={!puedeEscribir || savingAsignado === c.uuid}
                                  className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 transition-all"
                                />
                                {puedeEscribir && (
                                  <button
                                    type="button"
                                    disabled={savingAsignado === c.uuid}
                                    onClick={() => guardarAsignado(c.uuid)}
                                    title="Guardar asignación"
                                    className={`p-1.5 rounded-lg text-white font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50 ${
                                      savedSuccessUuid === c.uuid
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-[#0c66e4] hover:bg-blue-700 active:bg-blue-800'
                                    }`}
                                  >
                                    {savingAsignado === c.uuid ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : savedSuccessUuid === c.uuid ? (
                                      <CheckCircle className="w-3.5 h-3.5" />
                                    ) : (
                                      <Save className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Área */}
                          <td className="px-4 py-3 text-slate-700 font-medium">
                            {c.ubicacion ? labelUbicacion(c.ubicacion, ubicCompItems) : '—'}
                          </td>

                          {/* Estado con punto */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {esStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {esManual ? 'Nueva (stock)' : 'Stock'}
                              </span>
                            ) : activa ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Activa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Inactiva
                              </span>
                            )}
                          </td>

                          {/* Última Sync en dos renglones */}
                          <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                            {esManual ? (
                              '—'
                            ) : (
                              <div className="leading-tight">
                                <p className="font-semibold text-slate-700">{sync.fecha}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{sync.hora}</p>
                              </div>
                            )}
                          </td>

                          {/* Acción */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {esManual ? (
                              <Link
                                to="/perifericos/stock"
                                onClick={onClose}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors"
                              >
                                <span>Ver stock</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            ) : (
                              <Link
                                to={`/computadoras/${c.uuid}`}
                                onClick={onClose}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                              >
                                <span>Ver detalle</span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pie del modal */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Autoguardado activado en plataforma BACAR.it · Mostrando {startRecord} - {endRecord} de{' '}
                {filtradas.length} registros
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {/* Paginación */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={paginaValida <= 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - paginaValida) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const hasGap = prev && p - prev > 1;
                    return (
                      <div key={p} className="flex items-center">
                        {hasGap && <span className="px-1 text-slate-400 text-xs">…</span>}
                        <button
                          type="button"
                          onClick={() => setPagina(p)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            paginaValida === p
                              ? 'bg-red-700 text-white'
                              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      </div>
                    );
                  })}

                <button
                  type="button"
                  disabled={paginaValida >= totalPaginas}
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

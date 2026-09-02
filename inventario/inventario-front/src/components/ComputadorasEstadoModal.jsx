import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Monitor, ExternalLink, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { esSyncActivo, normalizarUltimaSincronizacion } from '../utils/syncActividad';
import { labelUbicacionEnum } from '../constants/ubicaciones';
import { useComputadoras, usePerifericosM } from '../hooks/useQueries';
import { normalizarTipoStock } from '../constants/tiposStock';

const TABS = [
  { id: 'activas', label: 'Activas' },
  { id: 'inactivas', label: 'Inactivas' },
  { id: 'stock', label: 'Stock' },
  { id: 'todas', label: 'Todas' },
];

function fmtSync(c) {
  const iso = normalizarUltimaSincronizacion(c?.ultimaSincronizacion ?? c?.ultima_sincronizacion);
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-AR');
}

export default function ComputadorasEstadoModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('todas');
  const { data: computadoras = [] } = useComputadoras({}, { enabled: isOpen });
  const { data: perifM = [] } = usePerifericosM({ enabled: isOpen });
  const stockManualPcs = useMemo(
    () => perifM.filter(p => normalizarTipoStock(p.tipo) === 'computadora'),
    [perifM],
  );

  const pcsLiberadas = useMemo(() => computadoras.filter(c => c.estadoActual === 'Sin Asignar'), [computadoras]);

  const conteos = useMemo(() => {
    let activas = 0;
    for (const c of computadoras) {
      if (esSyncActivo(c)) activas += 1;
    }
    const stockManualCount = stockManualPcs.reduce((sum, p) => sum + (p.cantidad ?? 1), 0);
    const stock = pcsLiberadas.length + stockManualCount;
    return { activas, inactivas: computadoras.length - activas, stock, todas: computadoras.length + stockManualCount };
  }, [computadoras, pcsLiberadas, stockManualPcs]);

  const stockRows = useMemo(() => {
    const liberadas = pcsLiberadas.map(c => ({ ...c, _origen: 'liberada' }));
    const manuales = stockManualPcs.map(p => ({
      uuid: p.id,
      hostname: p.nombre || p.fabricante || 'PC Stock',
      usuarioActual: '—',
      ubicacion: p.ubicacion,
      estadoActual: 'Nueva (stock)',
      cantidad: p.cantidad ?? 1,
      _origen: 'manual',
    }));
    return [...liberadas, ...manuales];
  }, [pcsLiberadas, stockManualPcs]);

  const filtradas = useMemo(() => {
    if (tab === 'activas') return computadoras.filter(c => esSyncActivo(c));
    if (tab === 'inactivas') return computadoras.filter(c => !esSyncActivo(c));
    if (tab === 'stock') return stockRows;
    return [...computadoras, ...stockRows.filter(r => r._origen === 'manual')];
  }, [computadoras, stockRows, tab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col border-t-[3px] border-t-accent"
        >
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-1.5 h-6 rounded-full bg-accent shrink-0" aria-hidden />
              <Monitor className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="font-extrabold text-sm text-slate-900 uppercase tracking-wide truncate">
                Computadoras — {conteos.todas} equipos
              </span>
            </div>
            <button type="button" onClick={onClose} className="p-1 hover:bg-slate-200 rounded text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 pt-4 flex gap-2 shrink-0">
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  tab === t.id
                    ? 'bg-[#0c66e4] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label} ({conteos[t.id]})
              </button>
            ))}
          </div>

          <div className="p-6 overflow-y-auto flex-1 min-h-0">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Hostname</th>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Área</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Última sync</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Ningún equipo en esta categoría
                      </td>
                    </tr>
                  ) : (
                    filtradas.map(c => {
                      const esManual = c._origen === 'manual';
                      const activa = !esManual && esSyncActivo(c);
                      const esStock = c._origen === 'liberada' || esManual;
                      return (
                        <tr key={c.uuid ?? c.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            <span className="inline-flex items-center gap-1.5">
                              {esManual && <Package className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                              {c.hostname ?? '—'}
                              {esManual && c.cantidad > 1 && (
                                <span className="text-xs font-bold text-slate-500">x{c.cantidad}</span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{c.usuarioActual ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {c.ubicacion ? labelUbicacionEnum(c.ubicacion) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {esStock ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800">
                                {esManual ? 'Nueva (stock)' : 'Liberada'}
                              </span>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                                  activa ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {activa ? 'Activa' : 'Inactiva'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">
                            {esManual ? '—' : fmtSync(c)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {esManual ? (
                              <Link
                                to="/perifericos/stock"
                                onClick={onClose}
                                className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-800"
                              >
                                Ver stock
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            ) : (
                              <Link
                                to={`/computadoras/${c.uuid}`}
                                onClick={onClose}
                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                              >
                                Ver detalle
                                <ExternalLink className="w-3 h-3" />
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { X, Package, AlertTriangle } from 'lucide-react';
import { armarCombo, fetchPerifericosStockDisponibles, fetchComputadora } from '../api/computadoraApi';
import FriendlySelect from './FriendlySelect';
import { formatSpecResumen } from '../utils/stockPcHelpers';

function labelPerifericoStock(p) {
  const base = [p.nombre, p.fabricante].filter(Boolean).join(' — ') || p.id;
  const serial = p.numeroSerie?.trim();
  return serial ? `${base} · S/N ${serial}` : base;
}

function opcionesPerifericos(items) {
  return [
    { value: '', label: 'Sin definir' },
    ...items.map(p => ({
      value: p.id,
      label: labelPerifericoStock(p),
    })),
  ];
}

function fmtFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('es-AR');
}

export default function ArmarComboModal({ computadora, onClose, onSuccess }) {
  const uuid = computadora?.uuid;
  const [cargandoPerifs, setCargandoPerifs] = useState(true);
  const [errorPerifs, setErrorPerifs] = useState(null);
  const [porTipo, setPorTipo] = useState({ monitor: [], mouse: [], teclado: [] });
  const [monitorId, setMonitorId] = useState('');
  const [mouseId, setMouseId] = useState('');
  const [tecladoId, setTecladoId] = useState('');
  const [cpuModelo, setCpuModelo] = useState('');
  const [ramTotalGb, setRamTotalGb] = useState('');
  const [discoResumen, setDiscoResumen] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [specDesdeLote, setSpecDesdeLote] = useState(false);
  const [specResumen, setSpecResumen] = useState('');

  useEffect(() => {
    setCpuModelo('');
    setRamTotalGb('');
    setDiscoResumen('');
    setSpecDesdeLote(false);
    setSpecResumen('');
    if (!uuid) return;

    function aplicarSpec(spec) {
      if (!spec) return false;
      let aplico = false;
      if (spec.cpuModelo?.trim()) {
        setCpuModelo(spec.cpuModelo.trim());
        aplico = true;
      }
      if (spec.ramTotalGb != null && spec.ramTotalGb > 0) {
        setRamTotalGb(String(spec.ramTotalGb));
        aplico = true;
      }
      if (spec.discoResumen?.trim()) {
        setDiscoResumen(spec.discoResumen.trim());
        aplico = true;
      }
      if (aplico) {
        setSpecDesdeLote(true);
        setSpecResumen(formatSpecResumen(spec));
      }
      return aplico;
    }

    if (aplicarSpec(computadora?.especificacionEsperada)) {
      return undefined;
    }

    let cancel = false;
    fetchComputadora(uuid)
      .then(full => {
        if (cancel) return;
        aplicarSpec(full?.especificacionEsperada);
      })
      .catch(() => { /* pre-fill opcional */ });
    return () => { cancel = true; };
  }, [uuid, computadora?.especificacionEsperada]);

  useEffect(() => {
    if (!uuid) return;
    let cancel = false;
    setCargandoPerifs(true);
    setErrorPerifs(null);
    fetchPerifericosStockDisponibles(uuid, ['monitor', 'mouse', 'teclado'])
      .then(list => {
        if (cancel) return;
        const grouped = { monitor: [], mouse: [], teclado: [] };
        for (const p of list ?? []) {
          const t = (p.tipo ?? '').trim().toLowerCase();
          if (grouped[t]) grouped[t].push(p);
        }
        setPorTipo(grouped);
      })
      .catch(() => {
        if (!cancel) setErrorPerifs('No se pudo cargar el stock de periféricos.');
      })
      .finally(() => {
        if (!cancel) setCargandoPerifs(false);
      });
    return () => { cancel = true; };
  }, [uuid]);

  const preview = useMemo(() => {
    const parts = [];
    if (monitorId) {
      const p = porTipo.monitor.find(x => x.id === monitorId);
      const serial = p?.numeroSerie?.trim();
      parts.push(`Monitor: ${p?.nombre ?? monitorId}${serial ? ` (S/N ${serial})` : ''}`);
    }
    if (mouseId) {
      const p = porTipo.mouse.find(x => x.id === mouseId);
      const serial = p?.numeroSerie?.trim();
      parts.push(`Mouse: ${p?.nombre ?? mouseId}${serial ? ` (S/N ${serial})` : ''}`);
    }
    if (tecladoId) {
      const p = porTipo.teclado.find(x => x.id === tecladoId);
      const serial = p?.numeroSerie?.trim();
      parts.push(`Teclado: ${p?.nombre ?? tecladoId}${serial ? ` (S/N ${serial})` : ''}`);
    }
    if (cpuModelo.trim()) parts.push(`CPU: ${cpuModelo.trim()}`);
    if (ramTotalGb.trim()) parts.push(`RAM: ${ramTotalGb.trim()} GB`);
    if (discoResumen.trim()) parts.push(`Disco: ${discoResumen.trim()}`);
    return parts;
  }, [monitorId, mouseId, tecladoId, cpuModelo, ramTotalGb, discoResumen, porTipo]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    const body = {};
    if (monitorId) body.monitorId = monitorId;
    if (mouseId) body.mouseId = mouseId;
    if (tecladoId) body.tecladoId = tecladoId;
    const cpu = cpuModelo.trim();
    if (cpu) body.cpuModelo = cpu;
    const ram = ramTotalGb.trim();
    if (ram) {
      const n = parseInt(ram, 10);
      if (Number.isNaN(n) || n < 0) {
        setError('RAM debe ser un número entero ≥ 0.');
        return;
      }
      body.ramTotalGb = n;
    }
    const disco = discoResumen.trim();
    if (disco) body.discoResumen = disco;
    const mo = motivo.trim();
    if (mo) body.motivo = mo;

    const tieneAlgo = body.monitorId || body.mouseId || body.tecladoId
      || body.cpuModelo || body.ramTotalGb != null || body.discoResumen;
    if (!tieneAlgo) {
      setError('Seleccioná al menos un periférico o completá un dato de hardware.');
      return;
    }

    if (!window.confirm(
      '¿Confirmar armado del combo?\n\nEsta acción no se puede deshacer desde la aplicación.'
    )) {
      return;
    }

    setEnviando(true);
    try {
      const updated = await armarCombo(uuid, body);
      onSuccess?.(updated);
      onClose?.();
    } catch (err) {
      setError(err.message || 'No se pudo armar el combo.');
    } finally {
      setEnviando(false);
    }
  }

  if (!computadora) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="armar-combo-title"
      >
        <div className="px-5 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <Package className="w-5 h-5 text-indigo-600 shrink-0" />
            <h2 id="armar-combo-title" className="font-extrabold text-sm text-slate-900 uppercase tracking-wide truncate">
              Armar computadora
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-slate-200 rounded text-slate-500" title="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4 text-xs font-bold text-slate-700">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex gap-2 text-amber-900 font-semibold normal-case">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Esta acción no se puede deshacer desde la aplicación. Revisá el combo antes de confirmar.</span>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 space-y-1">
            <p className="text-slate-500 uppercase text-[10px] tracking-wider">Equipo</p>
            <p className="text-slate-900 font-extrabold">{computadora.hostname ?? uuid}</p>
            <p className="text-slate-500 font-mono font-normal text-[11px]">{uuid}</p>
          </div>

          {specDesdeLote && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-teal-900 font-semibold normal-case text-[11px]">
              Hardware pre-cargado desde el stock del lote
              {specResumen ? (
                <span className="block text-teal-800 font-bold mt-0.5">{specResumen}</span>
              ) : null}
              {computadora.loteOrigenId ? (
                <span className="block text-teal-700 font-normal mt-0.5">
                  Lote origen:{' '}
                  <Link
                    to={`/perifericos/stock/${encodeURIComponent(computadora.loteOrigenId)}`}
                    className="text-teal-900 hover:underline font-semibold"
                    onClick={e => e.stopPropagation()}
                  >
                    {computadora.loteOrigenId}
                  </Link>
                </span>
              ) : null}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg font-semibold normal-case">
              {error}
            </div>
          )}
          {errorPerifs && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg font-semibold normal-case">
              {errorPerifs}
            </div>
          )}

          {cargandoPerifs ? (
            <p className="text-slate-500 font-medium normal-case py-4 text-center">Cargando stock…</p>
          ) : (
            <>
              <div className="space-y-1">
                <label className="block text-slate-600 uppercase text-[10px] tracking-wider">Monitor (opcional)</label>
                <FriendlySelect
                  name="monitorId"
                  value={monitorId}
                  placeholder="Sin definir"
                  options={opcionesPerifericos(porTipo.monitor)}
                  onChange={setMonitorId}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 uppercase text-[10px] tracking-wider">Mouse (opcional)</label>
                <FriendlySelect
                  name="mouseId"
                  value={mouseId}
                  placeholder="Sin definir"
                  options={opcionesPerifericos(porTipo.mouse)}
                  onChange={setMouseId}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 uppercase text-[10px] tracking-wider">Teclado (opcional)</label>
                <FriendlySelect
                  name="tecladoId"
                  value={tecladoId}
                  placeholder="Sin definir"
                  options={opcionesPerifericos(porTipo.teclado)}
                  onChange={setTecladoId}
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-150">
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-slate-600 uppercase text-[10px] tracking-wider">CPU esperada (opc.)</label>
              <input
                value={cpuModelo}
                onChange={e => setCpuModelo(e.target.value)}
                placeholder="Ej. i5-12400"
                className="inventory-input w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-600 uppercase text-[10px] tracking-wider">RAM GB (opc.)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={ramTotalGb}
                onChange={e => setRamTotalGb(e.target.value)}
                placeholder="16"
                className="inventory-input w-full"
              />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <label className="block text-slate-600 uppercase text-[10px] tracking-wider">Disco (opc.)</label>
              <input
                value={discoResumen}
                onChange={e => setDiscoResumen(e.target.value)}
                placeholder="Ej. SSD 512 GB"
                className="inventory-input w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-slate-600 uppercase text-[10px] tracking-wider">Motivo (opcional)</label>
            <input
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej. Armado para entrega sector X"
              className="inventory-input w-full"
            />
          </div>

          {preview.length > 0 && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-indigo-700 mb-1">Vista previa del baseline</p>
              <ul className="list-disc list-inside text-slate-800 font-semibold normal-case space-y-0.5">
                {preview.map(line => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || cargandoPerifs}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg"
            >
              {enviando ? 'Armando…' : 'Confirmar armado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EspecificacionEsperadaBlock({ especificacionEsperada, loteOrigenId }) {
  if (!especificacionEsperada) return null;
  const spec = especificacionEsperada;
  return (
    <div className="bg-teal-50/40 border border-teal-200 rounded-xl p-5 shadow-sm space-y-3">
      <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wide flex items-center gap-2">
        <Package className="w-4 h-4" />
        Especificación declarada (desde lote)
      </h4>
      <p className="text-sm font-semibold text-teal-950 normal-case">
        {formatSpecResumen(spec)}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-slate-500 uppercase text-[10px] tracking-wider block">CPU</span>
          <span className="font-semibold text-slate-800">{spec.cpuModelo ?? '—'}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase text-[10px] tracking-wider block">RAM</span>
          <span className="font-semibold text-slate-800">
            {spec.ramTotalGb != null ? `${spec.ramTotalGb} GB` : '—'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 uppercase text-[10px] tracking-wider block">Disco</span>
          <span className="font-semibold text-slate-800">{spec.discoResumen ?? '—'}</span>
        </div>
      </div>
      {loteOrigenId && (
        <p className="text-[11px] text-teal-800 font-medium normal-case">
          Lote origen:{' '}
          <Link
            to={`/perifericos/stock/${encodeURIComponent(loteOrigenId)}`}
            className="text-teal-900 hover:underline font-bold"
          >
            {loteOrigenId}
          </Link>
        </p>
      )}
    </div>
  );
}

export function BaselineEsperadoBlock({ baseline }) {
  if (!baseline) return null;
  const perifs = baseline.perifericos ?? [];
  return (
    <div className="bg-indigo-50/40 border border-indigo-200 rounded-xl p-5 shadow-sm space-y-3">
      <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-2">
        <Package className="w-4 h-4" />
        Baseline esperado (stock)
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-slate-500 uppercase text-[10px] tracking-wider block">CPU</span>
          <span className="font-semibold text-slate-800">{baseline.cpuModelo ?? '—'}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase text-[10px] tracking-wider block">RAM</span>
          <span className="font-semibold text-slate-800">
            {baseline.ramTotalGb != null ? `${baseline.ramTotalGb} GB` : '—'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 uppercase text-[10px] tracking-wider block">Disco</span>
          <span className="font-semibold text-slate-800">{baseline.discoResumen ?? '—'}</span>
        </div>
      </div>
      {perifs.length > 0 && (
        <div>
          <span className="text-slate-500 uppercase text-[10px] tracking-wider block mb-1">Periféricos del combo</span>
          <ul className="space-y-1">
            {perifs.map(p => (
              <li key={`${p.tipo}-${p.idStock}`} className="flex flex-wrap items-center gap-2 text-slate-800 font-semibold normal-case">
                <span className="capitalize text-slate-500">{p.tipo}:</span>
                <span>{p.nombre ?? p.fabricante ?? p.idStock}</span>
                {p.numeroSerie && (
                  <span className="font-mono text-[11px] text-slate-500">S/N: {p.numeroSerie}</span>
                )}
                {p.idStock && (
                  <Link to={`/perifericos/stock/${p.idStock}`} className="text-indigo-600 hover:underline text-[11px]">
                    Ver ficha
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {baseline.armadoAt && (
        <p className="text-[10px] text-slate-500 font-medium normal-case">
          Armado: {fmtFecha(baseline.armadoAt)}
        </p>
      )}
    </div>
  );
}

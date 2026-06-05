import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { fetchComputadoras, fetchComputadora } from '../api/computadoraApi';
import {
  esTeclado,
  esMouse,
  esWebcamClaseCamera,
  esBluetooth,
  filtrarUsbParaInventario,
  filtrarAudioParaInventario,
} from '../utils/perifericos';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
  StudioFilterBar,
} from '../components/studio/StudioUi';
import PerifericosTable from '../components/PerifericosTable';

function fmtNum(n, dec = 1) {
  if (n == null || n === '') return null;
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(dec) : null;
}

function detalleImpresora(p) {
  const parts = [];
  if (p.driver) parts.push(`Driver: ${p.driver}`);
  if (p.puerto) parts.push(`Puerto: ${p.puerto}`);
  if (p.estado) parts.push(`Estado: ${p.estado}`);
  return parts.length ? parts.join(' · ') : '—';
}

function detalleMonitor(m) {
  const parts = [];
  if (m.resolucion) parts.push(m.resolucion);
  const pulg = fmtNum(m.pulgadas);
  if (pulg) parts.push(`${pulg}"`);
  const w = fmtNum(m.anchoCm);
  const h = fmtNum(m.altoCm);
  if (w && h) parts.push(`${w}×${h} cm`);
  return parts.length ? parts.join(' · ') : '—';
}

function detalleUsb(d) {
  const parts = [];
  if (d.conexion) parts.push(`Conexión: ${d.conexion}`);
  if (d.categoria) parts.push(`Categoría: ${d.categoria}`);
  return parts.length ? parts.join(' · ') : '—';
}

function fabClaseUsb(d) {
  const bits = [d.fabricante, d.clase].filter(Boolean);
  return bits.length ? bits.join(' · ') : '—';
}

function tipoUsb(d) {
  if (esTeclado(d)) return 'Teclado';
  if (esMouse(d)) return 'Mouse';
  if (esWebcamClaseCamera(d)) return 'Webcam';
  if (esBluetooth(d)) return 'Bluetooth';
  return 'USB (otro)';
}

const TIPO_BADGE = {
  Impresora: 'bg-emerald-100 text-emerald-800',
  Monitor: 'bg-blue-100 text-blue-800',
  Teclado: 'bg-orange-100 text-orange-800',
  Mouse: 'bg-indigo-100 text-indigo-800',
  Webcam: 'bg-rose-100 text-rose-800',
  Bluetooth: 'bg-cyan-100 text-cyan-800',
  Micrófono: 'bg-teal-100 text-teal-800',
  Parlante: 'bg-purple-100 text-purple-800',
  'USB (otro)': 'bg-slate-100 text-slate-600',
};

function chipTipo(tipo) {
  return TIPO_BADGE[tipo] ?? 'bg-slate-100 text-slate-600';
}

function push(out, uuid, tipo, hostname, nombre, fabClase, detalle) {
  out.push({
    key: `${uuid}-${tipo}-${nombre ?? ''}-${out.length}`,
    tipo,
    hostname,
    uuid,
    nombre: nombre ?? '—',
    fabClase: fabClase ?? '—',
    detalle: detalle ?? '—',
  });
}

function coincideBusquedaPeriferico(f, queryRaw) {
  const q = (queryRaw ?? '').trim().toLowerCase();
  if (!q) return true;
  const host = (f.hostname ?? '').toLowerCase();
  const nom = (f.nombre ?? '').toLowerCase();
  return host.includes(q) || nom.includes(q);
}

function PerifericosTodosList() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [buscar, setBuscar] = useState('');

  useEffect(() => {
    let cancel = false;
    setCargando(true);
    setError(null);
    fetchComputadoras()
      .then(list =>
        Promise.all(
          (list ?? []).map(pc =>
            fetchComputadora(pc.uuid)
              .then(det => ({ pc, det }))
              .catch(() => ({ pc, det: null }))
          )
        )
      )
      .then(pares => {
        if (cancel) return;
        const out = [];
        pares.forEach(({ pc, det }) => {
          const hostname = det?.hostname ?? pc?.hostname ?? '—';
          const uuid = pc?.uuid;
          const p = det?.perifericos;
          if (!p) return;

          (p.impresoras ?? []).forEach(x => {
            push(out, uuid, 'Impresora', hostname, x.nombre, '—', detalleImpresora(x));
          });
          (p.monitores ?? []).forEach(x => {
            push(out, uuid, 'Monitor', hostname, x.nombre, '—', detalleMonitor(x));
          });
          filtrarUsbParaInventario(p.dispositivosUsb ?? []).forEach(x => {
            push(out, uuid, tipoUsb(x), hostname, x.nombre, fabClaseUsb(x), detalleUsb(x));
          });
          filtrarAudioParaInventario(p.audio?.entrada ?? []).forEach(x => {
            push(out, uuid, 'Micrófono', hostname, x.nombre, x.fabricante ?? '—', x.estado ? `Estado: ${x.estado}` : '—');
          });
          filtrarAudioParaInventario(p.audio?.salida ?? []).forEach(x => {
            push(out, uuid, 'Parlante', hostname, x.nombre, x.fabricante ?? '—', x.estado ? `Estado: ${x.estado}` : '—');
          });
        });
        setFilas(out);
      })
      .catch(() => {
        if (!cancel) setError('No se pudo cargar el listado');
      })
      .finally(() => {
        if (!cancel) setCargando(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const tiposDisponibles = useMemo(() => {
    const set = new Set(filas.map(f => f.tipo).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [filas]);

  const filasFiltradas = useMemo(() => {
    let list = filas;
    if (filtroTipo) {
      list = list.filter(f => f.tipo === filtroTipo);
    }
    list = list.filter(f => coincideBusquedaPeriferico(f, buscar));
    return list;
  }, [filas, filtroTipo, buscar]);

  if (cargando) return <StudioLoading />;
  if (error) return <StudioError message={error} />;

  const total = filas.length;
  const visibles = filasFiltradas.length;
  const subt =
    visibles === total
      ? `${total} periférico${total === 1 ? '' : 's'}`
      : `${visibles} de ${total} periférico${total === 1 ? '' : 's'}`;

  return (
    <StudioPageShell
      title="Todos los Periféricos Detectados"
      subtitle={`${subt}. Vista agregada de impresoras, monitores, USB y audio reportados por el agente.`}
    >
      <StudioFilterBar>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="perif-buscar"
            type="search"
            placeholder="Buscar por hostname o nombre del dispositivo…"
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            autoComplete="off"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all text-slate-700"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">
          <label htmlFor="perif-tipo">Tipo:</label>
          <select
            id="perif-tipo"
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer"
          >
            <option value="">{`Todos (${total})`}</option>
            {tiposDisponibles.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </StudioFilterBar>

      <PerifericosTable 
        items={filasFiltradas} 
        renderSpecs={(f) => (
          <>{f.fabClase !== '—' ? `${f.fabClase} ` : ''}<span className="text-slate-300 mx-1">|</span> {f.detalle}</>
        )} 
      />
    </StudioPageShell>
  );
}

export default PerifericosTodosList;

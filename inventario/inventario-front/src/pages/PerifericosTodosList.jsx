import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { fetchPerifericosAgenteListados } from '../api/perifericosAgenteApi';
import { fetchMonitoresReportadosAgente } from '../api/monitorApi';
import { fetchImpresorasAgrupadas } from '../api/impresoraApi';
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

function push(out, uuid, tipo, hostname, nombre, fabClase, detalle) {
  out.push({
    key: `${uuid ?? ''}-${tipo}-${nombre ?? ''}-${out.length}`,
    tipo,
    hostname: hostname ?? '—',
    uuid,
    pcUuid: uuid,
    pcHostname: hostname,
    nombre: nombre ?? '—',
    fabClase: fabClase ?? '—',
    detalle: detalle ?? '—',
    fabricante: fabClase && fabClase !== '—' ? fabClase : undefined,
  });
}

function coincideBusquedaPeriferico(f, queryRaw) {
  const q = (queryRaw ?? '').trim().toLowerCase();
  if (!q) return true;
  const host = (f.hostname ?? '').toLowerCase();
  const nom = (f.nombre ?? '').toLowerCase();
  return host.includes(q) || nom.includes(q);
}

function mapUsbTipo(tipoLista) {
  if (tipoLista === 'teclados') return 'Teclado';
  if (tipoLista === 'mouse') return 'Mouse';
  if (tipoLista === 'webcams') return 'Webcam';
  return 'USB (otro)';
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
    // 3 endpoints agregados (sin N+1 por PC)
    Promise.all([
      fetchPerifericosAgenteListados().catch(() => ({ teclados: [], mouse: [], webcams: [], parlantes: [], microfonos: [] })),
      fetchMonitoresReportadosAgente().catch(() => []),
      fetchImpresorasAgrupadas().catch(() => []),
    ])
      .then(([listados, monitores, impresoras]) => {
        if (cancel) return;
        const out = [];

        (impresoras ?? []).forEach(g => {
          const pcs = Array.isArray(g.pcs) ? g.pcs : [];
          const detalle = detalleImpresora(g);
          if (pcs.length === 0) {
            push(out, null, 'Impresora', '—', g.nombre, '—', detalle);
          } else {
            pcs.forEach(pc => {
              push(out, pc.uuid, 'Impresora', pc.hostname, g.nombre, '—', detalle);
            });
          }
        });

        (monitores ?? []).forEach(m => {
          push(
            out,
            m.pcUuid,
            'Monitor',
            m.pcHostname,
            m.nombre,
            '—',
            detalleMonitor(m),
          );
        });

        ['teclados', 'mouse', 'webcams'].forEach(key => {
          const tipo = mapUsbTipo(key);
          (listados?.[key] ?? []).forEach(x => {
            const fab = [x.fabricante, x.clase].filter(Boolean).join(' · ') || '—';
            const detParts = [];
            if (x.conexion) detParts.push(`Conexión: ${x.conexion}`);
            if (x.vid || x.pid) {
              detParts.push([x.vid && `VID_${x.vid}`, x.pid && `PID_${x.pid}`].filter(Boolean).join('/'));
            }
            if (x.categoria) detParts.push(`Categoría: ${x.categoria}`);
            push(out, x.pcUuid, tipo, x.pcHostname, x.nombre, fab, detParts.length ? detParts.join(' · ') : '—');
          });
        });

        (listados?.microfonos ?? []).forEach(x => {
          push(
            out,
            x.pcUuid,
            'Micrófono',
            x.pcHostname,
            x.nombre,
            x.fabricante ?? '—',
            x.estado ? `Estado: ${x.estado}` : '—',
          );
        });

        (listados?.parlantes ?? []).forEach(x => {
          push(
            out,
            x.pcUuid,
            'Parlante',
            x.pcHostname,
            x.nombre,
            x.fabricante ?? '—',
            x.estado ? `Estado: ${x.estado}` : '—',
          );
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

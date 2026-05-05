import { useState, useEffect, useMemo } from 'react';
import { fetchComputadoras, fetchComputadora } from '../api/computadoraApi';
import {
  esTeclado,
  esMouse,
  esWebcamClaseCamera,
  esBluetooth,
  filtrarUsbParaInventario,
  filtrarAudioParaInventario,
} from '../utils/perifericos';

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
  'Impresora':  'badge-router',
  'Monitor':    'badge-info',
  'Teclado':    'badge-neutral',
  'Mouse':      'badge-neutral',
  'Webcam':     'badge-switch',
  'Bluetooth':  'badge-switch',
  'Micrófono':  'badge-info',
  'Parlante':   'badge-success',
  'USB (otro)': 'badge-neutral',
};

function chipTipo(tipo) {
  return <span className={`badge ${TIPO_BADGE[tipo] ?? 'badge-neutral'}`}>{tipo}</span>;
}

function push(out, uuid, tipo, hostname, nombre, fabClase, detalle) {
  out.push({
    key: `${uuid}-${tipo}-${nombre ?? ''}-${out.length}`,
    tipo,
    hostname,
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

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;

  const total = filas.length;
  const visibles = filasFiltradas.length;
  const subt =
    visibles === total
      ? `${total} periférico${total === 1 ? '' : 's'}`
      : `${visibles} de ${total} periférico${total === 1 ? '' : 's'}`;

  return (
    <div className="page">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '0.35rem',
        }}
      >
        <div>
          <h1 className="inventory-page-title" style={{ marginBottom: '0.2rem' }}>Todos los periféricos</h1>
          <p className="inventory-page-sub" style={{ margin: 0 }}>{subt}</p>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Vista agregada de impresoras físicas (se excluyen virtuales), monitores, USB y audio reportados por el agente en cada PC.
      </p>

      <div className="inventory-toolbar-card">
        <div className="inventory-toolbar-row">
          <div className="inventory-field inventory-field--grow">
            <label className="inventory-field__label" htmlFor="perif-buscar">Buscar</label>
            <input
              id="perif-buscar"
              className="inventory-input"
              type="search"
              placeholder="PC origen (hostname) o nombre del dispositivo…"
              value={buscar}
              onChange={e => setBuscar(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="inventory-field inventory-field--sm" style={{ minWidth: '12rem' }}>
            <label className="inventory-field__label" htmlFor="perif-tipo">Tipo</label>
            <select
              id="perif-tipo"
              className="inventory-select"
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
            >
              <option value="">{`Todos (${total})`}</option>
              {tiposDisponibles.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>PC origen</th>
                <th>Nombre</th>
                <th>Fabricante / clase</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {total === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    Sin periféricos reportados
                  </td>
                </tr>
              ) : visibles === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    Ningún resultado con los filtros actuales
                  </td>
                </tr>
              ) : (
                filasFiltradas.map(f => (
                  <tr key={f.key}>
                    <td>{chipTipo(f.tipo)}</td>
                    <td>{f.hostname}</td>
                    <td>{f.nombre}</td>
                    <td>{f.fabClase}</td>
                    <td>{f.detalle}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PerifericosTodosList;

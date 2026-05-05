import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSwitch, cambiarEstadoSwitch } from '../api/switchApi';
import { ESTADOS_OPERATIVOS, ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import { labelUbicacionEnum } from '../constants/ubicaciones';

function fmtFechaIso(s) {
  if (s == null || s === '') return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('es-AR');
}

function fmtFechaAlta(v) {
  if (v == null || v === '') return '—';
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v.length >= 3) {
    const [y, m, d] = v;
    return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return String(v);
}

function SwitchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sw, setSw] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [estadoSel, setEstadoSel] = useState('');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [msgEstado, setMsgEstado] = useState(null);

  useEffect(() => {
    setCargando(true);
    setError(null);
    fetchSwitch(id)
      .then(data => {
        setSw(data);
        if (!data) setError('Switch no encontrado');
      })
      .catch(() => setError('No se pudo cargar el detalle'))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;
  if (!sw) return <p className="estado-msg">Switch no encontrado</p>;

  function guardarEstado(e) {
    e.preventDefault();
    if (!estadoSel || !motivoEstado.trim()) return;
    setGuardandoEstado(true);
    setMsgEstado(null);
    cambiarEstadoSwitch(id, { estado: estadoSel, motivo: motivoEstado.trim() })
      .then(data => {
        if (data) {
          setSw(data);
          setMotivoEstado('');
        } else {
          setMsgEstado('No se encontró el switch');
        }
      })
      .catch(() => setMsgEstado('No se pudo cambiar el estado'))
      .finally(() => setGuardandoEstado(false));
  }

  const historial = sw.historialEstados ?? [];
  const vlansTxt = Array.isArray(sw.vlans) && sw.vlans.length ? sw.vlans.join(', ') : '—';

  return (
    <div className="page">
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/switches')}>
        ← Volver
      </button>

      <h1 style={{ marginTop: '0.75rem' }}>{sw.nombre}</h1>

      <div className="card">
        <h2>Datos generales</h2>
        <dl className="detail-dl">
          <dt>ID</dt><dd className="uuid">{sw.id}</dd>
          <dt>Marca</dt><dd>{sw.marca ?? '—'}</dd>
          <dt>Modelo</dt><dd>{sw.modelo ?? '—'}</dd>
          <dt>IP</dt><dd className="uuid">{sw.ip ?? '—'}</dd>
          <dt>Nº serie</dt><dd>{sw.numeroSerie ?? '—'}</dd>
          <dt>Cantidad de puertos</dt><dd>{sw.cantidadPuertos ?? '—'}</dd>
          <dt>Tipo</dt><dd>{sw.tipo ?? '—'}</dd>
          <dt>VLANs</dt><dd>{vlansTxt}</dd>
          <dt>Ubicación</dt><dd>{sw.ubicacion ? labelUbicacionEnum(sw.ubicacion) : '—'}</dd>
          <dt>Estado (IT)</dt><dd>{sw.estado ?? '—'}</dd>
          <dt>Fecha alta</dt><dd>{fmtFechaAlta(sw.fechaAlta)}</dd>
        </dl>
        <form className="ubicacion-form" onSubmit={guardarEstado}>
          <label htmlFor="estado-sw">Cambiar estado (IT)</label>
          <div className="ubicacion-form-row">
            <select
              id="estado-sw"
              value={estadoSel}
              onChange={e => setEstadoSel(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {ESTADOS_OPERATIVOS.map(k => (
                <option key={k} value={k}>{ESTADO_OPERATIVO_LABELS[k] ?? k}</option>
              ))}
            </select>
          </div>
          <label htmlFor="motivo-estado-sw" style={{ marginTop: '0.5rem' }}>Motivo (obligatorio)</label>
          <textarea
            id="motivo-estado-sw"
            rows={3}
            value={motivoEstado}
            onChange={e => setMotivoEstado(e.target.value)}
            placeholder="Motivo del cambio de estado"
          />
          <div style={{ marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={guardandoEstado || !estadoSel || !motivoEstado.trim()}
            >
              {guardandoEstado ? 'Guardando…' : 'Cambiar estado'}
            </button>
          </div>
          {msgEstado ? <p className="page error" style={{ marginTop: '0.5rem' }}>{msgEstado}</p> : null}
        </form>
        <h3 style={{ marginTop: '1.25rem', marginBottom: '0.5rem' }}>Historial de estados (IT)</h3>
        {historial.length === 0 ? (
          <p className="estado-msg">Sin cambios de estado registrados</p>
        ) : (
          <div className="table-wrap" style={{ marginTop: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Motivo</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Activo</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h, i) => (
                  <tr key={i}>
                    <td>{h.estado ?? '—'}</td>
                    <td>{h.motivo ?? '—'}</td>
                    <td className="uuid">{fmtFechaIso(h.fechaHoraInicio)}</td>
                    <td className="uuid">{fmtFechaIso(h.fechaHoraFin)}</td>
                    <td>{h.activo ? 'Sí' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default SwitchDetail;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMaquina, cambiarEstadoMaquina } from '../api/maquinaTesoreriaApi';
import { ESTADOS_OPERATIVOS, ESTADO_OPERATIVO_LABELS } from '../constants/estados';

const TIPO_LABELS = {
  VALIDADORA: 'Validadora',
  BOLSILLOS: 'Bolsillos',
  RECONTADORA: 'Recontadora',
  ENVASADORA: 'Envasadora',
  FAJADORA: 'Fajadora',
};

function fmtFechaIso(s) {
  if (s == null || s === '') return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('es-AR');
}

function MaquinaTesoreriaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [maquina, setMaquina] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [estadoSel, setEstadoSel] = useState('');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [msgEstado, setMsgEstado] = useState(null);

  useEffect(() => {
    setCargando(true);
    setError(null);
    fetchMaquina(id)
      .then(data => {
        setMaquina(data);
        if (!data) setError('Máquina no encontrada');
      })
      .catch(() => setError('No se pudo cargar el detalle'))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;
  if (!maquina) return <p className="estado-msg">Máquina no encontrada</p>;

  function guardarEstado(e) {
    e.preventDefault();
    if (!estadoSel || !motivoEstado.trim()) return;
    setGuardandoEstado(true);
    setMsgEstado(null);
    cambiarEstadoMaquina(id, { estado: estadoSel, motivo: motivoEstado.trim() })
      .then(data => {
        if (data) {
          setMaquina(data);
          setMotivoEstado('');
        } else {
          setMsgEstado('No se encontró la máquina');
        }
      })
      .catch(() => setMsgEstado('No se pudo cambiar el estado'))
      .finally(() => setGuardandoEstado(false));
  }

  const historial = maquina.historialEstados ?? [];

  return (
    <div className="page">
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/maquinas-tesoreria')}>
        ← Volver
      </button>

      <h1 style={{ marginTop: '0.75rem' }}>
        {TIPO_LABELS[maquina.tipo] ?? maquina.tipo} — {maquina.modelo}
      </h1>

      <div className="card">
        <h2>Datos generales</h2>
        <dl className="detail-dl">
          <dt>ID</dt><dd className="uuid">{maquina.id}</dd>
          <dt>Tipo</dt><dd>{TIPO_LABELS[maquina.tipo] ?? maquina.tipo ?? '—'}</dd>
          <dt>Modelo</dt><dd>{maquina.modelo ?? '—'}</dd>
          <dt>Nº serie</dt><dd className="uuid">{maquina.nroSerie ?? '—'}</dd>
          <dt>Vida / Obs.</dt><dd>{maquina.vida ?? '—'}</dd>
          <dt>Estado (IT)</dt><dd>{maquina.estado ?? '—'}</dd>
        </dl>

        <form className="ubicacion-form" onSubmit={guardarEstado}>
          <label htmlFor="estado-maquina">Cambiar estado (IT)</label>
          <div className="ubicacion-form-row">
            <select
              id="estado-maquina"
              value={estadoSel}
              onChange={e => setEstadoSel(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {ESTADOS_OPERATIVOS.map(k => (
                <option key={k} value={k}>{ESTADO_OPERATIVO_LABELS[k] ?? k}</option>
              ))}
            </select>
          </div>
          <label htmlFor="motivo-maquina" style={{ marginTop: '0.5rem' }}>Motivo (obligatorio)</label>
          <textarea
            id="motivo-maquina"
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
          {msgEstado ? <p className="estado-msg error" style={{ marginTop: '0.5rem' }}>{msgEstado}</p> : null}
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

export default MaquinaTesoreriaDetail;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRouter, cambiarEstadoRouter, actualizarRouter } from '../api/routerApi';
import { ESTADOS_OPERATIVOS, ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import { UBICACIONES_RED, labelUbicacionEnum } from '../constants/ubicaciones';
import InfraestructuraModal from '../components/InfraestructuraModal';

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

function RouterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [r, setR] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [estadoSel, setEstadoSel] = useState('');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [msgEstado, setMsgEstado] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalForm, setModalForm] = useState({});
  const [modalError, setModalError] = useState('');
  const [guardandoForm, setGuardandoForm] = useState(false);

  useEffect(() => {
    setCargando(true);
    setError(null);
    fetchRouter(id)
      .then(data => {
        setR(data);
        if (!data) setError('Router no encontrado');
      })
      .catch(() => setError('No se pudo cargar el detalle'))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;
  if (!r) return <p className="estado-msg">Router no encontrado</p>;

  function guardarEstado(e) {
    e.preventDefault();
    if (!estadoSel || !motivoEstado.trim()) return;
    setGuardandoEstado(true);
    setMsgEstado(null);
    cambiarEstadoRouter(id, { estado: estadoSel, motivo: motivoEstado.trim() })
      .then(data => {
        if (data) {
          setR(data);
          setMotivoEstado('');
        } else {
          setMsgEstado('No se encontró el router');
        }
      })
      .catch(() => setMsgEstado('No se pudo cambiar el estado'))
      .finally(() => setGuardandoEstado(false));
  }

  const commonFields = [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'marca', label: 'Marca', type: 'text' },
    { name: 'modelo', label: 'Modelo', type: 'text' },
    { name: 'ip', label: 'IP Local', type: 'text' },
    { name: 'numeroSerie', label: 'Nro de Serie', type: 'text' },
  ];
  
  const routerFields = [
    ...commonFields,
    { name: 'firmware', label: 'Firmware', type: 'text' },
    { name: 'cantidadPuertosWan', label: 'Puertos WAN', type: 'number' },
    { name: 'cantidadPuertosLan', label: 'Puertos LAN', type: 'number' },
    { name: 'gateway', label: 'Gateway', type: 'text' },
  ];

  const handleOpenEdit = () => {
    setModalForm({ ...r });
    setModalError('');
    setModalAbierto(true);
  };

  const onChangeCampo = (e) => {
    const { name, value } = e.target;
    setModalForm(prev => ({ ...prev, [name]: value }));
  };

  const enviarEdicion = (e) => {
    e.preventDefault();
    if (!modalForm.nombre?.trim() || !modalForm.ubicacion) {
      setModalError('Nombre y ubicación son obligatorios');
      return;
    }
    setGuardandoForm(true);
    setModalError('');

    const body = {
      nombre: modalForm.nombre.trim(),
      marca: modalForm.marca?.trim() || undefined,
      modelo: modalForm.modelo?.trim() || undefined,
      ip: modalForm.ip?.trim() || undefined,
      numeroSerie: modalForm.numeroSerie?.trim() || undefined,
      firmware: modalForm.firmware?.trim() || undefined,
      cantidadPuertosWan: Number(modalForm.cantidadPuertosWan) || 0,
      cantidadPuertosLan: Number(modalForm.cantidadPuertosLan) || 0,
      gateway: modalForm.gateway?.trim() || undefined,
      ubicacion: modalForm.ubicacion,
    };
    if (modalForm.fechaAlta?.trim()) body.fechaAlta = modalForm.fechaAlta.trim();

    actualizarRouter(id, body).then(data => {
      setR(data);
      setModalAbierto(false);
    }).catch(() => setModalError('No se pudo actualizar el router'))
      .finally(() => setGuardandoForm(false));
  };

  const historial = r.historialEstados ?? [];

  return (
    <div className="page">
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/routers-switches')}>
          ← Volver
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenEdit}>
          Editar
        </button>
      </div>

      <h1 style={{ marginTop: '0.75rem' }}>{r.nombre}</h1>

      <div className="card">
        <h2>Datos generales</h2>
        <dl className="detail-dl">
          <dt>ID</dt><dd className="uuid">{r.id}</dd>
          <dt>Marca</dt><dd>{r.marca ?? '—'}</dd>
          <dt>Modelo</dt><dd>{r.modelo ?? '—'}</dd>
          <dt>IP</dt><dd className="uuid">{r.ip ?? '—'}</dd>
          <dt>Nº serie</dt><dd>{r.numeroSerie ?? '—'}</dd>
          <dt>Firmware</dt><dd>{r.firmware ?? '—'}</dd>
          <dt>Puertos WAN</dt><dd>{r.cantidadPuertosWan ?? '—'}</dd>
          <dt>Puertos LAN</dt><dd>{r.cantidadPuertosLan ?? '—'}</dd>
          <dt>Gateway</dt><dd className="uuid">{r.gateway ?? '—'}</dd>
          <dt>Ubicación</dt><dd>{r.ubicacion ? labelUbicacionEnum(r.ubicacion) : '—'}</dd>
          <dt>Estado (IT)</dt><dd>{r.estado ?? '—'}</dd>
          <dt>Fecha alta</dt><dd>{fmtFechaAlta(r.fechaAlta)}</dd>
        </dl>
        <form className="ubicacion-form" onSubmit={guardarEstado}>
          <label htmlFor="estado-router">Cambiar estado (IT)</label>
          <div className="ubicacion-form-row">
            <select
              id="estado-router"
              value={estadoSel}
              onChange={e => setEstadoSel(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {ESTADOS_OPERATIVOS.map(k => (
                <option key={k} value={k}>{ESTADO_OPERATIVO_LABELS[k] ?? k}</option>
              ))}
            </select>
          </div>
          <label htmlFor="motivo-estado-router" style={{ marginTop: '0.5rem' }}>Motivo (obligatorio)</label>
          <textarea
            id="motivo-estado-router"
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

      <InfraestructuraModal 
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSubmit={enviarEdicion}
        isEdit={true}
        title="Router"
        error={modalError}
        formState={modalForm}
        onChange={onChangeCampo}
        fields={routerFields}
        customFields={
          <>
            <div className="modal-field">
              <label>Ubicación <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select
                name="ubicacion"
                value={modalForm.ubicacion || ''}
                onChange={onChangeCampo}
                required
                className="inventory-input"
              >
                <option value="">Seleccionar…</option>
                {UBICACIONES_RED.map(u => (
                  <option key={u} value={u}>{labelUbicacionEnum(u)}</option>
                ))}
              </select>
            </div>
            <div className="modal-field">
              <label>Fecha alta</label>
              <input
                type="date"
                name="fechaAlta"
                value={modalForm.fechaAlta || ''}
                onChange={onChangeCampo}
                className="inventory-input"
              />
            </div>
          </>
        }
      />
    </div>
  );
}

export default RouterDetail;

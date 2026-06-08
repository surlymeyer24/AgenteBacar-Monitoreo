import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSwitch, cambiarEstadoSwitch, actualizarSwitch } from '../api/switchApi';
import { ESTADOS_OPERATIVOS, ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import { UBICACIONES_RED, labelUbicacionEnum } from '../constants/ubicaciones';
import InfraestructuraModal from '../components/InfraestructuraModal';

function parseVlans(texto) {
  if (!texto || !String(texto).trim()) return undefined;
  const partes = String(texto).split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
  return partes.length ? partes : undefined;
}

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

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalForm, setModalForm] = useState({});
  const [modalError, setModalError] = useState('');
  const [guardandoForm, setGuardandoForm] = useState(false);

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

  const commonFields = [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'marca', label: 'Marca', type: 'text' },
    { name: 'modelo', label: 'Modelo', type: 'text' },
    { name: 'ip', label: 'IP Local', type: 'text' },
    { name: 'numeroSerie', label: 'Nro de Serie', type: 'text' },
  ];
  
  const switchFields = [
    ...commonFields,
    { name: 'cantidadPuertos', label: 'Cantidad de puertos', type: 'number' },
    { name: 'tipo', label: 'Tipo (Ej. capa 2)', type: 'text' },
    { name: 'vlansTexto', label: 'VLANs (separadas por coma)', type: 'textarea' },
  ];

  const handleOpenEdit = () => {
    const vlansTxt = Array.isArray(sw.vlans) && sw.vlans.length ? sw.vlans.join(', ') : '';
    setModalForm({ ...sw, vlansTexto: vlansTxt });
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

    const vlans = parseVlans(modalForm.vlansTexto);
    const body = {
      nombre: modalForm.nombre.trim(),
      marca: modalForm.marca?.trim() || undefined,
      modelo: modalForm.modelo?.trim() || undefined,
      ip: modalForm.ip?.trim() || undefined,
      numeroSerie: modalForm.numeroSerie?.trim() || undefined,
      cantidadPuertos: Number(modalForm.cantidadPuertos) || 0,
      tipo: modalForm.tipo?.trim() || undefined,
      ubicacion: modalForm.ubicacion,
    };
    if (vlans) body.vlans = vlans;
    if (modalForm.fechaAlta?.trim()) body.fechaAlta = modalForm.fechaAlta.trim();

    actualizarSwitch(id, body).then(data => {
      setSw(data);
      setModalAbierto(false);
    }).catch(() => setModalError('No se pudo actualizar el switch'))
      .finally(() => setGuardandoForm(false));
  };

  const historial = sw.historialEstados ?? [];
  const vlansTxt = Array.isArray(sw.vlans) && sw.vlans.length ? sw.vlans.join(', ') : '—';

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

      <InfraestructuraModal 
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSubmit={enviarEdicion}
        isEdit={true}
        title="Switch"
        error={modalError}
        formState={modalForm}
        onChange={onChangeCampo}
        fields={switchFields}
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

export default SwitchDetail;

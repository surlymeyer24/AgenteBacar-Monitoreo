import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCamara, updateEstadoCamara, asignarNvrCamara, deleteCamara, actualizarCamara } from '../api/camaraApi';
import { fetchNvrs } from '../api/nvrApi';
import { ESTADOS_OPERATIVOS, ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import { UBICACIONES_CAMARA_SUGERIDAS, labelUbicacionEnum } from '../constants/ubicaciones';
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

function CamaraDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cam, setCam] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [estadoSel, setEstadoSel] = useState('');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [msgEstado, setMsgEstado] = useState(null);
  const [nvrs, setNvrs] = useState([]);
  const [nvrSel, setNvrSel] = useState('');
  const [guardandoNvr, setGuardandoNvr] = useState(false);
  const [msgNvr, setMsgNvr] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [msgEliminar, setMsgEliminar] = useState(null);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({});
  const [modalError, setModalError] = useState('');

  const handleOpenEditModal = () => {
    if (!cam) return;
    setModalForm({
      dispositivo: cam.id || '',
      nombre: cam.nombre || '',
      marca: cam.marca || '',
      descripcion: cam.descripcion || '',
      responsable: cam.responsable || '',
      ubicacion: cam.ubicacion || '',
      direccionIp: cam.direccionIp || '',
      puerto: cam.puerto != null ? String(cam.puerto) : '',
      tipo: cam.tipo || '',
      nvrId: cam.nvrId || '',
      estado: cam.estado || ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const payload = {
        dispositivo: modalForm.dispositivo.trim(),
        nombre: modalForm.nombre.trim(),
        marca: modalForm.marca?.trim() || undefined,
        descripcion: modalForm.descripcion?.trim() || undefined,
        responsable: modalForm.responsable?.trim() || undefined,
        ubicacion: modalForm.ubicacion,
        direccionIp: modalForm.direccionIp?.trim() || undefined,
        tipo: modalForm.tipo?.trim() || undefined,
        nvrId: modalForm.nvrId?.trim() || undefined,
      };
      const puertoNum = modalForm.puerto && String(modalForm.puerto).trim() !== '' 
        ? Number.parseInt(String(modalForm.puerto).trim(), 10) 
        : undefined;
      if (puertoNum !== undefined && !Number.isNaN(puertoNum)) {
        payload.puerto = puertoNum;
      }
      
      await actualizarCamara(id, payload);
      
      if (modalForm.estado && modalForm.estado !== cam.estado) {
        await updateEstadoCamara(id, modalForm.estado, "Edición manual desde detalle");
      }
      
      const updatedCam = await fetchCamara(id);
      setCam(updatedCam);
      setIsModalOpen(false);
    } catch (err) {
      setModalError(err.message || 'Error al actualizar');
    }
  };

  useEffect(() => {
    fetchNvrs()
      .then(setNvrs)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCargando(true);
    setError(null);
    fetchCamara(id)
      .then(data => {
        setCam(data);
        if (!data) setError('Cámara no encontrada');
      })
      .catch(() => setError('No se pudo cargar el detalle'))
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => {
    if (cam?.nvrId) setNvrSel(cam.nvrId);
    else setNvrSel('');
  }, [cam]);

  function guardarNvr(e) {
    e.preventDefault();
    setGuardandoNvr(true);
    setMsgNvr(null);
    const valor = nvrSel.trim();
    asignarNvrCamara(id, valor || null)
      .then(data => {
        if (data) {
          setCam(data);
          setMsgNvr(null);
        } else {
          setMsgNvr('No se encontró la cámara');
        }
      })
      .catch(() => setMsgNvr('No se pudo actualizar la NVR'))
      .finally(() => setGuardandoNvr(false));
  }

  function guardarEstado(e) {
    e.preventDefault();
    if (!estadoSel) return;
    setGuardandoEstado(true);
    setMsgEstado(null);
    updateEstadoCamara(id, estadoSel, motivoEstado.trim() || '')
      .then(data => {
        if (data) {
          setCam(data);
          setMotivoEstado('');
        } else {
          setMsgEstado('No se encontró la cámara');
        }
      })
      .catch(() => setMsgEstado('No se pudo cambiar el estado'))
      .finally(() => setGuardandoEstado(false));
  }

  function solicitarEliminar() {
    const nombre = (cam.nombre && String(cam.nombre).trim()) ? cam.nombre : 'esta cámara';
    if (
      !window.confirm(
        `¿Seguro que querés borrar ${nombre} (${id})? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setEliminando(true);
    setMsgEliminar(null);
    deleteCamara(id)
      .then(ok => {
        if (ok) navigate('/camaras');
        else setMsgEliminar('No se encontró la cámara (quizá ya fue borrada).');
      })
      .catch(() => setMsgEliminar('No se pudo eliminar la cámara'))
      .finally(() => setEliminando(false));
  }

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;
  if (!cam) return <p className="estado-msg">Cámara no encontrada</p>;

  const nvrInfo = cam.nvrId ? nvrs.find(n => n.id === cam.nvrId) : null;
  const historial = cam.historialEstados ?? [];

  return (
    <div className="page">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() =>
            navigate(
              cam.nvrId ? `/nvrs/${encodeURIComponent(cam.nvrId)}` : '/nvrs',
            )}
        >
          ← Volver
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleOpenEditModal}
        >
          Editar
        </button>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={solicitarEliminar}
          disabled={eliminando}
        >
          {eliminando ? 'Eliminando…' : 'Eliminar cámara'}
        </button>
      </div>
      {msgEliminar ? (
        <p className="page error" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
          {msgEliminar}
        </p>
      ) : null}

      <h1 style={{ marginTop: '0.75rem' }}>{cam.nombre}</h1>

      <div className="card">
        <h2>Datos generales</h2>
        <dl className="detail-dl">
          <dt>Dispositivo (ID)</dt><dd className="uuid">{cam.id}</dd>
          <dt>IP</dt><dd>{cam.direccionIp ?? '—'}</dd>
          <dt>Puerto</dt><dd>{cam.puerto != null ? String(cam.puerto) : '—'}</dd>
          <dt>Tipo</dt><dd>{cam.tipo ?? '—'}</dd>
          <dt>Marca</dt><dd>{cam.marca ?? '—'}</dd>
          <dt>Descripción</dt><dd>{cam.descripcion ?? '—'}</dd>
          <dt>Responsable</dt><dd>{cam.responsable ?? '—'}</dd>
          <dt>Ubicación</dt><dd>{cam.ubicacion ?? '—'}</dd>
          <dt>NVR</dt>
          <dd>
            {cam.nvrId
              ? (nvrInfo?.nombre ? `${nvrInfo.nombre} (${cam.nvrId})` : cam.nvrId)
              : '—'}
          </dd>
          <dt>Estado (IT)</dt><dd>{cam.estado ?? '—'}</dd>
          <dt>Fecha alta</dt><dd>{fmtFechaAlta(cam.fechaAlta)}</dd>
        </dl>
        <form className="ubicacion-form" onSubmit={guardarNvr}>
          <label htmlFor="nvr-cam">Asignar NVR</label>
          <div className="ubicacion-form-row">
            <select
              id="nvr-cam"
              value={nvrSel}
              onChange={e => setNvrSel(e.target.value)}
            >
              <option value="">Sin NVR</option>
              {nvrs.map(n => (
                <option key={n.id} value={n.id}>{n.nombre ?? n.id}</option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={guardandoNvr}>
              {guardandoNvr ? 'Guardando…' : 'Guardar NVR'}
            </button>
          </div>
          {msgNvr ? <p className="page error" style={{ marginTop: '0.5rem' }}>{msgNvr}</p> : null}
        </form>
        <form className="ubicacion-form" onSubmit={guardarEstado} style={{ marginTop: '1rem' }}>
          <label htmlFor="estado-cam">Cambiar estado (IT)</label>
          <div className="ubicacion-form-row">
            <select
              id="estado-cam"
              value={estadoSel}
              onChange={e => setEstadoSel(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {ESTADOS_OPERATIVOS.map(k => (
                <option key={k} value={k}>{ESTADO_OPERATIVO_LABELS[k] ?? k}</option>
              ))}
            </select>
          </div>
          <label htmlFor="motivo-estado-cam" style={{ marginTop: '0.5rem' }}>Motivo (opcional)</label>
          <textarea
            id="motivo-estado-cam"
            rows={3}
            value={motivoEstado}
            onChange={e => setMotivoEstado(e.target.value)}
            placeholder="Opcional — ej.: reubicación, revisión de inventario…"
          />
          <div style={{ marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={guardandoEstado || !estadoSel}
            >
              {guardandoEstado ? 'Guardando…' : 'Cambiar estado'}
            </button>
          </div>
          {msgEstado && <p className="page error" style={{ marginTop: '0.5rem' }}>{msgEstado}</p>}
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isEdit={true}
        title="Cámara de Seguridad"
        error={modalError}
        formState={modalForm}
        onChange={(e) => setModalForm({...modalForm, [e.target.name]: e.target.value})}
        fields={[
          { name: 'nombre', label: 'Nombre comercial / descriptivo', type: 'text', required: true },
          { name: 'nvrId', label: 'NVR (opcional)', type: 'select', options: nvrs.map(n => ({ value: n.id, label: n.nombre ?? n.id })) },
          { name: 'ubicacion', label: 'Ubicación', type: 'select', options: UBICACIONES_CAMARA_SUGERIDAS.map(u => ({ value: u, label: labelUbicacionEnum(u) })), required: true },
          { name: 'direccionIp', label: 'Dirección IP', type: 'text' },
          { name: 'puerto', label: 'Puerto', type: 'number' },
          { name: 'tipo', label: 'Tipo de Cámara / Modelo', type: 'text', required: true },
          { name: 'marca', label: 'Marca', type: 'text' },
          { name: 'responsable', label: 'Responsable', type: 'text' },
          { name: 'descripcion', label: 'Descripción / Notas', type: 'textarea', fullWidth: true },
          { name: 'estado', label: 'Estado', type: 'select', options: ESTADOS_OPERATIVOS.map(e => ({ value: e, label: ESTADO_OPERATIVO_LABELS[e] })) }
        ]}
      />
    </div>
  );
}

export default CamaraDetail;

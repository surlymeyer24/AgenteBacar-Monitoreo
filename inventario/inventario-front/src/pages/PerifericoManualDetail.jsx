import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  fetchPerifericoM,
  actualizarPerifericoM,
  updateEstadoPerifericoM,
  asignarPerifericoM,
  deletePerifericoM,
} from '../api/perifericoManualApi';
import { ESTADOS_OPERATIVOS } from '../constants/estados';

const TIPOS = ['teclado', 'mouse', 'monitor', 'impresora', 'webcam', 'parlante', 'microfono', 'otro'];
const CONEXIONES = ['usb', 'inalambrico_usb', 'bluetooth', 'hdmi', 'otro'];

function fmtFecha(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function formDesdeP(p) {
  return {
    tipo: p.tipo ?? '',
    cantidad: String(p.cantidad ?? 1),
    nombre: p.nombre ?? '',
    fabricante: p.fabricante ?? '',
    conexion: p.conexion ?? '',
    computadoraHostname: p.computadoraHostname ?? '',
    ubicacion: p.ubicacion ?? '',
    notas: p.notas ?? '',
    fechaAlta: p.fechaAlta ? String(p.fechaAlta) : '',
  };
}

function PerifericoManualDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [msgEdit, setMsgEdit] = useState(null);

  const [borrando, setBorrando] = useState(false);

  const [estadoSel, setEstadoSel] = useState('');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [msgEstado, setMsgEstado] = useState(null);

  const [hostnameAsignar, setHostnameAsignar] = useState('');
  const [motivoAsignar, setMotivoAsignar] = useState('');
  const [asignando, setAsignando] = useState(false);
  const [msgAsignar, setMsgAsignar] = useState(null);

  useEffect(() => {
    let cancel = false;
    setCargando(true);
    fetchPerifericoM(id)
      .then(data => {
        if (cancel) return;
        if (!data) setError('Periférico no encontrado.');
        else setP(data);
      })
      .catch(() => { if (!cancel) setError('No se pudo cargar el periférico.'); })
      .finally(() => { if (!cancel) setCargando(false); });
    return () => { cancel = true; };
  }, [id]);

  function iniciarEdicion() {
    setForm(formDesdeP(p));
    setMsgEdit(null);
    setEditando(true);
  }

  function cancelarEdicion() {
    setEditando(false);
    setForm(null);
    setMsgEdit(null);
  }

  function onChangeForm(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function guardarEdicion() {
    setGuardando(true);
    setMsgEdit(null);
    const body = {
      tipo: form.tipo || undefined,
      cantidad: parseInt(form.cantidad, 10) || 1,
      nombre: form.nombre.trim() || undefined,
      fabricante: form.fabricante.trim() || undefined,
      conexion: form.conexion || undefined,
      computadoraHostname: form.computadoraHostname.trim() || undefined,
      ubicacion: form.ubicacion.trim() || undefined,
      notas: form.notas.trim() || undefined,
      fechaAlta: form.fechaAlta || undefined,
    };
    actualizarPerifericoM(id, body)
      .then(data => {
        if (!data) { setMsgEdit('No se encontró el periférico.'); return; }
        setP(data);
        setEditando(false);
        setForm(null);
      })
      .catch(() => setMsgEdit('No se pudo guardar los cambios.'))
      .finally(() => setGuardando(false));
  }

  function hacerAsignar() {
    if (!hostnameAsignar.trim()) return;
    setAsignando(true);
    setMsgAsignar(null);
    asignarPerifericoM(id, hostnameAsignar.trim(), motivoAsignar.trim() || undefined)
      .then(data => {
        if (!data) { setMsgAsignar('No se encontró el periférico.'); return; }
        navigate(`/perifericos/stock/${encodeURIComponent(data.id)}`);
      })
      .catch(() => setMsgAsignar('No se pudo asignar el periférico.'))
      .finally(() => setAsignando(false));
  }

  function guardarEstado() {
    if (!estadoSel || !motivoEstado.trim()) return;
    setGuardandoEstado(true);
    setMsgEstado(null);
    updateEstadoPerifericoM(id, estadoSel, motivoEstado.trim())
      .then(data => {
        if (!data) { setMsgEstado('Periférico no encontrado.'); return; }
        setP(data);
        setEstadoSel('');
        setMotivoEstado('');
      })
      .catch(() => setMsgEstado('No se pudo cambiar el estado.'))
      .finally(() => setGuardandoEstado(false));
  }

  function borrarItem() {
    if (!window.confirm('¿Estás seguro de que querés eliminar este periférico? Esta acción no se puede deshacer.')) return;
    setBorrando(true);
    deletePerifericoM(id)
      .then(() => navigate('/perifericos/stock'))
      .catch(() => {
        alert('Error al eliminar el periférico.');
        setBorrando(false);
      });
  }

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;
  if (!p) return null;

  return (
    <div className="page">
      <Link to="/perifericos/stock" className="btn btn-secondary btn-sm">← Volver al stock</Link>
      <h1 style={{ marginTop: '0.75rem', textTransform: 'capitalize' }}>
        {p.tipo ?? 'Periférico'}{p.nombre ? ` — ${p.nombre}` : ''}
      </h1>

      {/* ── Card de datos ── */}
      <div className="card" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <strong>Datos del periférico</strong>
          {!editando && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={iniciarEdicion}>Editar</button>
              <button className="btn btn-sm" style={{ backgroundColor: '#dc3545', color: '#fff' }} onClick={borrarItem} disabled={borrando}>
                {borrando ? 'Borrando...' : 'Eliminar'}
              </button>
            </div>
          )}
        </div>

        {editando ? (
          <form className="camara-form" onSubmit={e => { e.preventDefault(); guardarEdicion(); }}>
            <label>
              Tipo
              <select name="tipo" value={form.tipo} onChange={onChangeForm}>
                <option value="">Sin especificar</option>
                {TIPOS.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
              </select>
            </label>
            <label>
              Unidades
              <input name="cantidad" type="number" min="1" value={form.cantidad} onChange={onChangeForm} />
            </label>
            <label>
              Nombre / descripción
              <input name="nombre" value={form.nombre} onChange={onChangeForm} autoComplete="off" />
            </label>
            <label>
              Fabricante
              <input name="fabricante" value={form.fabricante} onChange={onChangeForm} autoComplete="off" />
            </label>
            <label>
              Conexión
              <select name="conexion" value={form.conexion} onChange={onChangeForm}>
                <option value="">Sin especificar</option>
                {CONEXIONES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              PC asignada (hostname)
              <input name="computadoraHostname" value={form.computadoraHostname} onChange={onChangeForm} autoComplete="off" />
            </label>
            <label>
              Ubicación
              <input name="ubicacion" value={form.ubicacion} onChange={onChangeForm} autoComplete="off" />
            </label>
            <label>
              Notas
              <textarea name="notas" value={form.notas} onChange={onChangeForm} rows={2} />
            </label>
            <label>
              Fecha de alta
              <input name="fechaAlta" type="date" value={form.fechaAlta} onChange={onChangeForm} />
            </label>
            {msgEdit && <p className="page error">{msgEdit}</p>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={cancelarEdicion} disabled={guardando}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <dl className="detail-dl">
            <dt>Tipo</dt>
            <dd style={{ textTransform: 'capitalize' }}>{p.tipo ?? '—'}</dd>
            <dt>Unidades</dt>
            <dd>{p.cantidad ?? 1}</dd>
            <dt>Nombre</dt>
            <dd>{p.nombre ?? '—'}</dd>
            <dt>Fabricante</dt>
            <dd>{p.fabricante ?? '—'}</dd>
            <dt>Conexión</dt>
            <dd>{p.conexion ?? '—'}</dd>
            <dt>PC asignada</dt>
            <dd>{p.computadoraHostname ?? <span className="muted">Sin asignar</span>}</dd>
            <dt>Ubicación</dt>
            <dd>{p.ubicacion ?? '—'}</dd>
            <dt>Estado actual</dt>
            <dd>{p.estado ?? '—'}</dd>
            <dt>Fecha de alta</dt>
            <dd>{p.fechaAlta ? String(p.fechaAlta) : '—'}</dd>
            {p.notas && (<><dt>Notas</dt><dd>{p.notas}</dd></>)}
          </dl>
        )}
      </div>

      {/* ── Asignar ── */}
      <div className="card" style={{ maxWidth: 560, marginTop: '1.25rem' }}>
        <h2 style={{ marginTop: 0 }}>Asignar a computadora</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: '0.75rem' }}>
          Asigna 1 unidad a una PC. Si hay más de 1 en stock, se descuenta automáticamente y se crea un registro separado para la unidad asignada.
        </p>
        <div className="ubicacion-form">
          <input
            placeholder="Hostname de la PC (ej. PC-JUAN)"
            value={hostnameAsignar}
            onChange={e => setHostnameAsignar(e.target.value)}
            autoComplete="off"
          />
          <input
            placeholder="Motivo (opcional)"
            value={motivoAsignar}
            onChange={e => setMotivoAsignar(e.target.value)}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={hacerAsignar}
            disabled={asignando || !hostnameAsignar.trim()}
          >
            {asignando ? 'Asignando…' : 'Asignar 1 unidad'}
          </button>
          {msgAsignar && <p className="page error" style={{ marginTop: '0.5rem' }}>{msgAsignar}</p>}
        </div>
      </div>

      {/* ── Cambiar estado ── */}
      <div className="card" style={{ maxWidth: 560, marginTop: '1.25rem' }}>
        <h2 style={{ marginTop: 0 }}>Cambiar estado</h2>
        <div className="ubicacion-form">
          <select value={estadoSel} onChange={e => setEstadoSel(e.target.value)}>
            <option value="">Seleccioná un estado</option>
            {ESTADOS_OPERATIVOS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <textarea
            placeholder="Motivo (obligatorio)"
            value={motivoEstado}
            onChange={e => setMotivoEstado(e.target.value)}
            rows={2}
            style={{ resize: 'vertical' }}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={guardarEstado}
            disabled={guardandoEstado || !estadoSel || !motivoEstado.trim()}
          >
            {guardandoEstado ? 'Guardando…' : 'Cambiar estado'}
          </button>
          {msgEstado && <p className="page error" style={{ marginTop: '0.5rem' }}>{msgEstado}</p>}
        </div>
      </div>

      {/* ── Historial ── */}
      <div className="card" style={{ maxWidth: 700, marginTop: '1.25rem' }}>
        <h2 style={{ marginTop: 0 }}>Historial de estados</h2>
        {(!p.historialEstados || p.historialEstados.length === 0) ? (
          <p className="muted">Sin cambios de estado registrados.</p>
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
                {p.historialEstados.map((h, i) => (
                  <tr key={i}>
                    <td>{h.estado ?? '—'}</td>
                    <td>{h.motivo || '—'}</td>
                    <td>{fmtFecha(h.fechaHoraInicio)}</td>
                    <td>{h.fechaHoraFin ? fmtFecha(h.fechaHoraFin) : '—'}</td>
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

export default PerifericoManualDetail;

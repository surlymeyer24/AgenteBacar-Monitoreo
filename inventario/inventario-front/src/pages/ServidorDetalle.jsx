import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchServidor, actualizarServidor, eliminarServidor } from '../api/servidorApi';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
  StudioPrimaryButton,
  StudioSecondaryButton,
} from '../components/studio/StudioUi';

const ESTADOS = ['activo', 'inactivo', 'mantenimiento'];

function ServidorDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [servidor, setServidor] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);

  useEffect(() => {
    setCargando(true);
    fetchServidor(id)
      .then(data => {
        if (!data) setError('Servidor no encontrado');
        else setServidor(data);
      })
      .catch(() => setError('No se pudo cargar el servidor'))
      .finally(() => setCargando(false));
  }, [id]);

  function iniciarEdicion() {
    setForm({
      nombre: servidor.nombre ?? '',
      hostname: servidor.hostname ?? '',
      ip: servidor.ip ?? '',
      sistemaOperativo: servidor.sistemaOperativo ?? '',
      ubicacion: servidor.ubicacion ?? '',
      descripcion: servidor.descripcion ?? '',
      estado: servidor.estado ?? 'activo',
    });
    setErrorGuardar(null);
    setEditando(true);
  }

  function cancelarEdicion() {
    if (guardando) return;
    setEditando(false);
  }

  function onChangeCampo(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function guardar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setErrorGuardar('El nombre es obligatorio');
      return;
    }
    setGuardando(true);
    setErrorGuardar(null);
    actualizarServidor(id, {
      nombre: form.nombre.trim(),
      hostname: form.hostname.trim() || null,
      ip: form.ip.trim() || null,
      sistemaOperativo: form.sistemaOperativo.trim() || null,
      ubicacion: form.ubicacion.trim() || null,
      descripcion: form.descripcion.trim() || null,
      estado: form.estado || null,
    })
      .then(data => {
        setServidor(data);
        setEditando(false);
      })
      .catch(() => setErrorGuardar('No se pudo guardar los cambios'))
      .finally(() => setGuardando(false));
  }

  function handleEliminar() {
    if (!window.confirm(`¿Eliminar el servidor "${servidor.nombre}"? Esta acción no se puede deshacer.`)) return;
    eliminarServidor(id)
      .then(ok => {
        if (ok) navigate('/servidores');
      })
      .catch(() => alert('No se pudo eliminar el servidor'));
  }

  if (cargando) return <StudioLoading />;
  if (error) return <StudioError message={error} />;
  if (!servidor) return null;

  return (
    <StudioPageShell
      title={servidor.nombre}
      subtitle={servidor.hostname ?? servidor.ip ?? 'Servidor'}
      actions={
        editando ? null : (
          <>
            <StudioSecondaryButton onClick={handleEliminar}>Eliminar</StudioSecondaryButton>
            <StudioPrimaryButton onClick={iniciarEdicion}>Editar</StudioPrimaryButton>
          </>
        )
      }
    >
      {editando ? (
        <div className="card" style={{ maxWidth: 520 }}>
          <h3 style={{ marginTop: 0 }}>Editar servidor</h3>
          <form className="ubicacion-form" onSubmit={guardar}>
            <label htmlFor="det-nombre">Nombre <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input id="det-nombre" value={form.nombre} onChange={e => onChangeCampo('nombre', e.target.value)} />
            <label htmlFor="det-hostname">Hostname</label>
            <input id="det-hostname" value={form.hostname} onChange={e => onChangeCampo('hostname', e.target.value)} />
            <label htmlFor="det-ip">IP</label>
            <input id="det-ip" value={form.ip} onChange={e => onChangeCampo('ip', e.target.value)} />
            <label htmlFor="det-so">Sistema operativo</label>
            <input id="det-so" value={form.sistemaOperativo} onChange={e => onChangeCampo('sistemaOperativo', e.target.value)} />
            <label htmlFor="det-ubic">Ubicación</label>
            <input id="det-ubic" value={form.ubicacion} onChange={e => onChangeCampo('ubicacion', e.target.value)} />
            <label htmlFor="det-desc">Descripción</label>
            <input id="det-desc" value={form.descripcion} onChange={e => onChangeCampo('descripcion', e.target.value)} />
            <label htmlFor="det-estado">Estado</label>
            <select id="det-estado" value={form.estado} onChange={e => onChangeCampo('estado', e.target.value)}>
              {ESTADOS.map(est => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
            {errorGuardar ? <p className="estado-msg error" style={{ marginTop: '0.5rem' }}>{errorGuardar}</p> : null}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={cancelarEdicion} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 520 }}>
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1.5rem', margin: 0 }}>
            <dt style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Nombre</dt>
            <dd style={{ margin: 0 }}>{servidor.nombre}</dd>
            <dt style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Hostname</dt>
            <dd style={{ margin: 0, fontFamily: 'monospace' }}>{servidor.hostname ?? '—'}</dd>
            <dt style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>IP</dt>
            <dd style={{ margin: 0, fontFamily: 'monospace' }}>{servidor.ip ?? '—'}</dd>
            <dt style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Sistema operativo</dt>
            <dd style={{ margin: 0 }}>{servidor.sistemaOperativo ?? '—'}</dd>
            <dt style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Ubicación</dt>
            <dd style={{ margin: 0 }}>{servidor.ubicacion ?? '—'}</dd>
            <dt style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Estado</dt>
            <dd style={{ margin: 0 }}>
              {servidor.estado ? (
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                  ${servidor.estado === 'activo' ? 'bg-green-100 text-green-700' :
                    servidor.estado === 'mantenimiento' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'}`}>
                  {servidor.estado}
                </span>
              ) : '—'}
            </dd>
            <dt style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Descripción</dt>
            <dd style={{ margin: 0 }}>{servidor.descripcion ?? '—'}</dd>
          </dl>
        </div>
      )}
    </StudioPageShell>
  );
}

export default ServidorDetalle;

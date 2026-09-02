import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { crearNvr } from '../api/nvrApi';

const empty = {
  dispositivo: '',
  nombre: '',
  direccionIp: '',
  puerto: '',
  descripcion: '',
  usuario: '',
  password: '',
};

function NvrNueva() {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function onSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.dispositivo.trim() || !form.nombre.trim()) {
      setError('Dispositivo (ID) y nombre son obligatorios');
      return;
    }
    const puertoNum =
      form.puerto.trim() === '' ? undefined : Number.parseInt(form.puerto.trim(), 10);
    const body = {
      dispositivo: form.dispositivo.trim(),
      nombre: form.nombre.trim(),
      direccionIp: form.direccionIp.trim() || undefined,
      descripcion: form.descripcion.trim() || undefined,
      usuario: form.usuario.trim() || undefined,
      password: form.password.trim() || undefined,
    };
    if (puertoNum !== undefined && !Number.isNaN(puertoNum)) {
      body.puerto = puertoNum;
    }
    setEnviando(true);
    crearNvr(body)
      .then(created => {
        if (created?.id) {
          navigate(`/nvrs/${encodeURIComponent(created.id)}`);
        } else {
          navigate('/nvrs');
        }
      })
      .catch(() => setError('No se pudo crear la NVR. Revisá los datos obligatorios.'))
      .finally(() => setEnviando(false));
  }

  return (
    <div className="page">
      <Link to="/nvrs" className="btn btn-secondary btn-sm">← Volver al listado</Link>
      <h1 style={{ marginTop: '0.75rem' }}>Crear NVR</h1>
      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={onSubmit} className="ubicacion-form">
          <label htmlFor="nvr-nueva-dispositivo">
            Dispositivo (ID documento) <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            id="nvr-nueva-dispositivo"
            name="dispositivo"
            value={form.dispositivo}
            onChange={onChange}
            required
            autoComplete="off"
            placeholder="Ej. nvr-monitoreo-nueva"
          />
          <label htmlFor="nvr-nueva-nombre">
            Nombre <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input id="nvr-nueva-nombre" name="nombre" value={form.nombre} onChange={onChange} required />
          <label htmlFor="nvr-nueva-ip">IP</label>
          <input
            id="nvr-nueva-ip"
            name="direccionIp"
            value={form.direccionIp}
            onChange={onChange}
            placeholder="Ej. 192.168.0.102"
          />
          <label htmlFor="nvr-nueva-puerto">Puerto</label>
          <input
            id="nvr-nueva-puerto"
            name="puerto"
            type="number"
            min={1}
            max={65535}
            value={form.puerto}
            onChange={onChange}
          />
          <label htmlFor="nvr-nueva-desc">Descripción</label>
          <textarea id="nvr-nueva-desc" name="descripcion" rows={3} value={form.descripcion} onChange={onChange} />
          <label htmlFor="nvr-nueva-usuario">Usuario</label>
          <input id="nvr-nueva-usuario" name="usuario" value={form.usuario} onChange={onChange} autoComplete="off" />
          <label htmlFor="nvr-nueva-password">Contraseña</label>
          <input id="nvr-nueva-password" name="password" type="password" value={form.password} onChange={onChange} autoComplete="new-password" />
          {error ? <p className="page error">{error}</p> : null}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Crear NVR'}
            </button>
            <Link to="/nvrs" className="btn btn-secondary btn-sm">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NvrNueva;

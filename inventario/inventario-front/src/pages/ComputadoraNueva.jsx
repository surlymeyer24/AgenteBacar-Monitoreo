import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createComputadora } from '../api/computadoraApi';
import { UBICACIONES_COMPUTADORA } from '../constants/ubicaciones';

const empty = {
  hostname: '',
  usuarioActual: '',
  ubicacion: '',
  sistemaOperativo: '',
  arquitectura: '',
  motivo: '',
};

function ComputadoraNueva() {
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
    const hostname = form.hostname.trim();
    if (!hostname) {
      setError('El hostname es obligatorio.');
      return;
    }
    const body = { hostname };
    const u = form.usuarioActual.trim();
    const ub = form.ubicacion.trim();
    const so = form.sistemaOperativo.trim();
    const ar = form.arquitectura.trim();
    if (u) body.usuarioActual = u;
    if (ub) body.ubicacion = ub;
    if (so) body.sistemaOperativo = so;
    if (ar) body.arquitectura = ar;
    const mo = form.motivo.trim();
    if (mo) body.motivo = mo;

    setEnviando(true);
    createComputadora(body)
      .then(c => {
        if (c?.uuid) navigate(`/computadoras/${encodeURIComponent(c.uuid)}`);
        else navigate('/computadoras');
      })
      .catch(() => setError('No se pudo crear la computadora. Revisá hostname y ubicación (enum válido).'))
      .finally(() => setEnviando(false));
  }

  return (
    <div className="page">
      <Link to="/computadoras" className="btn btn-secondary btn-sm">← Volver al inventario</Link>
      <h1 style={{ marginTop: '0.75rem' }}>Nueva computadora</h1>
      <p className="muted" style={{ marginTop: '0.35rem', maxWidth: '36rem' }}>
        El servidor genera el UUID. Podés cargar periféricos después desde el detalle del equipo.
      </p>
      <div className="card" style={{ maxWidth: 520 }}>
        <form className="camara-form" onSubmit={onSubmit}>
          <label>
            Hostname *
            <input name="hostname" value={form.hostname} onChange={onChange} required autoComplete="off" />
          </label>
          <label>
            Usuario actual
            <input name="usuarioActual" value={form.usuarioActual} onChange={onChange} autoComplete="off" />
          </label>
          <label>
            Ubicación
            <select name="ubicacion" value={form.ubicacion} onChange={onChange}>
              <option value="">Sin definir</option>
              {UBICACIONES_COMPUTADORA.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>
          <label>
            Sistema operativo
            <input name="sistemaOperativo" value={form.sistemaOperativo} onChange={onChange} />
          </label>
          <label>
            Arquitectura
            <input name="arquitectura" value={form.arquitectura} onChange={onChange} placeholder="Ej. x64" />
          </label>
          <label>
            Motivo del alta
            <input name="motivo" value={form.motivo} onChange={onChange} placeholder="Ej. Compra orden #123" />
          </label>
          {error && <p className="page error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Creando…' : 'Crear computadora'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ComputadoraNueva;

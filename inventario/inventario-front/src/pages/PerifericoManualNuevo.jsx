import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPerifericoM } from '../api/perifericoManualApi';

const TIPOS = ['teclado', 'mouse', 'monitor', 'impresora', 'webcam', 'parlante', 'microfono', 'otro'];
const CONEXIONES = ['usb', 'inalambrico_usb', 'bluetooth', 'hdmi', 'otro'];

const empty = {
  tipo: '',
  cantidad: '1',
  nombre: '',
  fabricante: '',
  conexion: '',
  computadoraHostname: '',
  ubicacion: '',
  notas: '',
  fechaAlta: '',
  motivo: '',
};

function PerifericoManualNuevo() {
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
    if (!form.tipo) { setError('El tipo es obligatorio.'); return; }

    const cantNum = parseInt(form.cantidad, 10);
    const body = { tipo: form.tipo, cantidad: cantNum > 0 ? cantNum : 1 };
    const n = form.nombre.trim();
    const fab = form.fabricante.trim();
    const con = form.conexion.trim();
    const host = form.computadoraHostname.trim();
    const ub = form.ubicacion.trim();
    const notas = form.notas.trim();
    const mot = form.motivo.trim();
    if (n) body.nombre = n;
    if (fab) body.fabricante = fab;
    if (con) body.conexion = con;
    if (host) body.computadoraHostname = host;
    if (ub) body.ubicacion = ub;
    if (notas) body.notas = notas;
    if (form.fechaAlta) body.fechaAlta = form.fechaAlta;
    if (mot) body.motivo = mot;

    setEnviando(true);
    createPerifericoM(body)
      .then(() => navigate('/perifericos/stock'))
      .catch(() => setError('No se pudo crear el periférico. Revisá los datos.'))
      .finally(() => setEnviando(false));
  }

  return (
    <div className="page">
      <Link to="/perifericos/stock" className="btn btn-secondary btn-sm">← Volver al inventario</Link>
      <h1 style={{ marginTop: '0.75rem' }}>Nuevo periférico</h1>
      <p className="muted" style={{ marginTop: '0.35rem', maxWidth: '36rem' }}>
        Registrá un periférico que ingresa al inventario. Si aún no está asignado a ninguna PC, dejá el hostname vacío.
      </p>
      <div className="card" style={{ maxWidth: 520 }}>
        <form className="camara-form" onSubmit={onSubmit}>
          <label>
            Tipo *
            <select name="tipo" value={form.tipo} onChange={onChange} required>
              <option value="">Seleccioná un tipo</option>
              {TIPOS.map(t => (
                <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Unidades
            <input name="cantidad" type="number" min="1" value={form.cantidad} onChange={onChange} />
          </label>
          <label>
            Nombre / descripción
            <input name="nombre" value={form.nombre} onChange={onChange} placeholder="Ej. Teclado mecánico RGB" autoComplete="off" />
          </label>
          <label>
            Fabricante
            <input name="fabricante" value={form.fabricante} onChange={onChange} placeholder="Ej. Logitech" autoComplete="off" />
          </label>
          <label>
            Tipo de conexión
            <select name="conexion" value={form.conexion} onChange={onChange}>
              <option value="">Sin especificar</option>
              {CONEXIONES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            PC asignada (hostname)
            <input name="computadoraHostname" value={form.computadoraHostname} onChange={onChange} placeholder="Ej. PC-JUAN (opcional)" autoComplete="off" />
          </label>
          <label>
            Ubicación
            <input name="ubicacion" value={form.ubicacion} onChange={onChange} placeholder="Ej. Depósito 1" autoComplete="off" />
          </label>
          <label>
            Notas
            <textarea name="notas" value={form.notas} onChange={onChange} rows={2} placeholder="Observaciones opcionales" />
          </label>
          <label>
            Fecha de alta
            <input name="fechaAlta" type="date" value={form.fechaAlta} onChange={onChange} />
          </label>
          <label>
            Motivo del alta
            <input name="motivo" value={form.motivo} onChange={onChange} placeholder="Ej. Compra orden #123" />
          </label>
          {error && <p className="page error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Crear periférico'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PerifericoManualNuevo;

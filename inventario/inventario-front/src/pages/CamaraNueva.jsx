import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createCamara } from '../api/camaraApi';
import { fetchNvrs } from '../api/nvrApi';
import { UBICACIONES_CAMARA_SUGERIDAS } from '../constants/ubicaciones';

const empty = {
  dispositivo: '',
  nombre: '',
  marca: '',
  descripcion: '',
  responsable: '',
  ubicacion: '',
  direccionIp: '',
  puerto: '',
  tipo: '',
  fechaAlta: '',
  nvrId: '',
};

function CamaraNueva() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(empty);
  const [nvrs, setNvrs] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNvrs()
      .then(setNvrs)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const q = searchParams.get('nvrId');
    if (q) {
      setForm(f => (f.nvrId === q ? f : { ...f, nvrId: q }));
    }
  }, [searchParams]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function onSubmit(e) {
    e.preventDefault();
    setError(null);
    const puertoNum =
      form.puerto.trim() === '' ? undefined : Number.parseInt(form.puerto.trim(), 10);
    const body = {
      dispositivo: form.dispositivo.trim(),
      nombre: form.nombre.trim(),
      marca: form.marca.trim() || undefined,
      descripcion: form.descripcion.trim() || undefined,
      responsable: form.responsable.trim() || undefined,
      ubicacion: form.ubicacion,
      direccionIp: form.direccionIp.trim() || undefined,
      tipo: form.tipo.trim() || undefined,
      nvrId: form.nvrId.trim() || undefined,
    };
    if (puertoNum !== undefined && !Number.isNaN(puertoNum)) {
      body.puerto = puertoNum;
    }
    if (form.fechaAlta) {
      body.fechaAlta = form.fechaAlta;
    }
    const from = searchParams.get('from');
    setEnviando(true);
    createCamara(body)
      .then(() => {
        if (from === 'camaras') {
          navigate('/camaras');
        } else {
          navigate(form.nvrId.trim() ? `/nvrs/${encodeURIComponent(form.nvrId.trim())}` : '/nvrs');
        }
      })
      .catch(() => setError('No se pudo crear la cámara. Revisá los datos obligatorios.'))
      .finally(() => setEnviando(false));
  }

  const from = searchParams.get('from');
  const volverNvr = from === 'camaras'
    ? '/camaras'
    : (form.nvrId.trim()
      ? `/nvrs/${encodeURIComponent(form.nvrId.trim())}`
      : '/nvrs');

  return (
    <div className="page">
      <Link to={volverNvr} className="btn btn-secondary btn-sm">← Volver</Link>
      <h1 style={{ marginTop: '0.75rem' }}>Nueva cámara</h1>
      <p className="muted" style={{ marginTop: '0.35rem', maxWidth: '36rem' }}>
        La cámara se puede registrar de manera independiente o asignarse a una NVR existente.
      </p>
      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={onSubmit} className="camara-form">
          <label>
            NVR (opcional)
            <select name="nvrId" value={form.nvrId} onChange={onChange}>
              <option value="">Sin NVR / Seleccionar NVR…</option>
              {nvrs.map(n => (
                <option key={n.id} value={n.id}>{n.nombre ?? n.id}</option>
              ))}
            </select>
          </label>
          <label>
            Dispositivo (ID documento) *
            <input
              name="dispositivo"
              value={form.dispositivo}
              onChange={onChange}
              required
              placeholder="Ej. número de serie / nombre del equipo en red"
              autoComplete="off"
            />
          </label>
          <label>
            Nombre *
            <input name="nombre" value={form.nombre} onChange={onChange} required />
          </label>
          <label>
            Ubicación *
            <input
              name="ubicacion"
              list="ubicaciones-camara-sugeridas"
              value={form.ubicacion}
              onChange={onChange}
              required
              placeholder="Ej. Domo Santiago o texto libre"
              autoComplete="off"
            />
            <datalist id="ubicaciones-camara-sugeridas">
              {UBICACIONES_CAMARA_SUGERIDAS.map(u => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </label>
          <label>
            Marca
            <input name="marca" value={form.marca} onChange={onChange} />
          </label>
          <label>
            Descripción
            <textarea name="descripcion" value={form.descripcion} onChange={onChange} rows={3} />
          </label>
          <label>
            Responsable
            <input name="responsable" value={form.responsable} onChange={onChange} />
          </label>
          <label>
            IP
            <input name="direccionIp" value={form.direccionIp} onChange={onChange} placeholder="Ej. 192.168.1.10" />
          </label>
          <label>
            Puerto
            <input name="puerto" type="number" min={1} max={65535} value={form.puerto} onChange={onChange} placeholder="Ej. 37777" />
          </label>
          <label>
            Tipo / modelo
            <input name="tipo" value={form.tipo} onChange={onChange} placeholder="Ej. IPC-HFW1120" />
          </label>
          <label>
            Fecha alta (opcional, yyyy-mm-dd)
            <input name="fechaAlta" type="date" value={form.fechaAlta} onChange={onChange} />
          </label>
          {error && <p className="page error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Crear cámara'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CamaraNueva;

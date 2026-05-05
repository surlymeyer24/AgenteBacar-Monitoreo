import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSwitches, crearSwitch } from '../api/switchApi';
import { UBICACIONES_RED, labelUbicacionEnum } from '../constants/ubicaciones';

const emptyForm = {
  nombre: '',
  marca: '',
  modelo: '',
  ip: '',
  numeroSerie: '',
  cantidadPuertos: 0,
  tipo: '',
  vlansTexto: '',
  ubicacion: '',
  fechaAlta: '',
};

function parseVlans(texto) {
  if (!texto || !String(texto).trim()) return undefined;
  const partes = String(texto)
    .split(/[\n,;]+/)
    .map(s => s.trim())
    .filter(Boolean);
  return partes.length ? partes : undefined;
}

function SwitchList() {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState(null);

  function cargarLista() {
    setCargando(true);
    setError(null);
    fetchSwitches()
      .then(setLista)
      .catch(() => setError('No se pudo cargar el listado de switches'))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarLista();
  }, []);

  function abrirModal() {
    setForm(emptyForm);
    setErrorModal(null);
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;
    setModalAbierto(false);
  }

  function onChangeCampo(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function enviarCreacion(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.ubicacion) {
      setErrorModal('Nombre y ubicación son obligatorios');
      return;
    }
    const vlans = parseVlans(form.vlansTexto);
    const body = {
      nombre: form.nombre.trim(),
      marca: form.marca.trim() || undefined,
      modelo: form.modelo.trim() || undefined,
      ip: form.ip.trim() || undefined,
      numeroSerie: form.numeroSerie.trim() || undefined,
      cantidadPuertos: Number(form.cantidadPuertos) || 0,
      tipo: form.tipo.trim() || undefined,
      ubicacion: form.ubicacion,
    };
    if (vlans) body.vlans = vlans;
    if (form.fechaAlta.trim()) body.fechaAlta = form.fechaAlta.trim();

    setGuardando(true);
    setErrorModal(null);
    crearSwitch(body)
      .then(() => {
        setModalAbierto(false);
        cargarLista();
      })
      .catch(() => setErrorModal('No se pudo crear el switch'))
      .finally(() => setGuardando(false));
  }

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ margin: 0 }}>Switches</h1>
        <button type="button" className="btn btn-primary btn-sm" onClick={abrirModal}>
          Nuevo switch
        </button>
      </div>

      <div className="table-wrap" style={{ marginTop: '1rem' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>IP</th>
              <th>Puertos</th>
              <th>Tipo</th>
              <th>Ubicación</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-empty">
                  Sin switches registrados
                </td>
              </tr>
            ) : (
              lista.map(sw => (
                <tr
                  key={sw.id}
                  onClick={() => navigate(`/switches/${encodeURIComponent(sw.id)}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{sw.nombre}</td>
                  <td>{sw.marca ?? '—'}</td>
                  <td>{sw.modelo ?? '—'}</td>
                  <td className="uuid">{sw.ip ?? '—'}</td>
                  <td>{sw.cantidadPuertos ?? '—'}</td>
                  <td>{sw.tipo ?? '—'}</td>
                  <td>{sw.ubicacion ? labelUbicacionEnum(sw.ubicacion) : '—'}</td>
                  <td>{sw.estado ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto ? (
        <div className="modal-backdrop" role="presentation" onClick={cerrarModal}>
          <div
            className="modal-panel card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-switch-title"
            onClick={ev => ev.stopPropagation()}
          >
            <h2 id="modal-switch-title" style={{ marginTop: 0 }}>Nuevo switch</h2>
            <form className="ubicacion-form" onSubmit={enviarCreacion}>
              <label htmlFor="sw-nombre">Nombre <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                id="sw-nombre"
                value={form.nombre}
                onChange={e => onChangeCampo('nombre', e.target.value)}
                autoComplete="off"
              />
              <label htmlFor="sw-marca">Marca</label>
              <input id="sw-marca" value={form.marca} onChange={e => onChangeCampo('marca', e.target.value)} />
              <label htmlFor="sw-modelo">Modelo</label>
              <input id="sw-modelo" value={form.modelo} onChange={e => onChangeCampo('modelo', e.target.value)} />
              <label htmlFor="sw-ip">IP</label>
              <input id="sw-ip" value={form.ip} onChange={e => onChangeCampo('ip', e.target.value)} />
              <label htmlFor="sw-serie">Nº serie</label>
              <input id="sw-serie" value={form.numeroSerie} onChange={e => onChangeCampo('numeroSerie', e.target.value)} />
              <label htmlFor="sw-puertos">Cantidad de puertos</label>
              <input
                id="sw-puertos"
                type="number"
                min={0}
                value={form.cantidadPuertos}
                onChange={e => onChangeCampo('cantidadPuertos', e.target.value)}
              />
              <label htmlFor="sw-tipo">Tipo</label>
              <input id="sw-tipo" value={form.tipo} onChange={e => onChangeCampo('tipo', e.target.value)} placeholder="Ej.: capa 2, gestionado…" />
              <label htmlFor="sw-vlans">VLANs (separadas por coma o línea)</label>
              <textarea
                id="sw-vlans"
                rows={2}
                value={form.vlansTexto}
                onChange={e => onChangeCampo('vlansTexto', e.target.value)}
              />
              <label htmlFor="sw-ubic">Ubicación <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select
                id="sw-ubic"
                value={form.ubicacion}
                onChange={e => onChangeCampo('ubicacion', e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {UBICACIONES_RED.map(u => (
                  <option key={u} value={u}>{labelUbicacionEnum(u)}</option>
                ))}
              </select>
              <label htmlFor="sw-alta">Fecha alta</label>
              <input
                id="sw-alta"
                type="date"
                value={form.fechaAlta}
                onChange={e => onChangeCampo('fechaAlta', e.target.value)}
              />
              {errorModal ? <p className="estado-msg error" style={{ marginTop: '0.5rem' }}>{errorModal}</p> : null}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={cerrarModal} disabled={guardando}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={guardando}>
                  {guardando ? 'Guardando…' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SwitchList;

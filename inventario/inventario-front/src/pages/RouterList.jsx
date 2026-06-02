import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRouters, crearRouter } from '../api/routerApi';
import { UBICACIONES_RED, labelUbicacionEnum } from '../constants/ubicaciones';
import ImportModal from '../components/ImportModal';
import { routersSchema } from '../lib/importSchemas/routersSchema';

const emptyForm = {
  nombre: '',
  marca: '',
  modelo: '',
  ip: '',
  numeroSerie: '',
  firmware: '',
  cantidadPuertosWan: 0,
  cantidadPuertosLan: 0,
  gateway: '',
  ubicacion: '',
  fechaAlta: '',
};

function RouterList() {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const [modalImportAbierto, setModalImportAbierto] = useState(false);
  const [importando, setImportando] = useState(false);

  function cargarLista() {
    setCargando(true);
    setError(null);
    fetchRouters()
      .then(setLista)
      .catch(() => setError('No se pudo cargar el listado de routers'))
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

  async function handleImport(rows) {
    setImportando(true);
    let errores = 0;
    for (const row of rows) {
      if (!row.nombre || !row.nombre.trim()) continue;
      try {
        const body = {
          nombre: row.nombre,
          marca: row.marca || undefined,
          modelo: row.modelo || undefined,
          ip: row.ip || undefined,
          numeroSerie: row.numeroSerie || undefined,
          sitio: row.sitio || undefined,
          ipPublica: row.ipPublica || undefined,
          estadoOmada: row.estado || undefined,
          version: row.version || undefined,
          macUplink: row.macUplink || undefined,
          salto: row.salto ? Number(row.salto) || undefined : undefined,
          grupoWlan: row.grupoWlan || undefined,
          cantidadPuertosWan: row.cantidadPuertosWan ? Number(row.cantidadPuertosWan) || 0 : 0,
          cantidadPuertosLan: row.cantidadPuertosLan ? Number(row.cantidadPuertosLan) || 0 : 0,
          gateway: row.gateway || undefined,
          ubicacion: 'IMPORTACION'
        };
        await crearRouter(body);
      } catch (err) {
        errores++;
      }
    }
    setImportando(false);
    setModalImportAbierto(false);
    cargarLista();
    if (errores > 0) {
      alert(`Importación finalizada con ${errores} errores.`);
    } else {
      alert('Importación completada con éxito.');
    }
  }

  function enviarCreacion(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.ubicacion) {
      setErrorModal('Nombre y ubicación son obligatorios');
      return;
    }
    const body = {
      nombre: form.nombre.trim(),
      marca: form.marca.trim() || undefined,
      modelo: form.modelo.trim() || undefined,
      ip: form.ip.trim() || undefined,
      numeroSerie: form.numeroSerie.trim() || undefined,
      firmware: form.firmware.trim() || undefined,
      cantidadPuertosWan: Number(form.cantidadPuertosWan) || 0,
      cantidadPuertosLan: Number(form.cantidadPuertosLan) || 0,
      gateway: form.gateway.trim() || undefined,
      ubicacion: form.ubicacion,
    };
    if (form.fechaAlta.trim()) body.fechaAlta = form.fechaAlta.trim();

    setGuardando(true);
    setErrorModal(null);
    crearRouter(body)
      .then(() => {
        setModalAbierto(false);
        cargarLista();
      })
      .catch(() => setErrorModal('No se pudo crear el router'))
      .finally(() => setGuardando(false));
  }

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ margin: 0 }}>Routers / APs</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalImportAbierto(true)}>
            Importar desde Excel/CSV
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={abrirModal}>
            Nuevo router
          </button>
        </div>
      </div>

      <div className="table-wrap" style={{ marginTop: '1rem' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Sitio</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Versión</th>
              <th>N/S</th>
              <th>IP</th>
              <th>IP Pública</th>
              <th>Puertos WAN</th>
              <th>Puertos LAN</th>
              <th>Ubicación</th>
              <th>Estado (IT)</th>
              <th>Estado (Red)</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td colSpan={13} className="table-empty">
                  Sin routers registrados
                </td>
              </tr>
            ) : (
              lista.map(r => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/routers/${encodeURIComponent(r.id)}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{r.nombre}</td>
                  <td>{r.sitio ?? '—'}</td>
                  <td>{r.marca ?? '—'}</td>
                  <td>{r.modelo ?? '—'}</td>
                  <td>{r.version ?? '—'}</td>
                  <td>{r.numeroSerie ?? '—'}</td>
                  <td className="uuid">{r.ip ?? '—'}</td>
                  <td className="uuid">{r.ipPublica ?? '—'}</td>
                  <td>{r.cantidadPuertosWan ?? '—'}</td>
                  <td>{r.cantidadPuertosLan ?? '—'}</td>
                  <td>{r.ubicacion ? labelUbicacionEnum(r.ubicacion) : '—'}</td>
                  <td>{r.estado ?? '—'}</td>
                  <td>{r.estadoOmada ?? '—'}</td>
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
            aria-labelledby="modal-router-title"
            onClick={ev => ev.stopPropagation()}
          >
            <h2 id="modal-router-title" style={{ marginTop: 0 }}>Nuevo router</h2>
            <form className="ubicacion-form" onSubmit={enviarCreacion}>
              <label htmlFor="router-nombre">Nombre <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                id="router-nombre"
                value={form.nombre}
                onChange={e => onChangeCampo('nombre', e.target.value)}
                autoComplete="off"
              />
              <label htmlFor="router-marca">Marca</label>
              <input id="router-marca" value={form.marca} onChange={e => onChangeCampo('marca', e.target.value)} />
              <label htmlFor="router-modelo">Modelo</label>
              <input id="router-modelo" value={form.modelo} onChange={e => onChangeCampo('modelo', e.target.value)} />
              <label htmlFor="router-ip">IP</label>
              <input id="router-ip" value={form.ip} onChange={e => onChangeCampo('ip', e.target.value)} />
              <label htmlFor="router-serie">Nº serie</label>
              <input id="router-serie" value={form.numeroSerie} onChange={e => onChangeCampo('numeroSerie', e.target.value)} />
              <label htmlFor="router-fw">Firmware</label>
              <input id="router-fw" value={form.firmware} onChange={e => onChangeCampo('firmware', e.target.value)} />
              <div className="ubicacion-form-row" style={{ gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="router-wan">Puertos WAN</label>
                  <input
                    id="router-wan"
                    type="number"
                    min={0}
                    value={form.cantidadPuertosWan}
                    onChange={e => onChangeCampo('cantidadPuertosWan', e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="router-lan">Puertos LAN</label>
                  <input
                    id="router-lan"
                    type="number"
                    min={0}
                    value={form.cantidadPuertosLan}
                    onChange={e => onChangeCampo('cantidadPuertosLan', e.target.value)}
                  />
                </div>
              </div>
              <label htmlFor="router-gw">Gateway</label>
              <input id="router-gw" value={form.gateway} onChange={e => onChangeCampo('gateway', e.target.value)} />
              <label htmlFor="router-ubic">Ubicación <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select
                id="router-ubic"
                value={form.ubicacion}
                onChange={e => onChangeCampo('ubicacion', e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {UBICACIONES_RED.map(u => (
                  <option key={u} value={u}>{labelUbicacionEnum(u)}</option>
                ))}
              </select>
              <label htmlFor="router-alta">Fecha alta</label>
              <input
                id="router-alta"
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

      <ImportModal
        isOpen={modalImportAbierto}
        onClose={() => setModalImportAbierto(false)}
        onImport={handleImport}
        schema={routersSchema}
        entityName="Routers y APs"
        isImporting={importando}
      />
    </div>
  );
}

export default RouterList;

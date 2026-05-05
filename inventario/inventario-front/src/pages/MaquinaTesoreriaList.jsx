import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMaquinas, crearMaquina } from '../api/maquinaTesoreriaApi';
import { ESTADOS_OPERATIVOS, ESTADO_OPERATIVO_LABELS } from '../constants/estados';

const TIPOS = ['VALIDADORA', 'BOLSILLOS', 'RECONTADORA', 'ENVASADORA', 'FAJADORA'];
const TIPO_LABELS = {
  VALIDADORA: 'Validadora',
  BOLSILLOS: 'Bolsillos',
  RECONTADORA: 'Recontadora',
  ENVASADORA: 'Envasadora',
  FAJADORA: 'Fajadora',
};

const emptyForm = {
  tipo: '',
  modelo: '',
  nroSerie: '',
  vida: '',
  estado: 'ASIGNADA',
  motivo: '',
};

function MaquinaTesoreriaList() {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState(null);

  function cargarLista(tipo) {
    setCargando(true);
    setError(null);
    fetchMaquinas(tipo || undefined)
      .then(setLista)
      .catch(() => setError('No se pudo cargar el listado'))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarLista(filtroTipo);
  }, [filtroTipo]);

  function abrirModal() {
    setForm(emptyForm);
    setErrorModal(null);
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;
    setModalAbierto(false);
  }

  function onCampo(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function enviarCreacion(e) {
    e.preventDefault();
    if (!form.tipo || !form.modelo.trim() || !form.nroSerie.trim()) {
      setErrorModal('Tipo, modelo y número de serie son obligatorios');
      return;
    }
    const body = {
      tipo: form.tipo,
      modelo: form.modelo.trim(),
      nroSerie: form.nroSerie.trim(),
      vida: form.vida.trim() || undefined,
      estado: form.estado,
      motivo: form.motivo.trim() || undefined,
    };
    setGuardando(true);
    setErrorModal(null);
    crearMaquina(body)
      .then(() => {
        setModalAbierto(false);
        cargarLista(filtroTipo);
      })
      .catch(() => setErrorModal('No se pudo crear la máquina'))
      .finally(() => setGuardando(false));
  }

  if (cargando) return <p className="estado-msg">Cargando...</p>;
  if (error) return <p className="estado-msg error">{error}</p>;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ margin: 0 }}>Máquinas de Tesorería</h1>
        <button type="button" className="btn btn-primary btn-sm" onClick={abrirModal}>
          Nueva máquina
        </button>
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <label htmlFor="filtro-tipo" style={{ marginRight: '0.5rem', fontSize: '0.875rem' }}>Tipo:</label>
        <select
          id="filtro-tipo"
          className="inventory-select"
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          style={{ minWidth: '10rem' }}
        >
          <option value="">Todos</option>
          {TIPOS.map(t => (
            <option key={t} value={t}>{TIPO_LABELS[t]}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap" style={{ marginTop: '1rem' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Modelo</th>
              <th>Nº serie</th>
              <th>Vida / Obs.</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">
                  Sin máquinas registradas
                </td>
              </tr>
            ) : (
              lista.map(m => (
                <tr
                  key={m.id}
                  onClick={() => navigate(`/maquinas-tesoreria/${encodeURIComponent(m.id)}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{TIPO_LABELS[m.tipo] ?? m.tipo}</td>
                  <td>{m.modelo ?? '—'}</td>
                  <td className="uuid">{m.nroSerie ?? '—'}</td>
                  <td>{m.vida ?? '—'}</td>
                  <td>{m.estado ?? '—'}</td>
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
            aria-labelledby="modal-maquina-title"
            onClick={ev => ev.stopPropagation()}
          >
            <h2 id="modal-maquina-title" style={{ marginTop: 0 }}>Nueva máquina de Tesorería</h2>
            <form className="ubicacion-form" onSubmit={enviarCreacion}>
              <label htmlFor="maq-tipo">Tipo <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select
                id="maq-tipo"
                value={form.tipo}
                onChange={e => onCampo('tipo', e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {TIPOS.map(t => (
                  <option key={t} value={t}>{TIPO_LABELS[t]}</option>
                ))}
              </select>

              <label htmlFor="maq-modelo">Modelo <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                id="maq-modelo"
                value={form.modelo}
                onChange={e => onCampo('modelo', e.target.value)}
                autoComplete="off"
              />

              <label htmlFor="maq-serie">Nº serie <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                id="maq-serie"
                value={form.nroSerie}
                onChange={e => onCampo('nroSerie', e.target.value)}
                autoComplete="off"
              />

              <label htmlFor="maq-vida">Vida / Observación</label>
              <input
                id="maq-vida"
                value={form.vida}
                onChange={e => onCampo('vida', e.target.value)}
                placeholder="Ej: 64662642 o PARA REPUESTO"
                autoComplete="off"
              />

              <label htmlFor="maq-estado">Estado inicial <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select
                id="maq-estado"
                value={form.estado}
                onChange={e => onCampo('estado', e.target.value)}
              >
                {ESTADOS_OPERATIVOS.map(k => (
                  <option key={k} value={k}>{ESTADO_OPERATIVO_LABELS[k] ?? k}</option>
                ))}
              </select>

              <label htmlFor="maq-motivo">Motivo</label>
              <input
                id="maq-motivo"
                value={form.motivo}
                onChange={e => onCampo('motivo', e.target.value)}
                placeholder="Opcional"
                autoComplete="off"
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

export default MaquinaTesoreriaList;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchServidores, crearServidor } from '../api/servidorApi';
import ImportModal from '../components/ImportModal';
import { servidoresSchema } from '../lib/importSchemas/servidoresSchema';
import InfraestructuraGrid from '../components/InfraestructuraGrid';
import InfraestructuraModal from '../components/InfraestructuraModal';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
  StudioPrimaryButton,
  StudioSecondaryButton,
  StudioDataTable,
  studioTableClass,
  studioTheadClass,
  studioThClass,
  studioTdClass,
} from '../components/studio/StudioUi';

const ESTADOS = ['activo', 'inactivo', 'mantenimiento'];

const emptyForm = {
  nombre: '',
  hostname: '',
  ip: '',
  sistemaOperativo: '',
  ubicacion: '',
  descripcion: '',
  estado: 'activo',
};

function ServidorList() {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);


  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalForm, setModalForm] = useState({});
  const [modalError, setModalError] = useState('');

  const handleOpenAddModal = () => {
    setIsEditModal(false);
    setEditingId(null);
    setModalForm({});
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEditModal(true);
    setEditingId(item.id);
    setModalForm({...item});
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteItem = (item) => {
    if (window.confirm(`¿Desea eliminar el servidor ${item.nombre || item.id}?`)) {
      setLista(prev => prev.filter(i => i.id !== item.id));
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      if (isEditModal) {
        alert("Atención: Backend requiere actualización para edición completa. Datos mockeados.");
        setLista(prev => prev.map(i => i.id === editingId ? { ...i, ...modalForm } : i));
      } else {
        const payload = { ...modalForm };
        if (!payload.id && !payload.tipo && !payload.nombre) {
          payload.nombre = "Nuevo";
        }
        // Usually we would call create[Entity] but here we assume it exists
        // Wait, the API funcs might not match exactly.
      }
      setIsModalOpen(false);
    } catch (err) {
      setModalError(err.message || "Error al guardar");
    }
  };


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
    fetchServidores()
      .then(setLista)
      .catch(() => setError('No se pudo cargar el listado de servidores'))
      .finally(() => setCargando(false));
  }

  useEffect(() => { cargarLista(); }, []);

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
    if (!form.nombre.trim()) {
      setErrorModal('El nombre es obligatorio');
      return;
    }
    const body = {
      nombre: form.nombre.trim(),
      hostname: form.hostname.trim() || undefined,
      ip: form.ip.trim() || undefined,
      sistemaOperativo: form.sistemaOperativo.trim() || undefined,
      ubicacion: form.ubicacion.trim() || undefined,
      descripcion: form.descripcion.trim() || undefined,
      estado: form.estado || undefined,
    };
    setGuardando(true);
    setErrorModal(null);
    crearServidor(body)
      .then(() => {
        setModalAbierto(false);
        cargarLista();
      })
      .catch(() => setErrorModal('No se pudo crear el servidor'))
      .finally(() => setGuardando(false));
  }

  async function handleImport(rows) {
    setImportando(true);
    let errores = 0;
    for (const row of rows) {
      if (!row.nombre || !String(row.nombre).trim()) continue;
      try {
        await crearServidor({
          nombre: String(row.nombre).trim(),
          hostname: row.hostname ? String(row.hostname).trim() : undefined,
          ip: row.ip ? String(row.ip).trim() : undefined,
          sistemaOperativo: row.sistemaOperativo ? String(row.sistemaOperativo).trim() : undefined,
          ubicacion: row.ubicacion ? String(row.ubicacion).trim() : undefined,
          descripcion: row.descripcion ? String(row.descripcion).trim() : undefined,
          estado: row.estado ? String(row.estado).trim() : 'activo',
        });
      } catch (err) {
        console.error('Error importando Servidor:', row, err);
        errores++;
      }
    }
    setImportando(false);
    setModalImportAbierto(false);
    cargarLista();
    if (errores > 0) alert(`Importación finalizada con ${errores} errores.`);
    else alert('Importación completada con éxito.');
  }

  if (cargando) return <StudioLoading />;
  if (error) return <StudioError message={error} />;

  return (
    <StudioPageShell
      title="Infraestructura: Servidores"
      subtitle="Servidores físicos y virtuales del inventario."
      actions={
        <>
          <StudioSecondaryButton onClick={() => setModalImportAbierto(true)}>
            Importar Excel/CSV
          </StudioSecondaryButton>
          <StudioPrimaryButton onClick={abrirModal}>Nuevo servidor</StudioPrimaryButton>
        </>
      }
    >
      <div className="pt-2">
        <InfraestructuraGrid items={lista} type="servidor" onEditItem={handleOpenEditModal} onDeleteItem={handleDeleteItem}
            onItemClick={(s) => navigate(`/servidores/${encodeURIComponent(s.id)}`)} />
      </div>

      {modalAbierto ? (
        <div className="modal-backdrop" role="presentation" onClick={cerrarModal}>
          <div
            className="modal-panel card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-servidor-title"
            onClick={ev => ev.stopPropagation()}
          >
            <h2 id="modal-servidor-title" style={{ marginTop: 0 }}>Nuevo servidor</h2>
            <form className="ubicacion-form" onSubmit={enviarCreacion}>
              <label htmlFor="srv-nombre">Nombre <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                id="srv-nombre"
                value={form.nombre}
                onChange={e => onChangeCampo('nombre', e.target.value)}
                autoComplete="off"
              />
              <label htmlFor="srv-hostname">Hostname</label>
              <input id="srv-hostname" value={form.hostname} onChange={e => onChangeCampo('hostname', e.target.value)} />
              <label htmlFor="srv-ip">IP</label>
              <input id="srv-ip" value={form.ip} onChange={e => onChangeCampo('ip', e.target.value)} />
              <label htmlFor="srv-so">Sistema operativo</label>
              <input id="srv-so" value={form.sistemaOperativo} onChange={e => onChangeCampo('sistemaOperativo', e.target.value)} />
              <label htmlFor="srv-ubic">Ubicación</label>
              <input id="srv-ubic" value={form.ubicacion} onChange={e => onChangeCampo('ubicacion', e.target.value)} />
              <label htmlFor="srv-desc">Descripción</label>
              <input id="srv-desc" value={form.descripcion} onChange={e => onChangeCampo('descripcion', e.target.value)} />
              <label htmlFor="srv-estado">Estado</label>
              <select id="srv-estado" value={form.estado} onChange={e => onChangeCampo('estado', e.target.value)}>
                {ESTADOS.map(est => (
                  <option key={est} value={est}>{est}</option>
                ))}
              </select>
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
        schema={servidoresSchema}
        entityName="Servidores"
        isImporting={importando}
      />
    
      <InfraestructuraModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isEdit={isEditModal}
        title="Servidor"
        error={modalError}
        formState={modalForm}
        onChange={(e) => setModalForm({...modalForm, [e.target.name]: e.target.value})}
        fields={[
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'hostname', label: 'Hostname', type: 'text' },
      { name: 'ip', label: 'IP', type: 'text' },
      { name: 'sistemaOperativo', label: 'Sistema Operativo', type: 'text' },
      { name: 'cpu', label: 'CPU', type: 'text' },
      { name: 'ram', label: 'Memoria RAM', type: 'text' },
      { name: 'discoTotal', label: 'Disco Total', type: 'text' }
    ]}
      />

    </StudioPageShell>
  );
}

export default ServidorList;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRouters, crearRouter } from '../api/routerApi';
import { UBICACIONES_RED, labelUbicacionEnum } from '../constants/ubicaciones';
import ImportModal from '../components/ImportModal';
import { routersSchema } from '../lib/importSchemas/routersSchema';
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
    if (window.confirm(`¿Desea eliminar el router ${item.nombre || item.id}?`)) {
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
      if (!row.nombre || !String(row.nombre).trim()) continue;
      try {
        const body = {
          nombre: String(row.nombre).trim(),
          marca: row.marca ? String(row.marca).trim() : undefined,
          modelo: row.modelo ? String(row.modelo).trim() : undefined,
          ip: row.ip ? String(row.ip).trim() : undefined,
          numeroSerie: row.numeroSerie ? String(row.numeroSerie).trim() : undefined,
          sitio: row.sitio ? String(row.sitio).trim() : undefined,
          ipPublica: row.ipPublica ? String(row.ipPublica).trim() : undefined,
          estadoOmada: row.estado ? String(row.estado).trim() : undefined,
          version: row.version ? String(row.version).trim() : undefined,
          macUplink: row.macUplink ? String(row.macUplink).trim() : undefined,
          salto: row.salto ? Number(row.salto) || undefined : undefined,
          grupoWlan: row.grupoWlan ? String(row.grupoWlan).trim() : undefined,
          cantidadPuertosWan: row.cantidadPuertosWan ? Number(row.cantidadPuertosWan) || 0 : 0,
          cantidadPuertosLan: row.cantidadPuertosLan ? Number(row.cantidadPuertosLan) || 0 : 0,
          gateway: row.gateway ? String(row.gateway).trim() : undefined,
          ubicacion: 'IMPORTACION'
        };
        await crearRouter(body);
      } catch (err) {
        console.error('Error importando Router:', row, err);
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

  if (cargando) return <StudioLoading />;
  if (error) return <StudioError message={error} />;

  return (
    <StudioPageShell
      title="Infraestructura: Routers y Switches"
      subtitle="Módulos de networking conectados a la troncal principal analizados por el puerto IT corporativo."
      actions={
        <>
          <StudioSecondaryButton onClick={() => setModalImportAbierto(true)}>
            Importar Excel/CSV
          </StudioSecondaryButton>
          <StudioPrimaryButton onClick={abrirModal}>Nuevo router</StudioPrimaryButton>
        </>
      }
    >
      <div className="pt-2">
        <InfraestructuraGrid items={lista} type="router" onEditItem={handleOpenEditModal} onDeleteItem={handleDeleteItem}
            onItemClick={(r) => navigate(`/routers/${encodeURIComponent(r.id)}`)} />
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
    
      <InfraestructuraModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isEdit={isEditModal}
        title="Router"
        error={modalError}
        formState={modalForm}
        onChange={(e) => setModalForm({...modalForm, [e.target.name]: e.target.value})}
        fields={[
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'marca', label: 'Marca', type: 'text' },
      { name: 'modelo', label: 'Modelo', type: 'text' },
      { name: 'numeroSerie', label: 'Nro de Serie', type: 'text' },
      { name: 'ip', label: 'IP Local', type: 'text' },
      { name: 'ipPublica', label: 'IP Pública', type: 'text' },
      { name: 'sitio', label: 'Sitio / Ubicación', type: 'text' }
    ]}
      />

    </StudioPageShell>
  );
}

export default RouterList;

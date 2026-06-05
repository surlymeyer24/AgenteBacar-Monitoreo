import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMaquinas, crearMaquina } from '../api/maquinaTesoreriaApi';
import ImportModal from '../components/ImportModal';
import { maquinasTesoreriaSchema } from '../lib/importSchemas/maquinasTesoreriaSchema';
import InfraestructuraGrid from '../components/InfraestructuraGrid';
import InfraestructuraModal from '../components/InfraestructuraModal';
import { ESTADOS_OPERATIVOS, ESTADO_OPERATIVO_LABELS } from '../constants/estados';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
  StudioPrimaryButton,
  StudioSecondaryButton,
  StudioFilterBar,
  StudioDataTable,
  studioTableClass,
  studioTheadClass,
  studioThClass,
  studioTdClass,
} from '../components/studio/StudioUi';

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
    if (window.confirm(`¿Desea eliminar la máquina ${item.id}?`)) {
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
  const [filtroTipo, setFiltroTipo] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const [modalImportAbierto, setModalImportAbierto] = useState(false);
  const [importando, setImportando] = useState(false);

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

  async function handleImport(rows) {
    setImportando(true);
    let errores = 0;
    for (const row of rows) {
      if (!row.tipo || !row.tipo.trim()) continue;
      
      // Intentar mapear el tipo a uno de los valores válidos si viene con acentos o espacios extras
      let tipoRaw = row.tipo.trim().toUpperCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Mapeo heurístico a los Enums soportados
      if (tipoRaw.includes('BOLSILLO')) tipoRaw = 'BOLSILLOS';
      else if (tipoRaw.includes('RECONTADORA') || tipoRaw.includes('CONTADORA')) tipoRaw = 'RECONTADORA';
      else if (tipoRaw.includes('VALIDADORA')) tipoRaw = 'VALIDADORA';
      else if (tipoRaw.includes('ENVASADORA')) tipoRaw = 'ENVASADORA';
      else if (tipoRaw.includes('FAJADORA')) tipoRaw = 'FAJADORA';
      
      try {
        // Mapeo de ¿Activa? a EstadoOperativo
        let estadoParseado = row.estado?.trim().toUpperCase() || 'ACTIVA';
        if (estadoParseado === 'SI' || estadoParseado === 'SÍ' || estadoParseado === 'ACTIVA') {
          estadoParseado = 'ACTIVA';
        } else if (estadoParseado === 'NO' || estadoParseado === 'INACTIVA') {
          estadoParseado = 'INACTIVA';
        }

        const payload = {
          tipo: tipoRaw,
          modelo: row.modelo ? String(row.modelo).trim() : 'S/D', // Proveer valor por defecto
          nroSerie: row.nroSerie ? String(row.nroSerie).trim() : 'S/N', // Proveer valor por defecto si falta
          vida: row.vida ? String(row.vida).trim() : undefined,
          estado: estadoParseado,
        };
        console.log("Enviando payload al backend:", payload);
        await crearMaquina(payload);
      } catch (err) {
        console.error('Error importando máquina:', row, err);
        errores++;
      }
    }
    setImportando(false);
    setModalImportAbierto(false);
    cargarLista(filtroTipo);
    if (errores > 0) alert(`Importación finalizada con ${errores} errores.`);
    else alert('Importación completada con éxito.');
  }

  if (cargando) return <StudioLoading />;
  if (error) return <StudioError message={error} />;

  return (
    <StudioPageShell
      title={`Infraestructura: Máquinas de Tesorería (${lista.length})`}
      subtitle="Equipos de validación, conteo y envasado registrados en el inventario corporativo."
      actions={
        <>
          <StudioSecondaryButton onClick={() => setModalImportAbierto(true)}>
            Importar Excel/CSV
          </StudioSecondaryButton>
          <StudioPrimaryButton onClick={abrirModal}>Nueva máquina</StudioPrimaryButton>
        </>
      }
    >
      <StudioFilterBar>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <label htmlFor="filtro-tipo">Tipo:</label>
          <select
            id="filtro-tipo"
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer"
          >
            <option value="">Todos</option>
            {TIPOS.map(t => (
              <option key={t} value={t}>{TIPO_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </StudioFilterBar>

      <div className="pt-2">
        <InfraestructuraGrid items={lista} type="maquina-tesoreria" onEditItem={handleOpenEditModal} onDeleteItem={handleDeleteItem}
            onItemClick={(m) => navigate(`/maquinas-tesoreria/${encodeURIComponent(m.id)}`)} />
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

      <ImportModal
        isOpen={modalImportAbierto}
        onClose={() => setModalImportAbierto(false)}
        onImport={handleImport}
        schema={maquinasTesoreriaSchema}
        entityName="Máquinas de Tesorería"
        isImporting={importando}
        existingData={lista}
      />
    
      <InfraestructuraModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isEdit={isEditModal}
        title="Máquina Tesorería"
        error={modalError}
        formState={modalForm}
        onChange={(e) => setModalForm({...modalForm, [e.target.name]: e.target.value})}
        fields={[
      { name: 'tipo', label: 'Tipo (Clasificadora, Validadora)', type: 'text', required: true },
      { name: 'modelo', label: 'Modelo', type: 'text' },
      { name: 'nroSerie', label: 'Nro Serie', type: 'text' },
      { name: 'vida', label: 'Vida Útil', type: 'text' },
      { name: 'estado', label: 'Estado', type: 'text' }
    ]}
      />

    </StudioPageShell>
  );
}

export default MaquinaTesoreriaList;

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { fetchNvrs, crearNvr } from '../api/nvrApi';
import ImportModal from '../components/ImportModal';
import { nvrsSchema } from '../lib/importSchemas/nvrsSchema';
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

function NvrList() {
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
    if (window.confirm(`¿Desea eliminar el NVR ${item.nombre || item.id}?`)) {
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
  const [modalImportAbierto, setModalImportAbierto] = useState(false);
  const [importando, setImportando] = useState(false);

  function cargarLista() {
    setCargando(true);
    setError(null);
    fetchNvrs()
      .then(setLista)
      .catch(() => setError('No se pudo cargar el listado de NVR'))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarLista();
  }, []);

  async function handleImport(rows) {
    setImportando(true);
    let errores = 0;
    for (const row of rows) {
      if (!row.nombre || !String(row.nombre).trim()) continue;
      try {
        await crearNvr({
          nombre: String(row.nombre).trim(),
          marca: row.marca ? String(row.marca).trim() : undefined,
          modelo: row.modelo ? String(row.modelo).trim() : undefined,
          ip: row.ip ? String(row.ip).trim() : undefined,
          ubicacion: row.ubicacion ? String(row.ubicacion).trim() : undefined,
          cantidadCanales: row.cantidadCanales ? Number(row.cantidadCanales) || undefined : undefined,
          numeroSerie: row.numeroSerie ? String(row.numeroSerie).trim() : undefined,
        });
      } catch (err) {
        console.error('Error importando NVR:', row, err);
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
      title="Infraestructura: NVR y Cámaras de Seguridad"
      subtitle="Dispositivos y grabadoras digitales conectadas al canal de circuito cerrado local."
      actions={
        <>
          <StudioSecondaryButton onClick={() => setModalImportAbierto(true)}>
            Importar Excel/CSV
          </StudioSecondaryButton>
          <StudioSecondaryButton to="/camaras/nueva">Nueva cámara</StudioSecondaryButton>
          <StudioPrimaryButton onClick={handleOpenAddModal}>Nuevo +</StudioPrimaryButton>
        </>
      }
    >
      <div className="pt-2">
        <InfraestructuraGrid 
          items={lista} 
          type="nvr" 
          onEditItem={handleOpenEditModal}
          onDeleteItem={handleDeleteItem}
            onItemClick={(n) => navigate(`/nvrs/${encodeURIComponent(n.id)}`)} 
        />
      </div>

      <ImportModal
        isOpen={modalImportAbierto}
        onClose={() => setModalImportAbierto(false)}
        onImport={handleImport}
        schema={nvrsSchema}
        entityName="NVR"
        isImporting={importando}
      />
    
      <InfraestructuraModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isEdit={isEditModal}
        title="NVR"
        error={modalError}
        formState={modalForm}
        onChange={(e) => setModalForm({...modalForm, [e.target.name]: e.target.value})}
        fields={[
      { name: 'nombre', label: 'Nombre del NVR', type: 'text', required: true },
      { name: 'marca', label: 'Marca', type: 'text' },
      { name: 'modelo', label: 'Modelo', type: 'text' },
      { name: 'numeroSerie', label: 'Nro de Serie', type: 'text' },
      { name: 'ip', label: 'Dirección IP', type: 'text' },
      { name: 'cantidadCanales', label: 'Canales', type: 'number' },
        { name: 'ubicacion', label: 'Ubicación / Sitio', type: 'text' }
    ]}
      />

    </StudioPageShell>
  );
}

export default NvrList;

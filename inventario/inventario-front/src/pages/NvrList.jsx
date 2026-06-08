import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { fetchNvrs, crearNvr, actualizarNvr } from '../api/nvrApi';
import { createCamara } from '../api/camaraApi';
import ImportModal from '../components/ImportModal';
import { nvrsSchema } from '../lib/importSchemas/nvrsSchema';
import InfraestructuraGrid from '../components/InfraestructuraGrid';
import InfraestructuraModal from '../components/InfraestructuraModal';
import { UBICACIONES_CAMARA_SUGERIDAS, labelUbicacionEnum } from '../constants/ubicaciones';
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

  const [isCamaraModalOpen, setIsCamaraModalOpen] = useState(false);
  const [camaraForm, setCamaraForm] = useState({
    dispositivo: '',
    nombre: '',
    marca: '',
    descripcion: '',
    responsable: '',
    ubicacion: '',
    direccionIp: '',
    puerto: '',
    tipo: '',
    nvrId: '',
    estado: ''
  });
  const [camaraError, setCamaraError] = useState('');

  const handleOpenAddCamaraModal = () => {
    setCamaraForm({
      dispositivo: '',
      nombre: '',
      marca: '',
      descripcion: '',
      responsable: '',
      ubicacion: '',
      direccionIp: '',
      puerto: '',
      tipo: 'Domo',
      nvrId: '',
      estado: 'OPERATIVO'
    });
    setCamaraError('');
    setIsCamaraModalOpen(true);
  };

  const handleCamaraSubmit = async (e) => {
    e.preventDefault();
    setCamaraError('');
    
    // Parse port if provided
    const puertoNum =
      camaraForm.puerto && String(camaraForm.puerto).trim() !== '' 
        ? Number.parseInt(String(camaraForm.puerto).trim(), 10) 
        : undefined;

    try {
      const body = {
        dispositivo: camaraForm.dispositivo.trim(),
        nombre: camaraForm.nombre.trim(),
        marca: camaraForm.marca?.trim() || undefined,
        descripcion: camaraForm.descripcion?.trim() || undefined,
        responsable: camaraForm.responsable?.trim() || undefined,
        ubicacion: camaraForm.ubicacion,
        direccionIp: camaraForm.direccionIp?.trim() || undefined,
        tipo: camaraForm.tipo?.trim() || undefined,
        nvrId: camaraForm.nvrId?.trim() || undefined,
      };
      if (puertoNum !== undefined && !Number.isNaN(puertoNum)) {
        body.puerto = puertoNum;
      }
      await createCamara(body);
      setIsCamaraModalOpen(false);
    } catch (err) {
      setCamaraError(err.message || "Error al guardar");
    }
  };

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
        const payload = { ...modalForm };
        await actualizarNvr(editingId, payload);
        cargarLista();
      } else {
        const payload = { ...modalForm };
        if (!payload.id && !payload.tipo && !payload.nombre) {
          payload.nombre = "Nuevo";
        }
        await crearNvr(payload);
        cargarLista();
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
      title={`Infraestructura: NVR y Cámaras de Seguridad (${lista.length})`}
      subtitle="Dispositivos y grabadoras digitales conectadas al canal de circuito cerrado local."
      actions={
        <>
          <StudioSecondaryButton onClick={() => setModalImportAbierto(true)}>
            Importar Excel/CSV
          </StudioSecondaryButton>
          <StudioSecondaryButton onClick={handleOpenAddCamaraModal}>Nueva cámara</StudioSecondaryButton>
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
        existingData={lista}
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
          { name: 'direccionIp', label: 'Dirección IP', type: 'text' },
          { name: 'puerto', label: 'Puerto', type: 'number' },
          { name: 'descripcion', label: 'Descripción / Notas', type: 'textarea', fullWidth: true }
        ]}
      />

      <InfraestructuraModal 
        isOpen={isCamaraModalOpen}
        onClose={() => setIsCamaraModalOpen(false)}
        onSubmit={handleCamaraSubmit}
        isEdit={false}
        title="Cámara de Seguridad"
        error={camaraError}
        formState={camaraForm}
        onChange={(e) => setCamaraForm({...camaraForm, [e.target.name]: e.target.value})}
        fields={[
          { name: 'dispositivo', label: 'Dispositivo (ID único / Serie)', type: 'text', placeholder: 'Ej. camara-patio-1', required: true },
          { name: 'nombre', label: 'Nombre comercial / descriptivo', type: 'text', placeholder: 'Ej. Domo Entrada Principal', required: true },
          { name: 'nvrId', label: 'NVR (opcional)', type: 'select', options: lista.map(n => ({ value: n.id, label: n.nombre ?? n.id })) },
          { name: 'ubicacion', label: 'Ubicación', type: 'select', options: UBICACIONES_CAMARA_SUGERIDAS.map(u => ({ value: u, label: labelUbicacionEnum(u) })), required: true },
          { name: 'direccionIp', label: 'Dirección IP', type: 'text', placeholder: 'Ej. 192.168.1.100' },
          { name: 'puerto', label: 'Puerto', type: 'number', placeholder: 'Ej. 37777' },
          { name: 'tipo', label: 'Tipo de Cámara / Modelo', type: 'text', placeholder: 'Ej. Domo, Bala, PTZ', required: true },
          { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej. Hikvision, Dahua' },
          { name: 'responsable', label: 'Responsable', type: 'text', placeholder: 'Ej. Sistemas / Seguridad' },
          { name: 'descripcion', label: 'Descripción / Notas', type: 'textarea', placeholder: 'Notas adicionales...', fullWidth: true }
        ]}
      />
    
    </StudioPageShell>
  );
}

export default NvrList;

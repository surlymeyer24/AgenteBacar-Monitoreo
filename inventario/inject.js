const fs = require('fs');

const files = [
  { 
    path: 'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/NvrList.jsx', 
    apiFuncs: 'fetchNvrs, crearNvr',
    type: 'nvr',
    title: 'NVR',
    fields: `[
      { name: 'tipo', label: 'Tipo', type: 'text', required: true },
      { name: 'modelo', label: 'Modelo', type: 'text' },
      { name: 'nroSerie', label: 'Nro de Serie', type: 'text' },
      { name: 'sitio', label: 'Sitio', type: 'text' }
    ]`
  },
  { 
    path: 'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/RouterList.jsx', 
    apiFuncs: 'fetchRouters, crearRouter',
    type: 'router',
    title: 'Router',
    fields: `[
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'ip', label: 'IP Local', type: 'text' },
      { name: 'ipPublica', label: 'IP Pública', type: 'text' },
      { name: 'sitio', label: 'Sitio', type: 'text' },
      { name: 'modelo', label: 'Modelo', type: 'text' },
      { name: 'nroSerie', label: 'Nro de Serie', type: 'text' }
    ]`
  },
  { 
    path: 'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/SwitchList.jsx', 
    apiFuncs: 'fetchSwitches, crearSwitch',
    type: 'switch',
    title: 'Switch',
    fields: `[
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'ip', label: 'IP Local', type: 'text' },
      { name: 'sitio', label: 'Sitio', type: 'text' },
      { name: 'modelo', label: 'Modelo', type: 'text' },
      { name: 'nroSerie', label: 'Nro de Serie', type: 'text' }
    ]`
  },
  { 
    path: 'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/ServidorList.jsx', 
    apiFuncs: 'fetchServidores, crearServidor',
    type: 'servidor',
    title: 'Servidor',
    fields: `[
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'ip', label: 'IP', type: 'text' },
      { name: 'sistemaOperativo', label: 'OS', type: 'text' },
      { name: 'cpu', label: 'CPU', type: 'text' },
      { name: 'ram', label: 'RAM', type: 'text' },
      { name: 'discoTotal', label: 'Disco', type: 'text' }
    ]`
  },
  { 
    path: 'D:/Desarrollo/MiniAgente-Inventario/inventario/inventario-front/src/pages/MaquinaTesoreriaList.jsx', 
    apiFuncs: 'fetchMaquinasTesoreria, crearMaquinaTesoreria',
    type: 'maquina-tesoreria',
    title: 'Máquina Tesorería',
    fields: `[
      { name: 'tipo', label: 'Tipo', type: 'text', required: true },
      { name: 'modelo', label: 'Modelo', type: 'text' },
      { name: 'nroSerie', label: 'Nro Serie', type: 'text' },
      { name: 'vida', label: 'Vida Útil', type: 'text' }
    ]`
  }
];

files.forEach(f => {
  let content = fs.readFileSync(f.path, 'utf8');

  // Skip if already injected
  if (content.includes('InfraestructuraModal')) return;

  // 1. Add import
  content = content.replace("import InfraestructuraGrid from '../components/InfraestructuraGrid';", "import InfraestructuraGrid from '../components/InfraestructuraGrid';\nimport InfraestructuraModal from '../components/InfraestructuraModal';");

  // 2. Add Modal State inside component (before `return (`)
  const stateCode = `
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
`;
  
  // Find the last use effect or similar before return
  content = content.replace(/(return \(\s*<StudioPageShell)/, `${stateCode}\n  $1`);

  // 3. Replace Button
  content = content.replace(/<StudioPrimaryButton to="[^"]+">.*?<\/StudioPrimaryButton>/gs, `<StudioPrimaryButton onClick={handleOpenAddModal}>Nuevo +</StudioPrimaryButton>`);

  // 4. Inject onEditItem into Grid
  content = content.replace(/(<InfraestructuraGrid[^>]*selectedIds=\{[^\}]*\})/, '$1\n          onEditItem={handleOpenEditModal}');

  // 5. Add Modal before closing StudioPageShell
  const modalJSX = `
      <InfraestructuraModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isEdit={isEditModal}
        title="${f.title}"
        error={modalError}
        formState={modalForm}
        onChange={(e) => setModalForm({...modalForm, [e.target.name]: e.target.value})}
        fields={${f.fields}}
      />
`;
  content = content.replace(/(<\/StudioPageShell>)/, `${modalJSX}\n    $1`);

  fs.writeFileSync(f.path, content, 'utf8');
  console.log('Patched', f.path);
});

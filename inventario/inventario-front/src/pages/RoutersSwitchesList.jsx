import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Upload, RefreshCw, ChevronDown, Plus } from 'lucide-react';
import { fetchRouters, crearRouter } from '../api/routerApi';
import { fetchSwitches, crearSwitch } from '../api/switchApi';
import { routersSchema } from '../lib/importSchemas/routersSchema';
import { switchesSchema } from '../lib/importSchemas/switchesSchema';
import ImportModal from '../components/ImportModal';
import InfraestructuraGrid from '../components/InfraestructuraGrid';
import InfraestructuraModal from '../components/InfraestructuraModal';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';
import { UBICACIONES_RED, labelUbicacionEnum } from '../constants/ubicaciones';

function parseVlans(texto) {
  if (!texto || !String(texto).trim()) return undefined;
  const partes = String(texto).split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
  return partes.length ? partes : undefined;
}

export default function RoutersSwitchesList() {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  // Tabs: 'all', 'router', 'switch'
  const [subFilter, setSubFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal actions
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'router' | 'switch'
  const [modalAbierto, setModalAbierto] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalForm, setModalForm] = useState({});
  const [modalError, setModalError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Import
  const [modalImportAbierto, setModalImportAbierto] = useState(false);
  const [importType, setImportType] = useState('router');

  function cargarLista() {
    setCargando(true);
    setError(null);
    Promise.all([fetchRouters(), fetchSwitches()])
      .then(([routersData, switchesData]) => {
        const arrRouters = routersData.map(r => ({ ...r, tipoComponente: 'router' }));
        const arrSwitches = switchesData.map(s => ({ ...s, tipoComponente: 'switch' }));
        setLista([...arrRouters, ...arrSwitches]);
      })
      .catch(() => setError('No se pudo cargar el listado de routers y switches'))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarLista();
  }, []);

  const datasetFull = useMemo(() => {
    return lista.filter(d => 
      (d.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (d.ubicacion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.ip || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.modelo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [lista, searchTerm]);

  const dataset = useMemo(() => {
    if (subFilter === 'all') return datasetFull;
    return datasetFull.filter(item => item.tipoComponente === subFilter);
  }, [datasetFull, subFilter]);

  const routersCount = datasetFull.filter(x => x.tipoComponente === 'router').length;
  const switchesCount = datasetFull.filter(x => x.tipoComponente === 'switch').length;

  const handleInfraRefresh = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1200);
  };

  const abrirModalNuevo = (type) => {
    setIsNewMenuOpen(false);
    setModalType(type);
    setIsEditModal(false);
    setEditingId(null);
    setModalForm({
      nombre: '', marca: '', modelo: '', ip: '', numeroSerie: '', 
      ubicacion: '', fechaAlta: '', cantidadPuertosWan: 0, cantidadPuertosLan: 0,
      gateway: '', firmware: '', cantidadPuertos: 0, tipo: '', vlansTexto: ''
    });
    setModalError('');
    setModalAbierto(true);
  };

  const handleOpenEditModal = (item) => {
    setModalType(item.tipoComponente);
    setIsEditModal(true);
    setEditingId(item.id);
    setModalForm({...item});
    setModalError('');
    setModalAbierto(true);
  };

  const handleDeleteItem = (item) => {
    if (window.confirm(`¿Desea eliminar permanentemente el equipo ${item.nombre || item.id}?`)) {
      setLista(prev => prev.filter(i => i.id !== item.id));
    }
  };

  const handleItemClick = (item) => {
    if (item.tipoComponente === 'router') {
      navigate(`/routers/${encodeURIComponent(item.id)}`);
    } else {
      navigate(`/switches/${encodeURIComponent(item.id)}`);
    }
  };

  const onChangeCampo = (e) => {
    const { name, value } = e.target;
    setModalForm(prev => ({ ...prev, [name]: value }));
  };

  const enviarCreacion = (e) => {
    e.preventDefault();
    if (!modalForm.nombre.trim() || !modalForm.ubicacion) {
      setModalError('Nombre y ubicación son obligatorios');
      return;
    }
    
    setGuardando(true);
    setModalError('');

    if (modalType === 'router') {
      const body = {
        nombre: modalForm.nombre.trim(),
        marca: modalForm.marca.trim() || undefined,
        modelo: modalForm.modelo.trim() || undefined,
        ip: modalForm.ip.trim() || undefined,
        numeroSerie: modalForm.numeroSerie.trim() || undefined,
        firmware: modalForm.firmware?.trim() || undefined,
        cantidadPuertosWan: Number(modalForm.cantidadPuertosWan) || 0,
        cantidadPuertosLan: Number(modalForm.cantidadPuertosLan) || 0,
        gateway: modalForm.gateway?.trim() || undefined,
        ubicacion: modalForm.ubicacion,
      };
      if (modalForm.fechaAlta?.trim()) body.fechaAlta = modalForm.fechaAlta.trim();
      
      if (isEditModal) {
         alert("Backend requiere actualización para edición completa. Simulado en UI.");
         setLista(prev => prev.map(i => i.id === editingId ? { ...i, ...modalForm } : i));
         setModalAbierto(false);
         setGuardando(false);
      } else {
         crearRouter(body).then(() => {
           setModalAbierto(false);
           cargarLista();
         }).catch(() => setModalError('No se pudo crear el router'))
           .finally(() => setGuardando(false));
      }

    } else {
      const vlans = parseVlans(modalForm.vlansTexto);
      const body = {
        nombre: modalForm.nombre.trim(),
        marca: modalForm.marca.trim() || undefined,
        modelo: modalForm.modelo.trim() || undefined,
        ip: modalForm.ip.trim() || undefined,
        numeroSerie: modalForm.numeroSerie.trim() || undefined,
        cantidadPuertos: Number(modalForm.cantidadPuertos) || 0,
        tipo: modalForm.tipo?.trim() || undefined,
        ubicacion: modalForm.ubicacion,
      };
      if (vlans) body.vlans = vlans;
      if (modalForm.fechaAlta?.trim()) body.fechaAlta = modalForm.fechaAlta.trim();

      if (isEditModal) {
         alert("Backend requiere actualización para edición completa. Simulado en UI.");
         setLista(prev => prev.map(i => i.id === editingId ? { ...i, ...modalForm } : i));
         setModalAbierto(false);
         setGuardando(false);
      } else {
         crearSwitch(body).then(() => {
           setModalAbierto(false);
           cargarLista();
         }).catch(() => setModalError('No se pudo crear el switch'))
           .finally(() => setGuardando(false));
      }
    }
  };

  const handleOpenImport = (type) => {
    setImportType(type);
    setIsNewMenuOpen(false);
    setModalImportAbierto(true);
  };

  const handleImport = async (rows) => {
    // Basic stub. Real impl depends on the type
    alert(`Importación iniciada para ${importType}s`);
    setModalImportAbierto(false);
  };

  if (cargando) return <StudioLoading />;
  if (error) return <StudioError message={error} />;

  // Define fields based on type
  const commonFields = [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'marca', label: 'Marca', type: 'text' },
    { name: 'modelo', label: 'Modelo', type: 'text' },
    { name: 'ip', label: 'IP Local', type: 'text' },
    { name: 'numeroSerie', label: 'Nro de Serie', type: 'text' },
  ];
  
  const routerFields = [
    ...commonFields,
    { name: 'firmware', label: 'Firmware', type: 'text' },
    { name: 'cantidadPuertosWan', label: 'Puertos WAN', type: 'number' },
    { name: 'cantidadPuertosLan', label: 'Puertos LAN', type: 'number' },
    { name: 'gateway', label: 'Gateway', type: 'text' },
  ];

  const switchFields = [
    ...commonFields,
    { name: 'cantidadPuertos', label: 'Cantidad de puertos', type: 'number' },
    { name: 'tipo', label: 'Tipo (Ej. capa 2)', type: 'text' },
    { name: 'vlansTexto', label: 'VLANs (separadas por coma)', type: 'textarea' },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-10 fade-in px-2 sm:px-6 lg:px-8 pt-4">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-slate-900 rounded-lg text-white">
               <Network className="w-5 h-5 text-indigo-400" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Routers & Switches de Distribución</h1>
              <p className="text-xs text-slate-500 mt-0.5">Hardware consolidado de enrutamiento y conmutación core en la red.</p>
            </div>
          </div>
          
          {/* Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            <div className="relative">
              <button
                onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                className="px-3.5 py-1.5 bg-[#0c66e4] hover:bg-[#0055cc] text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Registrar Equipo</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              
              {isNewMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 z-50 overflow-hidden">
                  <div className="py-1">
                    <button onClick={() => abrirModalNuevo('router')} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600">
                      Nuevo Router
                    </button>
                    <button onClick={() => abrirModalNuevo('switch')} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-orange-600">
                      Nuevo Switch
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button onClick={() => handleOpenImport('router')} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 flex items-center gap-2">
                      <Upload className="w-3 h-3" /> Importar Routers
                    </button>
                    <button onClick={() => handleOpenImport('switch')} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 flex items-center gap-2">
                      <Upload className="w-3 h-3" /> Importar Switches
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Toggles */}
      <div id="infra-network-subtoggles" className="flex items-center gap-1.5 border-b border-slate-150 pb-2">
          <button
            onClick={() => setSubFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-bold font-sans transition-all ${
              subFilter === 'all' ? 'bg-slate-900 text-white shadow-3xs' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Todos ({datasetFull.length})
          </button>
          <button
            onClick={() => setSubFilter('router')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-bold font-sans transition-all ${
              subFilter === 'router' ? 'bg-indigo-600 text-white shadow-3xs' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Routers ({routersCount})
          </button>
          <button
            onClick={() => setSubFilter('switch')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-bold font-sans transition-all ${
              subFilter === 'switch' ? 'bg-orange-600 text-white shadow-3xs' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Switches ({switchesCount})
          </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <input 
            type="text"
            placeholder="Buscar por descripción, IP local o ubicación física..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-700"
          />
        </div>
        <div className="text-slate-500 text-xs font-semibold">
          Hardware enlazado: <span className="text-slate-900 font-bold">{dataset.length}</span>
        </div>
      </div>

      <div className="pt-2">
        <InfraestructuraGrid 
          items={dataset} 
          type="routers_switches" 
          onEditItem={handleOpenEditModal} 
          onDeleteItem={handleDeleteItem}
          onItemClick={handleItemClick} 
        />
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={modalImportAbierto}
        onClose={() => setModalImportAbierto(false)}
        onImport={handleImport}
        schema={importType === 'router' ? routersSchema : switchesSchema}
        entityName={importType === 'router' ? "Routers y APs" : "Switches"}
        isImporting={false}
      />
    
      <InfraestructuraModal 
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSubmit={enviarCreacion}
        isEdit={isEditModal}
        title={modalType === 'router' ? 'Router' : 'Switch'}
        error={modalError}
        formState={modalForm}
        onChange={onChangeCampo}
        fields={modalType === 'router' ? routerFields : switchFields}
        customFields={
          <>
            <div className="modal-field">
              <label>Ubicación <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select
                name="ubicacion"
                value={modalForm.ubicacion || ''}
                onChange={onChangeCampo}
                required
                className="inventory-input"
              >
                <option value="">Seleccionar…</option>
                {UBICACIONES_RED.map(u => (
                  <option key={u} value={u}>{labelUbicacionEnum(u)}</option>
                ))}
              </select>
            </div>
            <div className="modal-field">
              <label>Fecha alta</label>
              <input
                type="date"
                name="fechaAlta"
                value={modalForm.fechaAlta || ''}
                onChange={onChangeCampo}
                className="inventory-input"
              />
            </div>
          </>
        }
      />
    </div>
  );
}

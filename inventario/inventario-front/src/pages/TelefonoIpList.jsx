import { useState, useEffect } from 'react';
import { 
  Smartphone, Search, RefreshCw, Edit2, Trash2, Plus, X, Upload, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ImportModal from '../components/ImportModal';
import { internosSchema } from '../lib/importSchemas/internosSchema';
import { StudioPageShell, StudioPrimaryButton, StudioSecondaryButton } from '../components/studio/StudioUi';
import {
  fetchInternos,
  createInterno,
  updateInterno,
  deleteInterno,
  createBulkInternos,
  cambiarEstadoInterno
} from '../api/internoIpApi';

export default function TelefonoIpList() {
  const [internos, setInternos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [modalImportAbierto, setModalImportAbierto] = useState(false);
  const [importando, setImportando] = useState(false);

  // Success Banner
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  // Form states (Add/Edit)
  const [editingItem, setEditingItem] = useState(null);
  const [formNumero, setFormNumero] = useState('');
  const [formAsignado, setFormAsignado] = useState('');
  const [formIp, setFormIp] = useState('');
  const [formMac, setFormMac] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formEstado, setFormEstado] = useState('ACTIVO');

  useEffect(() => {
    loadInternos();
  }, []);

  const loadInternos = async () => {
    setIsSyncing(true);
    try {
      const data = await fetchInternos();
      setInternos(data || []);
    } catch (err) {
      console.error(err);
      showBanner('Error al cargar los teléfonos IP');
    } finally {
      setIsSyncing(false);
    }
  };

  const showBanner = (msg) => {
    setBannerMessage(msg);
    setShowSuccessBanner(true);
    setTimeout(() => setShowSuccessBanner(false), 4000);
  };

  const resetForm = () => {
    setFormNumero('');
    setFormAsignado('');
    setFormIp('');
    setFormMac('');
    setFormMarca('');
    setFormEstado('ACTIVO');
    setEditingItem(null);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormNumero(item.numeroInterno || '');
    setFormAsignado(item.asignadoA || '');
    setFormIp(item.direccionIp || '');
    setFormMac(item.macAddress || '');
    setFormMarca(item.marcaModelo || '');
    setFormEstado(item.estadoActual || 'ACTIVO');
    setIsEditModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const dto = {
      numeroInterno: formNumero,
      asignadoA: formAsignado,
      direccionIp: formIp,
      macAddress: formMac,
      marcaModelo: formMarca,
      estadoActual: formEstado
    };

    try {
      if (editingItem) {
        await updateInterno(editingItem.id, dto);
        showBanner(`Interno ${formNumero} actualizado correctamente.`);
        setIsEditModalOpen(false);
      } else {
        await createInterno(dto);
        showBanner(`Interno ${formNumero} registrado con éxito.`);
        setIsAddModalOpen(false);
      }
      loadInternos();
    } catch (err) {
      console.error(err);
      showBanner('Error al guardar el interno');
    }
  };

  const handleDelete = async (id, numero) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el interno ${numero}?`)) {
      try {
        await deleteInterno(id);
        showBanner(`Interno ${numero} eliminado del inventario.`);
        loadInternos();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // --- EXCEL IMPORT LOGIC ---
  const handleImport = async (rows) => {
    setImportando(true);
    try {
      const dataToImport = rows.map(r => ({
        numeroInterno: r.numeroInterno ? String(r.numeroInterno) : '',
        asignadoA: r.asignadoA ? String(r.asignadoA) : '',
        direccionIp: r.direccionIp ? String(r.direccionIp) : '',
        macAddress: r.macAddress ? String(r.macAddress) : '',
        marcaModelo: r.marcaModelo ? String(r.marcaModelo) : '',
        estadoActual: r.estadoActual ? String(r.estadoActual) : 'ACTIVO'
      })).filter(x => x.numeroInterno || x.asignadoA);
      
      await createBulkInternos(dataToImport);
      showBanner(`Se importaron ${dataToImport.length} internos correctamente.`);
      loadInternos();
    } catch (err) {
      console.error(err);
      showBanner('Error al importar el lote.');
    } finally {
      setImportando(false);
      setModalImportAbierto(false);
    }
  };

  const dataset = internos.filter(item => 
    (item.numeroInterno || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.asignadoA || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.direccionIp || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <StudioPageShell
      title={`Teléfonos IP (${internos.length})`}
      subtitle="Registro de internos, estado de comunicación y asignaciones activas."
      actions={
        <>
          <StudioSecondaryButton onClick={() => setModalImportAbierto(true)}>
            Importar Excel/CSV
          </StudioSecondaryButton>
          <StudioPrimaryButton onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
            Registrar Interno
          </StudioPrimaryButton>
        </>
      }
    >
      {/* Dynamic Success notifications */}
      <AnimatePresence>
        {showSuccessBanner && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: -15 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -15 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between gap-3 shadow-sm mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold">Operación Completada</h4>
                  <p className="text-[11px] font-medium mt-0.5">{bannerMessage}</p>
                </div>
              </div>
              <button onClick={() => setShowSuccessBanner(false)} className="p-1 px-2 hover:bg-emerald-100 rounded text-emerald-700 font-bold text-xs">
                Cerrar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por asignación, IP o número interno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
        <div className="text-slate-500 text-xs font-semibold">
          Internos: <span className="text-slate-900 font-bold">{dataset.length}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {dataset.map((infra) => (
          <div key={infra.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group">
            <div className={`absolute top-0 left-0 right-0 h-1 ${infra.estadoActual === 'ACTIVO' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">Int: {infra.numeroInterno}</span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${infra.estadoActual === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                  ● {infra.estadoActual}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm">{infra.asignadoA || 'Sin Asignar'}</h3>
                <p className="font-mono text-[11px] text-blue-700 font-bold">{infra.direccionIp || 'IP no registrada'}</p>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 min-h-[50px]">
                <p><strong>Marca/Mod:</strong> {infra.marcaModelo || '-'}</p>
                <p><strong>MAC:</strong> {infra.macAddress || '-'}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button onClick={() => openEdit(infra)} className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-50 hover:bg-blue-50 text-xs text-slate-700 hover:text-blue-700 border border-slate-200 rounded-md font-semibold transition-colors">
                <Edit2 className="w-3 h-3" /> Editar
              </button>
              <button onClick={() => handleDelete(infra.id, infra.numeroInterno)} className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 rounded-md transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {dataset.length === 0 && (
          <div className="col-span-full bg-slate-50 rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400 italic">
            Sin internos registrados o encontrados.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span className="font-extrabold text-sm text-slate-900">{isEditModalOpen ? 'Editar Interno' : 'Registrar Nuevo Interno'}</span>
                </div>
                <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-bold text-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Número de Interno *</label>
                    <input required type="text" value={formNumero} onChange={(e) => setFormNumero(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-1 focus:ring-blue-600" placeholder="Ej. 2100" />
                  </div>
                  <div className="space-y-1">
                    <label>Asignado A *</label>
                    <input required type="text" value={formAsignado} onChange={(e) => setFormAsignado(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-1 focus:ring-blue-600" placeholder="Ej. Guardia Principal" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label>Dirección IP</label>
                    <input type="text" value={formIp} onChange={(e) => setFormIp(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-1 focus:ring-blue-600 font-mono" placeholder="192.168..." />
                  </div>
                  <div className="space-y-1">
                    <label>MAC Address</label>
                    <input type="text" value={formMac} onChange={(e) => setFormMac(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-1 focus:ring-blue-600 font-mono" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label>Marca / Modelo</label>
                  <input type="text" value={formMarca} onChange={(e) => setFormMarca(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-1 focus:ring-blue-600" />
                </div>
                <div className="space-y-1">
                  <label>Estado</label>
                  <select value={formEstado} onChange={(e) => setFormEstado(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-1 focus:ring-blue-600">
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="EN_MANTENIMIENTO">EN_MANTENIMIENTO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-[#0c66e4] text-white rounded-lg shadow-sm hover:bg-[#0055cc]">
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <ImportModal
        isOpen={modalImportAbierto}
        onClose={() => setModalImportAbierto(false)}
        onImport={handleImport}
        schema={internosSchema}
        entityName="Internos"
        isImporting={importando}
        existingData={internos}
      />
    </StudioPageShell>
  );
}

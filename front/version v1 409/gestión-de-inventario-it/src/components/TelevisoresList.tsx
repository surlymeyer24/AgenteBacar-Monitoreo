import React, { useState, useEffect } from 'react';
import { 
  Tv, Search, Filter, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle, 
  MapPin, RefreshCw, Upload, Download, Eye, Layers, HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Televisor {
  id: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  area: string;
  direccionIp: string;
  estado: 'Activo' | 'Disponible' | 'En Reparación' | 'Baja';
  pulgadas?: string;
}

const INITIAL_TELEVISORES: Televisor[] = [
  { id: 'TV-001', marca: 'Samsung', modelo: 'Crystal UHD 65"', numeroSerie: 'SM65CRYSTAL-00912', area: 'Sala de Directorio', direccionIp: '192.168.0.85', estado: 'Activo', pulgadas: '65' },
  { id: 'TV-002', marca: 'LG', modelo: 'OLED C3 55"', numeroSerie: 'LG55OLEDC3-88319', area: 'Sala de Recuento A', direccionIp: '192.168.0.86', estado: 'Activo', pulgadas: '55' },
  { id: 'TV-003', marca: 'Sony', modelo: 'Bravia XR 75"', numeroSerie: 'SN75BRAVIA-10492', area: 'Sala de Monitoreo CCTV', direccionIp: '192.168.0.87', estado: 'Activo', pulgadas: '75' },
  { id: 'TV-004', marca: 'Samsung', modelo: 'QLED Q60C 50"', numeroSerie: 'SM50Q60C-33290', area: 'Oficina Administración', direccionIp: '192.168.1.40', estado: 'Disponible', pulgadas: '50' },
  { id: 'TV-005', marca: 'Xiaomi', modelo: 'Mi TV A2 43"', numeroSerie: 'XM43MIA2-77402', area: 'Comedor de Personal', direccionIp: '192.168.1.99', estado: 'En Reparación', pulgadas: '43' }
];

export default function TelevisoresList() {
  const [televisores, setTelevisores] = useState<Televisor[]>(() => {
    const cached = localStorage.getItem('cyberwatch_televisores');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn(e);
      }
    }
    return INITIAL_TELEVISORES;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [selectedEstado, setSelectedEstado] = useState('Todos');

  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTv, setEditingTv] = useState<Televisor | null>(null);

  // Form Fields
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formArea, setFormArea] = useState('');
  const [formIp, setFormIp] = useState('');
  const [formEstado, setFormEstado] = useState<'Activo' | 'Disponible' | 'En Reparación' | 'Baja'>('Activo');
  const [formPulgadas, setFormPulgadas] = useState('');
  const [formError, setFormError] = useState('');

  // Import Modal States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importFeedback, setImportFeedback] = useState('');

  useEffect(() => {
    localStorage.setItem('cyberwatch_televisores', JSON.stringify(televisores));
  }, [televisores]);

  // Extract unique areas
  const areas = ['Todas', ...Array.from(new Set(televisores.map(t => t.area).filter(Boolean)))];

  // Filtering
  const filteredTelevisores = televisores.filter(t => {
    const matchesSearch = 
      t.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.direccionIp.includes(searchTerm);
    const matchesArea = selectedArea === 'Todas' || t.area === selectedArea;
    const matchesEstado = selectedEstado === 'Todos' || t.estado === selectedEstado;
    return matchesSearch && matchesArea && matchesEstado;
  });

  const handleOpenAdd = () => {
    setEditingTv(null);
    setFormMarca('');
    setFormModelo('');
    setFormSerial('');
    setFormArea('Sala de Directorio');
    setFormIp('192.168.0.X');
    setFormEstado('Activo');
    setFormPulgadas('55');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tv: Televisor) => {
    setEditingTv(tv);
    setFormMarca(tv.marca);
    setFormModelo(tv.modelo);
    setFormSerial(tv.numeroSerie);
    setFormArea(tv.area);
    setFormIp(tv.direccionIp);
    setFormEstado(tv.estado);
    setFormPulgadas(tv.pulgadas || '55');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMarca.trim() || !formModelo.trim() || !formArea.trim() || !formEstado) {
      setFormError('Por favor complete los campos obligatorios (*) marcados.');
      return;
    }

    if (editingTv) {
      // Edit
      setTelevisores(prev => prev.map(t => t.id === editingTv.id ? {
        ...t,
        marca: formMarca,
        modelo: formModelo,
        numeroSerie: formSerial,
        area: formArea,
        direccionIp: formIp,
        estado: formEstado,
        pulgadas: formPulgadas
      } : t));
    } else {
      // Create new
      const newId = `TV-0${televisores.length + 1}`;
      const newTv: Televisor = {
        id: newId,
        marca: formMarca,
        modelo: formModelo,
        numeroSerie: formSerial || 'S/N',
        area: formArea,
        direccionIp: formIp || 'No asignada',
        estado: formEstado,
        pulgadas: formPulgadas
      };
      setTelevisores(prev => [newTv, ...prev]);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(`¿Está seguro de eliminar el televisor ${id}?`)) {
      setTelevisores(prev => prev.filter(t => t.id !== id));
    }
  };

  // Mock excel parsing
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setImportFeedback(`Archivo "${file.name}" cargado. Procesando activos...`);
        setTimeout(() => {
          const importedTvs: Televisor[] = [
            { id: 'TV-006', marca: 'LG', modelo: 'Nanocell 75"', numeroSerie: 'LG75NANO-40092', area: 'Sala de Espera', direccionIp: '192.168.1.102', estado: 'Activo', pulgadas: '75' },
            { id: 'TV-007', marca: 'Samsung', modelo: 'Neo QLED 85"', numeroSerie: 'SM85NEOQLED-1102', area: 'Auditorio Central', direccionIp: '192.168.1.103', estado: 'Disponible', pulgadas: '85' }
          ];
          setTelevisores(prev => [...prev, ...importedTvs]);
          setImportFeedback(`¡Sincronización exitosa! Se importaron 2 televisores desde Excel.`);
          setTimeout(() => {
            setIsImportOpen(false);
            setImportFeedback('');
          }, 2000);
        }, 1500);
      } else {
        setImportFeedback('Error: Formato no soportado. Suba un archivo Excel (.xlsx, .xls).');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Tv className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Módulo de Televisores y Smart Screens</h1>
          </div>
          <p className="text-slate-500 text-sm">Inventario de pantallas inteligentes para videoconferencias, monitoreo de CCTV y cartelería digital.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar Excel
          </button>
          <button 
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg font-medium text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Registrar TV
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Pantallas</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{televisores.length}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Tv className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Activos / En Uso</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{televisores.filter(t => t.estado === 'Activo').length}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">En Almacén</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{televisores.filter(t => t.estado === 'Disponible').length}</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">En Reparación</span>
            <p className="text-2xl font-bold text-amber-700 mt-1">{televisores.filter(t => t.estado === 'En Reparación').length}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input 
            type="text" 
            placeholder="Buscar por marca, modelo, N° serie o IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-3 border border-slate-200 rounded-lg bg-slate-50/30">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="text-xs font-semibold bg-transparent border-none text-slate-700 focus:outline-none"
            >
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 px-3 border border-slate-200 rounded-lg bg-slate-50/30">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="text-xs font-semibold bg-transparent border-none text-slate-700 focus:outline-none"
            >
              <option value="Todos">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Disponible">Disponible</option>
              <option value="En Reparación">En Reparación</option>
              <option value="Baja">Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tables list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <th className="p-4">ID</th>
                <th className="p-4">Marca y Modelo</th>
                <th className="p-4">N° de Serie</th>
                <th className="p-4">Área / Ubicación</th>
                <th className="p-4">Dirección IP</th>
                <th className="p-4">Pulgadas</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTelevisores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Tv className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">No se encontraron pantallas</p>
                    <p className="text-xs text-slate-400">Modifica los filtros o agrega una nueva de forma manual.</p>
                  </td>
                </tr>
              ) : (
                filteredTelevisores.map((tv) => (
                  <tr key={tv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-xs text-indigo-600">{tv.id}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-slate-900">{tv.marca} {tv.modelo}</p>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">{tv.numeroSerie}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {tv.area}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-600">{tv.direccionIp}</td>
                    <td className="p-4 font-semibold text-slate-700">{tv.pulgadas ? `${tv.pulgadas}"` : 'S/I'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-block border ${
                        tv.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
                        tv.estado === 'Disponible' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                        tv.estado === 'En Reparación' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {tv.estado}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleOpenEdit(tv)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(tv.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer / Edit or Add Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" 
              onClick={() => setIsFormOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between"
            >
              {/* Form Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {editingTv ? `Editar Pantalla: ${editingTv.id}` : 'Registrar Nuevo Televisor'}
                  </h3>
                  <p className="text-slate-500 text-xs">Formulario manual de ingreso a inventario tecnológico.</p>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Marca *</label>
                  <input 
                    type="text" 
                    required
                    value={formMarca}
                    onChange={(e) => setFormMarca(e.target.value)}
                    placeholder="Ej. Samsung, LG, Sony"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Modelo *</label>
                  <input 
                    type="text" 
                    required
                    value={formModelo}
                    onChange={(e) => setFormModelo(e.target.value)}
                    placeholder="Ej. OLED C3 55 o Crystal UHD"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Pulgadas</label>
                    <input 
                      type="text" 
                      value={formPulgadas}
                      onChange={(e) => setFormPulgadas(e.target.value)}
                      placeholder="Ej. 55"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Número de Serie</label>
                    <input 
                      type="text" 
                      value={formSerial}
                      onChange={(e) => setFormSerial(e.target.value)}
                      placeholder="Ej. S65CR-88931"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Área de Ubicación *</label>
                  <select
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  >
                    <option value="Sala de Directorio">Sala de Directorio</option>
                    <option value="Sala de Recuento A">Sala de Recuento A</option>
                    <option value="Sala de Recuento B">Sala de Recuento B</option>
                    <option value="Sala de Monitoreo CCTV">Sala de Monitoreo CCTV</option>
                    <option value="Oficina Administración">Oficina Administración</option>
                    <option value="Comedor de Personal">Comedor de Personal</option>
                    <option value="Recepción Principal">Recepción Principal</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Dirección IP asignada</label>
                  <input 
                    type="text" 
                    value={formIp}
                    onChange={(e) => setFormIp(e.target.value)}
                    placeholder="Ej. 192.168.0.85"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Estado *</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {['Activo', 'Disponible', 'En Reparación', 'Baja'].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFormEstado(st as any)}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                          formEstado === st 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </form>

              {/* Form Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all shadow-xs"
                >
                  {editingTv ? 'Guardar Cambios' : 'Dar de Alta'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" 
              onClick={() => setIsImportOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-base">Importador de Activos desde Excel</h3>
                </div>
                <button onClick={() => setIsImportOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drag Area */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50/30' 
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Arrastre su planilla Excel aquí</p>
                    <p className="text-xs text-slate-400 mt-0.5">Compatible con archivos .xlsx o .xls</p>
                  </div>
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">
                      Seleccionar Archivo
                    </span>
                  </div>
                </div>
              </div>

              {importFeedback && (
                <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs text-indigo-800 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-indigo-600" />
                  <span>{importFeedback}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-5">
                <button 
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

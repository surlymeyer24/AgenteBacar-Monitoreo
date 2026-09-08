import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Search, Filter, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle, 
  MapPin, RefreshCw, Upload, Download, Eye, Layers, HelpCircle, User, Phone, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Celular {
  id: string;
  marca: string;
  modelo: string;
  imei: string;
  linea: string;
  responsable: string;
  area: string;
  estado: 'Asignado' | 'Disponible' | 'En Reparación' | 'Retirado';
  garantiaHasta?: string;
}

const INITIAL_CELULARES: Celular[] = [
  { id: 'CEL-001', marca: 'Apple', modelo: 'iPhone 14 Pro 128GB', imei: '358902123456789', linea: '+54 351 555-0101', responsable: 'Daniel Ortega', area: 'Tecnología', estado: 'Asignado', garantiaHasta: '2026-11-15' },
  { id: 'CEL-002', marca: 'Samsung', modelo: 'Galaxy S23 Ultra 256GB', imei: '354890123456712', linea: '+54 351 555-0102', responsable: 'Marcela Santucho', area: 'Administración', estado: 'Asignado', garantiaHasta: '2026-09-20' },
  { id: 'CEL-003', marca: 'Motorola', modelo: 'Edge 40 Neo 128GB', imei: '351234567890123', linea: '+54 351 555-0103', responsable: 'Carlos Sosa', area: 'Sistemas', estado: 'Asignado', garantiaHasta: '2027-01-10' },
  { id: 'CEL-004', marca: 'Samsung', modelo: 'Galaxy A34 128GB', imei: '357891234567890', linea: '+54 351 555-0104', responsable: 'Sin Asignar', area: 'ALMACÉN', estado: 'Disponible', garantiaHasta: '2026-06-30' },
  { id: 'CEL-005', marca: 'Motorola', modelo: 'Moto G54 128GB', imei: '352345678901234', linea: '+54 351 555-0105', responsable: 'Agustina (RRHH)', area: 'Recursos Humanos', estado: 'Asignado', garantiaHasta: '2026-04-12' },
  { id: 'CEL-006', marca: 'Xiaomi', modelo: 'Redmi Note 12 Pro', imei: '359012345678901', linea: '+54 351 555-0106', responsable: 'Sin Asignar', area: 'Sistemas', estado: 'En Reparación', garantiaHasta: '2026-02-18' }
];

export default function CelularesList() {
  const [celulares, setCelulares] = useState<Celular[]>(() => {
    const cached = localStorage.getItem('cyberwatch_celulares');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn(e);
      }
    }
    return INITIAL_CELULARES;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [selectedEstado, setSelectedEstado] = useState('Todos');

  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCel, setEditingCel] = useState<Celular | null>(null);

  // Form Fields
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formImei, setFormImei] = useState('');
  const [formLinea, setFormLinea] = useState('');
  const [formResponsable, setFormResponsable] = useState('');
  const [formArea, setFormArea] = useState('');
  const [formEstado, setFormEstado] = useState<'Asignado' | 'Disponible' | 'En Reparación' | 'Retirado'>('Disponible');
  const [formGarantia, setFormGarantia] = useState('');
  const [formError, setFormError] = useState('');

  // Import Modal States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importFeedback, setImportFeedback] = useState('');

  useEffect(() => {
    localStorage.setItem('cyberwatch_celulares', JSON.stringify(celulares));
  }, [celulares]);

  // Extract unique areas
  const areas = ['Todas', ...Array.from(new Set(celulares.map(c => c.area).filter(Boolean)))];

  // Filtering
  const filteredCelulares = celulares.filter(c => {
    const matchesSearch = 
      c.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.linea.includes(searchTerm) ||
      c.responsable.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = selectedArea === 'Todas' || c.area === selectedArea;
    const matchesEstado = selectedEstado === 'Todos' || c.estado === selectedEstado;
    return matchesSearch && matchesArea && matchesEstado;
  });

  const handleOpenAdd = () => {
    setEditingCel(null);
    setFormMarca('');
    setFormModelo('');
    setFormImei('');
    setFormLinea('');
    setFormResponsable('Sin Asignar');
    setFormArea('Sistemas');
    setFormEstado('Disponible');
    setFormGarantia('2027-01-01');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cel: Celular) => {
    setEditingCel(cel);
    setFormMarca(cel.marca);
    setFormModelo(cel.modelo);
    setFormImei(cel.imei);
    setFormLinea(cel.linea);
    setFormResponsable(cel.responsable);
    setFormArea(cel.area);
    setFormEstado(cel.estado);
    setFormGarantia(cel.garantiaHasta || '');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMarca.trim() || !formModelo.trim() || !formImei.trim() || !formEstado) {
      setFormError('Por favor complete los campos obligatorios (*) marcados.');
      return;
    }

    if (editingCel) {
      // Edit
      setCelulares(prev => prev.map(c => c.id === editingCel.id ? {
        ...c,
        marca: formMarca,
        modelo: formModelo,
        imei: formImei,
        linea: formLinea,
        responsable: formResponsable,
        area: formArea,
        estado: formEstado,
        garantiaHasta: formGarantia
      } : c));
    } else {
      // Create new
      const newId = `CEL-0${celulares.length + 1}`;
      const newCel: Celular = {
        id: newId,
        marca: formMarca,
        modelo: formModelo,
        imei: formImei,
        linea: formLinea || 'Sin Línea',
        responsable: formResponsable || 'Sin Asignar',
        area: formArea,
        estado: formEstado,
        garantiaHasta: formGarantia
      };
      setCelulares(prev => [newCel, ...prev]);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(`¿Está seguro de eliminar el celular ${id}?`)) {
      setCelulares(prev => prev.filter(c => c.id !== id));
    }
  };

  // Drag over Excel simulator
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
        setImportFeedback(`Archivo "${file.name}" cargado. Procesando...`);
        setTimeout(() => {
          const imported: Celular[] = [
            { id: 'CEL-007', marca: 'Apple', modelo: 'iPhone 13 128GB', imei: '351982736154102', linea: '+54 351 555-0107', responsable: 'Marcela G.', area: 'Ventas', estado: 'Asignado', garantiaHasta: '2026-08-11' },
            { id: 'CEL-008', marca: 'Samsung', modelo: 'Galaxy A54 5G', imei: '356612983712551', linea: '+54 351 555-0108', responsable: 'Sin Asignar', area: 'ALMACÉN', estado: 'Disponible', garantiaHasta: '2026-12-01' }
          ];
          setCelulares(prev => [...prev, ...imported]);
          setImportFeedback(`¡Sincronización exitosa! Se importaron 2 teléfonos móviles desde Excel.`);
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
              <Smartphone className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Módulo de Dispositivos Móviles (Celulares)</h1>
          </div>
          <p className="text-slate-500 text-sm">Registro de líneas corporativas, marcas, modelos y claves IMEI vinculados al personal de la empresa.</p>
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
            Registrar Celular
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Líneas</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{celulares.length}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Líneas Activas</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{celulares.filter(c => c.estado === 'Asignado').length}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">En Almacén</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{celulares.filter(c => c.estado === 'Disponible').length}</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">En Reparación</span>
            <p className="text-2xl font-bold text-amber-700 mt-1">{celulares.filter(c => c.estado === 'En Reparación').length}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input 
            type="text" 
            placeholder="Buscar por marca, modelo, IMEI, línea o responsable..."
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
              <option value="Asignado">Asignado</option>
              <option value="Disponible">Disponible</option>
              <option value="En Reparación">En Reparación</option>
              <option value="Retirado">Retirado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <th className="p-4">ID</th>
                <th className="p-4">Equipo</th>
                <th className="p-4">IMEI</th>
                <th className="p-4">Línea / Número</th>
                <th className="p-4">Responsable</th>
                <th className="p-4">Área</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCelulares.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Smartphone className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">No se encontraron teléfonos móviles</p>
                    <p className="text-xs text-slate-400">Modifica los filtros o registra uno nuevo manualmente.</p>
                  </td>
                </tr>
              ) : (
                filteredCelulares.map((cel) => (
                  <tr key={cel.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-xs text-indigo-600">{cel.id}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-slate-900">{cel.marca} {cel.modelo}</p>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">{cel.imei}</td>
                    <td className="p-4 font-mono text-xs text-slate-600 flex items-center gap-1 mt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {cel.linea}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {cel.responsable}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-semibold">{cel.area}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-block border ${
                        cel.estado === 'Asignado' ? 'bg-indigo-50 text-indigo-700 border-indigo-150' :
                        cel.estado === 'Disponible' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                        cel.estado === 'En Reparación' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {cel.estado}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleOpenEdit(cel)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(cel.id)}
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
                    {editingCel ? `Editar Celular: ${editingCel.id}` : 'Registrar Nuevo Celular'}
                  </h3>
                  <p className="text-slate-500 text-xs">Formulario manual de asignación y telemetría móvil.</p>
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
                    placeholder="Ej. Apple, Samsung, Motorola"
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
                    placeholder="Ej. iPhone 14 Pro 128GB"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">IMEI *</label>
                    <input 
                      type="text" 
                      required
                      value={formImei}
                      onChange={(e) => setFormImei(e.target.value)}
                      placeholder="15 dígitos numéricos"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Línea Móvil (Número)</label>
                    <input 
                      type="text" 
                      value={formLinea}
                      onChange={(e) => setFormLinea(e.target.value)}
                      placeholder="+54 351 555-0101"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Responsable Asignado</label>
                  <input 
                    type="text" 
                    value={formResponsable}
                    onChange={(e) => setFormResponsable(e.target.value)}
                    placeholder="Nombre completo o 'Sin Asignar'"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Área *</label>
                  <select
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  >
                    <option value="Tecnología">Tecnología</option>
                    <option value="Sistemas">Sistemas</option>
                    <option value="Administración">Administración</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Ventas">Ventas</option>
                    <option value="ALMACÉN">ALMACÉN</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Vencimiento de Garantía</label>
                  <input 
                    type="date" 
                    value={formGarantia}
                    onChange={(e) => setFormGarantia(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Estado *</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {['Asignado', 'Disponible', 'En Reparación', 'Retirado'].map(st => (
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
                  className="flex-1 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg text-sm font-bold transition-all shadow-xs"
                >
                  {editingCel ? 'Guardar Cambios' : 'Dar de Alta'}
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
                  <Upload className="w-5 h-5 text-[#0c66e4]" />
                  <h3 className="font-bold text-slate-900 text-base">Importar Móviles desde Excel</h3>
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
                    ? 'border-[#0c66e4] bg-blue-50/30' 
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-[#0c66e4]">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Arrastre su planilla Excel aquí</p>
                    <p className="text-xs text-slate-400 mt-0.5">Soporta formatos .xlsx o .xls</p>
                  </div>
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-[#0c66e4] bg-blue-50 px-3 py-1 rounded-md">
                      Seleccionar Archivo
                    </span>
                  </div>
                </div>
              </div>

              {importFeedback && (
                <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-[#0c66e4]" />
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

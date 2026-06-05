import React, { useState } from 'react';
import { Consumable } from '../types';
import { 
  Package, Search, Filter, Plus, CheckCircle, 
  Trash2, Edit2, MapPin, X, Layers, Info, Check, 
  ArrowLeftRight, Tag, HelpCircle, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StockListProps {
  consumables: Consumable[];
  onAddConsumable: (consumable: Omit<Consumable, 'id'>) => void;
  onUpdateConsumable: (consumable: Consumable) => void;
  onUpdateStock: (id: string, delta: number) => void;
}

export default function StockList({ consumables, onAddConsumable, onUpdateConsumable, onUpdateStock }: StockListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modal / Form States for manual record changes
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConsumable, setEditingConsumable] = useState<Consumable | null>(null);
  
  // Simplified Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'License' | 'Peripheral' | 'Accessory' | 'Component'>('Component');
  const [formStock, setFormStock] = useState('10');
  const [formLocation, setFormLocation] = useState('Almacén Central - IT');
  const [formAvailable, setFormAvailable] = useState('10');
  const [formAssigned, setFormAssigned] = useState('0');
  const [formError, setFormError] = useState('');

  // Helper getters to guarantee correct dynamic numbers (Since available/assigned might be undefined in raw old mock data)
  const getAvailableCount = (c: Consumable) => {
    if (c.availableStock !== undefined) return c.availableStock;
    return c.stock; // Default all to available if not defined
  };

  const getAssignedCount = (c: Consumable) => {
    if (c.assignedStock !== undefined) return c.assignedStock;
    return 0; // Default 0 assigned
  };

  // KPI summaries
  const totalItemsCount = consumables.reduce((acc, curr) => acc + curr.stock, 0);
  const totalAvailableCount = consumables.reduce((acc, curr) => acc + getAvailableCount(curr), 0);
  const totalAssignedCount = consumables.reduce((acc, curr) => acc + getAssignedCount(curr), 0);

  // Filter Pipeline
  const filteredConsumables = consumables.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'License': return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'Peripheral': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Accessory': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Component': return 'bg-slate-50 text-slate-700 border-slate-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'License': return 'Licencia';
      case 'Peripheral': return 'Periférico';
      case 'Accessory': return 'Accesorio';
      case 'Component': return 'Componente';
      default: return category;
    }
  };

  // Open Handlers
  const handleOpenAdd = () => {
    setEditingConsumable(null);
    setFormName('');
    setFormCategory('Component');
    setFormStock('10');
    setFormLocation('Bodega Central IT');
    setFormAvailable('10');
    setFormAssigned('0');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Consumable) => {
    setEditingConsumable(c);
    setFormName(c.name);
    setFormCategory(c.category);
    setFormStock(c.stock.toString());
    setFormLocation(c.location);
    setFormAvailable(getAvailableCount(c).toString());
    setFormAssigned(getAssignedCount(c).toString());
    setFormError('');
    setIsFormOpen(true);
  };

  // Form balance controls (ensure Available + Assigned == Total Stock)
  const handleFormStockChange = (newTotalStr: string) => {
    const total = Math.max(0, parseInt(newTotalStr) || 0);
    setFormStock(total.toString());
    
    // Auto-allocate everything to available as a friendly default
    setFormAvailable(total.toString());
    setFormAssigned('0');
  };

  const handleFormAvailableChange = (newAvailStr: string) => {
    const total = parseInt(formStock) || 0;
    const avail = Math.max(0, Math.min(total, parseInt(newAvailStr) || 0));
    setFormAvailable(avail.toString());
    setFormAssigned((total - avail).toString());
  };

  const handleFormAssignedChange = (newAssignedStr: string) => {
    const total = parseInt(formStock) || 0;
    const assigned = Math.max(0, Math.min(total, parseInt(newAssignedStr) || 0));
    setFormAssigned(assigned.toString());
    setFormAvailable((total - assigned).toString());
  };

  // Submit modal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Por favor redacta el nombre del componente de hardware.');
      return;
    }

    const totalStock = parseInt(formStock) || 0;
    const availStock = parseInt(formAvailable) || 0;
    const assignedStk = parseInt(formAssigned) || 0;

    if (availStock + assignedStk !== totalStock) {
      setFormError(`La distribución no es exacta. Disponible (${availStock}) + Asignado (${assignedStk}) debe dar un total de ${totalStock}.`);
      return;
    }

    const payload = {
      name: formName,
      category: formCategory,
      stock: totalStock,
      minStock: 0, // Ignored as per user request (making simple)
      unitPrice: 0, // Ignored as per user request (no costs)
      location: formLocation || 'Gabinete General',
      availableStock: availStock,
      assignedStock: assignedStk
    };

    if (editingConsumable) {
      onUpdateConsumable({
        ...payload,
        id: editingConsumable.id
      });
    } else {
      onAddConsumable(payload);
    }
    setIsFormOpen(false);
  };

  // Direct fast allocation changes from row triggers
  const handleAlterQuantity = (c: Consumable, target: 'avail' | 'assigned', delta: number) => {
    const currentAvail = getAvailableCount(c);
    const currentAssigned = getAssignedCount(c);

    let nextAvail = currentAvail;
    let nextAssigned = currentAssigned;

    if (target === 'avail') {
      nextAvail = Math.max(0, currentAvail + delta);
    } else {
      nextAssigned = Math.max(0, currentAssigned + delta);
    }

    onUpdateConsumable({
      ...c,
      stock: nextAvail + nextAssigned,
      availableStock: nextAvail,
      assignedStock: nextAssigned
    });
  };

  // Transfer 1 unit between Disponible and Asignado
  const handleTransfer = (c: Consumable, direction: 'avail-to-assigned' | 'assigned-to-avail') => {
    const currentAvail = getAvailableCount(c);
    const currentAssigned = getAssignedCount(c);

    if (direction === 'avail-to-assigned' && currentAvail > 0) {
      onUpdateConsumable({
        ...c,
        availableStock: currentAvail - 1,
        assignedStock: currentAssigned + 1
      });
    } else if (direction === 'assigned-to-avail' && currentAssigned > 0) {
      onUpdateConsumable({
        ...c,
        availableStock: currentAvail + 1,
        assignedStock: currentAssigned - 1
      });
    }
  };

  return (
    <div id="it-stock-simplified" className="space-y-6">
      
      {/* Header and Call to Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="w-5.5 h-5.5 text-blue-600" />
            <span>Inventario IT y Control de Suministros</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Registra los componentes de hardware adquiridos y gestiona de manera rápida cuántos están disponibles en bodega o ya asignados en resguardo.
          </p>
        </div>

        <button 
          id="btn-add-stock-fast"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs ml-auto sm:ml-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Adquisición IT</span>
        </button>
      </div>

      {/* Metrics Row (Simple, focuses only on count indicators) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Adquirido */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-lg">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Adquirido</span>
            <span className="text-lg font-black font-mono text-slate-900">{totalItemsCount} <span className="text-xs font-normal text-slate-400">unidades</span></span>
          </div>
        </div>

        {/* Disponible para uso */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Disponible (En Bodega)</span>
            <span className="text-lg font-black font-mono text-emerald-600">
              {totalAvailableCount} <span className="text-xs font-medium text-slate-400">({totalItemsCount ? Math.round((totalAvailableCount / totalItemsCount) * 100) : 0}%)</span>
            </span>
          </div>
        </div>

        {/* Asignado en custodia */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Asignado (En Uso)</span>
            <span className="text-lg font-black font-mono text-indigo-600">
              {totalAssignedCount} <span className="text-xs font-medium text-slate-400">({totalItemsCount ? Math.round((totalAssignedCount / totalItemsCount) * 100) : 0}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por componente, SKU, ID o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-55 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-semibold text-slate-700"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filtro:</span>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer"
          >
            <option value="All">Todos las categorías</option>
            <option value="Component">Componentes de Hardware</option>
            <option value="Peripheral">Periféricos</option>
            <option value="License">Licencias SaaS</option>
            <option value="Accessory">Accesorios</option>
          </select>
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">COD / ID</th>
                <th className="py-3 px-4">Componente IT / Software</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Ubicación</th>
                <th className="py-3 px-4 text-center">Total Adquirido</th>
                <th className="py-3 px-4 text-center w-80">Distribución Real de Estado</th>
                <th className="py-3 px-4 text-center">Traspaso Rápido</th>
                <th className="py-3 px-4 text-right">Opciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredConsumables.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 px-4 text-center text-slate-400 font-medium">
                    No se encontraron componentes en el inventario que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredConsumables.map((c) => {
                  const avail = getAvailableCount(c);
                  const assigned = getAssignedCount(c);
                  
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-blue-600 text-[11px]">{c.id}</td>
                      
                      <td className="py-4 px-4 font-bold text-slate-900">
                        <div className="space-y-0.5">
                          <p>{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">Suministro verificado de IT</p>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getCategoryColor(c.category)}`}>
                          {getCategoryLabel(c.category)}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{c.location}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center font-bold font-mono text-slate-800 text-sm">
                        {c.stock}
                      </td>

                      {/* STATS INTEGRATED INDICATORS */}
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          {/* Row metrics display */}
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-emerald-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {avail} Disp.
                            </span>

                            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                              {/* inline minus avail */}
                              <button 
                                onClick={() => handleAlterQuantity(c, 'avail', -1)}
                                className="hover:text-red-650 px-1 font-bold"
                                title="Restar 1 disponible"
                              >-</button>
                              <span className="text-slate-400 mx-0.5">|</span>
                              {/* inline plus avail */}
                              <button 
                                onClick={() => handleAlterQuantity(c, 'avail', 1)}
                                className="hover:text-emerald-600 px-1 font-bold"
                                title="Sumar 1 disponible"
                              >+</button>
                            </div>

                            <span className="text-indigo-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              {assigned} Asig.
                            </span>

                            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                              {/* inline minus assigned */}
                              <button 
                                onClick={() => handleAlterQuantity(c, 'assigned', -1)}
                                className="hover:text-red-650 px-1 font-bold"
                                title="Restar 1 asignado"
                              >-</button>
                              <span className="text-slate-400 mx-0.5">|</span>
                              {/* inline plus assigned */}
                              <button 
                                onClick={() => handleAlterQuantity(c, 'assigned', 1)}
                                className="hover:text-indigo-600 px-1 font-bold"
                                title="Sumar 1 asignado"
                              >+</button>
                            </div>
                          </div>

                          {/* Distribution level bar */}
                          <div className="w-full h-2 bg-slate-100 border border-slate-200 rounded-full flex overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full transition-all"
                              style={{ width: `${c.stock > 0 ? (avail / c.stock) * 100 : 0}%` }}
                            />
                            <div 
                              className="bg-indigo-500 h-full transition-all"
                              style={{ width: `${c.stock > 0 ? (assigned / c.stock) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* FAST SHIFT ALLOCATION CONTROLS */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 p-0.5 rounded-lg">
                          <button
                            disabled={avail <= 0}
                            onClick={() => handleTransfer(c, 'avail-to-assigned')}
                            className="bg-white hover:bg-slate-100 text-slate-800 disabled:opacity-40 text-[10px] font-bold px-2 py-1 rounded border border-slate-200 transition-all shadow-3xs"
                            title="Traspasar 1 unidad de Disponible a Asignado"
                          >
                            Asignar →
                          </button>
                          <button
                            disabled={assigned <= 0}
                            onClick={() => handleTransfer(c, 'assigned-to-avail')}
                            className="bg-white hover:bg-slate-100 text-slate-800 disabled:opacity-40 text-[10px] font-bold px-2 py-1 rounded border border-slate-200 transition-all shadow-3xs"
                            title="Liberar 1 unidad de Asignado a Disponible"
                          >
                            ← Liberar
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => handleOpenEdit(c)}
                          className="p-1 px-2.5 text-blue-600 hover:bg-blue-50 hover:text-blue-800 rounded bg-slate-50 border border-slate-200 font-bold transition-all text-[11px]"
                          title="Ficha técnica del equipo"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline mr-1" />
                          <span>Ficha</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* simplified instructions/assistance footer */}
      <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl flex items-start gap-3">
        <Info className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-emerald-900">Ayuda rápida: Traspasos Inmediatos</h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Puedes aumentar o reducir el total disponible o asignado usando los controles interactivos de <strong className="text-slate-800">Disp. (- | +)</strong> y <strong className="text-slate-800">Asig. (- | +)</strong>. El botón de <strong>Asignar</strong> descuenta inmediatamente 1 de bodega y lo pone como asignado sin alterar el stock total de esa adquisición.
          </p>
        </div>
      </div>

      {/* POPUP MODAL: Register New Component or Edit Existing */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>{editingConsumable ? `Modificar Suministro [${editingConsumable.id}]` : 'Registrar Nueva Adquisición IT'}</span>
                </span>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-bold text-slate-700">
                
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-[11px] font-semibold">
                    {formError}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="text-slate-700 block mb-1">Nombre Comercial de Hardware / Software *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej. Memoria RAM DDR5 32GB 4800MHz"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                  />
                </div>

                {/* Category & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 block mb-1">Categoría</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-bold"
                    >
                      <option value="Component">Componente Técnico Interno</option>
                      <option value="Peripheral">Periférico de Oficina</option>
                      <option value="License">Licencia de Software</option>
                      <option value="Accessory">Accesorio / Cableado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">Ubicación física / Bodega original</label>
                    <input 
                      type="text"
                      placeholder="Ej. Bodega Central CDMX"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                    />
                  </div>
                </div>

                {/* Quantitative distribution (Simple and automated) */}
                <div className="border border-slate-200 p-4 rounded-xl space-y-3.5 bg-slate-50/50">
                  <span className="font-extrabold text-slate-900 block border-b border-slate-200 pb-1.5">Distribución de Lote</span>
                  
                  {/* Total Quantity */}
                  <div className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-lg">
                    <div>
                      <label className="text-slate-800 font-bold">Cantidad Adquirida Total *</label>
                      <span className="text-[10px] text-slate-400 block font-normal">Unidades totales compradas en el lote</span>
                    </div>
                    <input 
                      type="number"
                      min="0"
                      value={formStock}
                      onChange={(e) => handleFormStockChange(e.target.value)}
                      className="w-20 px-2 py-1 rounded border border-slate-200 text-center font-black font-mono text-xs text-slate-900"
                    />
                  </div>

                  {/* Split available vs assigned sliders */}
                  <div className="space-y-3 pt-1">
                    {/* Available */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-800 font-bold">● Disponible (Para Bodega)</span>
                        <span className="font-mono bg-white border px-2 py-0.5 rounded text-amber-950">{formAvailable} unidades</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max={formStock}
                        value={formAvailable}
                        onChange={(e) => handleFormAvailableChange(e.target.value)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    {/* Assigned */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-indigo-800 font-bold">● Asignado (Ya en uso técnico)</span>
                        <span className="font-mono bg-white border px-2 py-0.5 rounded text-indigo-950">{formAssigned} unidades</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max={formStock}
                        value={formAssigned}
                        onChange={(e) => handleFormAssignedChange(e.target.value)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 font-normal">
                    * Modificar el control deslizante ajustará automáticamente la diferencia de la distribución de forma exacta.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirmar Registro</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

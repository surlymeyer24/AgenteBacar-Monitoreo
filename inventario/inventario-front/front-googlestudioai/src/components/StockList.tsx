import React, { useState } from 'react';
import { Consumable } from '../types';
import { 
  Package, Search, Filter, Plus, AlertTriangle, CheckCircle, ArrowRight, 
  Settings, PenTool, Edit2, Archive, DollarSign, CloudCheck, LayoutList, 
  MapPin, Sliders, PlayCircle, PlusCircle, MinusCircle, X
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
  
  // Modals / forms
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConsumable, setEditingConsumable] = useState<Consumable | null>(null);
  
  // Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'License' | 'Peripheral' | 'Accessory' | 'Component'>('License');
  const [formStock, setFormStock] = useState('0');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formPrice, setFormPrice] = useState('0');
  const [formLocation, setFormLocation] = useState('Almacén Central');
  const [formError, setFormError] = useState('');

  const filteredConsumables = consumables.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'License': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'Peripheral': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Accessory': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Component': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getCategoryLabelSpan = (category: string) => {
    switch (category) {
      case 'License': return 'Licencia de Software';
      case 'Peripheral': return 'Periférico / Hardware';
      case 'Accessory': return 'Accesorio';
      case 'Component': return 'Componente Interno';
      default: return category;
    }
  };

  const handleOpenAdd = () => {
    setEditingConsumable(null);
    setFormName('');
    setFormCategory('License');
    setFormStock('10');
    setFormMinStock('5');
    setFormPrice('25');
    setFormLocation('Almacén Central');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Consumable) => {
    setEditingConsumable(c);
    setFormName(c.name);
    setFormCategory(c.category);
    setFormStock(c.stock.toString());
    setFormMinStock(c.minStock.toString());
    setFormPrice(c.unitPrice.toString());
    setFormLocation(c.location);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formStock.trim() || !formMinStock.trim() || !formPrice.trim()) {
      setFormError('Por favor complete todos los datos.');
      return;
    }

    const payload = {
      name: formName,
      category: formCategory,
      stock: Number(formStock),
      minStock: Number(formMinStock),
      unitPrice: Number(formPrice),
      location: formLocation
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

  return (
    <div id="stock-view" className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Insumos y Stock de Licencias</h1>
          <p className="text-xs text-slate-500">Mapea licencias en la nube SaaS, consumibles internos de oficina, cableado y periféricos con reabastecimiento programado.</p>
        </div>
        <button 
          id="add-consumable-btn"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg font-medium text-sm transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Nuevo Consumible
        </button>
      </div>

      {/* Critical Stock KPI alerts bar */}
      {consumables.some(c => c.stock <= c.minStock) && (
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-900">Artículos con Stock Bajo Crítico detectados</h4>
            <p className="text-[11px] text-slate-600">
              Hay insumos que están por debajo de su límite de reserva operativa. Por favor proceda a despachar o solicitar de la pasarela de compras corporativa.
            </p>
          </div>
        </div>
      )}

      {/* Search filters toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por nombre o ID de consumible..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-slate-700"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">
          <span>Categoría:</span>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer select-none"
          >
            <option value="All">Todas</option>
            <option value="License">Licencias SaaS</option>
            <option value="Peripheral">Periféricos</option>
            <option value="Accessory">Accesorios</option>
            <option value="Component">Componentes</option>
          </select>
        </div>
      </div>

      {/* Corporate table layout for precise stock control */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Consumible ID</th>
                <th className="py-3 px-4">Artículo</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Ubicación / Resguardo</th>
                <th className="py-3 px-4 text-right">Inversión Unitaria</th>
                <th className="py-3 px-4 text-center">Nivel de Stock</th>
                <th className="py-3 px-4 text-center">Control de Cantidad</th>
                <th className="py-3 px-4 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredConsumables.map((c) => {
                const isUnderThreshold = c.stock <= c.minStock;
                
                return (
                  <tr key={c.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-blue-600">{c.id}</td>
                    
                    <td className="py-4 px-4 font-semibold text-slate-900">
                      <div className="space-y-0.5">
                        <p>{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">Valor de inventario total: ${(c.stock * c.unitPrice).toLocaleString()} USD</p>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(c.category)}`}>
                        {getCategoryLabelSpan(c.category)}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{c.location}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-medium">${c.unitPrice} USD</td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="flex items-center gap-1.5 font-bold font-mono">
                          <span className={isUnderThreshold ? 'text-amber-600' : 'text-slate-900'}>{c.stock}</span>
                          <span className="text-slate-300 font-normal">/</span>
                          <span className="text-slate-400 font-normal text-[11px]">{c.minStock} min</span>
                        </div>
                        
                        {/* Dynamic mini indicator bar */}
                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isUnderThreshold ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min((c.stock / (c.minStock * 2 || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Stock quick controls */}
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                        <button 
                          onClick={() => onUpdateStock(c.id, -1)}
                          disabled={c.stock <= 0}
                          className="p-1 rounded text-slate-600 hover:bg-white disabled:opacity-30 transition-colors"
                          title="Restar 1 de stock"
                        >
                          <MinusCircle className="w-4 h-4 text-slate-500 hover:text-slate-800" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold font-mono text-slate-800">{c.stock}</span>
                        <button 
                          onClick={() => onUpdateStock(c.id, 1)}
                          className="p-1 rounded text-slate-600 hover:bg-white transition-colors"
                          title="Sumar 1 a stock"
                        >
                          <PlusCircle className="w-4 h-4 text-slate-500 hover:text-slate-800" />
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => handleOpenEdit(c)}
                        className="p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-800 rounded font-bold transition-colors"
                        title="Modificar ficha técnica"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: Add / Edit Consumable Insumo Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-950 text-sm">
                  {editingConsumable ? 'Modificar Consumible' : 'Registrar Consumible / Insumo'}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-2 border border-red-200 bg-red-100 text-red-700 text-xs rounded">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Nombre del Consumible *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej. Adobe Creative Cloud o Disco SSD Rugged 1TB"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Categoría del Insumo</label>
                  <select 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs bg-white"
                  >
                    <option value="License">Licencia de Software SaaS</option>
                    <option value="Peripheral">Periférico</option>
                    <option value="Accessory">Accesorio de Oficina</option>
                    <option value="Component">Componente Técnico Interno</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Stock Inicial *</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Stock Mínimo Alerta *</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Costo Unitario (USD) *</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Ubicación de Resguardo</label>
                    <input 
                      type="text"
                      placeholder="Ej. Estantería A2 o Admin portal"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-1.5 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded text-xs font-semibold"
                  >
                    Guardar
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

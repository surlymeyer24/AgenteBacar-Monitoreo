import React, { useState } from 'react';
import { Asset, User, AssetType, AssetStatus } from '../types';
import { 
  Search, Filter, Plus, Eye, Edit2, Trash2, X, AlertCircle, 
  ChevronDown, ArrowUpDown, Grid, List, Laptop, Monitor, Smartphone, 
  Cpu, HardDrive, Network, Layers, ShieldCheck, Check, Calendar, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AssetsListProps {
  assets: Asset[];
  users: User[];
  onAddAsset: (asset: Omit<Asset, 'id'>) => void;
  onUpdateAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
}

export default function AssetsList({ assets, users, onAddAsset, onUpdateAsset, onDeleteAsset }: AssetsListProps) {
  // Filter variables
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<keyof Asset>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Detail drawer / Edit / Add Asset modal states
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AssetType>('Laptop');
  const [formSerial, setFormSerial] = useState('');
  const [formStatus, setFormStatus] = useState<AssetStatus>('Available');
  const [formModel, setFormModel] = useState('');
  const [formManufacturer, setFormManufacturer] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formDept, setFormDept] = useState('Soporte e IT');
  const [formLocation, setFormLocation] = useState('Almacén Central');
  const [formNotes, setFormNotes] = useState('');
  const [formAssignedUser, setFormAssignedUser] = useState('');
  const [formError, setFormError] = useState('');

  // Get active departments
  const departments = ['All', 'Ingeniería', 'Diseño UX/UI', 'Recursos Humanos', 'Ventas & Marketing', 'Finanzas', 'Soporte e IT'];

  // Handle open modal for new asset
  const handleOpenAddModal = () => {
    setEditingAsset(null);
    setFormName('');
    setFormType('Laptop');
    setFormSerial('');
    setFormStatus('Available');
    setFormModel('');
    setFormManufacturer('');
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormCost('');
    setFormDept('Soporte e IT');
    setFormLocation('Almacén Central');
    setFormNotes('');
    setFormAssignedUser('');
    setFormError('');
    setIsFormOpen(true);
  };

  // Handle open modal for edit
  const handleOpenEditModal = (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAsset(asset);
    setFormName(asset.name);
    setFormType(asset.type);
    setFormSerial(asset.serialNumber);
    setFormStatus(asset.status);
    setFormModel(asset.model);
    setFormManufacturer(asset.manufacturer);
    setFormPurchaseDate(asset.purchaseDate);
    setFormCost(asset.cost.toString());
    setFormDept(asset.department);
    setFormLocation(asset.location);
    setFormNotes(asset.notes || '');
    setFormAssignedUser(asset.assignedToUserId || '');
    setFormError('');
    setIsFormOpen(true);
  };

  // Save/Submit Asset
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSerial.trim() || !formModel.trim() || !formManufacturer.trim() || !formCost.trim()) {
      setFormError('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    const payload = {
      name: formName,
      type: formType,
      serialNumber: formSerial,
      status: formStatus,
      model: formModel,
      manufacturer: formManufacturer,
      purchaseDate: formPurchaseDate,
      cost: Number(formCost),
      department: formDept,
      location: formLocation,
      notes: formNotes,
      assignedToUserId: formStatus === 'Assigned' ? (formAssignedUser || undefined) : undefined
    };

    if (editingAsset) {
      onUpdateAsset({
        ...payload,
        id: editingAsset.id
      });
    } else {
      onAddAsset(payload);
    }

    setIsFormOpen(false);
  };

  // Filter Assets list
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'All' || asset.type === selectedType;
    const matchesStatus = selectedStatus === 'All' || asset.status === selectedStatus;
    const matchesDept = selectedDept === 'All' || asset.department === selectedDept;

    return matchesSearch && matchesType && matchesStatus && matchesDept;
  });

  // Sort function
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (valA === undefined) return 1;
    if (valB === undefined) return -1;

    if (typeof valA === 'string') {
      return sortOrder === 'asc' 
        ? valA.localeCompare(valB as string) 
        : (valB as string).localeCompare(valA);
    } else {
      return sortOrder === 'asc' 
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    }
  });

  const toggleSort = (field: keyof Asset) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Styles helpers
  const getAssetTypeIcon = (type: string) => {
    const cls = "w-4 h-4 shrink-0";
    switch (type) {
      case 'Laptop': return <Laptop className={`${cls} text-blue-600`} />;
      case 'Monitor': return <Monitor className={`${cls} text-cyan-600`} />;
      case 'Mobile': return <Smartphone className={`${cls} text-purple-600`} />;
      case 'Peripheral': return <Cpu className={`${cls} text-orange-600`} />;
      case 'Server': return <HardDrive className={`${cls} text-emerald-600`} />;
      case 'Network': return <Network className={`${cls} text-amber-600`} />;
      default: return <Layers className={`${cls} text-slate-600`} />;
    }
  };

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'Available': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">● Disponible</span>;
      case 'Assigned': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">● Asignado</span>;
      case 'In Repair': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">● En Taller</span>;
      case 'Retired': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">● Retirado</span>;
    }
  };

  return (
    <div id="assets-list-view" className="space-y-6">
      
      {/* Title + Action Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div id="assets-header-text">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Catálogo de Activos de IT</h1>
          <p className="text-xs text-slate-500">Administra equipamiento de cómputo, licencias, dispositivos móviles e infraestructura de red.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Toggles */}
          <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-lg">
            <button 
              id="list-view-btn"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              title="Vista de Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              id="grid-view-btn"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              title="Vista de Bento Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          <button 
            id="register-asset-main-btn"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg font-medium text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Nuevo Activo
          </button>
        </div>
      </div>

      {/* Advanced Filter Toolbar - ServiceNow/Atlassian style */}
      <div id="filter-block" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              id="asset-search"
              type="text"
              placeholder="Buscar por nombre, número de serie, modelo o ID de activo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-slate-700"
            />
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600">
              <span className="text-slate-400 mr-1"><Filter className="w-3.5 h-3.5" /></span>
              <span>Categoría:</span>
              <select 
                id="filter-type-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer p-0 select-none pb-0.5"
              >
                <option value="All">Todas</option>
                <option value="Laptop">Laptops</option>
                <option value="Monitor">Monitores</option>
                <option value="Mobile">Móviles</option>
                <option value="Peripheral">Periféricos</option>
                <option value="Server">Servidores</option>
                <option value="Network">Redes</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600">
              <span>Estado:</span>
              <select 
                id="filter-status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer p-0 select-none pb-0.5"
              >
                <option value="All">Todos</option>
                <option value="Available">Disponibles</option>
                <option value="Assigned">Asignados</option>
                <option value="In Repair">En Taller</option>
                <option value="Retired">Retirados</option>
              </select>
            </div>

            {/* Dept Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600">
              <span>Depto:</span>
              <select 
                id="filter-dept-select"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer p-0 select-none pb-0.5"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept === 'All' ? 'Todos' : dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Counter of active filters & reset */}
        {(searchTerm || selectedType !== 'All' || selectedStatus !== 'All' || selectedDept !== 'All') && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="font-medium text-blue-600">Filtros activos: {sortedAssets.length} resultados encontrados.</span>
            <button 
              id="reset-filters"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('All');
                setSelectedStatus('All');
                setSelectedDept('All');
              }}
              className="text-[#0c66e4] hover:underline font-semibold"
            >
              Restablecer Filtros
            </button>
          </div>
        )}
      </div>

      {sortedAssets.length === 0 ? (
        <div id="no-assets-state" className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-full">
            <AlertCircle className="w-12 h-12" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-950 text-base">No se encontraron activos</h3>
            <p className="text-xs text-slate-500 max-w-sm">Intenta ajustar tus criterios de búsqueda o filtros avanzados para localizar el equipo.</p>
          </div>
          <button 
            id="clear-filters-btn-empty"
            onClick={() => { setSearchTerm(''); setSelectedType('All'); setSelectedStatus('All'); setSelectedDept('All'); }}
            className="px-4 py-2 bg-slate-100 font-medium text-xs text-slate-700 hover:bg-slate-200 rounded-lg transition-all"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* TABLE VIEW - Microsoft Admin Center & Jira styling */
        <div id="assets-table-card" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => toggleSort('id')}>
                    <div className="flex items-center gap-1.5">ID <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => toggleSort('name')}>
                    <div className="flex items-center gap-1.5">Nombre <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => toggleSort('type')}>
                    <div className="flex items-center gap-1.5">Categoría <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => toggleSort('manufacturer')}>
                    <div className="flex items-center gap-1.5">Fabricante <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => toggleSort('status')}>
                    <div className="flex items-center gap-1.5">Estado <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => toggleSort('cost')}>
                    <div className="flex items-center gap-1.5">Costo (USD) <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3.5 px-4">Custodio</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedAssets.map((asset) => {
                  const assignedUser = users.find(u => u.id === asset.assignedToUserId);
                  return (
                    <tr 
                      key={asset.id} 
                      onClick={() => { setSelectedAsset(asset); setIsDetailOpen(true); }}
                      className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-4 font-mono font-semibold text-xs text-blue-600">{asset.id}</td>
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 leading-tight">{asset.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">S/N: {asset.serialNumber}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          {getAssetTypeIcon(asset.type)}
                          <span className="text-xs text-slate-700 font-medium">{asset.type}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-slate-600">{asset.manufacturer}</td>
                      <td className="py-4 px-4">{getStatusBadge(asset.status)}</td>
                      <td className="py-4 px-4 font-mono font-medium text-slate-800">${asset.cost.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        {assignedUser ? (
                          <div className="flex items-center gap-2">
                            {assignedUser.avatarUrl && (
                              <img src={assignedUser.avatarUrl} alt={assignedUser.name} className="w-5 h-5 rounded-full object-cover border border-slate-100" referrerPolicy="no-referrer" />
                            )}
                            <div className="text-xs leading-none">
                              <p className="font-semibold text-slate-800 leading-tight">{assignedUser.name}</p>
                              <p className="text-[10px] text-slate-500">{assignedUser.department}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setSelectedAsset(asset); setIsDetailOpen(true); }}
                            className="p-1 px-2 rounded hover:bg-slate-100 text-slate-600 font-medium text-xs flex items-center gap-1"
                            title="Ver detalles"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => handleOpenEditModal(asset, e)}
                            className="p-1 px-2 rounded hover:bg-slate-100 text-blue-600 font-medium text-xs flex items-center gap-1"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onDeleteAsset(asset.id)}
                            className="p-1 px-2 rounded hover:bg-red-50 text-red-600 font-medium text-xs flex items-center gap-1"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* BENTO GRID VIEW - Material Design 3 and Modern styling */
        <div id="assets-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedAssets.map((asset) => {
            const assignedUser = users.find(u => u.id === asset.assignedToUserId);
            return (
              <div 
                key={asset.id}
                onClick={() => { setSelectedAsset(asset); setIsDetailOpen(true); }}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-500 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-600">{asset.id}</span>
                    {getStatusBadge(asset.status)}
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-950 group-hover:text-blue-600 transition-colors line-clamp-1 leading-tight">{asset.name}</h3>
                    <p className="text-xs text-slate-500 font-mono line-clamp-1">{asset.manufacturer} • {asset.model}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg p-2">
                    {getAssetTypeIcon(asset.type)}
                    <span className="font-semibold text-slate-700">{asset.type}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    <p className="text-slate-400 text-[10px]">Custodiado por:</p>
                    <p className="font-semibold text-slate-800 truncate max-w-[120px]">
                      {assignedUser ? assignedUser.name : 'Almacén Central'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-[10px]">Inversión:</p>
                    <p className="font-mono font-bold text-slate-900">${asset.cost.toLocaleString()} USD</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED DRAWERS & MODALS */}
      <AnimatePresence>
        {/* RIGHT SIDEBAR PANEL DRAWER: Asset Details */}
        {isDetailOpen && selectedAsset && (
          <div id="modal-backdrop" className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-slate-950"
            />
            {/* Drawer container container */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-mono text-xs font-bold text-blue-600">{selectedAsset.id}</span>
                  <h3 className="text-lg font-bold text-slate-950 leading-tight">{selectedAsset.name}</h3>
                </div>
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Visual state banner */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Estado de Activo</span>
                    <div>{getStatusBadge(selectedAsset.status)}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Ubicación Actual</span>
                    <p className="text-xs font-semibold text-slate-800">{selectedAsset.location}</p>
                  </div>
                </div>

                {/* Technical Information Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Ficha Técnica</h4>
                  
                  <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 text-xs">
                    <div className="flex justify-between py-2.5 px-3">
                      <span className="text-slate-500 font-medium">Categoría:</span>
                      <span className="font-semibold text-slate-800">{selectedAsset.type}</span>
                    </div>
                    <div className="flex justify-between py-2.5 px-3">
                      <span className="text-slate-500 font-medium">Fabricante:</span>
                      <span className="font-semibold text-slate-800">{selectedAsset.manufacturer}</span>
                    </div>
                    <div className="flex justify-between py-2.5 px-3">
                      <span className="text-slate-500 font-medium">Modelo:</span>
                      <span className="font-semibold text-slate-800">{selectedAsset.model}</span>
                    </div>
                    <div className="flex justify-between py-2.5 px-3">
                      <span className="text-slate-500 font-medium">Número de Serie:</span>
                      <span className="font-mono font-semibold text-slate-800">{selectedAsset.serialNumber}</span>
                    </div>
                    <div className="flex justify-between py-2.5 px-3">
                      <span className="text-slate-500 font-medium">Adquisición:</span>
                      <span className="font-semibold text-slate-800">{selectedAsset.purchaseDate}</span>
                    </div>
                    <div className="flex justify-between py-2.5 px-3">
                      <span className="text-slate-500 font-medium">Costo de Activo:</span>
                      <span className="font-mono font-bold text-slate-800">${selectedAsset.cost.toLocaleString()} USD</span>
                    </div>
                  </div>
                </div>

                {/* Assigned User Detail card */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Responsable Asignado</h4>
                  {selectedAsset.assignedToUserId ? (
                    (() => {
                      const userObj = users.find(u => u.id === selectedAsset.assignedToUserId);
                      return userObj ? (
                        <div className="p-4 border border-indigo-100 bg-indigo-50/15 rounded-xl flex items-center gap-3">
                          {userObj.avatarUrl && (
                            <img src={userObj.avatarUrl} alt={userObj.name} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs" referrerPolicy="no-referrer" />
                          )}
                          <div className="text-xs space-y-0.5">
                            <p className="font-bold text-indigo-950 text-sm leading-tight">{userObj.name}</p>
                            <p className="text-slate-600 font-medium">{userObj.role}</p>
                            <p className="text-slate-500 font-mono text-[10px]">{userObj.email}</p>
                          </div>
                        </div>
                      ) : null;
                    })()
                  ) : (
                    <div className="p-4 border border-dashed border-slate-200 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                      Dispositivo en bodega / almacén. Listo para asignación corporativa inmediata.
                    </div>
                  )}
                </div>

                {/* Internal notes and observation logs */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notas de Administración</h4>
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 text-xs text-slate-600 leading-relaxed italic">
                    {selectedAsset.notes || 'Sin anotaciones o incidentes del dispositivo registrados hasta el momento.'}
                  </div>
                </div>

              </div>

              {/* Footer actions */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-2">
                <button 
                  id="drawer-edit-btn"
                  onClick={(e) => { setIsDetailOpen(false); handleOpenEditModal(selectedAsset, e); }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg font-semibold text-xs transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Editorial Ficha
                </button>
                <button 
                  id="drawer-delete-btn"
                  onClick={() => { if (confirm('¿Confirma la depuración de este dispositivo?')) { onDeleteAsset(selectedAsset.id); setIsDetailOpen(false); } }}
                  className="px-3 py-2 border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  id="drawer-close-btn"
                  onClick={() => setIsDetailOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL: Add / Edit Asset Form */}
        {isFormOpen && (
          <div id="form-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-950 text-base">
                  {editingAsset ? `Editando Activo: ${editingAsset.id}` : 'Registrar Nuevo Activo de Cómputo'}
                </h3>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form container */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                {formError && (
                  <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Form fields grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Nombre del Dispositivo *</label>
                    <input 
                      id="form-name-input"
                      type="text"
                      placeholder="Ej. MacBook Pro 14 o Monitor Dell 27"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600 text-slate-800 font-medium"
                    />
                  </div>

                  {/* Category select type */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Categoría Corporatíva *</label>
                    <select 
                      id="form-type-select"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as AssetType)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600 text-slate-800 font-medium bg-white"
                    >
                      <option value="Laptop">Laptop</option>
                      <option value="Monitor">Monitor</option>
                      <option value="Mobile">Móviles / Tablets</option>
                      <option value="Peripheral">Periféricos / Accesorios</option>
                      <option value="Server">Servidor de Datos</option>
                      <option value="Network">Infraestructura de Red</option>
                    </select>
                  </div>

                  {/* S/N field */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Número de Serie *</label>
                    <input 
                      id="form-serial-input"
                      type="text"
                      placeholder="Código S/N único de fábrica"
                      value={formSerial}
                      onChange={(e) => setFormSerial(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600 text-slate-800 font-mono"
                    />
                  </div>

                  {/* Manufacturer field */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Fabricante *</label>
                    <input 
                      id="form-manufacturer-input"
                      type="text"
                      placeholder="Ej. Apple, Lenovo, Cisco, Dell"
                      value={formManufacturer}
                      onChange={(e) => setFormManufacturer(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600 text-slate-800 font-medium"
                    />
                  </div>

                  {/* Model spec structure field */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Modelo y Especificaciones Técnicas *</label>
                    <input 
                      id="form-model-input"
                      type="text"
                      placeholder="Ej. M3 Pro, 32GB RAM, 1TB SSD o Catalyst 48-port switch"
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600 text-slate-800 font-medium"
                    />
                  </div>

                  {/* Purchase date field */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Fecha de Adquisición *</label>
                    <input 
                      id="form-purchasedate-input"
                      type="date"
                      value={formPurchaseDate}
                      onChange={(e) => setFormPurchaseDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600 text-slate-800 font-medium"
                    />
                  </div>

                  {/* Cost budget USD USD */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Costo Estimado (USD) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1.5 text-xs text-slate-500">$</span>
                      <input 
                        id="form-cost-input"
                        type="number"
                        placeholder="Ej. 1400"
                        value={formCost}
                        onChange={(e) => setFormCost(e.target.value)}
                        className="w-full pl-6 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600 text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  {/* Status Selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Estado de Operación</label>
                    <select 
                      id="form-status-select"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as AssetStatus)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600 text-slate-800 font-medium bg-white"
                    >
                      <option value="Available">Disponible</option>
                      <option value="Assigned">Asignado</option>
                      <option value="In Repair">En Reparación</option>
                      <option value="Retired">Retirado / Descarte</option>
                    </select>
                  </div>

                  {/* Location field */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Ubicación de Resguardo</label>
                    <input 
                      id="form-location-input"
                      type="text"
                      placeholder="Ej. Almacén Central, Oficinas Monterrey, DHL"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600 text-slate-800 font-medium"
                    />
                  </div>

                  {/* Department Assignment department Selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Departamento Asignado</label>
                    <select 
                      id="form-dept-select"
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600 text-slate-800 font-medium bg-white"
                    >
                      {departments.filter(d => d !== 'All').map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* USER assigned selection IF status is Assigned */}
                  {formStatus === 'Assigned' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Colaborador Asignado</label>
                      <select 
                        id="form-assigneduser-select"
                        value={formAssignedUser}
                        onChange={(e) => setFormAssignedUser(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none focus:border-indigo-600 text-slate-800 font-medium bg-white"
                      >
                        <option value="">Selecciona Colaborador</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Notes description notes text area */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Notas Adicionales de Entrega o Historial</label>
                    <textarea 
                      id="form-notes-textarea"
                      placeholder="Añade especificaciones del equipo, estado físico o bitácora de actualización..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600 text-slate-800 font-medium"
                    />
                  </div>
                </div>

                {/* Actions bottom */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button 
                    id="form-cancel-btn"
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    id="form-save-btn"
                    type="submit"
                    className="px-5 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                  >
                    {editingAsset ? 'Guardar Cambios' : 'Registrar Activo'}
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

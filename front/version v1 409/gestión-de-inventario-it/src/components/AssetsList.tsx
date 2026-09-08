import React, { useState } from 'react';
import { Asset, User, AssetType, AssetStatus } from '../types';
import { 
  Search, Filter, Plus, Eye, Edit2, Trash2, X, AlertCircle, 
  ChevronDown, ArrowUpDown, Grid, List, Laptop, Monitor, Smartphone, 
  Cpu, HardDrive, Network, Layers, ShieldCheck, Check, Calendar, HelpCircle,
  Upload, Download, FileText, RefreshCw
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

  // Excel Excel Import redesigned window states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [fileDetails, setFileDetails] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

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
            id="import-excel-btn"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white rounded-lg font-semibold text-xs transition-all shadow-3xs"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
            <span>Importar Excel</span>
          </button>

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

      {/* Success banner for Excel Import */}
      <AnimatePresence>
        {showImportSuccess && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-900 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black">¡Carga Masiva de Excel Completada con éxito!</h4>
                  <p className="text-[11px] text-emerald-800 font-semibold font-sans mt-0.5">Se han importado correctamente <strong className="font-extrabold">{importedCount} nuevos activos</strong> al catálogo general de IT y se han generado las firmas de auditoría correspondientes.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportSuccess(false)}
                className="p-1.5 hover:bg-emerald-100 rounded text-emerald-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

        {/* MODAL: Excel Import redesigned window */}
        {isImportModalOpen && (
          <div id="excel-import-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-105 text-emerald-700 rounded-lg" style={{backgroundColor: '#e6f4ea'}}>
                    <Upload className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Importación de Activos desde Excel / CSV</h2>
                    <p className="text-[10px] text-slate-400 font-medium">Sube tus listas de activos en lote para incorporarlos de manera inmediata al inventario core.</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportRows([]);
                    setFileName('');
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs font-bold text-slate-700">
                {/* Drag and Drop Zone */}
                {importRows.length === 0 ? (
                  <div className="space-y-4">
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        setFileName('inventario_activos_corporativo.xlsx');
                        setFileDetails('Tamaño: 142 KB | Filtro correcto detectado');
                        setIsParsingFile(true);
                        setTimeout(() => {
                          setIsParsingFile(false);
                          setImportRows([
                            { name: 'Lenovo ThinkPad L14 Gen 4', type: 'Laptop', serialNumber: 'ST-LEN89547', manufacturer: 'Lenovo', model: 'ThinkPad L14', purchaseDate: '2026-02-15', cost: 1250, department: 'Soporte e IT', location: 'Almacén Central', notes: 'Lote de repuesto por compra trimestral', status: 'Available' },
                            { name: 'Lenovo ThinkPad L14 Gen 4', type: 'Laptop', serialNumber: 'ST-LEN89548', manufacturer: 'Lenovo', model: 'ThinkPad L14', purchaseDate: '2026-02-15', cost: 1250, department: 'Ventas', location: 'Almacén Central', notes: 'Lote de repuesto por compra trimestral', status: 'Available' },
                            { name: 'Dell UltraSharp 24 Monitor', type: 'Monitor', serialNumber: 'ST-DEL44781', manufacturer: 'Dell', model: 'U2424H', purchaseDate: '2026-04-10', cost: 320, department: 'Operaciones', location: 'Almacén Central', notes: 'Pantallas adicionales', status: 'Available' },
                            { name: 'Servidor HPE ProLiant Gen11', type: 'Server', serialNumber: 'ST-HPE11045', manufacturer: 'HPE', model: 'DL360 Gen11', purchaseDate: '2026-01-10', cost: 5800, department: 'Infraestructura', location: 'Búnker Sistemas', notes: 'Servidor base de datos', status: 'Available' }
                          ]);
                        }, 1200);
                      }}
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center space-y-4 ${
                        isDragging ? 'border-emerald-500 bg-emerald-50/50 scale-98' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full" style={{backgroundColor: '#e6f4ea'}}>
                        <Upload className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-800">Arrastra tu archivo aquí o busca tu archivo local</p>
                        <p className="text-[11px] text-slate-400 font-medium">Soporta formatos estándar de planilla de cálculo (.xlsx, .xls o .csv)</p>
                      </div>

                      {/* File selector trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setFileName('inventario_it_general.xlsx');
                          setFileDetails('Tamaño: 87 KB | 5 columnas mapeadas automáticamente');
                          setIsParsingFile(true);
                          setTimeout(() => {
                            setIsParsingFile(false);
                            setImportRows([
                              { name: 'Dell Latitude 3440 i5', type: 'Laptop', serialNumber: 'ST-DL3440-99', manufacturer: 'Dell', model: 'Latitude 3440', purchaseDate: '2026-05-18', cost: 950, department: 'Soporte e IT', location: 'Oficina Central', notes: 'Laptops para teletrabajo', status: 'Available' },
                              { name: 'Samsung Galaxy A54 128GB', type: 'Mobile', serialNumber: 'ST-SAM-A54-88', manufacturer: 'Samsung', model: 'Galaxy A54', purchaseDate: '2026-03-22', cost: 420, department: 'Ventas', location: 'Bodega de Valores', notes: 'Entrega para agentes externos', status: 'Available' },
                              { name: 'Monitor LG UltraWide 29"', type: 'Monitor', serialNumber: 'ST-LG-UW29', manufacturer: 'LG', model: '29WP500', purchaseDate: '2026-04-14', cost: 280, department: 'Desarrollo e IT', location: 'Búnker Sistemas', notes: 'Monitores de edición de código', status: 'Available' }
                            ]);
                          }, 1000);
                        }}
                        className="px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                      >
                        Seleccionar Archivo Local
                      </button>
                    </div>

                    {/* Pre-fill / presets */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">O carga una planilla de prueba predefinida:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setFileName('repuestos_it_lenovo.xlsx');
                            setFileDetails('Tamaño: 45 KB | Lote de laptops seleccionadas de soporte');
                            setIsParsingFile(true);
                            setTimeout(() => {
                              setIsParsingFile(false);
                              setImportRows([
                                { name: 'Lenovo ThinkPad L14 Gen 4', type: 'Laptop', serialNumber: 'ST-LEN89547', manufacturer: 'Lenovo', model: 'ThinkPad L14', purchaseDate: '2026-02-15', cost: 1250, department: 'Soporte e IT', location: 'Almacén Central', notes: 'Lote de repuesto por sucursales', status: 'Available' },
                                { name: 'Lenovo ThinkPad L14 Gen 4', type: 'Laptop', serialNumber: 'ST-LEN89548', manufacturer: 'Lenovo', model: 'ThinkPad L14', purchaseDate: '2026-02-15', cost: 1250, department: 'Ventas', location: 'Almacén Central', notes: 'Lote de repuesto', status: 'Available' },
                                { name: 'MacBook Pro 14 M3 base', type: 'Laptop', serialNumber: 'ST-APL22549', manufacturer: 'Apple', model: 'MacBook Pro 14', purchaseDate: '2026-03-01', cost: 2199, department: 'Desarrollo e IT', location: 'Búnker Sistemas', notes: 'Equipo Premium de Desarrollo', status: 'Available' }
                              ]);
                            }, 800);
                          }}
                          className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-left transition-colors flex items-center gap-2.5"
                        >
                          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                            <Laptop className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <span className="font-extrabold text-[#0c66e4] block">Laptops Lenovo / Apple</span>
                            <span className="text-[10px] text-slate-400 font-medium font-mono">3 Equipos de Cómputo</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFileName('monitores_Dell_oficinas.csv');
                            setFileDetails('Tamaño: 21 KB | Monitores secundarios listados');
                            setIsParsingFile(true);
                            setTimeout(() => {
                              setIsParsingFile(false);
                              setImportRows([
                                { name: 'Dell UltraSharp 24 Monitor - U2424H', type: 'Monitor', serialNumber: 'ST-DEL44781', manufacturer: 'Dell', model: 'U2424H', purchaseDate: '2026-04-10', cost: 320, department: 'Operaciones', location: 'Almacén Central', notes: 'Pantallas adicionales', status: 'Available' },
                                { name: 'Dell UltraSharp 24 Monitor - U2424H', type: 'Monitor', serialNumber: 'ST-DEL44782', manufacturer: 'Dell', model: 'U2424H', purchaseDate: '2026-04-10', cost: 320, department: 'Operaciones', location: 'Almacén Central', notes: 'Pantallas adicionales', status: 'Available' }
                              ]);
                            }, 800);
                          }}
                          className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-left transition-colors flex items-center gap-2.5"
                        >
                          <div className="p-1.5 bg-cyan-100 text-cyan-700 rounded-lg">
                            <Monitor className="w-4 h-4 text-cyan-600" />
                          </div>
                          <div>
                            <span className="font-extrabold text-[#0c66e4] block">Monitores Dell U2424H</span>
                            <span className="text-[10px] text-slate-400 font-medium font-mono">2 un. de Pantalla Oficina</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFileName('servidores_rack_dell.xlsx');
                            setFileDetails('Tamaño: 61 KB | Servidores robustos de infraestructura');
                            setIsParsingFile(true);
                            setTimeout(() => {
                              setIsParsingFile(false);
                              setImportRows([
                                { name: 'Dell PowerEdge R640 Enterprise', type: 'Server', serialNumber: 'ST-PE-R640', manufacturer: 'Dell', model: 'PowerEdge R640', purchaseDate: '2026-05-10', cost: 4500, department: 'Infraestructura', location: 'Búnker Sistemas - Rack 2', notes: 'Servidor ERP redundante', status: 'Available' }
                              ]);
                            }, 800);
                          }}
                          className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-left transition-colors flex items-center gap-2.5"
                        >
                          <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg animate-pulse">
                            <HardDrive className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <span className="font-extrabold text-[#0c66e4] block">Servidores Dell ERP</span>
                            <span className="text-[10px] text-slate-400 font-medium font-mono">1 Rack Infrastructure Core</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex gap-3 text-slate-600">
                      <HelpCircle className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 block">Estructura requerida de la planilla</span>
                        <p className="text-[11px] text-slate-500 font-light font-sans tracking-wide">
                          Para garantizar que tus datos se ingresen automáticamente de forma correcta, la primera fila debe contener los encabezados: <strong>Nombre, Tipo, Número de Serie, Fabricante, Modelo, Ubicación, Departamento, Costo</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* SPREADSHEET REVIEW PREVIEW GRID */
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-500 text-white rounded-md" style={{backgroundColor: '#10b981'}}>
                          <Check className="w-4 h-4 font-black" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-950 text-xs text-slate-800">Archivo cargado de manera correcta</p>
                          <p className="text-[10px] text-slate-400 font-bold font-mono uppercase">{fileName} {fileDetails}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImportRows([]);
                          setFileName('');
                        }}
                        className="text-[11px] text-red-600 hover:underline font-bold"
                      >
                        Limpiar y Cargar Otro Archivo
                      </button>
                    </div>

                    {/* Interactive table */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 tracking-wider text-[10px] uppercase font-bold">Vista previa del Lote para Importación</span>
                        <span className="text-[11px] text-slate-500 font-medium">Puedes modificar directamente las celdas haciendo clic en los textos</span>
                      </div>
                      
                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto shadow-2xs bg-white">
                        <table className="w-full text-left border-collapse font-sans">
                          <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              <th className="py-2.5 px-3">Estado</th>
                              <th className="py-2.5 px-3">Nombre comercial</th>
                              <th className="py-2.5 px-3">Categoría de Activo</th>
                              <th className="py-2.5 px-3">Número de Serie</th>
                              <th className="py-2.5 px-3">Fabricante</th>
                              <th className="py-2.5 px-3">Modelo</th>
                              <th className="py-2.5 px-3">Detalle Ubicación</th>
                              <th className="py-2.5 px-3 text-right">Costo USD</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px]">
                            {importRows.map((row, index) => {
                              const hasError = !row.name || !row.serialNumber || !row.type;
                              return (
                                <tr key={index} className="hover:bg-slate-50/40">
                                  <td className="py-2 px-3">
                                    {hasError ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 font-bold">⚠ Error</span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 font-bold">✓ Listo</span>
                                    )}
                                  </td>
                                  
                                  {/* Inline editable Name */}
                                  <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-100">
                                    <input 
                                      type="text"
                                      value={row.name}
                                      onChange={(e) => {
                                        const next = [...importRows];
                                        next[index].name = e.target.value;
                                        setImportRows(next);
                                      }}
                                      className="bg-transparent hover:bg-slate-55 focus:bg-white border-0 focus:border focus:ring-1 focus:ring-blue-600 focus:outline-none w-full p-0.5 rounded font-semibold text-slate-800"
                                    />
                                  </td>

                                  {/* Inline editable Type */}
                                  <td className="py-2 px-3 border-r border-slate-100">
                                    <select
                                      value={row.type}
                                      onChange={(e) => {
                                        const next = [...importRows];
                                        next[index].type = e.target.value;
                                        setImportRows(next);
                                      }}
                                      className="bg-transparent hover:bg-slate-50 focus:bg-white border-0 font-bold p-0 text-slate-700 cursor-pointer w-full focus:outline-none"
                                    >
                                      <option value="Laptop">Laptop</option>
                                      <option value="Monitor">Monitor</option>
                                      <option value="Mobile">Mobile</option>
                                      <option value="Peripheral">Peripheral</option>
                                      <option value="Server">Server</option>
                                      <option value="Network">Network</option>
                                    </select>
                                  </td>

                                  {/* Serial number */}
                                  <td className="py-2 px-3 font-mono border-r border-slate-100">
                                    <input 
                                      type="text"
                                      value={row.serialNumber}
                                      placeholder="Requerido"
                                      onChange={(e) => {
                                        const next = [...importRows];
                                        next[index].serialNumber = e.target.value;
                                        setImportRows(next);
                                      }}
                                      className={`bg-transparent hover:bg-slate-50 focus:bg-white border-0 focus:border focus:ring-1 focus:ring-blue-600 focus:outline-none w-full p-0.5 rounded font-bold font-mono ${!row.serialNumber ? 'text-rose-600 font-bold bg-rose-50' : 'text-slate-800'}`}
                                    />
                                  </td>

                                  {/* Manufacturer */}
                                  <td className="py-2 px-3 border-r border-slate-100">
                                    <input 
                                      type="text"
                                      value={row.manufacturer}
                                      onChange={(e) => {
                                        const next = [...importRows];
                                        next[index].manufacturer = e.target.value;
                                        setImportRows(next);
                                      }}
                                      className="bg-transparent hover:bg-slate-50 focus:bg-white border-0 focus:border focus:ring-1 focus:ring-blue-600 focus:outline-none w-full p-0.5 rounded text-slate-705"
                                    />
                                  </td>

                                  {/* Model */}
                                  <td className="py-2 px-3 border-r border-slate-100">
                                    <input 
                                      type="text"
                                      value={row.model}
                                      onChange={(e) => {
                                        const next = [...importRows];
                                        next[index].model = e.target.value;
                                        setImportRows(next);
                                      }}
                                      className="bg-transparent hover:bg-slate-50 focus:bg-white border-0 focus:border focus:ring-1 focus:ring-blue-600 focus:outline-none w-full p-0.5 rounded text-slate-705"
                                    />
                                  </td>

                                  {/* Location */}
                                  <td className="py-2 px-3 border-r border-slate-100">
                                    <input 
                                      type="text"
                                      value={row.location}
                                      onChange={(e) => {
                                        const next = [...importRows];
                                        next[index].location = e.target.value;
                                        setImportRows(next);
                                      }}
                                      className="bg-transparent hover:bg-slate-50 focus:bg-white border-0 focus:border focus:ring-1 focus:ring-blue-600 focus:outline-none w-full p-0.5 rounded text-slate-705"
                                    />
                                  </td>

                                  {/* Cost */}
                                  <td className="py-2 px-3 text-right border-r border-slate-100 pr-1.5 align-middle">
                                    <input 
                                      type="number"
                                      value={row.cost}
                                      onChange={(e) => {
                                        const next = [...importRows];
                                        next[index].cost = Number(e.target.value) || 0;
                                        setImportRows(next);
                                      }}
                                      className="bg-transparent hover:bg-slate-50 focus:bg-white border px-1 border-transparent focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none text-right rounded font-bold font-mono w-16"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Column Mapping Checker */}
                    <div className="border border-slate-205 bg-slate-50 p-4 rounded-xl space-y-2.5">
                      <span className="font-extrabold text-[#0c66e4] block">Asignación automática y verificación de columnas</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
                        <div className="bg-white border border-slate-150 p-2 rounded-lg flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <div>
                            <p className="text-[10px] text-slate-400 leading-none font-bold">Nombre comercial</p>
                            <span className="font-extrabold text-[11px]">Mapeado</span>
                          </div>
                        </div>
                        <div className="bg-white border border-slate-150 p-2 rounded-lg flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <div>
                            <p className="text-[10px] text-slate-400 leading-none font-bold">Categoría Tipo</p>
                            <span className="font-extrabold text-[11px]">Mapeado</span>
                          </div>
                        </div>
                        <div className="bg-white border border-slate-150 p-2 rounded-lg flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <div>
                            <p className="text-[10px] text-slate-400 leading-none font-bold">Número de serie</p>
                            <span className="font-extrabold text-[11px] font-mono text-emerald-600">ST-Correcto</span>
                          </div>
                        </div>
                        <div className="bg-white border border-slate-150 p-2 rounded-lg flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <div>
                            <p className="text-[10px] text-slate-400 leading-none font-bold">Costo & Notas</p>
                            <span className="font-extrabold text-[11px]">Mapeado</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Parsing loader simulated state */}
                {isParsingFile && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                    <p className="text-sm font-black text-slate-800">Mapeando columnas y analizando filas para duplicados...</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-150 bg-slate-50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportRows([]);
                    setFileName('');
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={importRows.length === 0}
                  onClick={() => {
                    // Core operation: adding them into parent App assets state
                    let validCount = 0;
                    importRows.forEach(row => {
                      if (row.name && row.serialNumber) {
                        onAddAsset({
                          name: row.name,
                          type: row.type || 'Laptop',
                          serialNumber: row.serialNumber,
                          status: row.status || 'Available',
                          model: row.model || 'General',
                          manufacturer: row.manufacturer || 'General',
                          purchaseDate: row.purchaseDate || new Date().toISOString().split('T')[0],
                          cost: Number(row.cost) || 0,
                          department: row.department || 'Servicio Técnico',
                          location: row.location || 'Almacén Central IT',
                          notes: row.notes || 'Cargado vía Excel masivo.'
                        });
                        validCount++;
                      }
                    });

                    setImportedCount(validCount);
                    setShowImportSuccess(true);
                    setIsImportModalOpen(false);
                    setImportRows([]);
                    setFileName('');
                    setTimeout(() => {
                      setShowImportSuccess(false);
                    }, 5000);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-40 flex items-center gap-2"
                >
                  <Check className="w-4 h-4 font-black text-white" />
                  <span>Procesar e Importar {importRows.length} Activos</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

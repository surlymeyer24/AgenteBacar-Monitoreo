import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  RotateCcw, 
  Search, 
  Filter, 
  Layers, 
  Download, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Laptop, 
  Cpu, 
  HardDrive, 
  Key, 
  Calendar, 
  Grid, 
  List, 
  Globe, 
  Monitor, 
  Terminal, 
  FileCode, 
  Sparkles, 
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  Radio,
  ArrowUpDown,
  Tag,
  Shield
} from 'lucide-react';
import { AgentComputer } from '../types';

interface ComputadoraSoftwareSectionProps {
  computer: AgentComputer;
  onUpdateComputer?: (updated: AgentComputer) => void;
  isReadOnly?: boolean;
}

const DEFAULT_PROGRAMS = [
  { id: 'adobe-acrobat-64-bit-828e17db', nombre: 'Adobe Acrobat (64-bit)', version: '26.001.21563', editor: 'Adobe', arquitectura: 'x64', fecha_instalacion: '2026-05-17' },
  { id: 'anydesk-77783093', nombre: 'AnyDesk Remote Desk', version: 'ad 9.0.10', editor: 'AnyDesk Software GmbH', arquitectura: 'x86', fecha_instalacion: '2026-04-12' },
  { id: 'argente-registry-cleaner-3-1-0-6-5a086179', nombre: 'Argente - Registry Cleaner 3.1.0.6', version: '3.1.0.6', editor: 'Argente Software', arquitectura: 'x86', fecha_instalacion: '2026-05-20' },
  { id: 'biostar-1-93-ecefc0b1', nombre: 'BioStar 1.93 Biometric Access', version: '1.93.171122', editor: 'Suprema Inc.', arquitectura: 'x64', fecha_instalacion: '2026-05-02' },
  { id: 'comprobacin-de-estado-de-pc-windows-133bc7b6', nombre: 'Comprobación de estado de PC Windows', version: '3.6.2204.08001', editor: 'Microsoft Corporation', arquitectura: 'x64', fecha_instalacion: '2026-05-11' },
  { id: 'copilot-bb9ba583', nombre: 'Microsoft Copilot AI Assistant', version: '148.0.3967.70', editor: 'Microsoft Corporation', arquitectura: 'x64', fecha_instalacion: '2026-05-15' },
  { id: 'crystaldiskinfo-8-3-2-ca8b86b9', nombre: 'CrystalDiskInfo Diagnostic Tool', version: '8.3.2', editor: 'Crystal Dew World', arquitectura: 'x86', fecha_instalacion: '2026-04-20' },
  { id: 'google-chrome-76868ae8', nombre: 'Google Chrome Enterprise', version: '148.0.7778.217', editor: 'Google LLC', arquitectura: 'x64', fecha_instalacion: '2026-03-24' },
  { id: 'google-drive-e0daf398', nombre: 'Google Drive Desktop Client', version: '126.0.5.0', editor: 'Google LLC', arquitectura: 'x64', fecha_instalacion: '2026-03-25' },
  { id: 'intel-r-chipset-device-software-cc3f27fa', nombre: 'Intel(R) Chipset Device Software Drivers', version: '10.1.19199.8340', editor: 'Intel(R) Corporation', arquitectura: 'x64', fecha_instalacion: '2026-01-10' }
];

export const ComputadoraSoftwareSection: React.FC<ComputadoraSoftwareSectionProps> = ({
  computer,
  onUpdateComputer,
  isReadOnly = false
}) => {
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('all');
  const [selectedArchFilter, setSelectedArchFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc' | 'date-desc' | 'date-asc' | 'vendor'>('name-asc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddSoftwareModal, setShowAddSoftwareModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for adding software manually
  const [newProgName, setNewProgName] = useState('');
  const [newProgVersion, setNewProgVersion] = useState('');
  const [newProgEditor, setNewProgEditor] = useState('');
  const [newProgArch, setNewProgArch] = useState<'x64' | 'x86' | 'ARM64'>('x64');
  const [newProgDate, setNewProgDate] = useState(new Date().toISOString().split('T')[0]);

  const rawProgramsList = computer.programas_instalados && computer.programas_instalados.length > 0 
    ? computer.programas_instalados 
    : DEFAULT_PROGRAMS;

  // Show temporary toast message
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    triggerToast(`Copiado al portapapeles: ${label}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export inventory as CSV
  const handleExportCSV = () => {
    const headers = ['ID Registro', 'Nombre de Software', 'Versión', 'Editor / Proveedor', 'Arquitectura', 'Fecha Instalación'];
    const rows = rawProgramsList.map(p => [
      `"${p.id}"`,
      `"${p.nombre}"`,
      `"${p.version}"`,
      `"${p.editor}"`,
      `"${p.arquitectura}"`,
      `"${p.fecha_instalacion}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Software_Inventario_${computer.hostname}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Inventario exportado como archivo CSV');
  };

  // Add new software program
  const handleAddSoftwareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgName.trim() || !onUpdateComputer) return;

    const newId = `${newProgName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 9)}`;
    const newEntry = {
      id: newId,
      nombre: newProgName.trim(),
      version: newProgVersion.trim() || '1.0.0',
      editor: newProgEditor.trim() || 'Desarrollo Interno / Terceros',
      arquitectura: newProgArch,
      fecha_instalacion: newProgDate || new Date().toISOString().split('T')[0]
    };

    const updatedComputer: AgentComputer = {
      ...computer,
      programas_instalados: [...rawProgramsList, newEntry]
    };

    onUpdateComputer(updatedComputer);
    triggerToast(`Software registrado: ${newEntry.nombre}`);

    // Reset form
    setNewProgName('');
    setNewProgVersion('');
    setNewProgEditor('');
    setShowAddSoftwareModal(false);
  };

  // Delete/Uninstall software entry
  const handleDeleteSoftware = (idToDelete: string, name: string) => {
    if (!onUpdateComputer) return;
    if (!confirm(`¿Deseas desvincular o eliminar del registro de auditoría el software "${name}"?`)) return;

    const filtered = rawProgramsList.filter(p => p.id !== idToDelete);
    const updatedComputer: AgentComputer = {
      ...computer,
      programas_instalados: filtered
    };

    onUpdateComputer(updatedComputer);
    triggerToast(`Software eliminado del registro: ${name}`);
  };

  // Categorize vendors & identify remote access tools
  const isRemoteAccessTool = (nombre: string, editor: string) => {
    const text = (nombre + ' ' + editor).toLowerCase();
    return text.includes('anydesk') || text.includes('teamviewer') || text.includes('rustdesk') || text.includes('ultraviewer') || text.includes('vnc') || text.includes('rdp') || text.includes('logmein') || text.includes('nomachine');
  };

  // Helper for vendor branding icon
  const getAppVendorIcon = (nombre: string, editor: string) => {
    const text = (nombre + ' ' + editor).toLowerCase();
    if (text.includes('chrome') || text.includes('google')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center font-black text-xs shrink-0">
          G
        </div>
      );
    }
    if (text.includes('microsoft') || text.includes('windows') || text.includes('copilot') || text.includes('office')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">
          MS
        </div>
      );
    }
    if (text.includes('adobe') || text.includes('acrobat') || text.includes('pdf')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-black text-xs shrink-0">
          AD
        </div>
      );
    }
    if (isRemoteAccessTool(nombre, editor)) {
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-black text-xs shrink-0">
          <Radio className="w-4 h-4" />
        </div>
      );
    }
    if (text.includes('intel') || text.includes('chipset') || text.includes('driver')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
          <Cpu className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-black text-xs shrink-0">
        <FileCode className="w-4 h-4" />
      </div>
    );
  };

  // Filter and sort programs
  const filteredAndSortedPrograms = useMemo(() => {
    return rawProgramsList
      .filter(prog => {
        // Search term match
        const matchesSearch = 
          searchTerm === '' ||
          prog.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prog.editor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prog.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prog.id.toLowerCase().includes(searchTerm.toLowerCase());

        // Vendor filter
        let matchesVendor = true;
        if (selectedVendorFilter === 'microsoft') {
          matchesVendor = prog.editor.toLowerCase().includes('microsoft') || prog.nombre.toLowerCase().includes('windows');
        } else if (selectedVendorFilter === 'google') {
          matchesVendor = prog.editor.toLowerCase().includes('google');
        } else if (selectedVendorFilter === 'adobe') {
          matchesVendor = prog.editor.toLowerCase().includes('adobe');
        } else if (selectedVendorFilter === 'remote') {
          matchesVendor = isRemoteAccessTool(prog.nombre, prog.editor);
        } else if (selectedVendorFilter === 'intel') {
          matchesVendor = prog.editor.toLowerCase().includes('intel') || prog.nombre.toLowerCase().includes('driver');
        } else if (selectedVendorFilter === 'other') {
          matchesVendor = 
            !prog.editor.toLowerCase().includes('microsoft') && 
            !prog.editor.toLowerCase().includes('google') && 
            !prog.editor.toLowerCase().includes('adobe') && 
            !prog.editor.toLowerCase().includes('intel') &&
            !isRemoteAccessTool(prog.nombre, prog.editor);
        }

        // Architecture filter
        let matchesArch = true;
        if (selectedArchFilter === 'x64') matchesArch = prog.arquitectura.toLowerCase().includes('64');
        if (selectedArchFilter === 'x86') matchesArch = prog.arquitectura.toLowerCase().includes('86') || prog.arquitectura.toLowerCase().includes('32');

        return matchesSearch && matchesVendor && matchesArch;
      })
      .sort((a, b) => {
        if (sortOrder === 'name-asc') return a.nombre.localeCompare(b.nombre);
        if (sortOrder === 'name-desc') return b.nombre.localeCompare(a.nombre);
        if (sortOrder === 'date-desc') return (b.fecha_instalacion || '').localeCompare(a.fecha_instalacion || '');
        if (sortOrder === 'date-asc') return (a.fecha_instalacion || '').localeCompare(b.fecha_instalacion || '');
        if (sortOrder === 'vendor') return a.editor.localeCompare(b.editor);
        return 0;
      });
  }, [rawProgramsList, searchTerm, selectedVendorFilter, selectedArchFilter, sortOrder]);

  // Metric stats
  const totalCount = rawProgramsList.length;
  const x64Count = rawProgramsList.filter(p => p.arquitectura.includes('64')).length;
  const x86Count = rawProgramsList.filter(p => p.arquitectura.includes('86') || p.arquitectura.includes('32')).length;
  const remoteToolsCount = rawProgramsList.filter(p => isRemoteAccessTool(p.nombre, p.editor)).length;

  return (
    <div className="space-y-6">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP OVERVIEW & METRICS KPI BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest font-mono">
                SUITE DE SOFTWARE & SEGURIDAD DE ENDPOINT
              </h3>
              <p className="text-[11px] text-slate-500">
                Auditoría de ejecutables, paquetería de registro WMI y compliance operativo de {computer.hostname}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              title="Descargar lista completa en CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>

            {!isReadOnly && onUpdateComputer && (
              <button
                onClick={() => setShowAddSoftwareModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar Software
              </button>
            )}
          </div>
        </div>

        {/* 4 KPI summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Software Total</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">{totalCount}</span>
              <span className="text-[10px] font-bold text-slate-400">paquetes</span>
            </div>
            <span className="text-[10px] text-slate-500 block">Detectados en registro</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Arquitectura 64-Bit</span>
              <Cpu className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-indigo-900">{x64Count}</span>
              <span className="text-[10px] font-bold text-indigo-600">({Math.round((x64Count / (totalCount || 1)) * 100)}%)</span>
            </div>
            <span className="text-[10px] text-slate-500 block">Nativo x64 moderno</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Legacy 32-Bit</span>
              <FileCode className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-800">{x86Count}</span>
              <span className="text-[10px] font-bold text-slate-500">paquetes</span>
            </div>
            <span className="text-[10px] text-slate-500 block">Compatibilidad x86</span>
          </div>

          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 font-mono">Control Remoto</span>
              <Radio className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-amber-900">{remoteToolsCount}</span>
              <span className="text-[10px] font-bold text-amber-700">activos</span>
            </div>
            <span className="text-[10px] text-amber-700 block font-medium">AnyDesk / Soporte IT</span>
          </div>
        </div>
      </div>

      {/* 2. SISTEMA OPERATIVO & PARCHES DE SEGURIDAD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* OS Details Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-3.5 lg:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono">
                SISTEMA OPERATIVO & COMPILACIÓN
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 font-mono">
              64-BIT WORKSTATION
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block font-mono">Sistema Operativo</span>
              <span className="font-bold text-slate-900 text-xs block">{computer.sistema_operativo}</span>
            </div>

            <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block font-mono">Edición</span>
              <span className="font-bold text-slate-900 text-xs block">
                {computer.os_detalles?.edicion || 'Windows 10 Pro'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block font-mono">Versión</span>
              <span className="font-bold text-slate-900 text-xs block">
                {computer.os_detalles?.version_mostrada || '22H2'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block font-mono">Build OS</span>
              <span className="font-mono font-bold text-slate-900 text-xs block">
                {computer.os_detalles?.build || '19045'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block font-mono">Revisión UBR</span>
              <span className="font-mono font-bold text-slate-900 text-xs block">
                {computer.os_detalles?.ubr || '3448'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block font-mono">AnyDesk Asociado</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-700 text-xs truncate">
                  {computer.anydesk_id || 'No asignado'}
                </span>
                {computer.anydesk_id && (
                  <button 
                    onClick={() => copyToClipboard(computer.anydesk_id, 'AnyDesk ID')}
                    className="text-slate-400 hover:text-slate-700 p-0.5"
                    title="Copiar ID AnyDesk"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-100/60 p-2 rounded-lg flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="truncate">Build Lab: {computer.os_detalles?.build_lab || '19041.1.amd64fre.vb_release.191206-1406'}</span>
            <button
              onClick={() => copyToClipboard(computer.os_detalles?.build_lab || '19041.1.amd64fre.vb_release.191206-1406', 'Build Lab')}
              className="text-slate-400 hover:text-slate-800 p-0.5 shrink-0 ml-2"
              title="Copiar Build Lab"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Antivirus & Parches Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono">
                  SEGURIDAD & PARCHES
                </h4>
              </div>
            </div>

            {/* Antivirus info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">Antivirus Endpoint:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  PROTEGIDO
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-900">
                {computer.software_critico?.antivirus?.[0]?.nombre || 'Windows Defender Antivirus'}
              </p>
              <p className="text-[10px] text-slate-400">
                Firmas al día: {computer.software_critico?.antivirus?.[0]?.ultima_act_firmas || '2026-05-18 (Actualizado)'}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">Windows Update:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  (computer.windows_updates?.criticos_pendientes || 0) > 0 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' 
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {computer.windows_updates?.criticos_pendientes ? `${computer.windows_updates.criticos_pendientes} Críticos` : 'Sin alertas'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Total paquetes pendientes: <strong className="text-slate-800">{computer.windows_updates?.total_pendientes || 0}</strong>
              </p>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[10px] text-slate-400 font-mono block">
              Último escaneo de compliance: {computer.ultima_sincronizacion || 'Hoy'}
            </span>
          </div>
        </div>

      </div>

      {/* 3. CATÁLOGO DE SOFTWARE INSTALADO (MAIN SECTION) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4">
        
        {/* Header & Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              PROGRAMAS Y APLICACIONES INSTALADAS ({filteredAndSortedPrograms.length} de {totalCount})
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Registro completo de paquetería detectada en el registro de Windows y software asignado
            </p>
          </div>

          {/* View toggle (table vs cards) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista de Tabla Detallada"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Tabla</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'cards' ? 'bg-white text-blue-600 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista de Cuadrícula / Tarjetas"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Tarjetas</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="space-y-3 pt-1">
          {/* Top Search & Selectors row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, versión, editor, ID de registro..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Architecture Selector */}
            <div className="sm:col-span-3">
              <select
                value={selectedArchFilter}
                onChange={(e) => setSelectedArchFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Todas las arquitecturas</option>
                <option value="x64">64-Bit (x64 nativo)</option>
                <option value="x86">32-Bit (x86 legacy)</option>
              </select>
            </div>

            {/* Sort Order Selector */}
            <div className="sm:col-span-3">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 cursor-pointer"
              >
                <option value="name-asc">Nombre (A → Z)</option>
                <option value="name-desc">Nombre (Z → A)</option>
                <option value="date-desc">Instalación (Más reciente)</option>
                <option value="date-asc">Instalación (Más antigua)</option>
                <option value="vendor">Editor / Proveedor</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Pills (Editor / Categories) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono shrink-0 mr-1">
              Filtro rápido:
            </span>
            <button
              onClick={() => setSelectedVendorFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                selectedVendorFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-3xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({totalCount})
            </button>
            <button
              onClick={() => setSelectedVendorFilter('microsoft')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                selectedVendorFilter === 'microsoft'
                  ? 'bg-blue-600 text-white shadow-3xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Microsoft
            </button>
            <button
              onClick={() => setSelectedVendorFilter('google')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                selectedVendorFilter === 'google'
                  ? 'bg-blue-600 text-white shadow-3xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Google
            </button>
            <button
              onClick={() => setSelectedVendorFilter('adobe')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                selectedVendorFilter === 'adobe'
                  ? 'bg-blue-600 text-white shadow-3xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Adobe
            </button>
            <button
              onClick={() => setSelectedVendorFilter('remote')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                selectedVendorFilter === 'remote'
                  ? 'bg-amber-600 text-white shadow-3xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Radio className="w-3 h-3" />
              Acceso Remoto ({remoteToolsCount})
            </button>
            <button
              onClick={() => setSelectedVendorFilter('intel')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                selectedVendorFilter === 'intel'
                  ? 'bg-blue-600 text-white shadow-3xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Intel & Drivers
            </button>
            <button
              onClick={() => setSelectedVendorFilter('other')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                selectedVendorFilter === 'other'
                  ? 'bg-blue-600 text-white shadow-3xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Otros / Utilidades
            </button>
          </div>
        </div>

        {/* 4. RENDER SOFTWARE LIST (TABLE OR CARDS) */}
        {filteredAndSortedPrograms.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
            <FileCode className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No se encontraron programas con los filtros seleccionados</p>
            <p className="text-[11px] text-slate-400">Prueba ajustando el término de búsqueda o seleccionando "Todos".</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedVendorFilter('all');
                setSelectedArchFilter('all');
              }}
              className="mt-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-3xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4 font-bold">Aplicación / Software</th>
                  <th className="py-3 px-4 font-bold">Versión</th>
                  <th className="py-3 px-4 font-bold">Editor / Proveedor</th>
                  <th className="py-3 px-4 font-bold text-center">Arquitectura</th>
                  <th className="py-3 px-4 font-bold">Fecha Instalación</th>
                  <th className="py-3 px-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedPrograms.map((prog) => {
                  const isRemote = isRemoteAccessTool(prog.nombre, prog.editor);
                  const isX64 = prog.arquitectura.includes('64');

                  return (
                    <tr key={prog.id} className="hover:bg-slate-50/70 transition-colors text-[11px] leading-snug group">
                      
                      {/* Name & Icon */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {getAppVendorIcon(prog.nombre, prog.editor)}
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">{prog.nombre}</span>
                              {isRemote && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-extrabold uppercase font-mono tracking-tight">
                                  Remoto
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[200px]" title={prog.id}>
                              ID: {prog.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Version */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {prog.version}
                        </span>
                      </td>

                      {/* Editor */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-600 block">{prog.editor}</span>
                      </td>

                      {/* Architecture */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isX64 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {prog.arquitectura}
                        </span>
                      </td>

                      {/* Installation Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{prog.fecha_instalacion || 'Desconocida'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => copyToClipboard(`${prog.nombre} v${prog.version} (${prog.editor})`, prog.nombre)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Copiar detalles del software"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {!isReadOnly && onUpdateComputer && (
                            <button
                              onClick={() => handleDeleteSoftware(prog.id, prog.nombre)}
                              className="p-1 rounded text-slate-300 hover:text-red-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                              title="Eliminar registro de software"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARDS VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAndSortedPrograms.map((prog) => {
              const isRemote = isRemoteAccessTool(prog.nombre, prog.editor);
              const isX64 = prog.arquitectura.includes('64');

              return (
                <div
                  key={prog.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-3xs transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        {getAppVendorIcon(prog.nombre, prog.editor)}
                        <div>
                          <h5 className="font-bold text-xs text-slate-900 leading-snug">{prog.nombre}</h5>
                          <span className="text-[10px] text-slate-500 font-medium block">{prog.editor}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isRemote && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-extrabold uppercase font-mono">
                            Remoto
                          </span>
                        )}
                        {!isReadOnly && onUpdateComputer && (
                          <button
                            onClick={() => handleDeleteSoftware(prog.id, prog.nombre)}
                            className="p-1 text-slate-300 hover:text-red-600 rounded hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Eliminar software"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Versión:</span>
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                        {prog.version}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Arquitectura:</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                        isX64 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {prog.arquitectura}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Instalado:</span>
                      <span className="font-mono text-slate-600 text-[10px]">
                        {prog.fecha_instalacion || 'Desconocida'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info note */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            La lista de software instalado se audita automáticamente mediante inspección de claves de desinstalación de registro de Windows (`HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall`). Los programas registrados manualmente permanecen persistidos para trazabilidad de licencias corporativas.
          </p>
        </div>

      </div>

      {/* MODAL: REGISTRAR SOFTWARE MANUAL */}
      {showAddSoftwareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
            
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm font-mono uppercase">
                  Registrar Software o Licencia
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSoftwareModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSoftwareSubmit} className="p-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px] block uppercase font-mono">
                  Nombre de la Aplicación *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. SAP GUI 7.70, AutoCAD 2026, Postman"
                  value={newProgName}
                  onChange={(e) => setNewProgName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px] block uppercase font-mono">
                    Versión
                  </label>
                  <input
                    type="text"
                    placeholder="ej. 24.1.0"
                    value={newProgVersion}
                    onChange={(e) => setNewProgVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px] block uppercase font-mono">
                    Arquitectura
                  </label>
                  <select
                    value={newProgArch}
                    onChange={(e) => setNewProgArch(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:bg-white focus:border-blue-500 cursor-pointer"
                  >
                    <option value="x64">x64 (64-bit)</option>
                    <option value="x86">x86 (32-bit)</option>
                    <option value="ARM64">ARM64</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px] block uppercase font-mono">
                  Editor / Proveedor
                </label>
                <input
                  type="text"
                  placeholder="ej. SAP SE, Autodesk, Microsoft Corporation"
                  value={newProgEditor}
                  onChange={(e) => setNewProgEditor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px] block uppercase font-mono">
                  Fecha de Asignación / Instalación
                </label>
                <input
                  type="date"
                  value={newProgDate}
                  onChange={(e) => setNewProgDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSoftwareModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-3xs"
                >
                  Guardar Software
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

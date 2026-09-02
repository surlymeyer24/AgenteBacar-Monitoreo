import { useMemo, useState } from 'react';
import {
  ShieldCheck,
  Search,
  Layers,
  Download,
  Copy,
  Calendar,
  Grid,
  List,
  Cpu,
  FileCode,
  Sparkles,
  Info,
  CheckCircle2,
  X,
  Radio,
  Shield,
  Laptop,
} from 'lucide-react';

const WIN_VER_KEYS_ORDER = ['edicion', 'display_version', 'build', 'ubr', 'build_lab'];

function valorWin(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function winField(winVer, ...keys) {
  if (!winVer || typeof winVer !== 'object') return null;
  for (const k of keys) {
    const v = valorWin(winVer[k]);
    if (v) return v;
  }
  return null;
}

function normalizePrograma(p, i) {
  const nombre = String(p?.nombre ?? p?.name ?? '').trim() || '—';
  const editor = String(p?.editor ?? p?.fabricante ?? p?.publisher ?? '').trim();
  const arquitectura = String(p?.arquitectura ?? p?.architecture ?? '').trim();
  return {
    id: String(p?.documentoId ?? p?.id ?? `prog-${i}`),
    nombre,
    version: String(p?.version ?? '').trim() || '—',
    editor: editor || '—',
    arquitectura: arquitectura || '—',
    fechaInstalacion: String(p?.fecha_instalacion ?? p?.fechaInstalacion ?? '').trim(),
    ruta: String(p?.ruta ?? p?.ruta_instalacion ?? p?.install_location ?? '').trim(),
  };
}

function isRemoteAccessTool(nombre, editor) {
  const text = `${nombre} ${editor}`.toLowerCase();
  return (
    text.includes('anydesk') ||
    text.includes('teamviewer') ||
    text.includes('rustdesk') ||
    text.includes('ultraviewer') ||
    text.includes('vnc') ||
    text.includes('rdp') ||
    text.includes('logmein') ||
    text.includes('nomachine')
  );
}

function isX64Arch(arquitectura) {
  const a = String(arquitectura ?? '').toLowerCase();
  return a.includes('64') && !a.includes('32');
}

function isX86Arch(arquitectura) {
  const a = String(arquitectura ?? '').toLowerCase();
  return a.includes('86') || a.includes('32');
}

function csvCell(v) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

function getAppVendorIcon(nombre, editor) {
  const text = `${nombre} ${editor}`.toLowerCase();
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
}

export default function ComputadoraSoftwareSection({ computadora }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('all');
  const [selectedArchFilter, setSelectedArchFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [viewMode, setViewMode] = useState('table');
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const programs = useMemo(
    () => (Array.isArray(computadora.programas) ? computadora.programas : []).map(normalizePrograma),
    [computadora.programas],
  );

  const winVer = computadora.windowsVersionDetallada;
  const anydeskId = computadora.anydeskId ?? computadora.anydesk_id;
  const antivirus = computadora.softwareCritico?.antivirus?.[0] ?? computadora.software_critico?.antivirus?.[0];
  const winUpdates = computadora.windowsUpdates ?? computadora.windows_updates;
  const criticosPendientes = Number(winUpdates?.criticosPendientes ?? winUpdates?.criticos_pendientes ?? 0) || 0;
  const totalPendientes = Number(winUpdates?.totalPendientes ?? winUpdates?.total_pendientes ?? 0) || 0;

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    triggerToast(`Copiado al portapapeles: ${label}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = ['ID Registro', 'Nombre de Software', 'Versión', 'Editor / Proveedor', 'Arquitectura', 'Fecha Instalación', 'Ruta'];
    const rows = programs.map(p => [
      csvCell(p.id),
      csvCell(p.nombre),
      csvCell(p.version),
      csvCell(p.editor),
      csvCell(p.arquitectura),
      csvCell(p.fechaInstalacion),
      csvCell(p.ruta),
    ].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Software_Inventario_${computadora.hostname}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('Inventario exportado como archivo CSV');
  };

  const filteredAndSortedPrograms = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return programs
      .filter(prog => {
        const matchesSearch =
          term === '' ||
          prog.nombre.toLowerCase().includes(term) ||
          prog.editor.toLowerCase().includes(term) ||
          prog.version.toLowerCase().includes(term) ||
          prog.id.toLowerCase().includes(term) ||
          prog.ruta.toLowerCase().includes(term);

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

        let matchesArch = true;
        if (selectedArchFilter === 'x64') matchesArch = isX64Arch(prog.arquitectura);
        if (selectedArchFilter === 'x86') matchesArch = isX86Arch(prog.arquitectura);

        return matchesSearch && matchesVendor && matchesArch;
      })
      .sort((a, b) => {
        if (sortOrder === 'name-asc') return a.nombre.localeCompare(b.nombre);
        if (sortOrder === 'name-desc') return b.nombre.localeCompare(a.nombre);
        if (sortOrder === 'date-desc') return (b.fechaInstalacion || '').localeCompare(a.fechaInstalacion || '');
        if (sortOrder === 'date-asc') return (a.fechaInstalacion || '').localeCompare(b.fechaInstalacion || '');
        if (sortOrder === 'vendor') return a.editor.localeCompare(b.editor);
        return 0;
      });
  }, [programs, searchTerm, selectedVendorFilter, selectedArchFilter, sortOrder]);

  const totalCount = programs.length;
  const x64Count = programs.filter(p => isX64Arch(p.arquitectura)).length;
  const x86Count = programs.filter(p => isX86Arch(p.arquitectura)).length;
  const remoteToolsCount = programs.filter(p => isRemoteAccessTool(p.nombre, p.editor)).length;

  const edicion = winField(winVer, 'edicion');
  const versionMostrada = winField(winVer, 'display_version', 'version_mostrada');
  const buildOs = winField(winVer, 'build');
  const ubr = winField(winVer, 'ubr');
  const buildLab = winField(winVer, 'build_lab');
  const extraWinKeys = winVer && typeof winVer === 'object'
    ? Object.keys(winVer).filter(k => !WIN_VER_KEYS_ORDER.includes(k)).sort()
    : [];

  const pill = (id, extraActive = 'bg-blue-600 text-white shadow-sm') =>
    `px-2.5 py-1 rounded-lg text-sm font-bold transition-all shrink-0 cursor-pointer ${
      selectedVendorFilter === id
        ? extraActive
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`;

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[60] bg-slate-900 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest font-mono">
                Suite de software & seguridad de endpoint
              </h3>
              <p className="text-sm text-slate-500">
                Auditoría de ejecutables y paquetería de registro de {computadora.hostname}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={totalCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Descargar lista completa en CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono">Software total</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">{totalCount}</span>
              <span className="text-xs font-bold text-slate-400">paquetes</span>
            </div>
            <span className="text-xs text-slate-500 block">Detectados en registro</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono">Arquitectura 64-bit</span>
              <Cpu className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-indigo-900">{x64Count}</span>
              <span className="text-xs font-bold text-indigo-600">({Math.round((x64Count / (totalCount || 1)) * 100)}%)</span>
            </div>
            <span className="text-xs text-slate-500 block">Nativo x64</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono">Legacy 32-bit</span>
              <FileCode className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-800">{x86Count}</span>
              <span className="text-xs font-bold text-slate-500">paquetes</span>
            </div>
            <span className="text-xs text-slate-500 block">Compatibilidad x86</span>
          </div>

          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 font-mono">Control remoto</span>
              <Radio className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-amber-900">{remoteToolsCount}</span>
              <span className="text-xs font-bold text-amber-700">activos</span>
            </div>
            <span className="text-xs text-amber-700 block font-medium">AnyDesk / Soporte IT</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5 lg:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest font-mono">
                Sistema operativo & compilación
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 font-mono">
              {computadora.arquitectura || '—'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-0.5">
              <span className="text-xs text-slate-400 font-bold uppercase block font-mono">Sistema operativo</span>
              <span className="font-bold text-slate-900 text-sm block">{computadora.sistemaOperativo || '—'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-0.5">
              <span className="text-xs text-slate-400 font-bold uppercase block font-mono">Edición</span>
              <span className="font-bold text-slate-900 text-sm block">{edicion || '—'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-0.5">
              <span className="text-xs text-slate-400 font-bold uppercase block font-mono">Versión</span>
              <span className="font-bold text-slate-900 text-sm block">{versionMostrada || '—'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-0.5">
              <span className="text-xs text-slate-400 font-bold uppercase block font-mono">Build OS</span>
              <span className="font-mono font-bold text-slate-900 text-sm block">{buildOs || '—'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-0.5">
              <span className="text-xs text-slate-400 font-bold uppercase block font-mono">Revisión UBR</span>
              <span className="font-mono font-bold text-slate-900 text-sm block">{ubr || '—'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-0.5">
              <span className="text-xs text-slate-400 font-bold uppercase block font-mono">AnyDesk asociado</span>
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono font-bold text-blue-700 text-sm truncate">
                  {anydeskId || 'No asignado'}
                </span>
                {anydeskId && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(anydeskId, 'AnyDesk ID')}
                    className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                    title="Copiar ID AnyDesk"
                  >
                    {copiedId === 'AnyDesk ID' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
            {extraWinKeys.map(k => (
              <div key={k} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-0.5">
                <span className="text-xs text-slate-400 font-bold uppercase block font-mono">{k}</span>
                <span className="font-bold text-slate-900 text-sm block truncate" title={winField(winVer, k)}>{winField(winVer, k) || '—'}</span>
              </div>
            ))}
          </div>

          {buildLab && (
            <div className="bg-slate-100/60 p-2 rounded-lg flex items-center justify-between text-xs text-slate-500 font-mono">
              <span className="truncate">Build Lab: {buildLab}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(buildLab, 'Build Lab')}
                className="text-slate-400 hover:text-slate-800 p-0.5 shrink-0 ml-2 cursor-pointer"
                title="Copiar Build Lab"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest font-mono">
                  Seguridad & parches
                </h4>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Antivirus endpoint:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold border flex items-center gap-1 ${
                  antivirus
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {antivirus ? <><CheckCircle2 className="w-3 h-3" /> Protegido</> : 'Sin datos'}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {antivirus?.nombre || 'El agente no reportó antivirus en este detalle'}
              </p>
              {antivirus?.ultima_act_firmas || antivirus?.ultimaActFirmas ? (
                <p className="text-xs text-slate-400">
                  Firmas: {antivirus.ultima_act_firmas ?? antivirus.ultimaActFirmas}
                </p>
              ) : null}
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Windows Update:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  criticosPendientes > 0
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {winUpdates == null
                    ? 'Sin datos'
                    : criticosPendientes > 0
                      ? `${criticosPendientes} críticos`
                      : 'Sin alertas'}
                </span>
              </div>
              {winUpdates != null && (
                <p className="text-xs text-slate-500">
                  Total paquetes pendientes: <strong className="text-slate-800">{totalPendientes}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs text-slate-400 font-mono block">
              Última sincronización: {computadora.ultimaSincronizacion
                ? new Date(computadora.ultimaSincronizacion).toLocaleString('es-AR')
                : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Programas y aplicaciones instaladas ({filteredAndSortedPrograms.length} de {totalCount})
            </h4>
            <p className="text-sm text-slate-500 mt-0.5">
              Registro de paquetería detectada en Windows y software asignado
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-sm font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista de tabla"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabla</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-sm font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista de tarjetas"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tarjetas</span>
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, versión, editor, ID de registro..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedArchFilter}
                onChange={(e) => setSelectedArchFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Todas las arquitecturas</option>
                <option value="x64">64-Bit (x64 nativo)</option>
                <option value="x86">32-Bit (x86 legacy)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 cursor-pointer"
              >
                <option value="name-asc">Nombre (A → Z)</option>
                <option value="name-desc">Nombre (Z → A)</option>
                <option value="date-desc">Instalación (más reciente)</option>
                <option value="date-asc">Instalación (más antigua)</option>
                <option value="vendor">Editor / Proveedor</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono shrink-0 mr-1">
              Filtro rápido:
            </span>
            <button type="button" onClick={() => setSelectedVendorFilter('all')} className={pill('all')}>
              Todos ({totalCount})
            </button>
            <button type="button" onClick={() => setSelectedVendorFilter('microsoft')} className={pill('microsoft')}>
              Microsoft
            </button>
            <button type="button" onClick={() => setSelectedVendorFilter('google')} className={pill('google')}>
              Google
            </button>
            <button type="button" onClick={() => setSelectedVendorFilter('adobe')} className={pill('adobe')}>
              Adobe
            </button>
            <button
              type="button"
              onClick={() => setSelectedVendorFilter('remote')}
              className={`px-2.5 py-1 rounded-lg text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                selectedVendorFilter === 'remote'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Radio className="w-3 h-3" />
              Acceso remoto ({remoteToolsCount})
            </button>
            <button type="button" onClick={() => setSelectedVendorFilter('intel')} className={pill('intel')}>
              Intel & Drivers
            </button>
            <button type="button" onClick={() => setSelectedVendorFilter('other')} className={pill('other')}>
              Otros / Utilidades
            </button>
          </div>
        </div>

        {filteredAndSortedPrograms.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
            <FileCode className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              {totalCount === 0
                ? 'No hay programas registrados para esta estación'
                : 'No se encontraron programas con los filtros seleccionados'}
            </p>
            <p className="text-sm text-slate-400">
              {totalCount === 0
                ? 'Cuando el agente reporte el inventario de software, aparecerá aquí.'
                : 'Probá ajustando el término de búsqueda o seleccionando «Todos».'}
            </p>
            {totalCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedVendorFilter('all');
                  setSelectedArchFilter('all');
                }}
                className="mt-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-bold transition-colors cursor-pointer"
              >
                Restablecer filtros
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4 font-bold">Aplicación / Software</th>
                  <th className="py-3 px-4 font-bold">Versión</th>
                  <th className="py-3 px-4 font-bold">Editor / Proveedor</th>
                  <th className="py-3 px-4 font-bold text-center">Arquitectura</th>
                  <th className="py-3 px-4 font-bold">Fecha instalación</th>
                  <th className="py-3 px-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedPrograms.map((prog) => {
                  const isRemote = isRemoteAccessTool(prog.nombre, prog.editor);
                  const x64 = isX64Arch(prog.arquitectura);
                  return (
                    <tr key={prog.id} className="hover:bg-slate-50/70 transition-colors leading-snug">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {getAppVendorIcon(prog.nombre, prog.editor)}
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm">{prog.nombre}</span>
                              {isRemote && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-extrabold uppercase font-mono tracking-tight">
                                  Remoto
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-xs text-slate-400 block truncate max-w-[220px]" title={prog.id}>
                              ID: {prog.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
                          {prog.version}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-600 block">{prog.editor}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          x64
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {prog.arquitectura}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-500 font-mono text-xs">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{prog.fechaInstalacion || 'Desconocida'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`${prog.nombre} v${prog.version} (${prog.editor})`, prog.nombre)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Copiar detalles del software"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAndSortedPrograms.map((prog) => {
              const isRemote = isRemoteAccessTool(prog.nombre, prog.editor);
              const x64 = isX64Arch(prog.arquitectura);
              return (
                <div
                  key={prog.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {getAppVendorIcon(prog.nombre, prog.editor)}
                      <div className="min-w-0">
                        <h5 className="font-bold text-sm text-slate-900 leading-snug">{prog.nombre}</h5>
                        <span className="text-xs text-slate-500 font-medium block">{prog.editor}</span>
                      </div>
                    </div>
                    {isRemote && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-extrabold uppercase font-mono shrink-0">
                        Remoto
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase font-mono">Versión:</span>
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                        {prog.version}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase font-mono">Arquitectura:</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold ${
                        x64 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {prog.arquitectura}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase font-mono">Instalado:</span>
                      <span className="font-mono text-slate-600 text-xs">
                        {prog.fechaInstalacion || 'Desconocida'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-sm text-slate-600">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed">
            La lista de software se audita automáticamente mediante las claves de desinstalación del registro de Windows. Los contadores de arquitectura dependen de que el agente reporte ese campo en cada paquete.
          </p>
        </div>
      </div>
    </div>
  );
}

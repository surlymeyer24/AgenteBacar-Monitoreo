import React, { useState, useRef, useEffect } from 'react';
import { 
  Asset, User, Assignment, Consumable, ActivityLog, AgentComputer, AssetType, AssetStatus 
} from './types';
import { 
  INITIAL_ASSETS, INITIAL_USERS, INITIAL_ASSIGNMENTS, INITIAL_CONSUMABLES, INITIAL_ACTIVITIES, INITIAL_AGENT_COMPUTERS 
} from './mockData';
import Dashboard from './components/Dashboard';
import AssetsList from './components/AssetsList';
import UserProfile from './components/UserProfile';
import ComputadorasList from './components/ComputadorasList';
import HardwareComplementList from './components/HardwareComplementList';
import NetworkInfrastructure from './components/NetworkInfrastructure';
import SistemaConfig from './components/SistemaConfig';
import StockList from './components/StockList';
import TelevisoresList from './components/TelevisoresList';
import CelularesList from './components/CelularesList';
import PerifericosDashboard from './components/PerifericosDashboard';
import InfraDashboard from './components/InfraDashboard';
import ReportsView from './components/ReportsView';
import EtiquetasQrList from './components/EtiquetasQrList';
import EtiquetaQrFicha from './components/EtiquetaQrFicha';
import CatalogosAbm from './components/CatalogosAbm';
import TrazabilidadModule from './components/trazabilidad/TrazabilidadModule';
import { 
  Monitor, Laptop, Smartphone, Cpu, HardDrive, Network, Layers, 
  Terminal, ShieldCheck, Mail, Lock, LogOut, ChevronLeft, ChevronRight, 
  Menu, RefreshCw, Layers2, FileText, CheckCircle, AlertTriangle, ShieldAlert,
  Search, Play, Plus, Trash2, Edit2, Key, Server, Settings, Disc, HelpCircle, X, Users, User as UserIcon,
  Phone, Keyboard, Printer, Camera, Tv, Volume2, Database, Sliders, QrCode, SlidersHorizontal, Usb, Sparkles
} from 'lucide-react';

export default function App() {
  // Session Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState(() => localStorage.getItem('bacarsa_profile_email') || 'desarrollo.it@bacarsa.com.ar');
  const [loginPassword, setLoginPassword] = useState(() => localStorage.getItem('bacarsa_profile_password') || 'admin123');
  const [loginError, setLoginError] = useState('');

  // Profile Settings States (synchronized with cookies/storage)
  const [profileName, setProfileName] = useState(() => localStorage.getItem('bacarsa_profile_name') || 'Daniel Ortega');
  const [profileRole, setProfileRole] = useState(() => localStorage.getItem('bacarsa_profile_role') || 'Administrador de IT');
  const [profilePhone, setProfilePhone] = useState(() => localStorage.getItem('bacarsa_profile_phone') || '+54 351 555-0199');
  const [profileDept, setProfileDept] = useState(() => localStorage.getItem('bacarsa_profile_dept') || 'Tecnología y Comunicaciones');

  // Core Data States
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [consumables, setConsumables] = useState<Consumable[]>(INITIAL_CONSUMABLES);
  const [activities, setActivities] = useState<ActivityLog[]>(INITIAL_ACTIVITIES);
  const [agentComputers, setAgentComputers] = useState<AgentComputer[]>(INITIAL_AGENT_COMPUTERS);

  // Command History / Triggered actions on Agent Computers
  const [triggeredCommands, setTriggeredCommands] = useState<Record<string, { command: string; date: string }>>({
    'SIS5': { command: 'RESETEAR_ID', date: '2026-05-27 14:49:43' }
  });

  // UI States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hardwareExpanded, setHardwareExpanded] = useState(true);
  const [perifericosExpanded, setPerifericosExpanded] = useState(true);
  const [infraestructuraExpanded, setInfraestructuraExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active View
  // Values: 'dashboard' | 'etiquetas-qr' | 'etiqueta_qr_ficha' | 'computadoras' | 'impresoras' | 'monitores' | 'teclados' | 'mouse' | 'webcams' | 'parlantes' | 'microfonos' | 'stock' | 'nvr' | 'camaras' | 'routers' | 'switches' | 'tesoreria_maq' | 'sistema' | 'assignments' | 'users' | 'reportes'
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedQrUuid, setSelectedQrUuid] = useState<string | null>(null);

  // Synchronize browser history and URL routes: /etiquetas-qr, /etiquetas-qr/:uuid, /computadoras, /reportes, etc.
  useEffect(() => {
    const parseLocation = () => {
      const path = window.location.pathname;
      if (path.startsWith('/etiquetas-qr/')) {
        const uuid = decodeURIComponent(path.replace('/etiquetas-qr/', '').trim());
        if (uuid) {
          setSelectedQrUuid(uuid);
          setCurrentView('etiqueta_qr_ficha');
          return;
        }
      }
      if (path === '/etiquetas-qr') {
        setSelectedQrUuid(null);
        setCurrentView('etiquetas-qr');
        return;
      }
      if (path.startsWith('/conciliaciones') || path.startsWith('/trazabilidad')) {
        setCurrentView('conciliaciones');
        return;
      }
      if (path.startsWith('/computadoras')) {
        setCurrentView('computadoras');
        return;
      }
      if (path === '/reportes') {
        setCurrentView('reportes');
        return;
      }
      if (path === '/perfil') {
        setCurrentView('perfil');
        return;
      }
      if (path === '/catalogos' || path === '/abm') {
        setCurrentView('catalogos');
        return;
      }
      if (path === '/sistema') {
        setCurrentView('sistema');
        return;
      }
      if (path === '/stock') {
        setCurrentView('stock');
        return;
      }
      if (path === '/monitores' || path === '/impresoras' || path === '/teclados' || path === '/mouse' || path === '/parlantes' || path === '/microfonos' || path === '/webcams' || path === '/perifericos_dashboard') {
        setCurrentView(path.replace('/', ''));
        return;
      }
      if (path === '/nvr' || path === '/camaras' || path === '/servers' || path === '/routers_switches' || path === '/tesoreria' || path === '/telefonos' || path === '/televisores' || path === '/celulares' || path === '/infra_dashboard') {
        setCurrentView(path.replace('/', ''));
        return;
      }
      if (path === '/dashboard' || path === '/') {
        setCurrentView('dashboard');
        return;
      }
    };

    parseLocation();
    window.addEventListener('popstate', parseLocation);
    return () => window.removeEventListener('popstate', parseLocation);
  }, []);

  const navigateRoute = (view: string, param?: string) => {
    setCurrentView(view);
    setMobileMenuOpen(false);

    let targetPath = '/dashboard';
    if (view === 'etiquetas-qr') {
      targetPath = '/etiquetas-qr';
      setSelectedQrUuid(null);
    } else if (view === 'etiqueta_qr_ficha' && param) {
      targetPath = `/etiquetas-qr/${encodeURIComponent(param)}`;
      setSelectedQrUuid(param);
    } else if (view === 'conciliaciones' || view === 'trazabilidad') {
      targetPath = '/conciliaciones';
    } else if (view === 'computadoras') {
      targetPath = param ? `/computadoras/${encodeURIComponent(param)}` : '/computadoras';
    } else if (view === 'reportes') {
      targetPath = '/reportes';
    } else if (view === 'dashboard') {
      targetPath = '/';
    } else {
      targetPath = `/${view}`;
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  // Agent System inspect drawer state
  const [selectedAgent, setSelectedAgent] = useState<AgentComputer | null>(null);
  const [agentCommandResult, setAgentCommandResult] = useState<string | null>(null);

  // Filter helpers inside System Agentes
  const [systemSearch, setSystemSearch] = useState('');
  const [systemUbicacion, setSystemUbicacion] = useState('All');
  const [systemConexion, setSystemConexion] = useState('All');
  const [systemOrden, setSystemOrden] = useState('Hostname A-Z');

  // Asset registration trigger helper
  const triggerNewAssetForm = useRef<() => void>(null);

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Por favor complete todos los datos.');
      return;
    }
    // Allow standard entry for demo or specialized Bacar emails
    if (loginEmail.includes('@') && loginPassword.length >= 4) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Usuario o contraseña no válida.');
    }
  };

  // Add/Mod handlers for assets
  const handleAddAsset = (newAssetPayload: Omit<Asset, 'id'>) => {
    const newId = `AST-0${assets.length + 1}`;
    const newAsset: Asset = {
      ...newAssetPayload,
      id: newId
    };
    setAssets([newAsset, ...assets]);
    
    // Log activity
    const newLog: ActivityLog = {
      id: `ACT-0${activities.length + 1}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'Create',
      user: `${profileName} (${profileRole})`,
      description: `Creación de Activo [${newId}] (${newAsset.name}) en el Almacén.`,
      details: `Número de serie: ${newAsset.serialNumber}`
    };
    setActivities([newLog, ...activities]);
  };

  const handleUpdateAsset = (updatedAsset: Asset) => {
    setAssets(assets.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    
    // Log activity
    const newLog: ActivityLog = {
      id: `ACT-0${activities.length + 1}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'Status',
      user: `${profileName} (${profileRole})`,
      description: `Actualización de Ficha de Activo [${updatedAsset.id}] (${updatedAsset.name}).`,
      details: `Estado: ${updatedAsset.status}. Ubicación: ${updatedAsset.location}`
    };
    setActivities([newLog, ...activities]);
  };

  const handleDeleteAsset = (id: string) => {
    const assetToDelete = assets.find(a => a.id === id);
    setAssets(assets.filter(a => a.id !== id));
    
    // Log activity
    if (assetToDelete) {
      const newLog: ActivityLog = {
        id: `ACT-0${activities.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: 'Delete',
        user: `${profileName} (${profileRole})`,
        description: `Depuración física / Baja de Activo [${id}] (${assetToDelete.name}) del catálogo.`,
        details: `Causa: Retiro o desecho definitivo.`
      };
      setActivities([newLog, ...activities]);
    }
  };

  // Custody Assignment Handlers
  const handleAssignCustody = (asgPayload: Omit<Assignment, 'id'>) => {
    const newId = `ASG-0${assignments.length + 1}`;
    const newAsg: Assignment = {
      ...asgPayload,
      id: newId
    };
    setAssignments([newAsg, ...assignments]);
    
    // Update asset status to Assigned
    setAssets(assets.map(a => a.id === asgPayload.assetId ? { 
      ...a, 
      status: 'Assigned', 
      assignedToUserId: asgPayload.userId 
    } : a));

    const assetObj = assets.find(a => a.id === asgPayload.assetId);
    const userObj = users.find(u => u.id === asgPayload.userId);

    // Log activity
    const newLog: ActivityLog = {
      id: `ACT-0${activities.length + 1}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'Assign',
      user: `${profileName} (${profileRole})`,
      description: `Custodia Activa: [${assetObj?.id || 'Equipo'}] entregado a ${userObj?.name || 'Usuario'}.`,
      details: `Estado previo verificado: ${asgPayload.conditionOnAssign}`
    };
    setActivities([newLog, ...activities]);
  };

  const handleReturnCustody = (assignmentId: string, conditionOnReturn: string, notes?: string) => {
    const asgToReturn = assignments.find(a => a.id === assignmentId);
    if (!asgToReturn) return;

    setAssignments(assignments.map(a => a.id === assignmentId ? {
      ...a,
      status: 'Completed',
      returnedDate: new Date().toISOString().split('T')[0],
      conditionOnReturn,
      notes: notes || a.notes
    } : a));

    // Release asset status back to Available
    setAssets(assets.map(a => a.id === asgToReturn.assetId ? {
      ...a,
      status: 'Available',
      assignedToUserId: undefined
    } : a));

    const assetObj = assets.find(a => a.id === asgToReturn.assetId);
    const userObj = users.find(u => u.id === asgToReturn.userId);

    // Log activity
    const newLog: ActivityLog = {
      id: `ACT-0${activities.length + 1}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'Return',
      user: `${profileName} (${profileRole})`,
      description: `Custodia Cerrada: Retorno de Activo [${assetObj?.id || 'Equipo'}] por parte de ${userObj?.name || 'Usuario'}.`,
      details: `Verificación en almacén: ${conditionOnReturn}`
    };
    setActivities([newLog, ...activities]);
  };

  // Add/Mod handlers for users
  const handleAddUser = (userPayload: Omit<User, 'id'>) => {
    const newId = `user-${users.length + 1}`;
    setUsers([...users, { ...userPayload, id: newId }]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    // Release assigned assets if user is deleted
    setAssets(assets.map(a => a.assignedToUserId === id ? { ...a, status: 'Available', assignedToUserId: undefined } : a));
  };

  // Trigger agent tasks / commands
  const handleTriggerAgentCommand = (host: string, command: string) => {
    const date = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setTriggeredCommands({
      ...triggeredCommands,
      [host]: { command, date }
    });
    setAgentCommandResult(`Comando "${command}" enviado satisfactoriamente al host "${host}". El Agente responderá en su próximo intervalo de comunicación.`);
    setTimeout(() => {
      setAgentCommandResult(null);
    }, 5000);
  };

  // Stock management increase/decrease
  const handleUpdateConsumableStock = (id: string, amount: number) => {
    setConsumables(consumables.map(c => {
      if (c.id === id) {
        const newStock = Math.max(0, c.stock + amount);
        return { ...c, stock: newStock };
      }
      return c;
    }));

    const targetCons = consumables.find(c => c.id === id);
    if (targetCons) {
      const newLog: ActivityLog = {
        id: `ACT-0${activities.length + 1}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: 'Stock',
        user: `${profileName} (${profileRole})`,
        description: `Actualización de Suministros: [${targetCons.id}] (${targetCons.name}) stock alterado por ${amount}.`,
        details: `Nuevo stock restante: ${Math.max(0, targetCons.stock + amount)} unidades`
      };
      setActivities([newLog, ...activities]);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-page min-h-screen w-full flex flex-col items-center justify-center bg-[#02040a] p-6 md:p-12 relative overflow-hidden select-none">
        {/* Modern grid background pattern */}
        <div className="absolute inset-0 opacity-[0.4] bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />
        
        {/* Soft glowing ambient spotlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md space-y-8">
          
          {/* Logo & Identity */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center p-2.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
              <Disc className="w-5 h-5 text-red-500 animate-spin" style={{ animationDuration: '12s' }} />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black tracking-wider text-white">
                BACAR<span className="text-red-500 font-mono">.</span>it
              </h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide uppercase font-mono">
                Consola de Control Patrimonial
              </p>
            </div>
          </div>

          {/* Clean minimal card */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
            
            {loginError && (
              <div className="p-3 border border-red-500/10 bg-red-950/20 text-red-400 text-[11px] rounded-lg flex items-center gap-2 font-medium font-sans">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-600">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input 
                    type="email" 
                    required
                    placeholder="usuario@bacarsa.com.ar"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none transition-all placeholder:text-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-600">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none transition-all placeholder:text-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="rounded border-slate-900 bg-slate-950 text-red-600 focus:ring-0 focus:ring-offset-0 w-3 h-3" 
                  />
                  <span className="text-[10px] text-slate-500">Sesión persistente</span>
                </label>
                <a href="#recuperar" className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
                  ¿Recuperar clave?
                </a>
              </div>

              <button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] uppercase tracking-widest py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Ingresar a Consola</span>
              </button>
            </form>

            {/* Subtle pre-fills */}
            <div className="border-t border-slate-900 pt-5 space-y-2.5">
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono block text-center">
                Accesos rápidos de simulación
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('desarrollo.it@bacarsa.com.ar');
                    setLoginPassword('admin123');
                  }}
                  className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-900 rounded-lg text-[10px] text-center text-slate-400 hover:text-white transition-all cursor-pointer truncate"
                >
                  <span className="font-bold block text-slate-300">Daniel O.</span>
                  <span className="text-[8px] text-slate-600 font-mono">Sistemas</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('supervisora.admin@bacarsa.com.ar');
                    setLoginPassword('admin123');
                    setProfileName('Marcela Santucho');
                    setProfileRole('Encargada de Administración');
                  }}
                  className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-900 rounded-lg text-[10px] text-center text-slate-400 hover:text-white transition-all cursor-pointer truncate"
                >
                  <span className="font-bold block text-slate-300">Marcela S.</span>
                  <span className="text-[8px] text-slate-600 font-mono">Administración</span>
                </button>
              </div>
            </div>

          </div>

          <p className="text-center text-[10px] text-slate-600 font-mono tracking-wide">
            Control de Acceso Seguro • Bacar IT 2026
          </p>

        </div>
      </div>
    );
  }

  // Filter lists inside specific submenus:
  // e.g. sidebar tabs.
  const handleSidebarClick = (view: string) => {
    navigateRoute(view);
  };

  // Filter computer assets
  const computerAssetsList = assets.filter(a => a.type === 'Laptop' || a.type === 'Server');
  const monitorAssetsList = assets.filter(a => a.type === 'Monitor');
  const networkAssetsList = assets.filter(a => a.type === 'Network');
  
  // Custom Peripheral Filters from general assets catalog
  const keyboardAssetsList = assets.filter(a => a.type === 'Peripheral' && a.name.toLowerCase().includes('teclado'));
  const mouseAssetsList = assets.filter(a => a.type === 'Peripheral' && a.name.toLowerCase().includes('mouse'));
  
  // Custom Filter inside System Computers (telemetry)
  const filteredAgentsList = agentComputers.filter(comp => {
    const matchesSearch = comp.hostname.toLowerCase().includes(systemSearch.toLowerCase()) || 
                          comp.anydesk_id.toLowerCase().includes(systemSearch.toLowerCase()) ||
                          comp.uuid.toLowerCase().includes(systemSearch.toLowerCase()) ||
                          (comp.ubicacion && comp.ubicacion.toLowerCase().includes(systemSearch.toLowerCase()));
    const matchesUbicacion = systemUbicacion === 'All' || comp.ubicacion === systemUbicacion;
    const matchesConexion = systemConexion === 'All' || comp.estado_conexion === systemConexion;
    return matchesSearch && matchesUbicacion && matchesConexion;
  }).sort((a, b) => {
    if (systemOrden === 'Hostname A-Z') {
      return a.hostname.localeCompare(b.hostname);
    } else if (systemOrden === 'Hostname Z-A') {
      return b.hostname.localeCompare(a.hostname);
    } else if (systemOrden === 'CPU más alto') {
      return b.cpu_uso_porcentaje - a.cpu_uso_porcentaje;
    } else {
      return b.ram_uso_porcentaje - a.ram_uso_porcentaje;
    }
  });

  return (
    <div className="app-root">
      {/* Mobile Header Bar */}
      <div className="mobile-header">
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="mobile-header-btn"
          title="Abrir menú"
        >
          <Menu className="w-5 h-5 text-slate-300" />
        </button>
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-red-600 inline-flex">
            <Disc className="w-3.5 h-3.5 text-white animate-spin" style={{ animationDuration: '6s' }} />
          </span>
          <span className="font-extrabold tracking-tight text-white font-sans text-sm leading-none">
            IT-Bacar
          </span>
        </div>
        <button 
          onClick={() => { setIsAuthenticated(false); setCurrentView('dashboard'); }}
          className="mobile-header-btn text-rose-400 hover:text-rose-300 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Backdrop overlay for mobile menu drawer */}
      {mobileMenuOpen && (
        <div 
          className="mobile-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="layout">
        
        {/* SIDEBAR NAVIGATION BLOCK - COLLAPSIBLE & MOBILE DRAWER */}
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''} bg-slate-950 border-r border-slate-900 shadow-2xl flex flex-col h-screen sticky top-0 transition-all duration-300`}>
          
          {/* Sidebar Header */}
          <div className="sidebar-header border-b border-slate-900/80 pb-4 mb-2 flex items-center justify-between px-4 pt-4">
            <span className="logo flex items-center gap-3">
              <span className="logo-icon bg-gradient-to-tr from-red-600 to-rose-500 p-2 rounded-xl shadow-md shadow-red-900/40 shrink-0">
                <Disc className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '8s' }} />
              </span>
              <span className="logo-text font-black tracking-wider text-white font-sans text-base bg-linear-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                BACAR<span className="text-red-500 font-extrabold font-mono">.</span>it
              </span>
            </span>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="sidebar-toggle hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 hover:bg-red-600 border border-slate-800 hover:border-red-500 text-slate-400 hover:text-white transition-all shadow-md cursor-pointer"
              title={sidebarCollapsed ? "Expandir panel" : "Contraer panel"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="sidebar-close lg:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400"
              title="Cerrar menú"
            >
              <X className="w-5 h-5 text-slate-300" />
            </button>
          </div>

          {/* Navigation Items container */}
          <nav className="nav flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            
            {/* Section 1: GENERAL */}
            <div className="nav-section-title text-[10px] font-bold text-slate-500 tracking-widest font-mono uppercase px-3 py-2">
              General
            </div>
            
            {/* Inicio (Dashboard) Link */}
            <button 
              onClick={() => handleSidebarClick('dashboard')}
              className={`nav-link w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                currentView === 'dashboard' 
                  ? 'bg-linear-to-r from-red-950/20 to-transparent text-white font-semibold border-l-2 border-red-500 shadow-xs' 
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
              }`}
            >
              <Layers2 className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'dashboard' ? 'text-red-400 scale-110' : 'text-slate-400'}`} />
              <span className="nav-link-text text-xs tracking-tight">Inicio / Resumen IT</span>
            </button>

            {/* Etiquetas QR Link */}
            <button 
              onClick={() => handleSidebarClick('etiquetas-qr')}
              className={`nav-link w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                currentView === 'etiquetas-qr' || currentView === 'etiqueta_qr_ficha'
                  ? 'bg-linear-to-r from-red-950/20 to-transparent text-white font-semibold border-l-2 border-red-500 shadow-xs' 
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <QrCode className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'etiquetas-qr' || currentView === 'etiqueta_qr_ficha' ? 'text-red-400 scale-110' : 'text-slate-400'}`} />
                <span className="nav-link-text text-xs tracking-tight">Etiquetas QR</span>
              </div>
              {!sidebarCollapsed && (
                <span className="text-[9px] bg-red-950/80 text-red-400 border border-red-900/50 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                  Mudanza
                </span>
              )}
            </button>

            {/* Reportes Link */}
            <button 
              onClick={() => handleSidebarClick('reportes')}
              className={`nav-link w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                currentView === 'reportes' 
                  ? 'bg-linear-to-r from-red-950/20 to-transparent text-white font-semibold border-l-2 border-red-500 shadow-xs' 
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
              }`}
            >
              <FileText className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'reportes' ? 'text-red-400 scale-110' : 'text-slate-400'}`} />
              <span className="nav-link-text text-xs tracking-tight">Reportes y Auditoría</span>
            </button>

            {/* Section: TRAZABILIDAD STOCK ↔ AGENTE */}
            <div className="nav-section-title text-[10px] font-bold text-red-400 tracking-widest font-mono uppercase px-3 pt-4 pb-2 flex items-center justify-between">
              <span>Trazabilidad</span>
              {!sidebarCollapsed && (
                <span className="text-[8px] bg-red-950/90 text-red-400 border border-red-900/60 px-1 py-0.2 rounded font-mono font-bold">
                  CYBERWATCH
                </span>
              )}
            </div>

            {/* Conciliaciones (Bandeja) Link */}
            <button 
              onClick={() => handleSidebarClick('conciliaciones')}
              className={`nav-link w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                currentView === 'conciliaciones' || currentView === 'trazabilidad'
                  ? 'bg-linear-to-r from-red-950/40 to-transparent text-white font-semibold border-l-2 border-red-500 shadow-xs' 
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Sparkles className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'conciliaciones' || currentView === 'trazabilidad' ? 'text-red-400 scale-110' : 'text-slate-400'}`} />
                <span className="nav-link-text text-xs tracking-tight">Conciliaciones</span>
              </div>
              {!sidebarCollapsed && (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                  3 pend.
                </span>
              )}
            </button>

            {/* Section 2: DISPOSITIVOS */}
            <div className="nav-section-title text-[10px] font-bold text-slate-500 tracking-widest font-mono uppercase px-3 pt-4 pb-2">
              Gestión de Activos
            </div>

            {/* Computadoras Link */}
            <button 
              onClick={() => handleSidebarClick('computadoras')}
              className={`nav-link w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                currentView === 'computadoras' 
                  ? 'bg-linear-to-r from-blue-950/20 to-transparent text-white font-semibold border-l-2 border-blue-500 shadow-xs' 
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
              }`}
            >
              <Laptop className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'computadoras' ? 'text-blue-400 scale-110' : 'text-slate-400'}`} />
              <span className="nav-link-text text-xs tracking-tight">Computadoras</span>
            </button>

            {/* Consolidated Perifericos Hub */}
            <div className="nav-group space-y-1">
              <button 
                onClick={() => handleSidebarClick('perifericos_dashboard')}
                className={`nav-group-header w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  currentView === 'perifericos_dashboard' 
                    ? 'bg-linear-to-r from-amber-950/20 to-transparent text-white font-semibold border-l-2 border-amber-500 shadow-xs' 
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Cpu className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'perifericos_dashboard' ? 'text-amber-400 scale-110' : 'text-slate-400'}`} />
                  <span className="nav-link-text text-xs tracking-tight">Periféricos</span>
                </div>
                {!sidebarCollapsed && (
                  <ChevronRight 
                    onClick={(e) => { e.stopPropagation(); setPerifericosExpanded(!perifericosExpanded); }}
                    className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-500 hover:text-slate-200 shrink-0 ${perifericosExpanded ? 'rotate-90' : ''}`} 
                  />
                )}
              </button>
              
              {perifericosExpanded && !sidebarCollapsed && (
                <div className="nav-group-children pl-3 border-l border-slate-900 ml-5 mt-1 space-y-0.5">
                  <button 
                    onClick={() => handleSidebarClick('monitores')}
                    className={`nav-link w-full py-2 px-2 text-[11px] flex items-center gap-2 rounded-md transition-all ${
                      currentView === 'monitores' ? 'text-amber-400 bg-amber-500/5 font-semibold' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5 shrink-0" />
                    <span className="nav-link-text">Monitores</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('impresoras')}
                    className={`nav-link w-full py-2 px-2 text-[11px] flex items-center gap-2 rounded-md transition-all ${
                      currentView === 'impresoras' ? 'text-amber-400 bg-amber-500/5 font-semibold' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5 shrink-0" />
                    <span className="nav-link-text">Impresoras</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('teclados')}
                    className={`nav-link w-full py-2 px-2 text-[11px] flex items-center gap-2 rounded-md transition-all ${
                      currentView === 'teclados' ? 'text-amber-400 bg-amber-500/5 font-semibold' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                    }`}
                  >
                    <Keyboard className="w-3.5 h-3.5 shrink-0" />
                    <span className="nav-link-text">Teclados</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('mouse')}
                    className={`nav-link w-full py-2 px-2 text-[11px] flex items-center gap-2 rounded-md transition-all ${
                      currentView === 'mouse' ? 'text-amber-400 bg-amber-500/5 font-semibold' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 shrink-0" />
                    <span className="nav-link-text">Mice / Ratones</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('webcams')}
                    className={`nav-link w-full py-2 px-2 text-[11px] flex items-center gap-2 rounded-md transition-all ${
                      currentView === 'webcams' ? 'text-amber-400 bg-amber-500/5 font-semibold' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 shrink-0" />
                    <span className="nav-link-text">Cámaras Web</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('parlantes')}
                    className={`nav-link w-full py-2 px-2 text-[11px] flex items-center gap-2 rounded-md transition-all ${
                      currentView === 'parlantes' ? 'text-amber-400 bg-amber-500/5 font-semibold' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="nav-link-text">Audio y Parlantes</span>
                  </button>
                </div>
              )}
            </div>

            {/* Televisores Link */}
            <button 
              onClick={() => handleSidebarClick('televisores')}
              className={`nav-link w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                currentView === 'televisores' 
                  ? 'bg-linear-to-r from-purple-950/20 to-transparent text-white font-semibold border-l-2 border-purple-500 shadow-xs' 
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
              }`}
            >
              <Tv className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'televisores' ? 'text-purple-400 scale-110' : 'text-slate-400'}`} />
              <span className="nav-link-text text-xs tracking-tight">Televisores Smart</span>
            </button>

            {/* Celulares Link */}
            <button 
              onClick={() => handleSidebarClick('celulares')}
              className={`nav-link w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                currentView === 'celulares' 
                  ? 'bg-linear-to-r from-pink-950/20 to-transparent text-white font-semibold border-l-2 border-pink-500 shadow-xs' 
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
              }`}
            >
              <Smartphone className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'celulares' ? 'text-pink-400 scale-110' : 'text-slate-400'}`} />
              <span className="nav-link-text text-xs tracking-tight">Celulares Corp.</span>
            </button>

            {/* Teléfonos IP Link */}
            <button 
              onClick={() => handleSidebarClick('telefonos')}
              className={`nav-link w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                currentView === 'telefonos' 
                  ? 'bg-linear-to-r from-teal-950/20 to-transparent text-white font-semibold border-l-2 border-teal-500 shadow-xs' 
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
              }`}
            >
              <Phone className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'telefonos' ? 'text-teal-400 scale-110' : 'text-slate-400'}`} />
              <span className="nav-link-text text-xs tracking-tight">Teléfonos IP</span>
            </button>

            {/* Section 3: RED E INFRAESTRUCTURA */}
            <div className="nav-section-title text-[10px] font-bold text-slate-500 tracking-widest font-mono uppercase px-3 pt-4 pb-2">
              Infraestructura de Red
            </div>

            {/* Consolidated Infra Hub */}
            <div className="nav-group space-y-1">
              <button 
                onClick={() => handleSidebarClick('infra_dashboard')}
                className={`nav-group-header w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  currentView === 'infra_dashboard' 
                    ? 'bg-linear-to-r from-emerald-950/20 to-transparent text-white font-semibold border-l-2 border-emerald-500 shadow-xs' 
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Network className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'infra_dashboard' ? 'text-emerald-400 scale-110' : 'text-slate-400'}`} />
                  <span className="nav-link-text text-xs tracking-tight">Redes & Nodos</span>
                </div>
                {!sidebarCollapsed && (
                  <ChevronRight 
                    onClick={(e) => { e.stopPropagation(); setInfraestructuraExpanded(!infraestructuraExpanded); }}
                    className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-500 hover:text-slate-200 shrink-0 ${infraestructuraExpanded ? 'rotate-90' : ''}`} 
                  />
                )}
              </button>

              {infraestructuraExpanded && !sidebarCollapsed && (
                <div className="nav-group-children pl-3 border-l border-slate-900 ml-5 mt-1 space-y-0.5">
                  <button 
                    onClick={() => handleSidebarClick('routers_switches')}
                    className={`nav-link w-full py-2 px-2 text-[11px] flex items-center gap-2 rounded-md transition-all ${
                      currentView === 'routers_switches' ? 'text-emerald-400 bg-emerald-500/5 font-semibold' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                    }`}
                  >
                    <Network className="w-3.5 h-3.5 shrink-0" />
                    <span className="nav-link-text">Routers & Switches</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('nvr')}
                    className={`nav-link w-full py-2 px-2 text-[11px] flex items-center gap-2 rounded-md transition-all ${
                      currentView === 'nvr' ? 'text-emerald-400 bg-emerald-500/5 font-semibold' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                    }`}
                  >
                    <HardDrive className="w-3.5 h-3.5 shrink-0" />
                    <span className="nav-link-text">NVRs de Cámaras</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('camaras')}
                    className={`nav-link w-full py-2 px-2 text-[11px] flex items-center gap-2 rounded-md transition-all ${
                      currentView === 'camaras' ? 'text-emerald-400 bg-emerald-500/5 font-semibold' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 shrink-0" />
                    <span className="nav-link-text">Cámaras ONVIF</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('servers')}
                    className={`nav-link w-full py-2 px-2 text-[11px] flex items-center gap-2 rounded-md transition-all ${
                      currentView === 'servers' ? 'text-emerald-400 bg-emerald-500/5 font-semibold' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 shrink-0" />
                    <span className="nav-link-text">Servidores Físicos</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('tesoreria')}
                    className={`nav-link w-full py-2 px-2 text-[11px] flex items-center gap-2 rounded-md transition-all ${
                      currentView === 'tesoreria' ? 'text-emerald-400 bg-emerald-500/5 font-semibold' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 shrink-0" />
                    <span className="nav-link-text">Máq. Tesorería</span>
                  </button>
                </div>
              )}
            </div>

            {/* Section 4: CONSUMIBLES */}
            <div className="nav-section-title text-[10px] font-bold text-slate-500 tracking-widest font-mono uppercase px-3 pt-4 pb-2">
              Bodega e Insumos
            </div>

            {/* Stock Link */}
            <button 
              onClick={() => handleSidebarClick('stock')}
              className={`nav-link w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                currentView === 'stock' 
                  ? 'bg-linear-to-r from-cyan-950/20 to-transparent text-white font-semibold border-l-2 border-cyan-500 shadow-xs' 
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
              }`}
            >
              <Layers className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'stock' ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} />
              <span className="nav-link-text text-xs tracking-tight">Stock y Asignaciones</span>
            </button>

            {/* Section 5: AJUSTES Y ACCESO */}
            <div className="nav-section-title text-[10px] font-bold text-slate-500 tracking-widest font-mono uppercase px-3 pt-4 pb-2">
              Ajustes & Acceso
            </div>

            {/* User Profile Link */}
            <button 
              onClick={() => handleSidebarClick('perfil')}
              className={`nav-link w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                currentView === 'perfil' 
                  ? 'bg-linear-to-r from-indigo-950/20 to-transparent text-white font-semibold border-l-2 border-indigo-500 shadow-xs' 
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
              }`}
            >
              <UserIcon className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'perfil' ? 'text-indigo-400 scale-110' : 'text-slate-400'}`} />
              <span className="nav-link-text text-xs tracking-tight">Mi Perfil</span>
            </button>

            {/* Catálogos (ABM) Link */}
            <button 
              onClick={() => handleSidebarClick('catalogos')}
              className={`nav-link w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                currentView === 'catalogos' 
                  ? 'bg-linear-to-r from-red-950/20 to-transparent text-white font-semibold border-l-2 border-red-500 shadow-xs' 
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <SlidersHorizontal className={`w-4 h-4 shrink-0 transition-transform ${currentView === 'catalogos' ? 'text-red-400 scale-110' : 'text-slate-400'}`} />
                <span className="nav-link-text text-xs tracking-tight">Catálogos (ABM)</span>
              </div>
              {!sidebarCollapsed && (
                <span className="text-[8px] bg-red-950/90 text-red-400 border border-red-900/60 px-1.5 py-0.5 rounded-md uppercase tracking-widest font-mono font-extrabold shrink-0">
                  ABM
                </span>
              )}
            </button>

            {/* Live Agent Terminal "Sistema" */}
            <button 
              onClick={() => handleSidebarClick('sistema')}
              className={`nav-link w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                currentView === 'sistema' 
                  ? 'bg-linear-to-r from-rose-950/20 to-transparent text-white font-semibold border-l-2 border-rose-500 shadow-xs' 
                  : 'text-rose-400/90 hover:bg-slate-900/60 hover:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Terminal className={`w-4 h-4 shrink-0 ${currentView === 'sistema' ? 'text-rose-400' : 'text-rose-500 animate-pulse'}`} />
                <span className="nav-link-text text-xs tracking-tight">Consola Agente</span>
              </div>
              {!sidebarCollapsed && (
                <span className="text-[8px] bg-rose-950/90 text-rose-400 border border-rose-900/60 px-1.5 py-0.5 rounded-md uppercase tracking-widest font-mono font-extrabold animate-pulse shrink-0">
                  Live
                </span>
              )}
            </button>
          </nav>

          {/* Footer Auth inside sidebar */}
          <div className="sidebar-auth-footer bg-slate-950 border-t border-slate-900/80 p-3 flex flex-col gap-2.5 shrink-0 mt-auto">
            <div 
              className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-900/60 transition-colors cursor-pointer" 
              onClick={() => handleSidebarClick('perfil')}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-xs shrink-0 uppercase shadow-md shadow-indigo-900/20 relative">
                {profileName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-xs text-white truncate leading-none">{profileName}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[8px] uppercase font-mono tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-900/40 px-1 py-0.2 rounded-sm leading-none shrink-0 font-bold">
                    En Línea
                  </span>
                  <span className="sidebar-auth-email text-[9px] text-slate-500 font-mono truncate block leading-none" title={loginEmail}>{loginEmail}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => { setIsAuthenticated(false); setCurrentView('dashboard'); }}
              className="sidebar-logout text-rose-400 hover:text-white bg-slate-900/40 hover:bg-red-950/20 border border-slate-800/40 hover:border-red-900/40 text-[11px] font-semibold flex items-center justify-center gap-2 w-full py-1.5 rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {!sidebarCollapsed && <span>Cerrar sesión</span>}
            </button>
          </div>
        </div>

        {/* MAIN DISPLAY WORKBOARD PORTAL */}
        <div className="main">
          <div className="main-scroll">
            
            {/* VIEW 1: Dashboard */}
            {currentView === 'dashboard' && (
              <Dashboard 
                assets={assets}
                users={users}
                computers={agentComputers}
                consumables={consumables}
                activities={activities}
                onNavigate={(t) => setCurrentView(t)}
                onQuickAddAsset={() => {
                  setCurrentView('computadoras');
                  // Timeout helper to trigger child add form
                  setTimeout(() => {
                    const bgBtn = document.getElementById('register-asset-main-btn');
                    if (bgBtn) bgBtn.click();
                  }, 150);
                }}
              />
            )}

            {/* VIEW 2: Computadoras (Live Realtime Agent Telemetry) */}
            {currentView === 'computadoras' && (
              <ComputadorasList 
                computers={agentComputers}
                onUpdateComputer={(comp) => {
                  setAgentComputers(prev => prev.map(c => c.uuid === comp.uuid ? comp : c));
                }}
                onAddComputer={(comp) => {
                  setAgentComputers(prev => [comp, ...prev]);
                }}
                onRefreshTelemetry={() => {
                  setAgentComputers(INITIAL_AGENT_COMPUTERS);
                  alert('Sincronizados correctamente los 11 agentes de red BACAR.');
                }}
              />
            )}

            {/* VIEW 3: Impresoras */}
            {currentView === 'impresoras' && (
              <HardwareComplementList category="impresoras" computers={agentComputers} assets={assets} />
            )}

            {/* VIEW 4: Monitores */}
            {currentView === 'monitores' && (
              <HardwareComplementList category="monitores" computers={agentComputers} assets={assets} />
            )}

            {/* VIEW 5: Teclados */}
            {currentView === 'teclados' && (
              <HardwareComplementList category="teclados" computers={agentComputers} assets={assets} />
            )}

            {/* VIEW 6: Mouse */}
            {currentView === 'mouse' && (
              <HardwareComplementList category="mouse" computers={agentComputers} assets={assets} />
            )}

            {/* VIEW 7: Webcams */}
            {currentView === 'webcams' && (
              <HardwareComplementList category="webcams" computers={agentComputers} assets={assets} />
            )}

            {/* VIEW 7b: Parlantes */}
            {currentView === 'parlantes' && (
              <HardwareComplementList category="parlantes" computers={agentComputers} assets={assets} />
            )}

            {/* VIEW 7c: Micrófonos */}
            {currentView === 'microfonos' && (
              <HardwareComplementList category="microfonos" computers={agentComputers} assets={assets} />
            )}

            {/* VIEW 7d: Módulo de Televisores Smart */}
            {currentView === 'televisores' && (
              <TelevisoresList />
            )}

            {/* VIEW 7e: Módulo de Celulares Corporativos */}
            {currentView === 'celulares' && (
              <CelularesList />
            )}

            {/* VIEW 7f: Módulo Centralizador Periféricos Dashboard */}
            {currentView === 'perifericos_dashboard' && (
              <PerifericosDashboard computers={agentComputers} assets={assets} />
            )}

            {/* VIEW 7g: Módulo Centralizador de Infraestructura (Dashboard Central) */}
            {currentView === 'infra_dashboard' && (
              <InfraDashboard onNavigate={(targetView) => setCurrentView(targetView)} computersCount={agentComputers.length} />
            )}

            {/* VIEW 8: Suministros Stock (Consumables, licenses, spare parts) */}
            {currentView === 'stock' && (
              <StockList
                consumables={consumables}
                onAddConsumable={(newC) => {
                  const freshC: Consumable = {
                    ...newC,
                    id: `CON-0${consumables.length + 1}`
                  };
                  setConsumables([...consumables, freshC]);
                  
                  const newLog: ActivityLog = {
                    id: `ACT-0${activities.length + 1}`,
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                    type: 'Create',
                    user: `${profileName} (${profileRole})`,
                    description: `Alta de Insumo/Componente: [${freshC.id}] ${freshC.name}`,
                    details: `Stock inicial: ${freshC.stock} unidades (Bodega: ${freshC.location}, Costo: $${freshC.unitPrice})`
                  };
                  setActivities([newLog, ...activities]);
                }}
                onUpdateConsumable={(updatedC) => {
                  setConsumables(consumables.map(c => c.id === updatedC.id ? updatedC : c));
                  
                  const newLog: ActivityLog = {
                    id: `ACT-0${activities.length + 1}`,
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                    type: 'Stock',
                    user: `${profileName} (${profileRole})`,
                    description: `Modificación de Suministro: [${updatedC.id}] ${updatedC.name}`,
                    details: `Nuevo stock total: ${updatedC.stock} | Disponible: ${updatedC.availableStock || updatedC.stock} | Asignado: ${updatedC.assignedStock || 0}`
                  };
                  setActivities([newLog, ...activities]);
                }}
                onUpdateStock={(id, delta) => {
                  handleUpdateConsumableStock(id, delta);
                }}
              />
            )}

            {/* VIEW 9: NVR */}
            {currentView === 'nvr' && (
              <NetworkInfrastructure category="nvr" />
            )}

            {/* VIEW 10: Cámaras */}
            {currentView === 'camaras' && (
              <NetworkInfrastructure category="camaras" />
            )}

            {/* VIEW 11: Servidores */}
            {currentView === 'servers' && (
              <NetworkInfrastructure category="servers" />
            )}

            {/* VIEW 12: Routers & Switches */}
            {currentView === 'routers_switches' && (
              <NetworkInfrastructure category="routers_switches" />
            )}

            {/* VIEW 13: Máquinas de tesorería */}
            {currentView === 'tesoreria' && (
              <NetworkInfrastructure category="tesoreria" />
            )}

            {/* VIEW 13.5: Teléfonos IP */}
            {currentView === 'telefonos' && (
              <NetworkInfrastructure category="telefonos" />
            )}

            {/* VIEW 14: Mi Perfil */}
            {currentView === 'perfil' && (
              <UserProfile 
                profileName={profileName}
                profileEmail={loginEmail}
                profileRole={profileRole}
                profilePhone={profilePhone}
                profileDept={profileDept}
                onUpdateProfile={({ profileName, profileEmail, profileRole, profilePhone, profileDept }) => {
                  setProfileName(profileName);
                  setProfileRole(profileRole);
                  setProfilePhone(profilePhone);
                  setProfileDept(profileDept);
                  setLoginEmail(profileEmail); // Synchronize auth email

                  localStorage.setItem('bacarsa_profile_name', profileName);
                  localStorage.setItem('bacarsa_profile_email', profileEmail);
                  localStorage.setItem('bacarsa_profile_role', profileRole);
                  localStorage.setItem('bacarsa_profile_phone', profilePhone);
                  localStorage.setItem('bacarsa_profile_dept', profileDept);
                }}
                onUpdatePassword={(newPass) => {
                  setLoginPassword(newPass);
                  localStorage.setItem('bacarsa_profile_password', newPass);
                }}
              />
            )}

            {/* VIEW 16: Live Agent Config (Sistema) */}
            {currentView === 'sistema' && (
              <SistemaConfig 
                onRefreshAll={() => {
                  setAgentComputers(INITIAL_AGENT_COMPUTERS);
                }}
                computers={agentComputers}
                setComputers={setAgentComputers}
              />
            )}

            {/* VIEW 17: Módulo de Etiquetas QR para Mudanza */}
            {currentView === 'etiquetas-qr' && (
              <EtiquetasQrList 
                onSelectComputer={(uuid) => navigateRoute('etiqueta_qr_ficha', uuid)} 
              />
            )}

            {/* VIEW 18: Ficha Liviana de Mudanza QR */}
            {currentView === 'etiqueta_qr_ficha' && (
              <EtiquetaQrFicha 
                uuid={selectedQrUuid || ''} 
                onBack={() => navigateRoute('etiquetas-qr')}
                onNavigateToComputadoras={(uuid) => navigateRoute('computadoras', uuid)}
              />
            )}

            {/* VIEW 19: Reportes y Auditoría */}
            {currentView === 'reportes' && (
              <ReportsView 
                assets={assets}
                users={users}
                consumables={consumables}
                activities={activities}
              />
            )}

            {/* VIEW 20: ABM y Gestión de Catálogos */}
            {currentView === 'catalogos' && (
              <CatalogosAbm />
            )}

            {/* VIEW 21: Módulo de Trazabilidad Stock ↔ Agente CyberWatch */}
            {(currentView === 'conciliaciones' || currentView === 'trazabilidad') && (
              <TrazabilidadModule 
                initialSubView="conciliaciones"
                onNavigateGlobal={(view, id) => navigateRoute(view, id)}
              />
            )}

          </div>
        </div>

      </div>

      {/* FULL STATION TELEMETRY INSPECTOR MODAL */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setSelectedAgent(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="font-mono text-xs font-bold text-indigo-600">HOST: {selectedAgent.hostname}</span>
                </div>
                <h3 className="font-bold text-slate-950 text-base">Inspector de Terminal Agente</h3>
              </div>
              <button 
                onClick={() => setSelectedAgent(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              
              {/* KPIs */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 border border-slate-100 rounded-lg bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Procesador</span>
                  <p className="font-bold text-slate-800 truncate mt-1" title={selectedAgent.procesador}>{selectedAgent.procesador}</p>
                </div>
                <div className="p-2 border border-slate-100 rounded-lg bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Memoria Total</span>
                  <p className="font-bold text-slate-800 mt-1">{selectedAgent.ram_total_gb.toFixed(1)} GB</p>
                </div>
                <div className="p-2 border border-slate-100 rounded-lg bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">IP Pública</span>
                  <p className="font-bold text-slate-800 mt-1 font-mono">{selectedAgent.ip_publica}</p>
                </div>
              </div>

              {/* Memory hard drives */}
              <div className="space-y-3">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Unidades de Disco ({selectedAgent.discos.length})</p>
                {selectedAgent.discos.map((d, index) => (
                  <div key={index} className="p-3 border border-slate-100 rounded-lg space-y-1.5 bg-slate-50/30">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-800">Montaje: {d.punto_montaje} ({d.tipo_disco})</span>
                      <span className="text-slate-500">Libre: {d.libre_gb.toFixed(1)} GB de {d.total_gb.toFixed(1)} GB</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${d.porcentaje_usado}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">{d.porcentaje_usado}% espacio utilizado</p>
                  </div>
                ))}
              </div>

              {/* Protection Antivirus */}
              {selectedAgent.software_critico && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Ciberseguridad y Antivirus</p>
                  {selectedAgent.software_critico.antivirus.map((av, index) => (
                    <div key={index} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-slate-50/30">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">{av.nombre}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Actualizado: {av.ultima_act_firmas}</p>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${av.habilitado ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {av.habilitado ? 'Protegido' : 'No Habilitado'}
                      </span>
                    </div>
                  ))}
                  {selectedAgent.software_critico.alertas_seguridad && selectedAgent.software_critico.alertas_seguridad.length > 0 && (
                    <div className="p-3 border border-amber-200 bg-amber-50/20 rounded-lg text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Alertas de Ciberseguridad:</p>
                        <ul className="list-disc pl-4 mt-1 font-medium">
                          {selectedAgent.software_critico.alertas_seguridad.map((al, idx) => (
                            <li key={idx}>{al}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Perifericos map */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5 font-mono">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    Periféricos y Dispositivos Mapeados
                  </p>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    {(selectedAgent.perifericos?.monitores?.length || 0) + (selectedAgent.perifericos?.impresoras?.length || 0) + (selectedAgent.perifericos?.dispositivos_usb?.length || 0)} vinculados
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Monitores */}
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-[10px] uppercase flex items-center gap-1">
                        <Monitor className="w-3 h-3 text-blue-600" />
                        Monitores ({selectedAgent.perifericos?.monitores?.length || 0})
                      </span>
                    </div>
                    {selectedAgent.perifericos?.monitores && selectedAgent.perifericos.monitores.length > 0 ? (
                      <div className="space-y-1.5">
                        {selectedAgent.perifericos.monitores.map((mon, idx) => (
                          <div key={idx} className="p-2 bg-white rounded-lg border border-slate-150 text-[11px] shadow-3xs">
                            <p className="font-bold text-slate-800 leading-tight">{mon.nombre.replace(/\u0000/g, '')}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-slate-700">{mon.resolucion}</span>
                              {mon.es_principal && (
                                <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Principal</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-slate-400 text-xs italic">Sin monitores detectados</p>}
                  </div>

                  {/* Impresoras & USB */}
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-[10px] uppercase flex items-center gap-1">
                        <Printer className="w-3 h-3 text-emerald-600" />
                        Impresoras & Conexiones ({selectedAgent.perifericos?.impresoras?.length || 0})
                      </span>
                    </div>
                    {selectedAgent.perifericos?.impresoras && selectedAgent.perifericos.impresoras.length > 0 ? (
                      <div className="space-y-1.5">
                        {selectedAgent.perifericos.impresoras.slice(0, 3).map((imp, idx) => (
                          <div key={idx} className="p-2 bg-white rounded-lg border border-slate-150 text-[11px] shadow-3xs">
                            <p className="font-bold text-slate-800 truncate" title={imp.nombre}>{imp.nombre}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                              <span className="text-slate-600">{imp.puerto || 'Conexión de red / USB'}</span>
                              {imp.es_predeterminada && (
                                <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Predeterminada</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-slate-400 text-xs italic">Sin impresoras vinculadas</p>}
                  </div>
                </div>

                {/* Dispositivos USB si existen */}
                {selectedAgent.perifericos?.dispositivos_usb && selectedAgent.perifericos.dispositivos_usb.length > 0 && (
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                    <span className="font-bold text-slate-700 text-[10px] uppercase flex items-center gap-1">
                      <Usb className="w-3 h-3 text-purple-600" />
                      Dispositivos USB ({selectedAgent.perifericos.dispositivos_usb.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {selectedAgent.perifericos.dispositivos_usb.map((u, idx) => (
                        <div key={idx} className="p-2 bg-white rounded-lg border border-slate-150 text-[11px] flex items-center justify-between">
                          <span className="font-medium text-slate-800 truncate">{u.nombre}</span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold uppercase shrink-0">{u.tipo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Errors logs */}
              {selectedAgent.errores_recientes && selectedAgent.errores_recientes.length > 0 && (
                <div className="space-y-2">
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Registro de Errores Críticos (Service Control)</p>
                  <div className="space-y-1.5">
                    {selectedAgent.errores_recientes.map((err, idx) => (
                      <div key={idx} className="p-3 border border-red-200 bg-red-50/30 rounded-lg space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-red-700 font-bold">
                          <span>{err.fuente}</span>
                          <span>{err.fecha}</span>
                        </div>
                        <p className="text-slate-800 italic leading-snug">{err.mensaje}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer task launcher */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-3">
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[9px]">Lanzar Instrucciones de Agente (Firestore Realtime)</p>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleTriggerAgentCommand(selectedAgent.hostname, 'RESETEAR_ID')}
                  className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
                >
                  Regenerar Agente ID
                </button>
                <button 
                  onClick={() => handleTriggerAgentCommand(selectedAgent.hostname, 'ACTUALIZAR_AGENTE')}
                  className="py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs"
                >
                  Actualizar Ejecutable
                </button>
              </div>

              <button 
                onClick={() => setSelectedAgent(null)}
                className="w-full py-2 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cerrar Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

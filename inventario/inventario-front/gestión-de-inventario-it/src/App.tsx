import React, { useState, useRef } from 'react';
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
import { 
  Monitor, Laptop, Smartphone, Cpu, HardDrive, Network, Layers, 
  Terminal, ShieldCheck, Mail, Lock, LogOut, ChevronLeft, ChevronRight, 
  Menu, RefreshCw, Layers2, FileText, CheckCircle, AlertTriangle, ShieldAlert,
  Search, Play, Plus, Trash2, Edit2, Key, Server, Settings, Disc, HelpCircle, X, Users, User as UserIcon
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

  // Active View
  // Values: 'dashboard' | 'computadoras' | 'impresoras' | 'monitores' | 'teclados' | 'mouse' | 'webcams' | 'parlantes' | 'microfonos' | 'stock' | 'nvr' | 'camaras' | 'routers' | 'switches' | 'tesoreria_maq' | 'sistema' | 'assignments' | 'users'
  const [currentView, setCurrentView] = useState<string>('dashboard');

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
      <div className="login-page">
        <div className="login-container">
          <div className="login-left">
            <span className="login-left-eyebrow">Sistema de Gestión Interna IT</span>
            <h1 className="login-left-title">
              Bacar<span className="login-dot">.</span>it
            </h1>
            <p className="login-left-desc">
              Consola de supervisión de infraestructura, inventarios físicos, licencias en la nube y sincronización de agentes Bacar en terminales corporativas.
            </p>
          </div>
          <div className="login-right">
            <div className="login-bracket-wrap">
              <div className="login-corner login-corner--tl" />
              <div className="login-corner login-corner--tr" />
              <div className="login-corner login-corner--bl" />
              <div className="login-corner login-corner--br" />
              <div className="login-floating-card">
                <h2 className="login-card-title">Acceso de Administrador</h2>
                <p className="login-card-subtitle">Ingresa tus credenciales IT autorizadas</p>
                {loginError && (
                  <p className="p-2 border border-red-200 bg-red-50 text-red-700 text-xs rounded-lg mb-3 font-semibold">
                    {loginError}
                  </p>
                )}
                <form onSubmit={handleLoginSubmit} className="login-form">
                  <div className="login-field">
                    <label className="login-label">Usuario o Correo *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="ej. desarrollo.it@bacarsa.com.ar"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="inventory-input text-center"
                    />
                  </div>
                  <div className="login-field">
                    <label className="login-label">Contraseña de Control *</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="inventory-input text-center"
                    />
                  </div>
                  <button type="submit" className="login-submit">
                    Cifrar e Iniciar
                  </button>
                </form>
                <p className="text-[10px] text-slate-400 mt-6 tracking-wide">
                  Conexión segura SSL integrada de fábrica.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter lists inside specific submenus:
  // e.g. sidebar tabs.
  const handleSidebarClick = (view: string) => {
    setCurrentView(view);
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
      <div className="layout">
        
        {/* SIDEBAR NAVIGATION BLOCK - COLLAPSIBLE */}
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <span className="logo">
              <span className="logo-icon">
                <Disc className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '6s' }} />
              </span>
              <span className="logo-text font-black tracking-tight text-white font-sans text-sm">
                IT-Bacar
              </span>
            </span>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="sidebar-toggle"
              title={sidebarCollapsed ? "Expandir" : "Encoger"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          <nav className="nav">
            {/* Section 1: GENERAL */}
            <div className="nav-section-title">General</div>
            
            {/* Inicio (Dashboard) Link */}
            <button 
              onClick={() => handleSidebarClick('dashboard')}
              className={`nav-link w-full text-left ${currentView === 'dashboard' ? 'active' : ''}`}
            >
              <Layers2 className="w-4 h-4 text-indigo-400" />
              <span className="nav-link-text">Inicio</span>
            </button>

            {/* Section 2: HARDWARE */}
            <div className="nav-section-title">Hardware</div>

            {/* Hardware Collapsible Folders */}
            <div className="nav-group">
              <button 
                onClick={() => setHardwareExpanded(!hardwareExpanded)}
                className="nav-group-header w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-400" />
                  <span className="nav-link-text">Hardware</span>
                </div>
                {!sidebarCollapsed && (
                  <ChevronRight className={`w-3 h-3 nav-group-chevron transition-transform duration-200 ${hardwareExpanded ? 'rotate-90' : ''}`} />
                )}
              </button>
              {hardwareExpanded && (
                <div className="nav-group-children">
                  <button 
                    onClick={() => handleSidebarClick('computadoras')}
                    className={`nav-link w-full ${currentView === 'computadoras' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-2">Computadoras</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('impresoras')}
                    className={`nav-link w-full ${currentView === 'impresoras' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-2">Impresoras</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('monitores')}
                    className={`nav-link w-full ${currentView === 'monitores' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-2">Monitores</span>
                  </button>
                </div>
              )}
            </div>

            {/* Perifericos Folder */}
            <div className="nav-group">
              <button 
                onClick={() => setPerifericosExpanded(!perifericosExpanded)}
                className="nav-group-header w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-500" />
                  <span className="nav-link-text">Periféricos</span>
                </div>
                {!sidebarCollapsed && (
                  <ChevronRight className={`w-3 h-3 nav-group-chevron transition-transform duration-200 ${perifericosExpanded ? 'rotate-90' : ''}`} />
                )}
              </button>
              {perifericosExpanded && (
                <div className="nav-group-children">
                  <button 
                    onClick={() => handleSidebarClick('teclados')}
                    className={`nav-link w-full ${currentView === 'teclados' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-2">Teclados</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('mouse')}
                    className={`nav-link w-full ${currentView === 'mouse' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-2">Mouse</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('webcams')}
                    className={`nav-link w-full ${currentView === 'webcams' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-2">Webcams</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('parlantes')}
                    className={`nav-link w-full ${currentView === 'parlantes' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-2">Parlantes</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('microfonos')}
                    className={`nav-link w-full ${currentView === 'microfonos' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-2">Micrófonos</span>
                  </button>
                </div>
              )}
            </div>

            {/* Stock Link */}
            <button 
              onClick={() => handleSidebarClick('stock')}
              className={`nav-link w-full text-left ${currentView === 'stock' ? 'active' : ''}`}
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="nav-link-text">Stock</span>
            </button>

            {/* Section 3: INFRAESTRUCTURA */}
            <div className="nav-section-title">Infraestructura</div>

            {/* Infraestructura Folder */}
            <div className="nav-group">
              <button 
                onClick={() => setInfraestructuraExpanded(!infraestructuraExpanded)}
                className="nav-group-header w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-emerald-400" />
                  <span className="nav-link-text">Infraestructura</span>
                </div>
                {!sidebarCollapsed && (
                  <ChevronRight className={`w-3 h-3 nav-group-chevron transition-transform duration-200 ${infraestructuraExpanded ? 'rotate-90' : ''}`} />
                )}
              </button>
              {infraestructuraExpanded && (
                <div className="nav-group-children">
                  <button 
                    onClick={() => handleSidebarClick('nvr')}
                    className={`nav-link w-full ${currentView === 'nvr' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-2">NVR</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('camaras')}
                    className={`nav-link w-full ${currentView === 'camaras' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-2">Cámaras</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('servers')}
                    className={`nav-link w-full ${currentView === 'servers' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-2">Servidores</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('routers_switches')}
                    className={`nav-link w-full ${currentView === 'routers_switches' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-2">Routers & Switches</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('tesoreria')}
                    className={`nav-link w-full ${currentView === 'tesoreria' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-2">Máq. Tesorería</span>
                  </button>
                </div>
              )}
            </div>

            {/* Section 4: ADMINISTRACIÓN */}
            <div className="nav-section-title">Ajustes & Acceso</div>

            {/* User Profile Link */}
            <button 
              onClick={() => handleSidebarClick('perfil')}
              className={`nav-link w-full text-left ${currentView === 'perfil' ? 'active' : ''}`}
            >
              <UserIcon className="w-4 h-4 text-indigo-400" />
              <span className="nav-link-text">Mi Perfil</span>
            </button>

            {/* Live Agent Terminal "Sistema" */}
            <button 
              onClick={() => handleSidebarClick('sistema')}
              className={`nav-link w-full text-left ${currentView === 'sistema' ? 'active' : ''}`}
            >
              <Terminal className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="nav-link-text font-bold text-rose-100 flex items-center justify-between w-full">
                <span>Sistema</span>
                {!sidebarCollapsed && (
                  <span className="text-[9px] bg-rose-950/80 text-rose-400 border border-rose-900 px-1 py-0.5 rounded-md uppercase tracking-wider font-mono font-bold animate-pulse">
                    Live
                  </span>
                )}
              </span>
            </button>
          </nav>

          {/* Footer Auth inside sidebar */}
          <div className="sidebar-auth-footer">
            <div className="flex items-center gap-2.5 mb-2 px-1 cursor-pointer hover:bg-slate-800/60 p-1.5 rounded-lg transition-colors" onClick={() => handleSidebarClick('perfil')}>
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-extrabold text-[10px] shrink-0 uppercase">
                {profileName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-xs text-white truncate leading-tight">{profileName}</p>
                <span className="sidebar-auth-email text-[10px] text-slate-400 font-mono truncate block" title={loginEmail}>{loginEmail}</span>
              </div>
            </div>
            <button 
              onClick={() => { setIsAuthenticated(false); setCurrentView('dashboard'); }}
              className="sidebar-logout text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 w-full pt-1.5 border-t border-slate-800"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
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
                consumables={consumables}
                activities={activities}
                onNavigate={(t) => setCurrentView(t)}
                onQuickAddAsset={() => {
                  setCurrentView('computadoras');
                  // Timeout helper to trigger child add form
                  setTimeout(() => {
                    const btn = document.getElementById('register-asset-main-btn');
                    if (btn) btn.click();
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
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Periféricos e Interfaces de Consumo Mapeados</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 border border-slate-100 rounded-lg bg-slate-50/30 space-y-1">
                    <p className="font-bold text-slate-400 text-[8px] uppercase">Monitores Conectados</p>
                    {selectedAgent.perifericos?.monitores && selectedAgent.perifericos.monitores.length > 0 ? (
                      selectedAgent.perifericos.monitores.map((mon, idx) => (
                        <p key={idx} className="font-semibold text-slate-800 leading-tight">{mon.nombre.replace(/\u0000/g, '')} ({mon.resolucion})</p>
                      ))
                    ) : <p className="text-slate-400 italic">No mapeado</p>}
                  </div>

                  <div className="p-2 border border-slate-100 rounded-lg bg-slate-50/30 space-y-1">
                    <p className="font-bold text-slate-400 text-[8px] uppercase">Impresoras Asignadas</p>
                    {selectedAgent.perifericos?.impresoras && selectedAgent.perifericos.impresoras.length > 0 ? (
                      selectedAgent.perifericos.impresoras.slice(0, 3).map((imp, idx) => (
                        <p key={idx} className="font-semibold text-slate-800 truncate" title={imp.nombre}>{imp.nombre}</p>
                      ))
                    ) : <p className="text-slate-400 italic">No mapeado</p>}
                  </div>
                </div>
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

import React, { useState, useRef } from 'react';
import { 
  Asset, User, Assignment, Consumable, ActivityLog, AgentComputer, AssetType, AssetStatus 
} from './types';
import { 
  INITIAL_ASSETS, INITIAL_USERS, INITIAL_ASSIGNMENTS, INITIAL_CONSUMABLES, INITIAL_ACTIVITIES, INITIAL_AGENT_COMPUTERS 
} from './mockData';
import Dashboard from './components/Dashboard';
import AssetsList from './components/AssetsList';
import Assignments from './components/Assignments';
import UsersList from './components/UsersList';
import { 
  Monitor, Laptop, Smartphone, Cpu, HardDrive, Network, Layers, 
  Terminal, ShieldCheck, Mail, Lock, LogOut, ChevronLeft, ChevronRight, 
  Menu, RefreshCw, Layers2, FileText, CheckCircle, AlertTriangle, ShieldAlert,
  Search, Play, Plus, Trash2, Edit2, Key, Server, Settings, Disc, HelpCircle, X, Users
} from 'lucide-react';

export default function App() {
  // Session Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('desarrollo.it@bacarsa.com.ar');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');

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
      user: 'Daniel Ortega (IT Admin)',
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
      user: 'Daniel Ortega (IT Admin)',
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
        user: 'Daniel Ortega (IT Admin)',
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
      user: 'Daniel Ortega (IT Admin)',
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
      user: 'Daniel Ortega (IT Admin)',
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
        user: 'Daniel Ortega (IT Admin)',
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
              <span className="logo-icon p-1 bg-red-700 rounded-lg text-white font-black text-sm">
                <Disc className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              </span>
              <span className="logo-text font-black tracking-tight text-white font-sans">
                IT-Bacar
              </span>
            </span>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="sidebar-toggle"
              title={sidebarCollapsed ? "Expandir" : "Encoger"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <nav className="nav space-y-1">
            {/* Inicio (Dashboard) Link */}
            <button 
              onClick={() => handleSidebarClick('dashboard')}
              className={`nav-link w-full text-left ${currentView === 'dashboard' ? 'active' : ''}`}
            >
              <Layers2 className="w-4 h-4 text-indigo-400" />
              <span className="nav-link-text">Inicio General</span>
            </button>

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
                  <ChevronRight className={`w-3.5 h-3.5 nav-group-chevron transition-transform duration-200 ${hardwareExpanded ? 'rotate-90' : ''}`} />
                )}
              </button>
              {hardwareExpanded && (
                <div className="nav-group-children">
                  <button 
                    onClick={() => handleSidebarClick('computadoras')}
                    className={`nav-link w-full ${currentView === 'computadoras' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-4">• Computadoras</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('impresoras')}
                    className={`nav-link w-full ${currentView === 'impresoras' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-4">• Impresoras</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('monitores')}
                    className={`nav-link w-full ${currentView === 'monitores' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-4">• Monitores</span>
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
                  <Cpu className="w-4 h-4 text-orange-400" />
                  <span className="nav-link-text">Periféricos</span>
                </div>
                {!sidebarCollapsed && (
                  <ChevronRight className={`w-3.5 h-3.5 nav-group-chevron transition-transform duration-200 ${perifericosExpanded ? 'rotate-90' : ''}`} />
                )}
              </button>
              {perifericosExpanded && (
                <div className="nav-group-children">
                  <button 
                    onClick={() => handleSidebarClick('teclados')}
                    className={`nav-link w-full ${currentView === 'teclados' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-4">• Teclados</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('mouse')}
                    className={`nav-link w-full ${currentView === 'mouse' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-4">• Mouse</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('webcams')}
                    className={`nav-link w-full ${currentView === 'webcams' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-4">• Webcams & Eq.</span>
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
              <span className="nav-link-text">Suministros Stock</span>
            </button>

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
                  <ChevronRight className={`w-3.5 h-3.5 nav-group-chevron transition-transform duration-200 ${infraestructuraExpanded ? 'rotate-90' : ''}`} />
                )}
              </button>
              {infraestructuraExpanded && (
                <div className="nav-group-children">
                  <button 
                    onClick={() => handleSidebarClick('routers')}
                    className={`nav-link w-full ${currentView === 'routers' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-4">• Routers / Switches</span>
                  </button>
                  <button 
                    onClick={() => handleSidebarClick('camaras')}
                    className={`nav-link w-full ${currentView === 'camaras' ? 'active' : ''}`}
                  >
                    <span className="nav-link-text pl-4">• NVR & Cámaras</span>
                  </button>
                </div>
              )}
            </div>

            {/* Custodia Assignments Link */}
            <button 
              onClick={() => handleSidebarClick('assignments')}
              className={`nav-link w-full text-left ${currentView === 'assignments' ? 'active' : ''}`}
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="nav-link-text">Custodia Equipos</span>
            </button>

            {/* Users Link */}
            <button 
              onClick={() => handleSidebarClick('users')}
              className={`nav-link w-full text-left ${currentView === 'users' ? 'active' : ''}`}
            >
              <Users className="w-4 h-4 text-slate-300" />
              <span className="nav-link-text">Colaboradores</span>
            </button>

            {/* Live Agent Terminal "Sistema" */}
            <button 
              onClick={() => handleSidebarClick('sistema')}
              className={`nav-link w-full text-left ${currentView === 'sistema' ? 'active' : ''}`}
            >
              <Terminal className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="nav-link-text font-bold text-red-100">Dispositivos Agente</span>
            </button>
          </nav>

          {/* Footer Auth inside sidebar */}
          <div className="sidebar-auth-footer">
            <p className="sidebar-auth-email" title={loginEmail}>{loginEmail}</p>
            <button 
              onClick={() => { setIsAuthenticated(false); setCurrentView('dashboard'); }}
              className="sidebar-logout text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5"
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

            {/* VIEW 2: Computadoras (Filtered general assets list) */}
            {currentView === 'computadoras' && (
              <div>
                <AssetsList 
                  assets={assets}
                  users={users}
                  onAddAsset={handleAddAsset}
                  onUpdateAsset={handleUpdateAsset}
                  onDeleteAsset={handleDeleteAsset}
                />
              </div>
            )}

            {/* VIEW 3: Impresoras */}
            {currentView === 'impresoras' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">Periféricos: Impresoras Corporativas</h1>
                  <p className="text-xs text-slate-500">Listado de dispositivos de impresión mapeados localmente y en red por los agentes activos en el corporativo Bacar.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {agentComputers.flatMap(c => c.perifericos?.impresoras?.map(imp => ({ ...imp, hostname: c.hostname, uuid: c.uuid })) || []).map((imp, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${imp.predeterminada ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                            {imp.predeterminada ? 'Predeterminada' : 'Secundaria'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Puerto: {imp.puerto}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs">{imp.nombre}</h3>
                        <p className="text-[11px] text-slate-500 font-mono">Controlador: {imp.driver}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-normal text-left">Host Mapeado</span>
                          <span className="text-slate-700">{imp.hostname}</span>
                        </div>
                        <button 
                          onClick={() => {
                            const matchedAgent = agentComputers.find(a => a.uuid === imp.uuid);
                            if (matchedAgent) {
                              setSelectedAgent(matchedAgent);
                            }
                          }}
                          className="p-1 text-[#0c66e4] hover:underline font-bold text-[11px]"
                        >
                          Ver equipo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 4: Monitores */}
            {currentView === 'monitores' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">Periféricos: Monitores y Pantallas</h1>
                  <p className="text-xs text-slate-500">Monitores e interfaces detectados de manera automática en las estaciones de trabajo activas de Bacar.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {agentComputers.flatMap(c => c.perifericos?.monitores?.map(mon => ({ ...mon, hostname: c.hostname, uuid: c.uuid })) || []).map((mon, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                            Física
                          </span>
                          <span className="text-[11px] text-slate-700 font-mono font-bold">{mon.resolucion}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs">{mon.nombre.replace(/\u0000/g, '')}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">Pulgadas: {mon.pulgadas || 'N/A'}" pulgadas</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-normal text-left">Host de Salida</span>
                          <span className="text-slate-700">{mon.hostname}</span>
                        </div>
                        <button 
                          onClick={() => {
                            const matchedAgent = agentComputers.find(a => a.uuid === mon.uuid);
                            if (matchedAgent) {
                              setSelectedAgent(matchedAgent);
                            }
                          }}
                          className="p-1 text-[#0c66e4] hover:underline font-bold text-[11px]"
                        >
                          Ver terminal
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 5: Teclados */}
            {currentView === 'teclados' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">Periféricos: Teclados Registrados</h1>
                  <p className="text-xs text-slate-500">Módulos de entrada física inalámbricos y USB mapeados en los escritorios activos.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {agentComputers.flatMap(c => c.perifericos?.dispositivos_usb?.filter(usb => usb.categoria === 'Teclado' || usb.nombre.toLowerCase().includes('teclado')).map(kb => ({ ...kb, hostname: c.hostname, uuid: c.uuid })) || []).map((kb, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800">
                            USB / Inalámbrico
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Fabricante: {kb.fabricante || 'Standard'}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs">{kb.nombre}</h3>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-normal text-left">Dispositivo Conectado a</span>
                          <span className="text-slate-700">{kb.hostname}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 6: Mouse */}
            {currentView === 'mouse' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">Periféricos: Mouse y Dispositivos de Señalador</h1>
                  <p className="text-xs text-slate-500">Unidades de puntero ópticos inalámbricos y ergonómicos activos analizados por telemetría.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {agentComputers.flatMap(c => c.perifericos?.dispositivos_usb?.filter(usb => usb.categoria === 'Mouse' || usb.nombre.toLowerCase().includes('mouse')).map(m => ({ ...m, hostname: c.hostname, uuid: c.uuid })) || []).map((m, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                            Optical Mouse
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Fabricante: {m.fabricante || 'Standard'}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs">{m.nombre}</h3>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-normal text-left">Equipo Vinculado</span>
                          <span className="text-slate-700">{m.hostname}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 7: Webcams & Eq. */}
            {currentView === 'webcams' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">Periféricos: Webcams, Grabación y Audio</h1>
                  <p className="text-xs text-slate-500">Módulos de grabación de video y periféricos de capture habilitados.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {agentComputers.flatMap(c => c.perifericos?.dispositivos_usb?.filter(usb => usb.categoria === 'Camera' || usb.nombre.toLowerCase().includes('webcam') || usb.nombre.toLowerCase().includes('camara')).map(cam => ({ ...cam, hostname: c.hostname, uuid: c.uuid })) || []).map((cam, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                            Multivector Camera
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Clase: {cam.fabricante || 'USB'}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs">{cam.nombre}</h3>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-normal text-left">Asociado a Estación</span>
                          <span className="text-slate-700">{cam.hostname}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 8: Suministros Stock (Consumables, licenses, spare parts) */}
            {currentView === 'stock' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Catálogo de Consumibles y Suministros</h1>
                    <p className="text-xs text-slate-500">Controla consumibles en bodegas físicas de CDMX e inventario de licencias corporativas en la nube.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {consumables.map((item) => {
                    const isLow = item.stock <= item.minStock;
                    return (
                      <div key={item.id} className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${isLow ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-blue-600">{item.id}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.category === 'License' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              item.category === 'Peripheral' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                              item.category === 'Accessory' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.category === 'License' ? 'Licencia' : item.category === 'Peripheral' ? 'Periférico' : item.category === 'Accessory' ? 'Accesorio' : 'Componente'}
                            </span>
                          </div>

                          <h3 className="font-bold text-slate-900 leading-tight text-sm">{item.name}</h3>
                          <p className="text-xs text-slate-500">Bodega: {item.location}</p>
                          <p className="text-xs font-semibold text-slate-800">Costo Unitario: ${item.unitPrice} USD</p>
                        </div>

                        {/* Adjust stock value */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-normal">Cantidad Restante</span>
                            <span className={`text-base font-bold font-mono ${isLow ? 'text-amber-700 animate-pulse' : 'text-slate-900'}`}>{item.stock} unidades</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleUpdateConsumableStock(item.id, -1)}
                              className="w-7 h-7 flex items-center justify-center bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded text-slate-700 font-bold"
                              title="Retirar 1 unidad"
                            >
                              -
                            </button>
                            <button 
                              onClick={() => handleUpdateConsumableStock(item.id, 1)}
                              className="w-7 h-7 flex items-center justify-center bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded font-bold"
                              title="Surtir 1 unidad"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 9: Routers & Network Switches */}
            {currentView === 'routers' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">Infraestructura: Routers y Switches</h1>
                  <p className="text-xs text-slate-500">Módulos de networking conectados a la troncal principal analizados por el puerto IT corporativo.</p>
                </div>
                <AssetsList 
                  assets={assets.filter(a => a.type === 'Network')}
                  users={users}
                  onAddAsset={handleAddAsset}
                  onUpdateAsset={handleUpdateAsset}
                  onDeleteAsset={handleDeleteAsset}
                />
              </div>
            )}

            {/* VIEW 10: NVR & Cámaras */}
            {currentView === 'camaras' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">Infraestructura: NVR y Cámaras de Seguridad</h1>
                  <p className="text-xs text-slate-500">Dispositivos y grabadoras digitales conectadas al canal de circuito cerrado local.</p>
                </div>
                <AssetsList 
                  assets={assets.filter(a => a.type === 'Server')}
                  users={users}
                  onAddAsset={handleAddAsset}
                  onUpdateAsset={handleUpdateAsset}
                  onDeleteAsset={handleDeleteAsset}
                />
              </div>
            )}

            {/* VIEW 11: Custodia */}
            {currentView === 'assignments' && (
              <Assignments 
                assignments={assignments}
                assets={assets}
                users={users}
                onAssign={handleAssignCustody}
                onReturn={handleReturnCustody}
              />
            )}

            {/* VIEW 12: Colaboradores */}
            {currentView === 'users' && (
              <UsersList 
                users={users}
                assets={assets}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
              />
            )}

            {/* VIEW 13: Live WinBacar Telemetry (Sistema) */}
            {currentView === 'sistema' && (
              <div id="agent-systems-view" className="space-y-6">
                
                {/* Title */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Terminales Corporativas: WinBacar Monitor</h1>
                    <p className="text-xs text-slate-500">Administra y envía tareas remotas a los agentes instalados en las computadoras de los colaboradores.</p>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping mr-1"></span>
                    <span>Canal de Telemetría Activo con Firestore</span>
                  </div>
                </div>

                {/* FILTER TOOLBAR */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3">
                  {/* Search input bar */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Buscar por hostname, anydesk ID, UUID..."
                      value={systemSearch}
                      onChange={(e) => setSystemSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all text-slate-700"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Ubicacion filter */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">
                      <span>Ubicación:</span>
                      <select 
                        value={systemUbicacion}
                        onChange={(e) => setSystemUbicacion(e.target.value)}
                        className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer p-0 select-none"
                      >
                        <option value="All">Todas</option>
                        <option value="SISTEMAS">Sistemas</option>
                        <option value="TESORERIA">Tesoreria</option>
                        <option value="SEGURIDAD_PRIVADA">Seguridad Privada</option>
                        <option value="ADMINISTRACION">Administración</option>
                        <option value="CAPITAL_HUMANO">Capital Humano</option>
                        <option value="OPERACIONES">Operaciones</option>
                      </select>
                    </div>

                    {/* Orden filter */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">
                      <span>Ordenar:</span>
                      <select 
                        value={systemOrden}
                        onChange={(e) => setSystemOrden(e.target.value)}
                        className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer p-0 select-none box-border"
                      >
                        <option value="Hostname A-Z">Hostname A-Z</option>
                        <option value="Hostname Z-A">Hostname Z-A</option>
                        <option value="CPU más alto">CPU más alto</option>
                        <option value="RAM más alta">RAM más alta</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* COMMAND RESULT ALERT MESSAGE */}
                {agentCommandResult && (
                  <div className="p-3 border border-indigo-200 bg-indigo-50 text-indigo-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                    <span>{agentCommandResult}</span>
                  </div>
                )}

                {/* GRID OF COMPUTERS - FIRESTORE INSPIRED BY SCREENS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredAgentsList.map((comp) => {
                    const hostDetails = triggeredCommands[comp.hostname] || null;
                    return (
                      <div 
                        key={comp.uuid}
                        onClick={() => setSelectedAgent(comp)}
                        className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-600 transition-all cursor-pointer flex flex-col justify-between space-y-4 group hover:shadow-md"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" title="ONLINE"></span>
                            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">{comp.hostname}</h3>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">v6.1.0</span>
                        </div>

                        {/* General mini specs */}
                        <div className="space-y-1.5 text-xs text-slate-600 leading-snug">
                          <p><span className="font-semibold text-slate-700">OS:</span> {comp.sistema_operativo}</p>
                          <p><span className="font-semibold text-slate-700">AnyDesk ID:</span> <span className="font-mono">{comp.anydesk_id}</span></p>
                          <p><span className="font-semibold text-slate-700">Jurisdicción:</span> {comp.ubicacion || 'General'}</p>
                        </div>

                        {/* Mini CPU progress bar */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold gap-4">
                          <div className="flex-1 space-y-1">
                            <span className="text-[9px] text-slate-400 block font-normal">CPU {comp.cpu_uso_porcentaje}%</span>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600" style={{ width: `${comp.cpu_uso_porcentaje}%` }} />
                            </div>
                          </div>

                          <div className="flex-1 space-y-1">
                            <span className="text-[9px] text-slate-400 block font-normal">RAM {comp.ram_uso_porcentaje}%</span>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600" style={{ width: `${comp.ram_uso_porcentaje}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Current Queue tasks */}
                        {hostDetails && (
                          <div className="p-2 border border-indigo-100 bg-indigo-50/25 rounded-md text-[10px] text-indigo-800">
                            <p className="font-semibold">Tarea pendiente en Firestore:</p>
                            <p>{hostDetails.command} ({hostDetails.date})</p>
                          </div>
                        )}

                        {/* Trigger quick actions */}
                        <div className="pt-1 flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleTriggerAgentCommand(comp.hostname, 'ACTUALIZAR_AGENTE')}
                            className="p-1 px-2 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold"
                          >
                            Actualizar Agente
                          </button>
                          <button 
                            onClick={() => handleTriggerAgentCommand(comp.hostname, 'RESETEAR_ID')}
                            className="p-1 px-2 text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-bold"
                          >
                            Resetear Id
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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

import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import SidebarNav from './components/SidebarNav';
import SidebarAuthFooter from './components/SidebarAuthFooter';
import { LOGO_ICON_PROPS } from './lib/navIcons';
import { useFirebaseAuthUser } from './hooks/useFirebaseAuth';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ComputadoraList from './pages/ComputadoraList';
import ComputadorasListLayout from './pages/ComputadorasListLayout';
import ComputadoraAsignaciones from './pages/ComputadoraAsignaciones';
import ComputadoraNueva from './pages/ComputadoraNueva';
import ComputadoraDetail from './pages/ComputadoraDetail';
import PerifericosTodosList from './pages/PerifericosTodosList';
import PerifericosImpresorasList from './pages/PerifericosImpresorasList';
import PerifericosMonitoresList from './pages/PerifericosMonitoresList';
import PerifericosTecladosList from './pages/PerifericosTecladosList';
import PerifericosMouseList from './pages/PerifericosMouseList';
import PerifericosWebcamsList from './pages/PerifericosWebcamsList';
import PerifericosParlantesList from './pages/PerifericosParlantesList';
import PerifericosMicrofonosList from './pages/PerifericosMicrofonosList';
import PerifericoManualList from './pages/PerifericoManualList';
import PerifericoManualNuevo from './pages/PerifericoManualNuevo';
import PerifericoManualDetail from './pages/PerifericoManualDetail';
import CamaraList from './pages/CamaraList';
import CamaraNueva from './pages/CamaraNueva';
import CamaraDetail from './pages/CamaraDetail';
import RoutersSwitchesList from './pages/RoutersSwitchesList';
import RouterDetail from './pages/RouterDetail';
import NvrList from './pages/NvrList';
import NvrNueva from './pages/NvrNueva';
import NvrDetail from './pages/NvrDetail';
import SwitchDetail from './pages/SwitchDetail';
import MaquinaTesoreriaList from './pages/MaquinaTesoreriaList';
import MaquinaTesoreriaDetail from './pages/MaquinaTesoreriaDetail';
import InfraestructuraDashboard from './pages/InfraestructuraDashboard';
import ServidorList from './pages/ServidorList';
import ServidorDetalle from './pages/ServidorDetalle';
import System from './pages/System';
import MiPerfil from './pages/MiPerfil';
import './App.css';
import { PerifericosAgenteListadosProvider } from './context/PerifericosAgenteListadosContext';

const LogoIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#storeui-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <defs>
      <linearGradient id="storeui-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff7a59" />
        <stop offset="50%" stopColor="#c250c5" />
        <stop offset="100%" stopColor="#4a6cf7" />
      </linearGradient>
    </defs>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <polyline points="5 8 7 10 10 7" />
    <line x1="13" y1="8.5" x2="19" y2="8.5" />
    <polyline points="5 12 7 14 10 11" />
    <line x1="13" y1="12.5" x2="19" y2="12.5" />
  </svg>
);

function AppShell() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="layout">
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <span className="logo">
            <span className="logo-icon" aria-hidden>
              <LogoIcon {...LOGO_ICON_PROPS} />
            </span>
            <span className="logo-text">Inventario</span>
          </span>
          <button className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
            <Menu size={20} />
          </button>
        </div>
        <SidebarNav sidebarCollapsed={isCollapsed} />
        <SidebarAuthFooter />
      </aside>
      <div className="main">
        <div className="main-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function ProtectedLayout() {
  const location = useLocation();
  const user = useFirebaseAuthUser();

  if (user === undefined) {
    return (
      <div className="layout layout--boot">
        <p className="estado-msg layout-boot-msg">Cargando…</p>
      </div>
    );
  }

  if (user !== false && !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <PerifericosAgenteListadosProvider>
      <AppShell />
    </PerifericosAgenteListadosProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/computadoras" element={<ComputadorasListLayout />}>
          <Route path="asignaciones" element={<ComputadoraAsignaciones />} />
          <Route path="nueva" element={<ComputadoraNueva />} />
          <Route path="" element={<ComputadoraList />}>
            <Route path=":uuid" element={<ComputadoraDetail />} />
          </Route>
        </Route>
        <Route path="/perifericos" element={<PerifericosTodosList />} />
        <Route path="/perifericos/impresoras" element={<PerifericosImpresorasList />} />
        <Route path="/perifericos/monitores" element={<PerifericosMonitoresList />} />
        <Route path="/perifericos/teclados" element={<PerifericosTecladosList />} />
        <Route path="/perifericos/mouse" element={<PerifericosMouseList />} />
        <Route path="/perifericos/webcams" element={<PerifericosWebcamsList />} />
        <Route path="/perifericos/parlantes" element={<PerifericosParlantesList />} />
        <Route path="/perifericos/microfonos" element={<PerifericosMicrofonosList />} />
        <Route path="/perifericos/stock" element={<PerifericoManualList />} />
        <Route path="/perifericos/stock/nuevo" element={<PerifericoManualNuevo />} />
        <Route path="/perifericos/stock/:id" element={<PerifericoManualDetail />} />
        <Route path="/infraestructura" element={<InfraestructuraDashboard />} />
        <Route path="/camaras" element={<CamaraList />} />
        <Route path="/camaras/nueva" element={<CamaraNueva />} />
        <Route path="/camaras/:id" element={<CamaraDetail />} />
        <Route path="/routers-switches" element={<RoutersSwitchesList />} />
        <Route path="/routers/:id" element={<RouterDetail />} />
        <Route path="/nvrs" element={<NvrList />} />
        <Route path="/nvrs/nueva" element={<NvrNueva />} />
        <Route path="/nvrs/:id" element={<NvrDetail />} />
        <Route path="/switches/:id" element={<SwitchDetail />} />
        <Route path="/maquinas-tesoreria" element={<MaquinaTesoreriaList />} />
        <Route path="/maquinas-tesoreria/:id" element={<MaquinaTesoreriaDetail />} />
        <Route path="/servidores" element={<ServidorList />} />
        <Route path="/servidores/:id" element={<ServidorDetalle />} />
        <Route path="/system" element={<System />} />
        <Route path="/perfil" element={<MiPerfil />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;

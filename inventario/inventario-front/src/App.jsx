import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Monitor } from 'lucide-react';
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
import RouterList from './pages/RouterList';
import RouterDetail from './pages/RouterDetail';
import NvrList from './pages/NvrList';
import NvrNueva from './pages/NvrNueva';
import NvrDetail from './pages/NvrDetail';
import SwitchList from './pages/SwitchList';
import SwitchDetail from './pages/SwitchDetail';
import MaquinaTesoreriaList from './pages/MaquinaTesoreriaList';
import MaquinaTesoreriaDetail from './pages/MaquinaTesoreriaDetail';
import InfraestructuraDashboard from './pages/InfraestructuraDashboard';
import System from './pages/System';
import './App.css';
import { PerifericosAgenteListadosProvider } from './context/PerifericosAgenteListadosContext';

function AppShell() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <span className="logo">
          <span className="logo-icon" aria-hidden>
            <Monitor {...LOGO_ICON_PROPS} />
          </span>
          Inventario BACARSA
        </span>
        <SidebarNav />
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
          <Route index element={<ComputadoraList />} />
          <Route path="asignaciones" element={<ComputadoraAsignaciones />} />
          <Route path="nueva" element={<ComputadoraNueva />} />
          <Route path=":uuid" element={<ComputadoraDetail />} />
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
        <Route path="/routers" element={<RouterList />} />
        <Route path="/routers/:id" element={<RouterDetail />} />
        <Route path="/nvrs" element={<NvrList />} />
        <Route path="/nvrs/nueva" element={<NvrNueva />} />
        <Route path="/nvrs/:id" element={<NvrDetail />} />
        <Route path="/switches" element={<SwitchList />} />
        <Route path="/switches/:id" element={<SwitchDetail />} />
        <Route path="/maquinas-tesoreria" element={<MaquinaTesoreriaList />} />
        <Route path="/maquinas-tesoreria/:id" element={<MaquinaTesoreriaDetail />} />
        <Route path="/system" element={<System />} />
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

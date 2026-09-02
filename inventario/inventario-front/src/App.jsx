import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useState, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Menu, X, LogOut } from 'lucide-react';
import SidebarNav from './components/SidebarNav';
import SidebarAuthFooter from './components/SidebarAuthFooter';
import { useFirebaseAuthUser } from './hooks/useFirebaseAuth';
import { PermisosProvider } from './context/PermisosContext';
import { PermisosBoot, RequireWrite, RequireAdmin } from './components/RoutePermiso';
import PwaInstallBanner from './components/PwaInstallBanner';
import { getFirebaseAuth } from './lib/firebase';
import Login from './pages/Login';
import './App.css';
import { PerifericosAgenteListadosProvider } from './context/PerifericosAgenteListadosContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Reportes = lazy(() => import('./pages/Reportes'));
const ComputadoraList = lazy(() => import('./pages/ComputadoraList'));
const ComputadorasListLayout = lazy(() => import('./pages/ComputadorasListLayout'));
const ComputadoraAsignaciones = lazy(() => import('./pages/ComputadoraAsignaciones'));
const ComputadoraNueva = lazy(() => import('./pages/ComputadoraNueva'));
const ComputadoraDetail = lazy(() => import('./pages/ComputadoraDetail'));
const PerifericosTodosList = lazy(() => import('./pages/PerifericosTodosList'));
const PerifericosDashboard = lazy(() => import('./pages/PerifericosDashboard'));
const AccessPointList = lazy(() => import('./pages/AccessPointList'));
const AccessPointDetail = lazy(() => import('./pages/AccessPointDetail'));
const PerifericosImpresorasList = lazy(() => import('./pages/PerifericosImpresorasList'));
const PerifericosMonitoresList = lazy(() => import('./pages/PerifericosMonitoresList'));
const PerifericosTecladosList = lazy(() => import('./pages/PerifericosTecladosList'));
const PerifericosMouseList = lazy(() => import('./pages/PerifericosMouseList'));
const PerifericosWebcamsList = lazy(() => import('./pages/PerifericosWebcamsList'));
const PerifericosParlantesList = lazy(() => import('./pages/PerifericosParlantesList'));
const PerifericosMicrofonosList = lazy(() => import('./pages/PerifericosMicrofonosList'));
const PerifericoManualList = lazy(() => import('./pages/PerifericoManualList'));
const PerifericoManualNuevo = lazy(() => import('./pages/PerifericoManualNuevo'));
const PerifericoManualDetail = lazy(() => import('./pages/PerifericoManualDetail'));
const CamaraList = lazy(() => import('./pages/CamaraList'));
const CamaraNueva = lazy(() => import('./pages/CamaraNueva'));
const CamaraDetail = lazy(() => import('./pages/CamaraDetail'));
const RouterList = lazy(() => import('./pages/RouterList'));
const SwitchList = lazy(() => import('./pages/SwitchList'));
const RoutersSwitchesList = lazy(() => import('./pages/RoutersSwitchesList'));
const RouterDetail = lazy(() => import('./pages/RouterDetail'));
const NvrList = lazy(() => import('./pages/NvrList'));
const NvrNueva = lazy(() => import('./pages/NvrNueva'));
const NvrDetail = lazy(() => import('./pages/NvrDetail'));
const SwitchDetail = lazy(() => import('./pages/SwitchDetail'));
const MaquinaTesoreriaList = lazy(() => import('./pages/MaquinaTesoreriaList'));
const MaquinaTesoreriaDetail = lazy(() => import('./pages/MaquinaTesoreriaDetail'));
const InfraestructuraDashboard = lazy(() => import('./pages/InfraestructuraDashboard'));
const ServidorList = lazy(() => import('./pages/ServidorList'));
const ServidorDetalle = lazy(() => import('./pages/ServidorDetalle'));
const TelefonoIpList = lazy(() => import('./pages/TelefonoIpList'));
const TelevisorList = lazy(() => import('./pages/TelevisorList'));
const CelularList = lazy(() => import('./pages/CelularList'));
const System = lazy(() => import('./pages/System'));
const UsuariosAdmin = lazy(() => import('./pages/UsuariosAdmin'));
const MiPerfil = lazy(() => import('./pages/MiPerfil'));
const EtiquetasQrList = lazy(() => import('./pages/EtiquetasQrList'));
const EtiquetaQrFicha = lazy(() => import('./pages/EtiquetaQrFicha'));

function RouteFallback() {
  return (
    <div className="p-8 text-center text-slate-500 font-medium">Cargando página…</div>
  );
}

function AppShell() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    try {
      getFirebaseAuth().signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      <div className="mobile-header">
        <button
          onClick={() => {
            setIsCollapsed(false);
            setMobileMenuOpen(true);
          }}
          className="mobile-header-btn"
          title="Abrir menú"
        >
          <Menu className="w-5 h-5 text-slate-300" />
        </button>
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold tracking-tight text-white font-sans text-sm leading-none">
            BACAR<span className="text-accent">.</span>it
          </span>
          <span className="text-[10px] text-slate-500 font-medium">v2.1</span>
        </div>
        <button
          onClick={handleLogout}
          className="mobile-header-btn text-rose-400 hover:text-rose-300 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="layout">
        <aside className={`sidebar ${isCollapsed && !mobileMenuOpen ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <span className="logo">
              <span className="logo-mark" aria-hidden>B</span>
              <span className="logo-text">
                BACAR<span className="logo-dot">.</span>it
              </span>
              <span className="logo-version">v2.1</span>
            </span>
            <button className="sidebar-toggle hidden lg:flex" onClick={() => setIsCollapsed(!isCollapsed)}>
              <Menu size={20} />
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="sidebar-close lg:hidden flex"
              title="Cerrar menú"
            >
              <X className="w-4.5 h-4.5 text-slate-400" />
            </button>
          </div>
          <SidebarNav
            sidebarCollapsed={isCollapsed && !mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
          <SidebarAuthFooter />
        </aside>
        <div className="main">
          <div className="main-scroll">
            <Suspense fallback={<RouteFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>
      <PwaInstallBanner />
    </>
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
    <PermisosProvider>
      <PermisosBoot>
        <PerifericosAgenteListadosProvider>
          <AppShell />
        </PerifericosAgenteListadosProvider>
      </PermisosBoot>
    </PermisosProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/etiquetas-qr" element={<EtiquetasQrList />} />
        <Route path="/etiquetas-qr/:uuid" element={<EtiquetaQrFicha />} />
        <Route path="/computadoras" element={<ComputadorasListLayout />}>
          <Route path="asignaciones" element={<ComputadoraAsignaciones />} />
          <Route path="" element={<ComputadoraList />}>
            <Route path="nueva" element={<RequireWrite><ComputadoraNueva /></RequireWrite>} />
            <Route path=":uuid" element={<ComputadoraDetail />} />
          </Route>
        </Route>
        <Route path="/perifericos" element={<PerifericosTodosList />} />
        <Route path="/perifericos/dashboard" element={<PerifericosDashboard />} />
        <Route path="/perifericos/impresoras" element={<PerifericosImpresorasList />} />
        <Route path="/perifericos/monitores" element={<PerifericosMonitoresList />} />
        <Route path="/perifericos/teclados" element={<PerifericosTecladosList />} />
        <Route path="/perifericos/mouse" element={<PerifericosMouseList />} />
        <Route path="/perifericos/webcams" element={<PerifericosWebcamsList />} />
        <Route path="/perifericos/parlantes" element={<PerifericosParlantesList />} />
        <Route path="/perifericos/microfonos" element={<PerifericosMicrofonosList />} />
        <Route path="/perifericos/televisores" element={<TelevisorList />} />
        <Route path="/perifericos/celulares" element={<CelularList />} />
        <Route path="/perifericos/stock" element={<PerifericoManualList />}>
          <Route path=":id" element={<PerifericoManualDetail />} />
        </Route>
        <Route path="/perifericos/stock/nuevo" element={<RequireWrite><PerifericoManualNuevo /></RequireWrite>} />
        <Route path="/infraestructura" element={<InfraestructuraDashboard />} />
        <Route path="/camaras" element={<CamaraList />}>
          <Route path=":id" element={<CamaraDetail />} />
        </Route>
        <Route path="/camaras/nueva" element={<RequireWrite><CamaraNueva /></RequireWrite>} />
        <Route path="/routers-switches" element={<RoutersSwitchesList />} />
        <Route path="/routers" element={<RouterList />}>
          <Route path=":id" element={<RouterDetail />} />
        </Route>
        <Route path="/switches" element={<SwitchList />}>
          <Route path=":id" element={<SwitchDetail />} />
        </Route>
        <Route path="/access-points" element={<AccessPointList />}>
          <Route path=":id" element={<AccessPointDetail />} />
        </Route>
        <Route path="/nvrs" element={<NvrList />}>
          <Route path=":id" element={<NvrDetail />} />
        </Route>
        <Route path="/nvrs/nueva" element={<RequireWrite><NvrNueva /></RequireWrite>} />
        <Route path="/maquinas-tesoreria" element={<MaquinaTesoreriaList />}>
          <Route path=":id" element={<MaquinaTesoreriaDetail />} />
        </Route>
        <Route path="/telefonos" element={<TelefonoIpList />} />
        <Route path="/servidores" element={<ServidorList />}>
          <Route path=":id" element={<ServidorDetalle />} />
        </Route>
        <Route path="/system" element={<RequireAdmin><System /></RequireAdmin>} />
        <Route path="/admin/usuarios" element={<RequireAdmin><UsuariosAdmin /></RequireAdmin>} />
        <Route path="/perfil" element={<MiPerfil />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="app-root">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

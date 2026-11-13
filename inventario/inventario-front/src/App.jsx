import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useState, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Menu, X, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import SidebarNav from './components/SidebarNav';
import SidebarAuthFooter from './components/SidebarAuthFooter';
import TopBar from './components/TopBar';
import { useFirebaseAuthUser } from './hooks/useFirebaseAuth';
import { PermisosProvider, usePermisos } from './context/PermisosContext';
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
const StockPage = lazy(() => import('./pages/StockPage'));
const NvrsCamarasList = lazy(() => import('./pages/NvrsCamarasList'));
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
const ConfiguracionSistema = lazy(() => import('./pages/ConfiguracionSistema'));
const EtiquetasQrList = lazy(() => import('./pages/EtiquetasQrList'));
const EtiquetaQrFicha = lazy(() => import('./pages/EtiquetaQrFicha'));
const ConciliacionesList = lazy(() => import('./pages/ConciliacionesList'));
const ResponsablesList = lazy(() => import('./pages/ResponsablesList'));
const ResponsableDetail = lazy(() => import('./pages/ResponsableDetail'));

function RouteFallback() {
  return (
    <div className="p-8 text-center text-slate-500 font-medium">Cargando página…</div>
  );
}

function MainContentSkeleton() {
  return (
    <div className="p-6 space-y-4" aria-busy="true" aria-label="Cargando permisos">
      <div className="h-8 w-48 rounded-lg bg-slate-200/80 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-36 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
    </div>
  );
}

function AppShell() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { loading: permisosLoading } = usePermisos();

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
            <button
              className="sidebar-toggle hidden lg:flex"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
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
          <SidebarAuthFooter sidebarCollapsed={isCollapsed && !mobileMenuOpen} />
        </aside>
        <div className="main">
          <TopBar />
          <div className="main-scroll">
            {permisosLoading ? (
              <MainContentSkeleton />
            ) : (
              <Suspense fallback={<RouteFallback />}>
                <Outlet />
              </Suspense>
            )}
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
        <Route path="/eventos-hardware" element={<Navigate to="/" replace />} />
        <Route path="/eventos-hardware/:id" element={<Navigate to="/" replace />} />
        <Route path="/conciliaciones" element={<ConciliacionesList />} />
        <Route path="/computadoras" element={<ComputadorasListLayout />}>
          <Route path="asignaciones" element={<Navigate to="/computadoras" replace />} />
          <Route path="" element={<ComputadoraList />}>
            <Route path="nueva" element={<RequireWrite><ComputadoraNueva /></RequireWrite>} />
            <Route path=":uuid" element={<ComputadoraDetail />} />
          </Route>
        </Route>
        <Route path="/responsables" element={<Navigate to="/configuracion?tab=responsables" replace />} />
        <Route path="/responsables/:id" element={<ResponsableDetail />} />
        <Route path="/perifericos" element={<PerifericosTodosList />} />
        <Route path="/perifericos/dashboard" element={<Navigate to="/perifericos" replace />} />
        <Route path="/perifericos/monitores" element={<Navigate to="/perifericos?tipo=monitores" replace />} />
        <Route path="/perifericos/teclados" element={<Navigate to="/perifericos?tipo=teclados" replace />} />
        <Route path="/perifericos/mouse" element={<Navigate to="/perifericos?tipo=mouse" replace />} />
        <Route path="/perifericos/webcams" element={<Navigate to="/perifericos?tipo=webcams" replace />} />
        <Route path="/perifericos/parlantes" element={<Navigate to="/perifericos?tipo=audio" replace />} />
        <Route path="/perifericos/microfonos" element={<Navigate to="/perifericos?tipo=audio" replace />} />
        <Route path="/perifericos/impresoras" element={<Navigate to="/perifericos?tipo=impresoras" replace />} />
        <Route path="/perifericos/televisores" element={<Navigate to="/perifericos?tipo=televisores" replace />} />
        <Route path="/perifericos/celulares" element={<Navigate to="/perifericos?tipo=celulares" replace />} />
        <Route path="/deposito" element={<StockPage />} />
        <Route path="/asignaciones-stock" element={<Navigate to="/deposito?tab=asignaciones" replace />} />
        <Route path="/perifericos/stock/*" element={<Navigate to="/deposito" replace />} />
        <Route path="/perifericos/stock" element={<Navigate to="/deposito" replace />} />
        <Route path="/infraestructura" element={<InfraestructuraDashboard />} />
        <Route path="/camaras" element={<NvrsCamarasList />}>
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
        <Route path="/nvrs" element={<NvrsCamarasList />}>
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
        <Route path="/configuracion" element={<ConfiguracionSistema />} />
        <Route path="/system" element={<Navigate to="/configuracion?tab=agente" replace />} />
        <Route path="/admin/usuarios" element={<Navigate to="/configuracion?tab=usuarios" replace />} />
        <Route path="/admin/catalogos" element={<Navigate to="/configuracion?tab=catalogos" replace />} />
        <Route path="/investigacion" element={<Navigate to="/" replace />} />
        <Route path="/perfil" element={<Navigate to="/configuracion?tab=perfil" replace />} />
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

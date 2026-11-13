import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart2,
  QrCode,
  ArrowLeftRight,
  Monitor,
  Printer,
  MonitorSpeaker,
  Keyboard,
  Mouse,
  Video,
  Speaker,
  Mic,
  Tv,
  Smartphone,
  Package,
  ClipboardCheck,
  Network,
  HardDrive,
  Cctv,
  Server,
  GitFork,
  Wifi,
  Banknote,
  PhoneCall,
  FileText,
  UserRound,
  UserCog,
  BookOpen,
  Terminal,
  Sliders,
} from 'lucide-react';
import { useConciliacionesPendientesCount } from '../hooks/useConciliacionesPendientesCount';

export default function SidebarNav({ sidebarCollapsed, onMobileClose }) {
  const location = useLocation();
  const { data: conciliacionesData } = useConciliacionesPendientesCount();
  const conciliacionesCount = conciliacionesData?.count ?? 3;

  const navItemClass = ({ isActive }) =>
    `nav-link w-full text-left flex items-center ${
      sidebarCollapsed ? 'justify-center px-0' : 'justify-start gap-2.5 px-3'
    } py-2 rounded-lg text-xs font-medium transition-all ${
      isActive
        ? 'nav-link-active bg-[#1c2237] text-white font-semibold'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
    }`;

  const isDepositoStockActive =
    location.pathname === '/deposito' &&
    (!location.search || location.search.includes('tab=deposito'));

  const isDepositoAsigActive =
    location.pathname === '/deposito' && location.search.includes('tab=asignaciones');

  return (
    <nav className="nav flex flex-col gap-0.5 px-2 sm:px-3 py-2 overflow-y-auto flex-1 min-h-0 select-none">
      {/* ── GENERAL ── */}
      <div className="nav-section-title text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-2.5 pb-1">
        General
      </div>

      <NavLink onClick={onMobileClose} to="/" title="Inicio" className={navItemClass} end>
        <LayoutDashboard className="w-4 h-4 shrink-0" />
        <span className="nav-link-text truncate">Inicio</span>
      </NavLink>

      <NavLink onClick={onMobileClose} to="/reportes" title="Reportes" className={navItemClass}>
        <BarChart2 className="w-4 h-4 shrink-0" />
        <span className="nav-link-text truncate">Reportes</span>
      </NavLink>

      <NavLink onClick={onMobileClose} to="/etiquetas-qr" title="Etiquetas QR" className={navItemClass}>
        <QrCode className="w-4 h-4 shrink-0" />
        <span className="nav-link-text truncate">Etiquetas QR</span>
      </NavLink>

      <NavLink onClick={onMobileClose} to="/conciliaciones" title="Conciliaciones" className={navItemClass}>
        <ArrowLeftRight className="w-4 h-4 shrink-0" />
        <span className="nav-link-text truncate flex-1">Conciliaciones</span>
        {conciliacionesCount > 0 && (
          <span className="nav-badge w-4.5 h-4.5 rounded-full text-[10px] font-bold bg-blue-600 text-white flex items-center justify-center shrink-0">
            {conciliacionesCount}
          </span>
        )}
      </NavLink>

      {/* ── HARDWARE ── */}
      <div className="nav-section-title text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-3.5 pb-1">
        Hardware
      </div>

      <NavLink onClick={onMobileClose} to="/computadoras" title="Computadoras" className={navItemClass}>
        <Monitor className="w-4 h-4 shrink-0" />
        <span className="nav-link-text truncate">Computadoras</span>
      </NavLink>

      <NavLink
        onClick={onMobileClose}
        to="/perifericos"
        title="Periféricos"
        className={({ isActive }) =>
          `nav-link w-full text-left flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'justify-start gap-2.5 px-3'
          } py-2 rounded-lg text-xs font-medium transition-all ${
            location.pathname.startsWith('/perifericos')
              ? 'nav-link-active bg-[#1c2237] text-white font-semibold'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
          }`
        }
      >
        <MonitorSpeaker className="w-4 h-4 shrink-0" />
        <span className="nav-link-text truncate">Periféricos</span>
      </NavLink>

      {/* ── DEPÓSITO ── */}
      <div className="nav-section-title text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-3.5 pb-1">
        Depósito
      </div>

      <NavLink
        onClick={onMobileClose}
        to="/deposito?tab=deposito"
        title="Stock de Depósito"
        className={`nav-link w-full text-left flex items-center ${
          sidebarCollapsed ? 'justify-center px-0' : 'justify-start gap-2.5 px-3'
        } py-2 rounded-lg text-xs font-medium transition-all ${
          isDepositoStockActive
            ? 'nav-link-active bg-[#1c2237] text-white font-semibold'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
        }`}
      >
        <Package className="w-4 h-4 shrink-0" />
        <span className="nav-link-text truncate">Stock de Depósito</span>
      </NavLink>

      <NavLink
        onClick={onMobileClose}
        to="/deposito?tab=asignaciones"
        title="Asignaciones de Stock"
        className={`nav-link w-full text-left flex items-center ${
          sidebarCollapsed ? 'justify-center px-0' : 'justify-start gap-2.5 px-3'
        } py-2 rounded-lg text-xs font-medium transition-all ${
          isDepositoAsigActive
            ? 'nav-link-active bg-[#1c2237] text-white font-semibold'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
        }`}
      >
        <ClipboardCheck className="w-4 h-4 shrink-0" />
        <span className="nav-link-text truncate">Asignaciones de Stock</span>
      </NavLink>

      {/* ── INFRAESTRUCTURA ── */}
      <div className="nav-section-title text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-3.5 pb-1">
        Infraestructura
      </div>

      <NavLink onClick={onMobileClose} to="/infraestructura" title="Resumen Infra" className={navItemClass} end>
        <Network className="w-4 h-4 shrink-0" />
        <span className="nav-link-text truncate">Resumen Infra</span>
      </NavLink>

      <NavLink
        onClick={onMobileClose}
        to="/nvrs"
        title="NVR y Cámaras IP"
        className={({ isActive }) =>
          `nav-link w-full text-left flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'justify-start gap-2.5 px-3'
          } py-2 rounded-lg text-xs font-medium transition-all ${
            isActive || location.pathname.startsWith('/camaras')
              ? 'nav-link-active bg-[#1c2237] text-white font-semibold'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
          }`
        }
      >
        <HardDrive className="w-4 h-4 shrink-0" />
        <span className="nav-link-text truncate">NVR y Cámaras IP</span>
      </NavLink>

      <NavLink onClick={onMobileClose} to="/servidores" title="Servidores" className={navItemClass}>
        <Server className="w-4 h-4 shrink-0" />
        <span className="nav-link-text truncate">Servidores</span>
      </NavLink>

      <NavLink
        onClick={onMobileClose}
        to="/routers-switches"
        title="Routers, Switches y AP"
        className={({ isActive }) =>
          `nav-link w-full text-left flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'justify-start gap-2.5 px-3'
          } py-2 rounded-lg text-xs font-medium transition-all ${
            isActive ||
            location.pathname.startsWith('/routers') ||
            location.pathname.startsWith('/switches') ||
            location.pathname.startsWith('/access-points')
              ? 'nav-link-active bg-[#1c2237] text-white font-semibold'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
          }`
        }
      >
        <GitFork className="w-4 h-4 shrink-0" />
        <span className="nav-link-text truncate">Routers, Switches y AP</span>
      </NavLink>

      <NavLink onClick={onMobileClose} to="/maquinas-tesoreria" title="Máquinas de Tesorería" className={navItemClass}>
        <Banknote className="w-4 h-4 shrink-0" />
        <span className="nav-link-text truncate">Máquinas de Tesorería</span>
      </NavLink>

      <NavLink onClick={onMobileClose} to="/telefonos" title="Teléfonos IP" className={navItemClass}>
        <PhoneCall className="w-4 h-4 shrink-0" />
        <span className="nav-link-text truncate">Teléfonos IP</span>
      </NavLink>

      {/* ── ADMINISTRACIÓN ── */}
      <div className="nav-section-title text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-3.5 pb-1">
        Administración
      </div>

      <NavLink
        onClick={onMobileClose}
        to="/configuracion"
        title="Configuración"
        className={({ isActive }) =>
          `nav-link w-full text-left flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'justify-start gap-2.5 px-3'
          } py-2 rounded-lg text-xs font-medium transition-all ${
            isActive || location.pathname.startsWith('/configuracion')
              ? 'nav-link-active bg-[#1c2237] text-white font-semibold'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
          }`
        }
      >
        <Sliders className="w-4 h-4 shrink-0" />
        <span className="nav-link-text truncate">Configuración</span>
      </NavLink>
    </nav>
  );
}

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Laptop,
  Cpu,
  Network,
  Package,
  Terminal,
  ChevronRight,
  BarChart3,
  UserCog,
  FileText,
  Monitor,
  Printer,
  Activity,
  Server,
  Camera,
  Keyboard,
  Mouse,
  Webcam,
  Volume2,
  Mic,
  Tv2,
  Smartphone,
  Router,
  Banknote,
  Phone,
  QrCode,
} from 'lucide-react';
import AdminGate from './AdminGate';

export default function SidebarNav({ sidebarCollapsed, onMobileClose }) {
  const [hardwareExpanded, setHardwareExpanded] = useState(true);
  const [perifericosExpanded, setPerifericosExpanded] = useState(true);
  const [infraestructuraExpanded, setInfraestructuraExpanded] = useState(true);

  const navLinkClass = ({ isActive }) => `nav-link w-full text-left ${isActive ? 'active' : ''}`;

  return (
    <nav className="nav">
      <div className="nav-section-title">General</div>

      <NavLink onClick={onMobileClose} to="/" className={navLinkClass} end>
        <Home className="w-4 h-4" />
        <span className="nav-link-text">Inicio</span>
      </NavLink>

      <NavLink onClick={onMobileClose} to="/reportes" className={navLinkClass}>
        <BarChart3 className="w-4 h-4" />
        <span className="nav-link-text">Reportes</span>
      </NavLink>

      <NavLink onClick={onMobileClose} to="/etiquetas-qr" className={navLinkClass}>
        <QrCode className="w-4 h-4" />
        <span className="nav-link-text">Etiquetas QR</span>
      </NavLink>

      <div className="nav-group">
        <button
          type="button"
          onClick={() => setHardwareExpanded(!hardwareExpanded)}
          className="nav-group-header w-full text-left"
        >
          <div className="nav-group-header-inner">
            <Laptop className="w-4 h-4" />
            <span className="nav-link-text">Hardware</span>
          </div>
          {!sidebarCollapsed && (
            <ChevronRight
              className={`w-3 h-3 nav-group-chevron transition-transform duration-200 ${hardwareExpanded ? 'rotate-90' : ''}`}
            />
          )}
        </button>
        {hardwareExpanded && (
          <div className="nav-group-children">
            <NavLink onClick={onMobileClose} to="/computadoras" className={navLinkClass} end>
              <Monitor className="w-3.5 h-3.5" />
              <span className="nav-link-text">Computadoras</span>
            </NavLink>
            <NavLink onClick={onMobileClose} to="/perifericos/impresoras" className={navLinkClass}>
              <Printer className="w-3.5 h-3.5" />
              <span className="nav-link-text">Impresoras</span>
            </NavLink>
            <NavLink onClick={onMobileClose} to="/perifericos/monitores" className={navLinkClass}>
              <Monitor className="w-3.5 h-3.5" />
              <span className="nav-link-text">Monitores</span>
            </NavLink>
          </div>
        )}
      </div>

      <div className="nav-group">
        <div className="nav-group-header-row">
          <NavLink
            onClick={onMobileClose}
            to="/perifericos/dashboard"
            className={({ isActive }) =>
              `nav-link nav-group-header-link ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-group-header-inner">
              <Cpu className="w-4 h-4" />
              <span className="nav-link-text">Periféricos</span>
            </div>
          </NavLink>
          {!sidebarCollapsed && (
            <button
              type="button"
              className="nav-group-chevron-btn"
              aria-label={perifericosExpanded ? 'Colapsar periféricos' : 'Expandir periféricos'}
              onClick={() => setPerifericosExpanded(!perifericosExpanded)}
            >
              <ChevronRight
                className={`w-3 h-3 nav-group-chevron-svg transition-transform duration-200 ${perifericosExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          )}
        </div>
        {perifericosExpanded && (
          <div className="nav-group-children">
            <NavLink onClick={onMobileClose} to="/perifericos/teclados" className={navLinkClass}>
              <Keyboard className="w-3.5 h-3.5" />
              <span className="nav-link-text">Teclados</span>
            </NavLink>
            <NavLink onClick={onMobileClose} to="/perifericos/mouse" className={navLinkClass}>
              <Mouse className="w-3.5 h-3.5" />
              <span className="nav-link-text">Mouse</span>
            </NavLink>
            <NavLink onClick={onMobileClose} to="/perifericos/webcams" className={navLinkClass}>
              <Webcam className="w-3.5 h-3.5" />
              <span className="nav-link-text">Webcams</span>
            </NavLink>
            <NavLink onClick={onMobileClose} to="/perifericos/parlantes" className={navLinkClass}>
              <Volume2 className="w-3.5 h-3.5" />
              <span className="nav-link-text">Parlantes</span>
            </NavLink>
            <NavLink onClick={onMobileClose} to="/perifericos/microfonos" className={navLinkClass}>
              <Mic className="w-3.5 h-3.5" />
              <span className="nav-link-text">Micrófonos</span>
            </NavLink>
            <NavLink onClick={onMobileClose} to="/perifericos/televisores" className={navLinkClass}>
              <Tv2 className="w-3.5 h-3.5" />
              <span className="nav-link-text">Televisores</span>
            </NavLink>
            <NavLink onClick={onMobileClose} to="/perifericos/celulares" className={navLinkClass}>
              <Smartphone className="w-3.5 h-3.5" />
              <span className="nav-link-text">Celulares</span>
            </NavLink>
          </div>
        )}
      </div>

      <div className="nav-section-title">Depósito</div>

      <NavLink onClick={onMobileClose} to="/perifericos/stock" className={navLinkClass}>
        <Package className="w-4 h-4" />
        <span className="nav-link-text">Stock de Depósito</span>
      </NavLink>

      <div className="nav-group">
        <div className="nav-group-header-row">
          <NavLink
            onClick={onMobileClose}
            to="/infraestructura"
            className={({ isActive }) =>
              `nav-link nav-group-header-link ${isActive ? 'active' : ''}`
            }
            end
          >
            <div className="nav-group-header-inner">
              <Network className="w-4 h-4" />
              <span className="nav-link-text">Infraestructura</span>
            </div>
          </NavLink>
          {!sidebarCollapsed && (
            <button
              type="button"
              className="nav-group-chevron-btn"
              aria-label={infraestructuraExpanded ? 'Colapsar infraestructura' : 'Expandir infraestructura'}
              onClick={() => setInfraestructuraExpanded(!infraestructuraExpanded)}
            >
              <ChevronRight
                className={`w-3 h-3 nav-group-chevron-svg transition-transform duration-200 ${infraestructuraExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          )}
        </div>
        {infraestructuraExpanded && (
          <div className="nav-group-children">
            <NavLink onClick={onMobileClose} to="/infraestructura" className={navLinkClass} end>
              <Activity className="w-3.5 h-3.5" />
              <span className="nav-link-text">Resumen Infra</span>
            </NavLink>
            <NavLink onClick={onMobileClose} to="/nvrs" className={navLinkClass}>
              <Server className="w-3.5 h-3.5" />
              <span className="nav-link-text">NVR</span>
            </NavLink>
            <NavLink onClick={onMobileClose} to="/camaras" className={navLinkClass}>
              <Camera className="w-3.5 h-3.5" />
              <span className="nav-link-text">Cámaras IP</span>
            </NavLink>
            <NavLink onClick={onMobileClose} to="/servidores" className={navLinkClass}>
              <Server className="w-3.5 h-3.5" />
              <span className="nav-link-text">Servidores</span>
            </NavLink>
            <NavLink onClick={onMobileClose} to="/routers-switches" className={navLinkClass}>
              <Router className="w-3.5 h-3.5" />
              <span className="nav-link-text">Routers & Switches</span>
            </NavLink>
            <NavLink onClick={onMobileClose} to="/maquinas-tesoreria" className={navLinkClass}>
              <Banknote className="w-3.5 h-3.5" />
              <span className="nav-link-text">Máq. Tesorería</span>
            </NavLink>
            <NavLink onClick={onMobileClose} to="/telefonos" className={navLinkClass}>
              <Phone className="w-3.5 h-3.5" />
              <span className="nav-link-text">Teléfonos IP</span>
            </NavLink>
          </div>
        )}
      </div>

      <div className="nav-section-title">Administración</div>

      <NavLink onClick={onMobileClose} to="/perfil" className={navLinkClass}>
        <FileText className="w-4 h-4" />
        <span className="nav-link-text">Mi Perfil</span>
      </NavLink>

      <AdminGate>
        <NavLink onClick={onMobileClose} to="/admin/usuarios" className={navLinkClass}>
          <UserCog className="w-4 h-4" />
          <span className="nav-link-text">Usuarios</span>
        </NavLink>
        <NavLink onClick={onMobileClose} to="/system" className={navLinkClass}>
          <Terminal className="w-4 h-4" />
          <span className="nav-link-text">Sistema</span>
        </NavLink>
      </AdminGate>
    </nav>
  );
}

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Laptop, Cpu, Network, Layers, 
  Terminal, ChevronRight, Layers2, FileText,
  Users, Video, Server, HardDrive
} from 'lucide-react';

export default function SidebarNav({ sidebarCollapsed }) {
  const [hardwareExpanded, setHardwareExpanded] = useState(true);
  const [perifericosExpanded, setPerifericosExpanded] = useState(true);
  const [infraestructuraExpanded, setInfraestructuraExpanded] = useState(true);

  const navLinkClass = ({ isActive }) => `nav-link w-full text-left ${isActive ? 'active' : ''}`;

  return (
    <nav className="nav">
      {/* Section 1: GENERAL */}
      <div className="nav-section-title">General</div>
      
      <NavLink to="/" className={navLinkClass}>
        <Layers2 className="w-4 h-4 text-indigo-400" />
        <span className="nav-link-text">Inicio</span>
      </NavLink>

      {/* Section 2: HARDWARE */}
      <div className="nav-section-title">Hardware</div>

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
            <NavLink to="/computadoras" className={navLinkClass} end>
              <span className="nav-link-text pl-2">Computadoras</span>
            </NavLink>
            <NavLink to="/perifericos/impresoras" className={navLinkClass}>
              <span className="nav-link-text pl-2">Impresoras</span>
            </NavLink>
            <NavLink to="/perifericos/monitores" className={navLinkClass}>
              <span className="nav-link-text pl-2">Monitores</span>
            </NavLink>
          </div>
        )}
      </div>

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
            <NavLink to="/perifericos/teclados" className={navLinkClass}>
              <span className="nav-link-text pl-2">Teclados</span>
            </NavLink>
            <NavLink to="/perifericos/mouse" className={navLinkClass}>
              <span className="nav-link-text pl-2">Mouse</span>
            </NavLink>
            <NavLink to="/perifericos/webcams" className={navLinkClass}>
              <span className="nav-link-text pl-2">Webcams</span>
            </NavLink>
            <NavLink to="/perifericos/parlantes" className={navLinkClass}>
              <span className="nav-link-text pl-2">Parlantes</span>
            </NavLink>
            <NavLink to="/perifericos/microfonos" className={navLinkClass}>
              <span className="nav-link-text pl-2">Micrófonos</span>
            </NavLink>
          </div>
        )}
      </div>

      <NavLink to="/perifericos/stock" className={navLinkClass}>
        <Layers className="w-4 h-4 text-cyan-400" />
        <span className="nav-link-text">Stock</span>
      </NavLink>

      {/* Section 3: INFRAESTRUCTURA */}
      <div className="nav-section-title">Infraestructura</div>

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
            <NavLink to="/nvrs" className={navLinkClass}>
              <span className="nav-link-text pl-2">NVR</span>
            </NavLink>
            <NavLink to="/camaras" className={navLinkClass}>
              <span className="nav-link-text pl-2">Cámaras</span>
            </NavLink>
            <NavLink to="/servidores" className={navLinkClass}>
              <span className="nav-link-text pl-2">Servidores</span>
            </NavLink>
            <NavLink to="/routers-switches" className={navLinkClass}>
              <span className="nav-link-text pl-2">Routers & Switches</span>
            </NavLink>
            <NavLink to="/maquinas-tesoreria" className={navLinkClass}>
              <span className="nav-link-text pl-2">Máq. Tesorería</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Section 4: ADMINISTRACIÓN */}
      <div className="nav-section-title">Administración</div>

      <NavLink to="/perfil" className={navLinkClass}>
        <FileText className="w-4 h-4 text-purple-400" />
        <span className="nav-link-text">Mi Perfil</span>
      </NavLink>

      <NavLink to="/system" className={navLinkClass}>
        <Terminal className="w-4 h-4 text-slate-400" />
        <span className="nav-link-text">Sistema</span>
      </NavLink>
    </nav>
  );
}

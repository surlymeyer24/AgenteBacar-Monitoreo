import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { TOPICOS } from '../constants/topicos';
import { CHEVRON_ICON_PROPS, NAV_ICONS } from '../lib/navIcons';
import NavIcon from './NavIcon';

function pathMatchesChild(pathname, childPath) {
  if (childPath === '/') return pathname === '/';
  return pathname === childPath || pathname.startsWith(`${childPath}/`);
}

function getAutoExpandedIds(pathname) {
  const ids = {};
  TOPICOS.forEach(t => {
    if (!t.children) return;
    const matchChildren = t.children.some(c => pathMatchesChild(pathname, c.path));
    const matchGroupPath = t.path && pathMatchesChild(pathname, t.path);
    if (matchChildren || matchGroupPath) ids[t.id] = true;
  });
  return ids;
}

function NavChevron({ open }) {
  const Chevron = open ? NAV_ICONS.ChevronDown : NAV_ICONS.ChevronRight;
  return <Chevron {...CHEVRON_ICON_PROPS} className="nav-group-chevron-svg" />;
}

/** Ítem de menú: Lucide (`iconKey`) o emoji (`icono`), como en la rama Redes. */
function NavItemIcon({ item, size }) {
  if (item.icono) {
    return (
      <span className="nav-link-emoji" aria-hidden>
        {item.icono}
      </span>
    );
  }
  return <NavIcon name={item.iconKey} size={size} />;
}

function SidebarNav() {
  const location = useLocation();
  const [expanded, setExpanded] = useState({});
  const autoExpanded = useMemo(() => getAutoExpandedIds(location.pathname), [location.pathname]);

  useEffect(() => {
    setExpanded(prev => {
      const next = { ...prev };
      Object.keys(autoExpanded).forEach(id => {
        if (autoExpanded[id]) next[id] = true;
      });
      return next;
    });
  }, [autoExpanded]);

  function toggleGroup(id) {
    setExpanded(prev => {
      const auto = getAutoExpandedIds(location.pathname);
      const current = prev[id] !== undefined ? prev[id] : !!auto[id];
      return { ...prev, [id]: !current };
    });
  }

  function groupIsOpen(item) {
    if (expanded[item.id] !== undefined) return expanded[item.id];
    return !!autoExpanded[item.id];
  }

  function navLinkClass({ isActive }) {
    return `nav-link${isActive ? ' active' : ''}`;
  }

  function groupHeaderNavClass({ isActive }) {
    return `nav-link nav-group-header nav-group-header-link${isActive ? ' active' : ''}`;
  }

  return (
    <nav className="nav">
      {TOPICOS.map(item => {
        if (item.children?.length) {
          const open = groupIsOpen(item);
          if (item.path) {
            return (
              <div key={item.id} className="nav-group">
                <div className="nav-group-header-row">
                  <NavLink to={item.path} className={groupHeaderNavClass}>
                    <NavItemIcon item={item} />
                    <span className="nav-link-text">{item.label}</span>
                  </NavLink>
                  <button
                    type="button"
                    className="nav-group-chevron-btn"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleGroup(item.id);
                    }}
                    aria-expanded={open}
                    aria-label={open ? 'Contraer menú' : 'Expandir menú'}
                  >
                    <NavChevron open={open} />
                  </button>
                </div>
                <div className={`nav-group-children${open ? '' : ' is-collapsed'}`}>
                  {item.children.map(child => (
                    <NavLink key={child.id} to={child.path} className={navLinkClass}>
                      <NavItemIcon item={child} size={18} />
                      <span className="nav-link-text">{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={item.id} className="nav-group">
              <button type="button" className="nav-group-header" onClick={() => toggleGroup(item.id)}>
                <span className="nav-group-header-inner">
                  <NavItemIcon item={item} />
                  <span className="nav-link-text">{item.label}</span>
                </span>
                <NavChevron open={open} />
              </button>
              <div className={`nav-group-children${open ? '' : ' is-collapsed'}`}>
                {item.children.map(child => (
                  <NavLink key={child.id} to={child.path} className={navLinkClass}>
                    <NavItemIcon item={child} size={18} />
                    <span className="nav-link-text">{child.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        }

        return (
          <NavLink key={item.id} to={item.path} end={item.path === '/'} className={navLinkClass}>
            <NavItemIcon item={item} />
            <span className="nav-link-text">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default SidebarNav;

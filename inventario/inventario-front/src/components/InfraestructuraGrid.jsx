import { Server, Router, SwitchCamera, Video, ShieldAlert, BadgeCheck, HardDrive, Cpu, AlertCircle, PlayCircle, Network, Edit2, Trash2 } from 'lucide-react';
import { labelUbicacionEnum } from '../constants/ubicaciones';

function getIconForType(type) {
  switch (type) {
    case 'router':
    case 'switch':
      return <Network className="w-4 h-4 text-amber-600" />;
    case 'nvr':
      return <HardDrive className="w-4 h-4 text-purple-600" />;
    case 'camara':
      return <Video className="w-4 h-4 text-blue-600" />;
    case 'servidor':
      return <Server className="w-4 h-4 text-emerald-600" />;
    case 'maquina-tesoreria':
      return <ShieldAlert className="w-4 h-4 text-red-600" />;
    default:
      return <Cpu className="w-4 h-4 text-slate-600" />;
  }
}

function getLabelForType(type, item) {
  switch (type) {
    case 'router': return 'Router / AP';
    case 'switch': return 'Switch';
    case 'nvr': return 'NVR';
    case 'camara': return 'Cámara de Seg.';
    case 'servidor': return 'Servidor';
    case 'maquina-tesoreria': return item?.tipo ? `Tesorería: ${item.tipo}` : 'Máquina Tesorería';
    default: return 'Infraestructura';
  }
}

export default function InfraestructuraGrid({ items, type, onItemClick, selectedIds, onToggleSelection, onEditItem, onDeleteItem }) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
        <div className="p-4 bg-slate-50 text-slate-400 rounded-full">
          <AlertCircle className="w-12 h-12" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-950 text-base">No se encontraron equipos</h3>
          <p className="text-xs text-slate-500 max-w-sm">No hay registros de infraestructura para mostrar con los filtros actuales.</p>
        </div>
      </div>
    );
  }

  const isSelectable = selectedIds != null && onToggleSelection != null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {items.map((item) => {
        // Build subtitle parts
        const parts = [];
        if (item.marca) parts.push(item.marca);
        if (item.modelo) parts.push(item.modelo);
        const marcaModelo = parts.join(' ') || 'Equipo Genérico';
        
        // Use an 8-char short ID if we don't have a clear IP
        let shortId = item.id ? item.id.substring(0, 8).toUpperCase() : 'N/A';
        if (type === 'maquina-tesoreria' && (item.numeroSerie || item.nroSerie)) {
          shortId = String(item.numeroSerie || item.nroSerie).toUpperCase();
        }
        const topId = item.ip ? item.ip : shortId;

        // Badge styling
        const statusLower = (item.estado || '').toLowerCase();
        let badgeCls = 'bg-slate-100 text-slate-600 border-slate-200';
        if (statusLower.includes('activo') || statusLower.includes('operativo') || statusLower.includes('online')) {
          badgeCls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        } else if (statusLower.includes('falla') || statusLower.includes('offline') || statusLower.includes('roto')) {
          badgeCls = 'bg-red-50 text-red-700 border-red-200';
        } else if (statusLower.includes('mantenimiento') || statusLower.includes('reparacion')) {
          badgeCls = 'bg-amber-50 text-amber-700 border-amber-200';
        }

        const isSelected = isSelectable && selectedIds.has(item.id);

        return (
          <div 
            key={item.id}
            onClick={() => onItemClick && onItemClick(item)}
            className={`bg-white rounded-xl border p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 group cursor-pointer ${isSelected ? 'border-[#0c66e4] ring-1 ring-[#0c66e4] bg-blue-50/10' : 'border-slate-200 hover:border-[#0c66e4] hover:shadow-md'}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSelectable && (
                    <div onClick={(e) => { e.stopPropagation(); onToggleSelection(item.id); }}>
                      <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
                    </div>
                  )}
                  <span className="text-xs font-mono font-bold text-[#0c66e4]">{topId}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {onEditItem && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditItem(item); }}
                      className="p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDeleteItem && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteItem(item); }}
                      className="p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {item.estado && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeCls} uppercase tracking-wider`}>
                      {item.estado}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                {(() => {
                  let displayNombre = item.nombre;
                  if (type === 'maquina-tesoreria') {
                    const tipoAbrev = item.tipo ? item.tipo.substring(0, 3).toUpperCase() : 'UNK';
                    const numSerie = item.numeroSerie || item.nroSerie || 'S/N';
                    displayNombre = `MTes-${tipoAbrev}-${numSerie}`;
                  } else if (!displayNombre) {
                    displayNombre = 'Sin nombre';
                  }
                  return (
                    <h3 className="font-bold text-slate-950 group-hover:text-[#0c66e4] transition-colors line-clamp-1 leading-tight" title={displayNombre}>
                      {displayNombre}
                    </h3>
                  );
                })()}
                <p className="text-xs text-slate-500 font-mono line-clamp-1">
                  {marcaModelo} {(item.numeroSerie || item.nroSerie) ? ` • S/N: ${item.numeroSerie || item.nroSerie}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg p-2 w-fit">
                {getIconForType(item.tipoComponente || type)}
                <span className="font-semibold text-slate-700">{getLabelForType(item.tipoComponente || type, item)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs">
                <p className="text-slate-400 text-[10px]">{type === 'maquina-tesoreria' ? 'Vida Útil:' : 'Ubicación Física:'}</p>
                <p className="font-semibold text-slate-800 truncate max-w-[120px]" title={item.sitio || labelUbicacionEnum(item.ubicacion) || 'No especificada'}>
                    {type === 'maquina-tesoreria' 
                      ? (item.vida || 'No especificada') 
                      : (item.sitio || labelUbicacionEnum(item.ubicacion) || 'No especificada')}
                  </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-[10px]">{item.ip ? 'Dirección IP:' : 'Identificador:'}</p>
                <p className="font-mono font-bold text-slate-900">{item.ip ? item.ip : shortId}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

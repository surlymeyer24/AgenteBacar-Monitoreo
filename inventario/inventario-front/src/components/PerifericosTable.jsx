import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Monitor, Laptop, Printer, Keyboard, Mouse, Webcam, Speaker, Mic, Usb, Cpu } from 'lucide-react';
import { StudioDataTable, studioTableClass, studioThClass, studioTdClass } from './studio/StudioUi';

// Map icon based on type
const getIconForType = (type) => {
  switch (type) {
    case 'impresora': return <Printer className="w-5 h-5 text-emerald-600" />;
    case 'monitor': return <Monitor className="w-5 h-5 text-blue-600" />;
    case 'teclado': return <Keyboard className="w-5 h-5 text-orange-600" />;
    case 'mouse': return <Mouse className="w-5 h-5 text-indigo-600" />;
    case 'webcam': return <Webcam className="w-5 h-5 text-rose-600" />;
    case 'parlante': return <Speaker className="w-5 h-5 text-pink-600" />;
    case 'microfono': return <Mic className="w-5 h-5 text-purple-600" />;
    case 'usb': return <Usb className="w-5 h-5 text-slate-600" />;
    default: return <Cpu className="w-5 h-5 text-slate-600" />;
  }
};

export default function PerifericosTable({ items, type, renderSpecs }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const searchableString = [
      item.nombre,
      item.hostname || item.pcHostname,
      item.driver,
      item.puerto,
      item.fabricante,
      item.resolucion,
      item.tipo
    ].filter(Boolean).join(' ').toLowerCase();
    
    return searchableString.includes(term);
  });

  return (
    <div className="space-y-4">
      {/* Table Header / Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por modelo, marca o computadora asociada..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg pl-9 pr-4 py-2 font-medium focus:bg-white focus:outline-none focus:border-[#0c66e4]"
          />
        </div>
        <div className="text-sm font-bold text-slate-700">
          Total de equipos: <span className="text-slate-900">{filteredItems.length}</span>
        </div>
      </div>

      {/* Table */}
      <StudioDataTable>
        <table className={`${studioTableClass()} text-sm w-full text-left`}>
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-extrabold text-slate-600 uppercase tracking-widest">
              <th className={studioThClass()}>ID EQUIPO</th>
              <th className={studioThClass()}>DESCRIPCIÓN DE PERIFÉRICO</th>
              <th className={studioThClass()}>ESPECIFICACIONES / DETALLES</th>
              <th className={studioThClass()}>SITUACIÓN EN RED / ASOCIACIÓN</th>
              <th className={studioThClass()}>TIPO</th>
              <th className={studioThClass()}>ESTADO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" className={`${studioTdClass()} text-center py-10 text-slate-400 italic`}>
                  No se encontraron dispositivos que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                const itemUuid = item.uuid || item.pcUuid || '';
                const uniqueId = `PERIF-${(itemUuid).slice(0,4).toUpperCase()}-${idx}`;
                
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className={`${studioTdClass()} font-mono text-sm font-bold text-blue-600`}>
                      {uniqueId}
                    </td>
                    
                    <td className={`${studioTdClass()} font-bold text-slate-800`}>
                      <div className="flex items-center gap-3">
                        {getIconForType((item.tipo || type || '').toLowerCase())}
                        <span>{item.nombre || 'Desconocido'}</span>
                      </div>
                    </td>
                    
                    <td className={`${studioTdClass()} text-sm font-medium text-slate-500`}>
                      {renderSpecs ? renderSpecs(item) : '—'}
                    </td>
                    
                    <td className={studioTdClass()}>
                      <button 
                        onClick={() => itemUuid && navigate(`/computadoras/${itemUuid}`)}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-[#0c66e4] transition-colors cursor-pointer bg-slate-100 hover:bg-blue-50 px-2 py-1 rounded"
                      >
                        <Laptop className="w-3.5 h-3.5" />
                        {item.hostname || item.pcHostname || 'Desconocido'}
                      </button>
                    </td>
                    
                    <td className={studioTdClass()}>
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs font-extrabold uppercase tracking-wide">
                        Autodetectado
                      </span>
                    </td>
                    
                    <td className={studioTdClass()}>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-extrabold uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        ONLINE
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </StudioDataTable>
    </div>
  );
}

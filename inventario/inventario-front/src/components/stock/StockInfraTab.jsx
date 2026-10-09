import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Router, Network, Phone, Camera, MapPin, Edit2 } from 'lucide-react';
import { BadgeDisponibilidad } from '../StockEstadoBadges';
import { labelTipoStock, normalizarTipoStock } from '../../constants/tiposStock';
import { StudioFilterBar } from '../studio/StudioUi';
import TableFilters from '../TableFilters';

const ICON_POR_TIPO = {
  router: Router,
  switch: Network,
  access_point: Wifi,
  telefono_ip: Phone,
  camara_ip: Camera,
};

const TIPO_COLORS = {
  router: 'bg-orange-50 text-orange-700 border-orange-200',
  switch: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  access_point: 'bg-violet-50 text-violet-700 border-violet-200',
  telefono_ip: 'bg-amber-50 text-amber-700 border-amber-200',
  camara_ip: 'bg-rose-50 text-rose-700 border-rose-200',
};

function SummaryCard({ icon: Icon, label, count, colorBg, colorText }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
      <div className={`p-3 ${colorBg} ${colorText} rounded-lg`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">{label}</span>
        <span className="text-3xl font-black font-mono text-slate-900">{count}</span>
      </div>
    </div>
  );
}

export default function StockInfraTab({
  items,
  estadoLabels,
  onOpenEdit,
  onUpdateStock,
  onBajaUnidad,
  onAsignarUbicacion,
}) {
  const navigate = useNavigate();
  const [buscar, setBuscar] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('all');

  const filtrados = useMemo(() => {
    return items.filter(item => {
      const tipo = normalizarTipoStock(item.tipo);
      if (filtroTipo !== 'all' && tipo !== filtroTipo) return false;
      if (!buscar) return true;
      const q = buscar.toLowerCase();
      return [item.nombre, item.fabricante, item.numeroSerie, item.ubicacion, item.id]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q));
    });
  }, [items, buscar, filtroTipo]);

  const conteos = useMemo(() => {
    const c = { router: 0, switch: 0, access_point: 0, telefono_ip: 0, camara_ip: 0 };
    for (const item of items) {
      const t = normalizarTipoStock(item.tipo);
      if (t in c) c[t] += (item.cantidad ?? 1);
    }
    return c;
  }, [items]);

  const totalUnidades = Object.values(conteos).reduce((s, n) => s + n, 0);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard icon={Router} label="Total" count={totalUnidades} colorBg="bg-slate-100" colorText="text-slate-600" />
        <SummaryCard icon={Router} label="Routers" count={conteos.router} colorBg="bg-orange-50" colorText="text-orange-600" />
        <SummaryCard icon={Network} label="Switches" count={conteos.switch} colorBg="bg-cyan-50" colorText="text-cyan-600" />
        <SummaryCard icon={Wifi} label="Access Points" count={conteos.access_point} colorBg="bg-violet-50" colorText="text-violet-600" />
        <SummaryCard icon={Phone} label="Teléfonos IP" count={conteos.telefono_ip} colorBg="bg-amber-50" colorText="text-amber-600" />
        <SummaryCard icon={Camera} label="Cámaras IP" count={conteos.camara_ip} colorBg="bg-rose-50" colorText="text-rose-600" />
      </div>

      <StudioFilterBar>
        <TableFilters>
          <TableFilters.Search
            value={buscar}
            onChange={setBuscar}
            placeholder="Buscar por nombre, fabricante, S/N, ubicación…"
          />
          <TableFilters.Select
            value={filtroTipo}
            onChange={setFiltroTipo}
            label="Tipo"
          >
            <option value="all">Todos los tipos</option>
            <option value="router">Routers</option>
            <option value="switch">Switches</option>
            <option value="access_point">Access Points</option>
            <option value="telefono_ip">Teléfonos IP</option>
            <option value="camara_ip">Cámaras IP</option>
          </TableFilters.Select>
        </TableFilters>
      </StudioFilterBar>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">COD / ID</th>
                <th className="py-4 px-5">Nombre / Fabricante</th>
                <th className="py-4 px-5">Tipo</th>
                <th className="py-4 px-5">Ubicación / Estado</th>
                <th className="py-4 px-5 text-center">Cantidad</th>
                <th className="py-4 px-5 text-right">Controles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-slate-400 font-medium">
                    No hay equipos de infraestructura en stock. Usá &quot;Nuevo&quot; para registrar uno.
                  </td>
                </tr>
              ) : (
                filtrados.map(item => {
                  const tipo = normalizarTipoStock(item.tipo);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/perifericos/stock/${encodeURIComponent(item.id)}`)}
                    >
                      <td className="py-4 px-5">
                        <span className="font-mono font-bold text-blue-600 text-xs">{item.id}</span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 capitalize">{item.nombre ?? '—'}</p>
                          {item.fabricante && (
                            <p className="text-[11px] text-slate-400 font-normal">{item.fabricante}</p>
                          )}
                          {item.numeroSerie && (
                            <p className="text-[11px] text-slate-500 font-mono font-normal">S/N: {item.numeroSerie}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${TIPO_COLORS[tipo] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {labelTipoStock(tipo)}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-1.5 items-start">
                          <BadgeDisponibilidad estadoActual={item.estado} estadoLabels={estadoLabels} />
                          {item.ubicacion && (
                            <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{item.ubicacion}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="font-bold font-mono text-slate-900 text-base">{item.cantidad ?? 1}</span>
                      </td>
                      <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-2">
                          <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded p-1 shadow-sm mr-2">
                            <button
                              type="button"
                              onClick={() => onUpdateStock(item, -1)}
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:text-red-600 hover:shadow-xs text-slate-500 font-bold transition-all cursor-pointer"
                              title="Restar 1 unidad"
                            >
                              -
                            </button>
                            <span className="text-slate-300 mx-0.5 text-xs">|</span>
                            <button
                              type="button"
                              onClick={() => onUpdateStock(item, 1)}
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:text-emerald-600 hover:shadow-xs text-slate-500 font-bold transition-all cursor-pointer"
                              title="Sumar 1 unidad"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => onBajaUnidad(item)}
                            className="inline-flex items-center px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                            title="Dar de baja 1 unidad"
                          >
                            Baja 1
                          </button>
                          <button
                            type="button"
                            onClick={() => onAsignarUbicacion(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Asignar
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenEdit(item)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

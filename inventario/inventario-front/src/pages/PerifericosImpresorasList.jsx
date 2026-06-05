import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchImpresorasAgrupadas } from '../api/impresoraApi';
import {
  StudioPageShell,
  StudioLoading,
  StudioError,
  StudioDataTable,
  studioTableClass,
  studioThClass,
  studioTdClass,
} from '../components/studio/StudioUi';
import { Printer, Search, Laptop } from 'lucide-react';

function PerifericosImpresorasList() {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let cancel = false;
    setCargando(true);
    setError(null);
    fetchImpresorasAgrupadas()
      .then(data => {
        if (!cancel) setGrupos(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (!cancel)
          setError(err?.message ? String(err.message) : 'No se pudo cargar el listado');
      })
      .finally(() => {
        if (!cancel) setCargando(false);
      });
    return () => { cancel = true; };
  }, []);

  if (cargando) return <StudioLoading />;
  if (error) return <StudioError message={error} />;

  const term = searchTerm.toLowerCase();
  const filtrados = grupos.filter(g =>
    !term ||
    (g.nombre ?? '').toLowerCase().includes(term) ||
    (g.driver ?? '').toLowerCase().includes(term) ||
    (g.puerto ?? '').toLowerCase().includes(term) ||
    (g.pcs ?? []).some(pc => (pc.hostname ?? '').toLowerCase().includes(term))
  );

  return (
    <StudioPageShell
      title="Administración de Impresoras"
    >
      {/* Barra de búsqueda */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, driver o computadora conectada..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg pl-9 pr-4 py-2 font-medium focus:bg-white focus:outline-none focus:border-[#0c66e4]"
          />
        </div>
        <div className="text-sm font-bold text-slate-700">
          Impresoras únicas: <span className="text-slate-900">{filtrados.length}</span>
        </div>
      </div>

      {/* Tabla agrupada */}
      <StudioDataTable>
        <table className={`${studioTableClass()} text-sm w-full text-left`}>
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-widest">
              <th className={studioThClass()}>NOMBRE DE IMPRESORA</th>
              <th className={studioThClass()}>DRIVER / PUERTO</th>
              <th className={studioThClass()}>MÁQUINAS CONECTADAS</th>
              <th className={studioThClass()}>TIPO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={4} className={`${studioTdClass()} text-center py-10 text-slate-400 italic`}>
                  No se encontraron impresoras que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filtrados.map((grupo, idx) => {
                const pcs = grupo.pcs?.length ? grupo.pcs : [];
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">

                    {/* Nombre */}
                    <td className={`${studioTdClass()} font-bold text-slate-800`}>
                      <div className="flex items-center gap-2">
                        <Printer className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{grupo.nombre || '—'}</span>
                      </div>
                    </td>

                    {/* Driver / Puerto */}
                    <td className={`${studioTdClass()} font-mono text-xs text-slate-500`}>
                      {grupo.driver || '—'}
                      {grupo.puerto ? (
                        <>
                          <span className="text-slate-300 mx-1.5">|</span>
                          {grupo.puerto}
                        </>
                      ) : null}
                    </td>

                    {/* Badges de PCs */}
                    <td className={studioTdClass()}>
                      {pcs.length === 0 ? (
                        <span className="text-slate-400 italic text-xs">Sin equipos registrados</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {pcs.map((pc, pcIdx) => (
                            <button
                              key={pcIdx}
                              onClick={() => pc.uuid && navigate(`/computadoras/${pc.uuid}`)}
                              title={pc.uuid ? `Ver detalle de ${pc.hostname}` : pc.hostname}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors
                                ${pc.uuid
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 cursor-default'
                                }`}
                            >
                              <Laptop className="w-2.5 h-2.5 shrink-0" />
                              {pc.hostname || '—'}
                              {grupo.predeterminada && (
                                <span className="text-amber-500 ml-0.5" title="Predeterminada">★</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Tipo */}
                    <td className={studioTdClass()}>
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-extrabold uppercase tracking-wide">
                        Autodetectado
                      </span>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </StudioDataTable>
    </StudioPageShell>
  );
}

export default PerifericosImpresorasList;

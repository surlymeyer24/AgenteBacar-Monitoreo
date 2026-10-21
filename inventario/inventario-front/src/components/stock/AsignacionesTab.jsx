import { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
  CheckCircle2,
  ArrowUpRight,
  RotateCcw,
  Package,
  Laptop,
  Cpu,
  Network,
  Smartphone,
} from 'lucide-react';
import { KpiCard, KpiGrid } from '../layout';
import WriteGate from '../WriteGate';
import { labelTipoStock } from '../../constants/tiposStock';

const FILAS_POR_PAGINA = 25;

const FAMILIAS = [
  { id: 'todas', label: 'Todas', icon: Package, tipos: null },
  {
    id: 'pcs',
    label: 'PCs',
    icon: Laptop,
    tipos: ['desktop', 'notebook', 'computadora', 'pc'],
  },
  {
    id: 'perifericos',
    label: 'Periféricos',
    icon: Cpu,
    tipos: ['monitor', 'teclado', 'mouse', 'impresora', 'webcam', 'parlante', 'microfono', 'micrófono'],
  },
  {
    id: 'infraestructura',
    label: 'Infraestructura',
    icon: Network,
    tipos: ['router', 'switch', 'access_point', 'access point', 'camara', 'cámara', 'camara_ip', 'cámara_ip', 'televisor', 'telefono_ip', 'teléfono ip'],
  },
  {
    id: 'celulares',
    label: 'Celulares',
    icon: Smartphone,
    tipos: ['celular'],
  },
];

function getIconForTipo(tipo) {
  const t = (tipo || '').toLowerCase().trim();
  for (const fam of FAMILIAS) {
    if (fam.tipos && fam.tipos.includes(t)) return fam.icon;
  }
  return Package;
}

function formatFecha(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return str; }
}

function esDelMesActual(str) {
  if (!str) return false;
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return false;
    const ahora = new Date();
    return d.getFullYear() === ahora.getFullYear() && d.getMonth() === ahora.getMonth();
  } catch { return false; }
}

function getBadgeEstadoClass(estado) {
  const e = (estado || '').toLowerCase().trim();
  if (e === 'activa' || e === 'activo' || e === 'asignado')
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (e === 'finalizada' || e === 'devuelto' || e === 'reingresada')
    return 'bg-slate-100 text-slate-600 border-slate-200';
  if (e === 'pendiente')
    return 'bg-amber-50 text-amber-700 border-amber-200';
  if (e.includes('en uso'))
    return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-blue-50 text-blue-700 border-blue-200';
}

function getEstadoDotClass(estado) {
  const e = (estado || '').toLowerCase().trim();
  if (e === 'activa' || e === 'activo' || e === 'asignado') return 'bg-emerald-500';
  if (e === 'finalizada' || e === 'devuelto' || e === 'reingresada') return 'bg-slate-400';
  if (e === 'pendiente') return 'bg-amber-500';
  if (e.includes('en uso')) return 'bg-blue-500';
  return 'bg-blue-500';
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

const TH = 'text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap';

export default function AsignacionesTab({ asignaciones = [], onDevolver }) {
  const [categoriaActiva, setCategoriaActiva] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [pagina, setPagina] = useState(1);

  const conteosPorFamilia = useMemo(() => {
    const conteos = { todas: asignaciones.length, pcs: 0, perifericos: 0, infraestructura: 0, celulares: 0 };
    asignaciones.forEach((m) => {
      const t = (m.tipo || '').toLowerCase().trim();
      if (['desktop', 'notebook', 'computadora', 'pc'].includes(t)) conteos.pcs++;
      else if (['monitor', 'teclado', 'mouse', 'impresora', 'webcam', 'parlante', 'microfono', 'micrófono'].includes(t)) conteos.perifericos++;
      else if (['router', 'switch', 'access_point', 'access point', 'camara', 'cámara', 'camara_ip', 'cámara_ip', 'televisor', 'telefono_ip', 'teléfono ip'].includes(t)) conteos.infraestructura++;
      else if (t === 'celular') conteos.celulares++;
    });
    return conteos;
  }, [asignaciones]);

  const kpis = useMemo(() => {
    let activas = 0, entregasMes = 0, devolucionesMes = 0;
    asignaciones.forEach((m) => {
      const estado = (m.estado || '').toLowerCase();
      const accion = (m.accion || '').toLowerCase();
      const fecha = m.fecha || m.fechaMovimiento || m.fechaHora;
      if (estado === 'activa' || estado === 'activo') activas++;
      if (esDelMesActual(fecha)) {
        if (accion.includes('asig') || accion.includes('alta') || accion.includes('entrega')) entregasMes++;
        if (accion.includes('devol') || accion.includes('retorno') || accion.includes('baja')) devolucionesMes++;
      }
    });
    return { activas, entregasMes, devolucionesMes };
  }, [asignaciones]);

  const areasDisponibles = useMemo(() => {
    const set = new Set();
    asignaciones.forEach((m) => { if (m.area && m.area.trim()) set.add(m.area.trim()); });
    return Array.from(set).sort();
  }, [asignaciones]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const estadoTarget = filtroEstado.toLowerCase();
    const areaTarget = filtroArea.toLowerCase();
    const famObj = FAMILIAS.find((f) => f.id === categoriaActiva);

    return asignaciones.filter((m) => {
      const t = (m.tipo || '').toLowerCase().trim();
      if (famObj && famObj.tipos && !famObj.tipos.includes(t)) return false;
      if (q) {
        const blob = [m.codigo, m.responsable, m.marca, m.modelo].filter(Boolean).join(' ').toLowerCase();
        if (!blob.includes(q)) return false;
      }
      if (estadoTarget && (m.estado || '').toLowerCase() !== estadoTarget) return false;
      if (areaTarget && (m.area || '').toLowerCase() !== areaTarget) return false;
      return true;
    });
  }, [asignaciones, categoriaActiva, busqueda, filtroEstado, filtroArea]);

  const totalPaginas = Math.ceil(filtradas.length / FILAS_POR_PAGINA) || 1;
  const paginaValida = Math.min(Math.max(1, pagina), totalPaginas);
  const paginadas = useMemo(() => {
    const inicio = (paginaValida - 1) * FILAS_POR_PAGINA;
    return filtradas.slice(inicio, inicio + FILAS_POR_PAGINA);
  }, [filtradas, paginaValida]);

  const limpiarFiltros = () => {
    setCategoriaActiva('todas');
    setBusqueda('');
    setFiltroEstado('');
    setFiltroArea('');
    setPagina(1);
  };

  const hayFiltrosActivos = Boolean(busqueda || filtroEstado || filtroArea || categoriaActiva !== 'todas');

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <KpiGrid cols="grid-cols-1 sm:grid-cols-3">
        <KpiCard
          title="Asignaciones Activas"
          value={kpis.activas}
          subtitle="Equipos en custodia"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />
        <KpiCard
          title="Entregas del Mes"
          value={kpis.entregasMes}
          subtitle="Asignaciones mes actual"
          icon={<ArrowUpRight className="w-4 h-4 text-blue-600" />}
        />
        <KpiCard
          title="Devoluciones del Mes"
          value={kpis.devolucionesMes}
          subtitle="Reingresos a depósito"
          icon={<RotateCcw className="w-4 h-4 text-indigo-600" />}
        />
      </KpiGrid>

      {/* Solapas por Familia + contador */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 border-b border-slate-200">
        <div className="flex items-center gap-1.5 w-fit">
          {FAMILIAS.map((fam) => {
            const activa = categoriaActiva === fam.id;
            const count = conteosPorFamilia[fam.id] ?? 0;
            const Icon = fam.icon;
            return (
              <button
                key={fam.id}
                type="button"
                onClick={() => { setCategoriaActiva(fam.id); setPagina(1); }}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activa
                    ? 'bg-[#0c66e4] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{fam.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-bold leading-none ${
                  activa ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
          Mostrando {paginadas.length} de {filtradas.length} movimientos
        </span>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 flex-wrap items-stretch">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
            placeholder="Buscar por responsable, equipo, marca o modelo..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c66e4]/20 focus:border-[#0c66e4] transition-colors"
          />
        </div>

        <select
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0c66e4]/20 focus:border-[#0c66e4] transition-colors min-w-[150px]"
        >
          <option value="">Estado: Todos</option>
          <option value="activa">Activa</option>
          <option value="finalizada">Finalizada</option>
          <option value="pendiente">Pendiente</option>
        </select>

        {areasDisponibles.length > 0 && (
          <select
            value={filtroArea}
            onChange={(e) => { setFiltroArea(e.target.value); setPagina(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0c66e4]/20 focus:border-[#0c66e4] transition-colors min-w-[160px]"
          >
            <option value="">Área: Todas</option>
            {areasDisponibles.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        )}

        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className={TH}>Tipo</th>
              <th className={TH}>Equipo</th>
              <th className={TH}>Responsable</th>
              <th className={TH}>Área</th>
              <th className={TH}>Acción</th>
              <th className={TH}>Estado</th>
              <th className={TH}>Fecha</th>
              <th className={TH}>Devolución</th>
              <th className={`${TH} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginadas.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-14 text-center text-slate-400 text-sm">
                  {hayFiltrosActivos
                    ? 'No se encontraron movimientos que coincidan con los filtros.'
                    : 'No hay registros en el libro de asignaciones.'}
                </td>
              </tr>
            ) : (
              paginadas.map((m, idx) => {
                const estado = m.estado || 'Activa';
                const esActiva = estado.toLowerCase() === 'activa' || estado.toLowerCase() === 'activo';
                const rowKey = m.id || `${m.codigo}-${m.fecha || idx}`;
                const TipoIcon = getIconForTipo(m.tipo);

                return (
                  <tr key={rowKey} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <TipoIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700 text-sm">{labelTipoStock(m.tipo)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 text-sm leading-snug">
                        {[m.marca, m.modelo].filter(Boolean).join(' ') || '—'}
                      </div>
                      {m.codigo && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{m.codigo}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 text-sm">
                      {m.responsable || '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      {m.area ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                          {m.area}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs uppercase tracking-wide font-medium text-slate-600">
                        {m.accion || 'Asignación'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getBadgeEstadoClass(estado)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getEstadoDotClass(estado)}`} />
                        {estado}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs">
                      {formatFecha(m.fecha || m.fechaMovimiento || m.fechaHora)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs">
                      {formatFecha(m.fechaDevolucion)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <WriteGate>
                        {esActiva && (
                          <button
                            type="button"
                            onClick={() => onDevolver(m)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Devolver este equipo al depósito"
                          >
                            <CornerDownLeft className="w-3 h-3" />
                            Devolver
                          </button>
                        )}
                      </WriteGate>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 px-1">
        <span>
          Mostrando{' '}
          <strong className="text-slate-700">
            {filtradas.length === 0 ? 0 : (paginaValida - 1) * FILAS_POR_PAGINA + 1}
          </strong>
          {' - '}
          <strong className="text-slate-700">
            {Math.min(paginaValida * FILAS_POR_PAGINA, filtradas.length)}
          </strong>
          {' '}de <strong className="text-slate-700">{filtradas.length}</strong> movimientos
          {hayFiltrosActivos ? ` (filtrados de ${asignaciones.length} totales)` : ''}
        </span>

        {totalPaginas > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaValida <= 1}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-700 cursor-pointer"
            >
              Anterior
            </button>

            {getPageNumbers(paginaValida, totalPaginas).map((item, idx) => {
              if (item === '...') {
                return <span key={`dots-${idx}`} className="px-1.5 text-slate-400 select-none">…</span>;
              }
              const num = Number(item);
              return (
                <button
                  key={`page-${num}`}
                  type="button"
                  onClick={() => setPagina(num)}
                  className={`min-w-[28px] h-7 px-2 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    paginaValida === num
                      ? 'bg-[#0c66e4] text-white shadow-xs'
                      : 'border border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {num}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaValida >= totalPaginas}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-700 cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit3,
  UserCheck,
  Trash2,
  Package,
  Laptop,
  Cpu,
  Network,
  Smartphone,
  MapPin,
  ArrowRight,
} from 'lucide-react';
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
    grupoLabel: 'Computadoras',
  },
  {
    id: 'perifericos',
    label: 'Periféricos',
    icon: Cpu,
    tipos: ['monitor', 'teclado', 'mouse', 'impresora', 'webcam', 'parlante', 'microfono'],
    grupoLabel: 'Periféricos',
  },
  {
    id: 'infraestructura',
    label: 'Infraestructura',
    icon: Network,
    tipos: ['router', 'switch', 'access_point', 'camara', 'camara_ip', 'televisor', 'telefono_ip'],
    grupoLabel: 'Infraestructura y Redes',
  },
  {
    id: 'celulares',
    label: 'Celulares',
    icon: Smartphone,
    tipos: ['celular'],
    grupoLabel: 'Dispositivos Móviles',
  },
];

const GRUPOS_TIPO = [
  {
    familiaId: 'pcs',
    label: 'Computadoras',
    opciones: [
      { value: 'desktop', label: 'Desktop' },
      { value: 'notebook', label: 'Notebook' },
    ],
  },
  {
    familiaId: 'perifericos',
    label: 'Periféricos',
    opciones: [
      { value: 'monitor', label: 'Monitor' },
      { value: 'teclado', label: 'Teclado' },
      { value: 'mouse', label: 'Mouse' },
      { value: 'impresora', label: 'Impresora' },
      { value: 'webcam', label: 'Webcam' },
      { value: 'parlante', label: 'Parlante' },
      { value: 'microfono', label: 'Micrófono' },
    ],
  },
  {
    familiaId: 'infraestructura',
    label: 'Infraestructura y Redes',
    opciones: [
      { value: 'router', label: 'Router' },
      { value: 'switch', label: 'Switch' },
      { value: 'access_point', label: 'Access Point' },
      { value: 'camara', label: 'Cámara' },
      { value: 'camara_ip', label: 'Cámara IP' },
      { value: 'televisor', label: 'Televisor' },
      { value: 'telefono_ip', label: 'Teléfono IP' },
    ],
  },
  {
    familiaId: 'celulares',
    label: 'Dispositivos Móviles',
    opciones: [{ value: 'celular', label: 'Celular' }],
  },
];

function getIconForTipo(tipo) {
  const t = (tipo || '').toLowerCase();
  for (const fam of FAMILIAS) {
    if (fam.tipos && fam.tipos.includes(t)) return fam.icon;
  }
  return Package;
}

function getBadgeCondicionClass(condicion) {
  const c = (condicion || '').toLowerCase().trim();
  if (c.includes('nuevo') || c.includes('sellado') || c.includes('caja'))
    return 'bg-teal-50 text-teal-700 border-teal-200';
  if (c.includes('reacondicionado') || c.includes('refurbish'))
    return 'bg-amber-50 text-amber-700 border-amber-200';
  if (c.includes('usado'))
    return 'bg-sky-50 text-sky-700 border-sky-200';
  if (c.includes('revis'))
    return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function getBadgeEstadoClass(estado) {
  const e = (estado || '').toLowerCase().trim();
  if (e.includes('disponible') || e.includes('sin asign') || e === 'en_stock' || e === 'en deposito')
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (e.includes('staging') || e.includes('config') || e.includes('preparaci'))
    return 'bg-amber-50 text-amber-700 border-amber-200';
  if (e.includes('reservado') || e.includes('reserv'))
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (e.includes('taller') || e.includes('manten') || e.includes('repar'))
    return 'bg-red-50 text-red-700 border-red-200';
  if (e.includes('asignad') || e.includes('activ') || e.includes('en uso'))
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (e.includes('baja') || e.includes('retir'))
    return 'bg-slate-100 text-slate-600 border-slate-300';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function getEstadoDotClass(estado) {
  const e = (estado || '').toLowerCase().trim();
  if (e.includes('disponible') || e.includes('sin asign') || e === 'en_stock' || e === 'en deposito')
    return 'bg-emerald-500';
  if (e.includes('staging') || e.includes('config') || e.includes('preparaci'))
    return 'bg-amber-500';
  if (e.includes('reservado') || e.includes('reserv'))
    return 'bg-yellow-500';
  if (e.includes('taller') || e.includes('manten') || e.includes('repar'))
    return 'bg-red-500';
  if (e.includes('asignad') || e.includes('activ') || e.includes('en uso'))
    return 'bg-emerald-500';
  if (e.includes('baja') || e.includes('retir'))
    return 'bg-slate-400';
  return 'bg-slate-400';
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

const TH = 'text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap';

export default function DepositoTab({ unidades = [], onEditar, onAsignar, onBaja }) {
  const [categoriaActiva, setCategoriaActiva] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCondicion, setFiltroCondicion] = useState('');
  const [pagina, setPagina] = useState(1);

  const unidadesEnDeposito = useMemo(() => {
    return unidades.filter((u) => {
      const uEstado = (u.estadoDeposito || '').toUpperCase();
      if (uEstado.includes('BAJA') || uEstado.includes('RETIR')) return false;
      if (
        uEstado.includes('ASIGNAD') ||
        uEstado.includes('OPERATIV') ||
        uEstado.includes('EN USO') ||
        uEstado.includes('EN_USO') ||
        uEstado.includes('ACTIVA') ||
        uEstado.includes('ACTIVO') ||
        uEstado.includes('CONECTAD') ||
        uEstado.includes('INSTALAD')
      ) return false;
      if (u.responsable && u.responsable.trim()) return false;
      const uUbicacion = (u.ubicacion || '').toLowerCase().trim();
      if (
        uUbicacion &&
        !uUbicacion.includes('deposito') &&
        !uUbicacion.includes('depósito') &&
        !uUbicacion.includes('stock') &&
        !uUbicacion.includes('almacen') &&
        !uUbicacion.includes('almacén') &&
        !uUbicacion.includes('bodega') &&
        !uUbicacion.includes('estante') &&
        !uUbicacion.includes('pañol') &&
        !uUbicacion.includes('panol') &&
        !uUbicacion.includes('taller') &&
        !uUbicacion.includes('sistemas')
      ) return false;
      return true;
    });
  }, [unidades]);

  const conteosPorFamilia = useMemo(() => {
    const conteos = { todas: unidadesEnDeposito.length, pcs: 0, perifericos: 0, infraestructura: 0, celulares: 0 };
    unidadesEnDeposito.forEach((u) => {
      const t = (u.tipo || '').toLowerCase();
      if (['desktop', 'notebook', 'computadora', 'pc'].includes(t)) conteos.pcs++;
      else if (['monitor', 'teclado', 'mouse', 'impresora', 'webcam', 'parlante', 'microfono'].includes(t)) conteos.perifericos++;
      else if (['router', 'switch', 'access_point', 'camara', 'camara_ip', 'televisor', 'telefono_ip'].includes(t)) conteos.infraestructura++;
      else if (t === 'celular') conteos.celulares++;
    });
    return conteos;
  }, [unidadesEnDeposito]);

  const condicionesDisponibles = useMemo(() => {
    const set = new Set();
    unidadesEnDeposito.forEach((u) => { if (u.condicion) set.add(u.condicion); });
    return Array.from(set).sort();
  }, [unidadesEnDeposito]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const tipoTarget = filtroTipo.toLowerCase();
    const estadoTarget = filtroEstado.toLowerCase();
    const condTarget = filtroCondicion.toLowerCase();
    const famObj = FAMILIAS.find((f) => f.id === categoriaActiva);

    return unidadesEnDeposito.filter((u) => {
      const uTipo = (u.tipo || '').toLowerCase();
      if (famObj && famObj.tipos && !famObj.tipos.includes(uTipo)) return false;
      if (tipoTarget && uTipo !== tipoTarget) return false;
      if (q) {
        const blob = [u.codigo, u.descripcionCompleta, u.marca, u.modelo, u.serieOImei, u.ubicacion, u.comentarios].filter(Boolean).join(' ').toLowerCase();
        if (!blob.includes(q)) return false;
      }
      if (estadoTarget) {
        const uEstado = (u.estadoDeposito || '').toLowerCase();
        if (estadoTarget === 'sin asignar') {
          if (!uEstado.includes('sin asign') && uEstado !== 'disponible' && uEstado !== 'en_stock' && uEstado !== 'en deposito') return false;
        } else if (estadoTarget === 'mantenimiento') {
          if (!uEstado.includes('manten') && !uEstado.includes('repar') && !uEstado.includes('taller')) return false;
        }
      }
      if (condTarget) {
        if ((u.condicion || '').toLowerCase() !== condTarget) return false;
      }
      return true;
    });
  }, [unidadesEnDeposito, busqueda, filtroTipo, filtroEstado, filtroCondicion, categoriaActiva]);

  const totalPaginas = Math.ceil(filtradas.length / FILAS_POR_PAGINA) || 1;
  const paginaValida = Math.min(Math.max(1, pagina), totalPaginas);
  const paginadas = useMemo(() => {
    const inicio = (paginaValida - 1) * FILAS_POR_PAGINA;
    return filtradas.slice(inicio, inicio + FILAS_POR_PAGINA);
  }, [filtradas, paginaValida]);

  const limpiarFiltros = () => {
    setCategoriaActiva('todas');
    setBusqueda('');
    setFiltroTipo('');
    setFiltroEstado('');
    setFiltroCondicion('');
    setPagina(1);
  };

  const hayFiltrosActivos = Boolean(busqueda || filtroTipo || filtroEstado || filtroCondicion || categoriaActiva !== 'todas');

  const gruposTipoFiltrados = useMemo(() => {
    if (categoriaActiva === 'todas') return GRUPOS_TIPO;
    return GRUPOS_TIPO.filter((g) => g.familiaId === categoriaActiva);
  }, [categoriaActiva]);

  return (
    <div className="space-y-4">
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
                onClick={() => { setCategoriaActiva(fam.id); setFiltroTipo(''); setPagina(1); }}
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
          Mostrando {paginadas.length} de {filtradas.length} activos
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
            placeholder="Buscar por código, serie o modelo..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c66e4]/20 focus:border-[#0c66e4] transition-colors"
          />
        </div>

        <select
          value={filtroTipo}
          onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0c66e4]/20 focus:border-[#0c66e4] transition-colors min-w-[150px]"
        >
          <option value="">
            {categoriaActiva === 'todas' ? 'Todos los tipos' : `Todos (${FAMILIAS.find((f) => f.id === categoriaActiva)?.label})`}
          </option>
          {gruposTipoFiltrados.map((grupo) =>
            categoriaActiva === 'todas' ? (
              <optgroup key={grupo.label} label={grupo.label}>
                {grupo.opciones.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
            ) : (
              grupo.opciones.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))
            )
          )}
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0c66e4]/20 focus:border-[#0c66e4] transition-colors min-w-[150px]"
        >
          <option value="">Estado: Todos</option>
          <option value="sin asignar">Sin Asignar / Disponible</option>
          <option value="mantenimiento">En Mantenimiento</option>
        </select>

        {condicionesDisponibles.length > 0 && (
          <select
            value={filtroCondicion}
            onChange={(e) => { setFiltroCondicion(e.target.value); setPagina(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0c66e4]/20 focus:border-[#0c66e4] transition-colors min-w-[140px]"
          >
            <option value="">Condición: Todas</option>
            {condicionesDisponibles.map((cond) => (
              <option key={cond} value={cond}>{cond}</option>
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
        <table className="w-full text-left text-sm min-w-[1050px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className={TH}>Código Interno</th>
              <th className={TH}>Tipo / Hardware</th>
              <th className={TH}>Marca y Modelo</th>
              <th className={TH}>Serie / Identificador</th>
              <th className={TH}>Condición</th>
              <th className={TH}>Estado</th>
              <th className={TH}>Ubicación</th>
              <th className={TH}>Comentarios</th>
              <th className={`${TH} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginadas.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-14 text-center text-slate-400 text-sm">
                  {hayFiltrosActivos
                    ? 'No hay unidades que coincidan con los filtros aplicados.'
                    : 'No hay unidades registradas en el depósito.'}
                </td>
              </tr>
            ) : (
              paginadas.map((u) => {
                const estado = u.estadoDeposito || 'Sin Asignar';
                const estadoNorm = estado.toLowerCase();
                const esBaja = estadoNorm.includes('baja') || estadoNorm.includes('retir');
                const esDisponible =
                  estadoNorm.includes('sin asign') ||
                  estadoNorm === 'disponible' ||
                  estadoNorm === 'en_stock' ||
                  estadoNorm === 'en deposito';
                const TipoIcon = getIconForTipo(u.tipo);

                return (
                  <tr key={u.codigo || u.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Código Interno */}
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 text-xs tracking-wide">
                        {u.codigo || '—'}
                      </span>
                    </td>

                    {/* Tipo / Hardware */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <TipoIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700 text-sm">
                          {labelTipoStock(u.tipo)}
                        </span>
                      </div>
                    </td>

                    {/* Descripción / Marca y Modelo */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 text-sm leading-snug">
                        {u.descripcionCompleta || [u.marca, u.modelo].filter(Boolean).join(' ') || '—'}
                      </div>
                    </td>

                    {/* Serie / Identificador */}
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                      {u.serieOImei || '—'}
                    </td>

                    {/* Condición */}
                    <td className="px-4 py-3.5">
                      {u.condicion ? (
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${getBadgeCondicionClass(u.condicion)}`}>
                          {u.condicion}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getBadgeEstadoClass(estado)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getEstadoDotClass(estado)}`} />
                        {estado}
                      </span>
                    </td>

                    {/* Ubicación */}
                    <td className="px-4 py-3.5">
                      {u.ubicacion ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {u.ubicacion}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Comentarios */}
                    <td className="px-4 py-3.5">
                      {u.comentarios ? (
                        <span className="text-xs text-slate-600 line-clamp-2 max-w-[200px]" title={u.comentarios}>
                          {u.comentarios}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3.5 text-right">
                      <WriteGate>
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {esDisponible && (
                            <button
                              type="button"
                              onClick={() => onAsignar(u)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Asignar a un responsable"
                            >
                              <ArrowRight className="w-3 h-3" />
                              Asignar
                            </button>
                          )}
                          {!esBaja && !esDisponible && (
                            <button
                              type="button"
                              onClick={() => onEditar(u)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Editar datos de la unidad"
                            >
                              <Edit3 className="w-3 h-3" />
                              Editar
                            </button>
                          )}
                          {esDisponible && (
                            <button
                              type="button"
                              onClick={() => onEditar(u)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Editar datos de la unidad"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                          {!esBaja && (
                            <button
                              type="button"
                              onClick={() => onBaja(u)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Dar de baja con motivo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
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
          {' '}de <strong className="text-slate-700">{filtradas.length}</strong> registros físicos
          {hayFiltrosActivos ? ` (filtrados de ${unidadesEnDeposito.length} totales)` : ''}
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

import { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  Laptop,
  Cpu,
  Network,
  Smartphone,
  AlertTriangle,
  Archive,
} from 'lucide-react';
import {
  StudioDataTable,
  StudioFilterBar,
  studioTableClass,
  studioTheadClass,
  studioThClass,
  studioTdClass,
  studioRowClass,
} from '../studio/StudioUi';
import { KpiCard, KpiGrid } from '../layout';
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

function formatFecha(str) {
  if (!str) return '—';
  try {
    const d = new Date(str.includes('T') ? str : str.replace(' ', 'T'));
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return str;
  }
}

export default function BajasTab({ unidades = [], asignaciones = [] }) {
  const [categoriaActiva, setCategoriaActiva] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);

  // Unidades dadas de baja provenientes de unidades y de movimientos_stock
  const bajasConsolidadas = useMemo(() => {
    const mapa = new Map();

    // 1. Unidades de stock cuyo estado es BAJA
    unidades.forEach((u) => {
      const estado = (u.estadoDeposito || '').toUpperCase();
      if (estado.includes('BAJA') || estado.includes('RETIR')) {
        const key = u.codigo || u.id;
        mapa.set(key, {
          id: u.id || u.codigo,
          codigo: u.codigo,
          tipo: u.tipo,
          marca: u.marca,
          modelo: u.modelo,
          serieOImei: u.serieOImei,
          ubicacion: u.ubicacion || 'Depósito',
          condicion: u.condicion,
          estado: 'Baja',
          fecha: u.fechaIngreso,
          motivo: 'Baja definitiva de inventario',
        });
      }
    });

    // 2. Movimientos históricos cuya acción o estado es Baja
    asignaciones.forEach((m) => {
      const accion = (m.accion || '').toLowerCase();
      const estado = (m.estado || '').toLowerCase();
      if (accion === 'baja' || estado === 'baja') {
        const key = m.codigo || m.id;
        if (!mapa.has(key)) {
          mapa.set(key, {
            id: m.id || m.codigo,
            codigo: m.codigo,
            tipo: m.tipo,
            marca: m.marca,
            modelo: m.modelo,
            serieOImei: m.serieOImei,
            ubicacion: m.area || 'Depósito',
            condicion: '',
            estado: 'Baja',
            fecha: m.fecha,
            motivo: m.motivo || 'Baja registrada en movimientos',
          });
        }
      }
    });

    return Array.from(mapa.values());
  }, [unidades, asignaciones]);

  // Conteos por familia
  const conteosPorFamilia = useMemo(() => {
    const conteos = {
      todas: bajasConsolidadas.length,
      pcs: 0,
      perifericos: 0,
      infraestructura: 0,
      celulares: 0,
    };

    bajasConsolidadas.forEach((b) => {
      const t = (b.tipo || '').toLowerCase();
      if (['desktop', 'notebook', 'computadora', 'pc'].includes(t)) {
        conteos.pcs++;
      } else if (
        ['monitor', 'teclado', 'mouse', 'impresora', 'webcam', 'parlante', 'microfono', 'micrófono'].includes(t)
      ) {
        conteos.perifericos++;
      } else if (
        ['router', 'switch', 'access_point', 'access point', 'camara', 'cámara', 'camara_ip', 'cámara_ip', 'televisor', 'telefono_ip', 'teléfono ip'].includes(t)
      ) {
        conteos.infraestructura++;
      } else if (t === 'celular') {
        conteos.celulares++;
      }
    });

    return conteos;
  }, [bajasConsolidadas]);

  // Filtrado reactivo en memoria
  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const famObj = FAMILIAS.find((f) => f.id === categoriaActiva);

    return bajasConsolidadas.filter((b) => {
      const bTipo = (b.tipo || '').toLowerCase();

      // Solapa por familia
      if (famObj && famObj.tipos && !famObj.tipos.includes(bTipo)) {
        return false;
      }

      // Buscador
      if (q) {
        const codigo = (b.codigo || '').toLowerCase();
        const marca = (b.marca || '').toLowerCase();
        const modelo = (b.modelo || '').toLowerCase();
        const serie = (b.serieOImei || '').toLowerCase();
        const ubicacion = (b.ubicacion || '').toLowerCase();
        const motivo = (b.motivo || '').toLowerCase();

        if (
          !codigo.includes(q) &&
          !marca.includes(q) &&
          !modelo.includes(q) &&
          !serie.includes(q) &&
          !ubicacion.includes(q) &&
          !motivo.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [bajasConsolidadas, categoriaActiva, busqueda]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / FILAS_POR_PAGINA));
  const paginaValida = Math.min(Math.max(1, pagina), totalPaginas);

  const paginadas = useMemo(() => {
    const inicio = (paginaValida - 1) * FILAS_POR_PAGINA;
    return filtradas.slice(inicio, inicio + FILAS_POR_PAGINA);
  }, [filtradas, paginaValida]);

  const hayFiltrosActivos = Boolean(busqueda.trim() || categoriaActiva !== 'todas');

  const limpiarFiltros = () => {
    setBusqueda('');
    setCategoriaActiva('todas');
    setPagina(1);
  };

  return (
    <div className="space-y-4">
      {/* Tarjetas métricas superiores */}
      <KpiGrid cols="grid-cols-2 sm:grid-cols-4">
        <KpiCard
          title="Total Unidades en Baja"
          value={conteosPorFamilia.todas}
          subtitle="Equipos desincorporados"
          icon={<Archive className="w-4 h-4 text-rose-600" />}
        />
        <KpiCard
          title="Computadoras / PCs"
          value={conteosPorFamilia.pcs}
          subtitle="Desktops y notebooks"
          icon={<Laptop className="w-4 h-4 text-blue-600" />}
        />
        <KpiCard
          title="Periféricos"
          value={conteosPorFamilia.perifericos}
          subtitle="Accesorios y periféricos"
          icon={<Cpu className="w-4 h-4 text-amber-600" />}
        />
        <KpiCard
          title="Infraestructura y Redes"
          value={conteosPorFamilia.infraestructura}
          subtitle="Routers, switches y CCTV"
          icon={<Network className="w-4 h-4 text-emerald-600" />}
        />
      </KpiGrid>

      {/* Solapas por Categoría / Familia */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {FAMILIAS.map((fam) => {
          const Icon = fam.icon;
          const count = conteosPorFamilia[fam.id] ?? 0;
          const activa = categoriaActiva === fam.id;

          return (
            <button
              key={fam.id}
              type="button"
              onClick={() => {
                setCategoriaActiva(fam.id);
                setPagina(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activa
                  ? 'bg-red-50 text-red-700 shadow-xs border border-red-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${activa ? 'text-red-700' : 'text-slate-400'}`} />
              <span>{fam.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                  activa ? 'bg-red-100 text-red-800' : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Barra de Filtros */}
      <StudioFilterBar>
        {/* Buscador */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar en bajas por equipo, marca, modelo, serie o motivo..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
          />
        </div>

        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}
      </StudioFilterBar>

      {/* Tabla de Bajas */}
      <StudioDataTable>
        <table className={studioTableClass()}>
          <thead className={studioTheadClass()}>
            <tr>
              <th className={studioThClass()}>Tipo</th>
              <th className={studioThClass()}>Equipo</th>
              <th className={studioThClass()}>Ubicación Anterior</th>
              <th className={studioThClass()}>Fecha</th>
              <th className={studioThClass()}>Motivo / Detalle</th>
              <th className={`${studioThClass()} text-right`}>Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginadas.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                  {hayFiltrosActivos
                    ? 'No se encontraron equipos dados de baja con los filtros seleccionados.'
                    : 'No hay registros de equipos dados de baja.'}
                </td>
              </tr>
            ) : (
              paginadas.map((b, idx) => {
                const rowKey = b.id || `${b.codigo}-${b.fecha || idx}`;

                return (
                  <tr key={rowKey} className={studioRowClass(false)}>
                    <td className={studioTdClass()}>{labelTipoStock(b.tipo)}</td>
                    <td className={studioTdClass()}>
                      <span className="font-medium text-slate-800">
                        {[b.marca, b.modelo].filter(Boolean).join(' ') || '—'}
                      </span>
                    </td>
                    <td className={studioTdClass()}>{b.ubicacion || '—'}</td>
                    <td className={`${studioTdClass()} text-slate-600`}>
                      {formatFecha(b.fecha)}
                    </td>
                    <td className={`${studioTdClass()} text-slate-600 max-w-xs truncate`} title={b.motivo}>
                      {b.motivo || '—'}
                    </td>
                    <td className={`${studioTdClass()} text-right`}>
                      <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                        Baja
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </StudioDataTable>

      {/* Paginación */}
      {filtradas.length > FILAS_POR_PAGINA && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
          <span>
            Mostrando {Math.min((paginaValida - 1) * FILAS_POR_PAGINA + 1, filtradas.length)} a{' '}
            {Math.min(paginaValida * FILAS_POR_PAGINA, filtradas.length)} de {filtradas.length} bajas
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaValida === 1}
              className="p-1.5 rounded border border-slate-200 enabled:hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => {
              if (
                num === 1 ||
                num === totalPaginas ||
                (num >= paginaValida - 1 && num <= paginaValida + 1)
              ) {
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPagina(num)}
                    className={`min-w-[28px] h-7 px-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                      paginaValida === num
                        ? 'bg-red-600 text-white font-bold shadow-xs'
                        : 'border border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                );
              }
              if (num === paginaValida - 2 || num === paginaValida + 2) {
                return (
                  <span key={num} className="px-1 text-slate-400">
                    …
                  </span>
                );
              }
              return null;
            })}

            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaValida === totalPaginas}
              className="p-1.5 rounded border border-slate-200 enabled:hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

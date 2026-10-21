import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Download,
  PlusCircle,
  Monitor,
  Keyboard,
  Mouse,
  Video,
  Speaker,
  Mic,
  Printer,
  Tv,
  Smartphone,
  Package,
  Layers,
  Link2,
  ChevronLeft,
  ChevronRight,
  FilterX,
} from 'lucide-react';
import { fetchPerifericosAgenteListados } from '../api/perifericosAgenteApi';
import { fetchMonitoresReportadosAgente } from '../api/monitorApi';
import { fetchImpresorasAgrupadas } from '../api/impresoraApi';
import {
  useComputadoras,
  usePerifericosM,
  useTelevisores,
  useCelulares,
} from '../hooks/useQueries';
import { labelUbicacionEnum } from '../constants/ubicaciones';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';
import WriteGate from '../components/WriteGate';
import { ModalAlta } from '../components/stock/StockModals';
import { FilterBar } from '../components/layout';

function formatFecha(fecha) {
  if (!fecha) return '—';
  try {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return String(fecha);
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(fecha);
  }
}

function getIconForTipo(tipo) {
  const t = (tipo || '').toLowerCase();
  if (t.includes('monitor') || t.includes('pantalla')) {
    return <Monitor className="w-4 h-4 text-blue-600" />;
  }
  if (t.includes('teclado') || t.includes('keyboard')) {
    return <Keyboard className="w-4 h-4 text-orange-600" />;
  }
  if (t.includes('mouse') || t.includes('raton')) {
    return <Mouse className="w-4 h-4 text-purple-600" />;
  }
  if (t.includes('webcam') || t.includes('camara') || t.includes('camera')) {
    return <Video className="w-4 h-4 text-emerald-600" />;
  }
  if (t.includes('parlante') || t.includes('speaker') || t.includes('audio')) {
    return <Speaker className="w-4 h-4 text-pink-600" />;
  }
  if (t.includes('microfono') || t.includes('mic')) {
    return <Mic className="w-4 h-4 text-teal-600" />;
  }
  if (t.includes('impresora') || t.includes('printer')) {
    return <Printer className="w-4 h-4 text-cyan-600" />;
  }
  if (t.includes('televisor') || t.includes('tv')) {
    return <Tv className="w-4 h-4 text-violet-600" />;
  }
  if (t.includes('celular') || t.includes('smartphone') || t.includes('telefono')) {
    return <Smartphone className="w-4 h-4 text-sky-600" />;
  }
  return <Package className="w-4 h-4 text-slate-500" />;
}

export default function PerifericosTodosList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Solapa activa desde la URL (?tipo=...)
  const tabActiva = searchParams.get('tipo') || 'todos';

  // Filtros de búsqueda
  const [buscar, setBuscar] = useState('');
  const [filtroConexion, setFiltroConexion] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroOrigen, setFiltroOrigen] = useState('');
  const [filtroArea, setFiltroArea] = useState('');

  // Paginación y selección
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState('todos');
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [modalAltaOpen, setModalAltaOpen] = useState(false);

  // Queries de datos
  const { data: computadoras = [], isLoading: loadingPcs } = useComputadoras();
  const { data: stockManual = [], isLoading: loadingStock } = usePerifericosM();
  const { data: televisores = [], isLoading: loadingTvs } = useTelevisores();
  const { data: celularesList = [], isLoading: loadingCels } = useCelulares();

  const { data: perifericosAgente, isLoading: loadingAgente, error: errorAgente } = useQuery({
    queryKey: ['perifericosAgenteListados'],
    queryFn: fetchPerifericosAgenteListados,
  });

  const { data: monitores = [], isLoading: loadingMonitores } = useQuery({
    queryKey: ['monitoresReportadosAgente'],
    queryFn: fetchMonitoresReportadosAgente,
  });

  const { data: impresoras = [], isLoading: loadingImpresoras } = useQuery({
    queryKey: ['impresorasAgrupadas'],
    queryFn: fetchImpresorasAgrupadas,
  });

  const cargando =
    loadingPcs ||
    loadingStock ||
    loadingTvs ||
    loadingCels ||
    loadingAgente ||
    loadingMonitores ||
    loadingImpresoras;

  // Mapa de computadoras por UUID
  const pcMap = useMemo(() => {
    const map = new Map();
    for (const pc of computadoras) {
      if (pc.uuid) map.set(pc.uuid, pc);
    }
    return map;
  }, [computadoras]);

  // Consolidación de todos los periféricos en una sola estructura homogénea
  const todosLosPerifericos = useMemo(() => {
    const list = [];

    // 1. Monitores (Agente)
    (monitores ?? []).forEach((m, idx) => {
      const pc = m.pcUuid ? pcMap.get(m.pcUuid) : null;
      list.push({
        id: `mon-${m.pcUuid || 'stk'}-${idx}`,
        tipoKey: 'monitores',
        tipoLabel: 'Monitor',
        nombre: m.nombre || 'Monitor',
        subtitulo: m.resolucion
          ? `${m.resolucion}${m.pulgadas ? ` · ${m.pulgadas}"` : ''}`
          : 'Monitor Principal',
        serial: m.serial || (m.pcUuid ? `MON-${m.pcUuid.slice(0, 6).toUpperCase()}` : '—'),
        conexion: m.conexion || (m.resolucion ? 'HDMI / DP' : 'DisplayPort'),
        pcUuid: m.pcUuid || null,
        pcHostname: m.pcHostname || (pc ? pc.hostname : null),
        responsable: pc ? pc.responsableInventario || pc.usuarioActual || '—' : '—',
        area: pc && pc.ubicacion ? labelUbicacionEnum(pc.ubicacion) : '—',
        origen: 'Agente v2.4',
        estado: m.pcUuid ? 'Asignado' : 'En stock',
        ultimaSinc: pc?.ultimaSincronizacion || null,
      });
    });

    // 2. Teclados (Agente)
    (perifericosAgente?.teclados ?? []).forEach((x, idx) => {
      const pc = x.pcUuid ? pcMap.get(x.pcUuid) : null;
      const vidPid =
        x.vid || x.pid
          ? [x.vid && `VID_${x.vid}`, x.pid && `PID_${x.pid}`].filter(Boolean).join('/')
          : null;
      list.push({
        id: `kb-${x.pcUuid || 'stk'}-${idx}`,
        tipoKey: 'teclados',
        tipoLabel: 'Teclado',
        nombre: x.nombre || 'Teclado USB',
        subtitulo: x.fabricante && x.fabricante !== '—' ? `${x.fabricante} Standard` : 'Teclado Estándar USB',
        serial: x.serial || vidPid || (x.pcUuid ? `KB-${x.pcUuid.slice(0, 6).toUpperCase()}` : '—'),
        conexion: x.conexion || 'USB-A',
        pcUuid: x.pcUuid || null,
        pcHostname: x.pcHostname || (pc ? pc.hostname : null),
        responsable: pc ? pc.responsableInventario || pc.usuarioActual || '—' : '—',
        area: pc && pc.ubicacion ? labelUbicacionEnum(pc.ubicacion) : '—',
        origen: 'Agente v2.4',
        estado: x.pcUuid ? 'Asignado' : 'En stock',
        ultimaSinc: pc?.ultimaSincronizacion || null,
      });
    });

    // 3. Mouse (Agente)
    (perifericosAgente?.mouse ?? []).forEach((x, idx) => {
      const pc = x.pcUuid ? pcMap.get(x.pcUuid) : null;
      const vidPid =
        x.vid || x.pid
          ? [x.vid && `VID_${x.vid}`, x.pid && `PID_${x.pid}`].filter(Boolean).join('/')
          : null;
      list.push({
        id: `mou-${x.pcUuid || 'stk'}-${idx}`,
        tipoKey: 'mouse',
        tipoLabel: 'Mouse',
        nombre: x.nombre || 'Mouse Óptico',
        subtitulo: x.fabricante && x.fabricante !== '—' ? `${x.fabricante} Óptico` : 'Mouse Alámbrico USB',
        serial: x.serial || vidPid || (x.pcUuid ? `MOU-${x.pcUuid.slice(0, 6).toUpperCase()}` : '—'),
        conexion: x.conexion || 'USB-A',
        pcUuid: x.pcUuid || null,
        pcHostname: x.pcHostname || (pc ? pc.hostname : null),
        responsable: pc ? pc.responsableInventario || pc.usuarioActual || '—' : '—',
        area: pc && pc.ubicacion ? labelUbicacionEnum(pc.ubicacion) : '—',
        origen: 'Agente v2.4',
        estado: x.pcUuid ? 'Asignado' : 'En stock',
        ultimaSinc: pc?.ultimaSincronizacion || null,
      });
    });

    // 4. Webcams (Agente)
    (perifericosAgente?.webcams ?? []).forEach((x, idx) => {
      const pc = x.pcUuid ? pcMap.get(x.pcUuid) : null;
      list.push({
        id: `cam-${x.pcUuid || 'stk'}-${idx}`,
        tipoKey: 'webcams',
        tipoLabel: 'Webcam',
        nombre: x.nombre || 'Webcam HD',
        subtitulo: x.fabricante && x.fabricante !== '—' ? `${x.fabricante} Conferencia` : 'Webcam USB',
        serial: x.serial || (x.pcUuid ? `CAM-${x.pcUuid.slice(0, 6).toUpperCase()}` : '—'),
        conexion: x.conexion || 'USB-A',
        pcUuid: x.pcUuid || null,
        pcHostname: x.pcHostname || (pc ? pc.hostname : null),
        responsable: pc ? pc.responsableInventario || pc.usuarioActual || '—' : '—',
        area: pc && pc.ubicacion ? labelUbicacionEnum(pc.ubicacion) : '—',
        origen: 'Agente v2.4',
        estado: x.pcUuid ? 'Asignado' : 'En stock',
        ultimaSinc: pc?.ultimaSincronizacion || null,
      });
    });

    // 5. Audio: Parlantes y Micrófonos (Agente)
    (perifericosAgente?.parlantes ?? []).forEach((x, idx) => {
      const pc = x.pcUuid ? pcMap.get(x.pcUuid) : null;
      list.push({
        id: `spk-${x.pcUuid || 'stk'}-${idx}`,
        tipoKey: 'audio',
        tipoLabel: 'Parlante',
        nombre: x.nombre || 'Altavoces Audio',
        subtitulo: x.fabricante || 'Dispositivo de Salida Audio',
        serial: x.serial || (x.pcUuid ? `SPK-${x.pcUuid.slice(0, 6).toUpperCase()}` : '—'),
        conexion: x.conexion || 'Jack 3.5mm / USB',
        pcUuid: x.pcUuid || null,
        pcHostname: x.pcHostname || (pc ? pc.hostname : null),
        responsable: pc ? pc.responsableInventario || pc.usuarioActual || '—' : '—',
        area: pc && pc.ubicacion ? labelUbicacionEnum(pc.ubicacion) : '—',
        origen: 'Agente v2.4',
        estado: x.pcUuid ? 'Asignado' : 'En stock',
        ultimaSinc: pc?.ultimaSincronizacion || null,
      });
    });

    (perifericosAgente?.microfonos ?? []).forEach((x, idx) => {
      const pc = x.pcUuid ? pcMap.get(x.pcUuid) : null;
      list.push({
        id: `mic-${x.pcUuid || 'stk'}-${idx}`,
        tipoKey: 'audio',
        tipoLabel: 'Micrófono',
        nombre: x.nombre || 'Micrófono Entrada',
        subtitulo: x.fabricante || 'Dispositivo de Entrada Audio',
        serial: x.serial || (x.pcUuid ? `MIC-${x.pcUuid.slice(0, 6).toUpperCase()}` : '—'),
        conexion: x.conexion || 'Jack 3.5mm / USB',
        pcUuid: x.pcUuid || null,
        pcHostname: x.pcHostname || (pc ? pc.hostname : null),
        responsable: pc ? pc.responsableInventario || pc.usuarioActual || '—' : '—',
        area: pc && pc.ubicacion ? labelUbicacionEnum(pc.ubicacion) : '—',
        origen: 'Agente v2.4',
        estado: x.pcUuid ? 'Asignado' : 'En stock',
        ultimaSinc: pc?.ultimaSincronizacion || null,
      });
    });

    // 6. Impresoras
    (impresoras ?? []).forEach((g, gIdx) => {
      const pcs = Array.isArray(g.pcs) ? g.pcs : [];
      const conx =
        g.puerto && (g.puerto.toLowerCase().includes('ip') || g.puerto.toLowerCase().includes('tcp'))
          ? 'Red / IP'
          : 'USB-A';
      if (pcs.length === 0) {
        list.push({
          id: `prn-${gIdx}-0`,
          tipoKey: 'impresoras',
          tipoLabel: 'Impresora',
          nombre: g.nombre || 'Impresora de Red',
          subtitulo: g.driver || 'Impresora de red / cola local',
          serial: g.puerto ? `PORT: ${g.puerto}` : `PRN-${gIdx}`,
          conexion: conx,
          pcUuid: null,
          pcHostname: null,
          responsable: '—',
          area: 'Oficina Central',
          origen: 'Agente v2.4',
          estado: 'Asignado',
          ultimaSinc: null,
        });
      } else {
        pcs.forEach((pcRef, pcIdx) => {
          const pc = pcRef.uuid ? pcMap.get(pcRef.uuid) : null;
          list.push({
            id: `prn-${gIdx}-${pcIdx}`,
            tipoKey: 'impresoras',
            tipoLabel: 'Impresora',
            nombre: g.nombre || 'Impresora de Red',
            subtitulo: g.driver || 'Impresora compartida',
            serial: g.puerto ? `PORT: ${g.puerto}` : `PRN-${gIdx}`,
            conexion: conx,
            pcUuid: pcRef.uuid || null,
            pcHostname: pcRef.hostname || (pc ? pc.hostname : null),
            responsable: pc ? pc.responsableInventario || pc.usuarioActual || '—' : '—',
            area: pc && pc.ubicacion ? labelUbicacionEnum(pc.ubicacion) : '—',
            origen: 'Agente v2.4',
            estado: 'Asignado',
            ultimaSinc: pc?.ultimaSincronizacion || null,
          });
        });
      }
    });

    // 7. Televisores
    (televisores ?? []).forEach((t, idx) => {
      list.push({
        id: `tv-${t.id || idx}`,
        tipoKey: 'televisores',
        tipoLabel: 'Televisor',
        nombre: [t.marca, t.modelo].filter(Boolean).join(' ') || 'Smart TV',
        subtitulo: t.pulgadas ? `Pantalla ${t.pulgadas}"` : 'Pantalla Corporativa',
        serial: t.nroSerie || t.id || `TV-${idx}`,
        conexion: 'HDMI / Red',
        pcUuid: null,
        pcHostname: null,
        responsable: 'Recepción / Sala',
        area: t.ubicacion || 'Edificio Central',
        origen: 'Carga manual',
        estado: t.estado === 'BAJA' ? 'Baja' : t.estado === 'EN_REPARACION' ? 'En reparación' : 'Asignado',
        ultimaSinc: null,
      });
    });

    // 8. Celulares
    (celularesList ?? []).forEach((c, idx) => {
      list.push({
        id: `cel-${c.id || idx}`,
        tipoKey: 'celulares',
        tipoLabel: 'Celular',
        nombre: [c.marca, c.modelo].filter(Boolean).join(' ') || 'Celular Corporativo',
        subtitulo: c.linea ? `Línea: ${c.linea}` : 'Flota Corporativa',
        serial: c.imei || c.nroSerie || c.id || `CEL-${idx}`,
        conexion: 'USB-C / 4G',
        pcUuid: null,
        pcHostname: null,
        responsable: c.responsable || '—',
        area: c.ubicacion || 'Flota Comercial',
        origen: 'Carga manual',
        estado:
          c.estado === 'ASIGNADA' || c.estado === 'ASIGNADO'
            ? 'Asignado'
            : c.estado === 'SIN_ASIGNAR'
            ? 'En stock'
            : c.estado || 'Asignado',
        ultimaSinc: null,
      });
    });

    // 9. Periféricos en Stock Manual (perifericos_manuales)
    (stockManual ?? []).forEach((p, idx) => {
      const rawTipo = (p.tipo || '').toLowerCase();
      // Excluir computadoras para no duplicar con el módulo de PCs
      if (
        rawTipo.includes('pc') ||
        rawTipo.includes('notebook') ||
        rawTipo.includes('computador')
      ) {
        return;
      }

      let catKey = 'otros';
      let catLabel = p.tipo || 'Accesorio';
      if (rawTipo.includes('monitor') || rawTipo.includes('pantalla')) {
        catKey = 'monitores';
        catLabel = 'Monitor';
      } else if (rawTipo.includes('teclado')) {
        catKey = 'teclados';
        catLabel = 'Teclado';
      } else if (rawTipo.includes('mouse')) {
        catKey = 'mouse';
        catLabel = 'Mouse';
      } else if (rawTipo.includes('webcam') || rawTipo.includes('camara')) {
        catKey = 'webcams';
        catLabel = 'Webcam';
      } else if (rawTipo.includes('parlante') || rawTipo.includes('microfono') || rawTipo.includes('audio')) {
        catKey = 'audio';
        catLabel = 'Audio';
      } else if (rawTipo.includes('impresora')) {
        catKey = 'impresoras';
        catLabel = 'Impresora';
      }

      const est =
        p.estado === 'SIN_ASIGNAR'
          ? 'En stock'
          : p.estado === 'ASIGNADA'
          ? 'Asignado'
          : p.estado === 'EN_MANTENIMIENTO'
          ? 'En reparación'
          : p.estado === 'BAJA'
          ? 'Baja'
          : 'En stock';

      list.push({
        id: `stk-${p.id || idx}`,
        tipoKey: catKey,
        tipoLabel: catLabel,
        nombre: [p.marca, p.modelo].filter(Boolean).join(' ') || p.tipo || 'Dispositivo en stock',
        subtitulo: p.notas || p.descripcion || 'Existencia en depósito',
        serial: p.nroSerie || p.codigo || `STK-${p.id || idx}`,
        conexion: p.conexion || (catKey === 'monitores' ? 'HDMI / DP' : 'USB-A'),
        pcUuid: null,
        pcHostname: null,
        responsable: p.responsable || 'Depósito Logística',
        area: p.ubicacion || 'Almacén Central',
        origen: 'Carga manual',
        estado: est,
        ultimaSinc: p.fechaAlta || p.updatedAt || null,
      });
    });

    return list;
  }, [
    monitores,
    perifericosAgente,
    impresoras,
    televisores,
    celularesList,
    stockManual,
    pcMap,
  ]);

  // Conteos por categoría
  const conteos = useMemo(() => {
    const acc = {
      todos: todosLosPerifericos.length,
      monitores: 0,
      teclados: 0,
      mouse: 0,
      webcams: 0,
      audio: 0,
      impresoras: 0,
      televisores: 0,
      celulares: 0,
      otros: 0,
    };
    for (const item of todosLosPerifericos) {
      if (acc[item.tipoKey] !== undefined) {
        acc[item.tipoKey]++;
      } else {
        acc.otros++;
      }
    }
    return acc;
  }, [todosLosPerifericos]);

  // KPIs superiores
  const kpiStats = useMemo(() => {
    const calc = (key) => {
      const items = todosLosPerifericos.filter((p) => p.tipoKey === key);
      const enUso = items.filter((p) => p.estado === 'Asignado').length;
      const stock = items.length - enUso;
      return { total: items.length, enUso, stock };
    };

    const audioItems = todosLosPerifericos.filter((p) => p.tipoKey === 'audio');
    const audioEnUso = audioItems.filter((p) => p.estado === 'Asignado').length;

    const otrosItems = todosLosPerifericos.filter((p) =>
      ['impresoras', 'televisores', 'celulares', 'otros'].includes(p.tipoKey)
    );
    const otrosEnUso = otrosItems.filter((p) => p.estado === 'Asignado').length;

    return {
      monitores: calc('monitores'),
      teclados: calc('teclados'),
      mouse: calc('mouse'),
      webcams: calc('webcams'),
      audio: { total: audioItems.length, enUso: audioEnUso, stock: audioItems.length - audioEnUso },
      otros: { total: otrosItems.length, enUso: otrosEnUso, stock: otrosItems.length - otrosEnUso },
    };
  }, [todosLosPerifericos]);

  // Filtrado de la tabla
  const filasFiltradas = useMemo(() => {
    let list = todosLosPerifericos;

    // Filtro por solapa
    if (tabActiva !== 'todos') {
      list = list.filter((p) => p.tipoKey === tabActiva);
    }

    // Buscador
    if (buscar.trim()) {
      const q = buscar.trim().toLowerCase();
      list = list.filter((p) => {
        const blob = [
          p.nombre,
          p.subtitulo,
          p.serial,
          p.conexion,
          p.pcHostname,
          p.responsable,
          p.area,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      });
    }

    // Selectores
    if (filtroConexion) {
      list = list.filter((p) =>
        (p.conexion || '').toLowerCase().includes(filtroConexion.toLowerCase())
      );
    }
    if (filtroEstado) {
      list = list.filter((p) => (p.estado || '').toLowerCase() === filtroEstado.toLowerCase());
    }
    if (filtroOrigen) {
      list = list.filter((p) => (p.origen || '').toLowerCase().includes(filtroOrigen.toLowerCase()));
    }
    if (filtroArea) {
      list = list.filter((p) => (p.area || '').toLowerCase().includes(filtroArea.toLowerCase()));
    }

    return list;
  }, [
    todosLosPerifericos,
    tabActiva,
    buscar,
    filtroConexion,
    filtroEstado,
    filtroOrigen,
    filtroArea,
  ]);

  // Paginación
  const totalFiltradas = filasFiltradas.length;
  const totalPaginas =
    filasPorPagina === 'todos' ? 1 : Math.ceil(totalFiltradas / Number(filasPorPagina)) || 1;

  const filasPaginadas = useMemo(() => {
    if (filasPorPagina === 'todos') return filasFiltradas;
    const limit = Number(filasPorPagina);
    const start = (paginaActual - 1) * limit;
    return filasFiltradas.slice(start, start + limit);
  }, [filasFiltradas, paginaActual, filasPorPagina]);

  const toggleSelectTodo = () => {
    if (seleccionados.size === filasPaginadas.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(filasPaginadas.map((r) => r.id)));
    }
  };

  const toggleSelect = (id) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const cambiarSolapa = (key) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (key === 'todos') next.delete('tipo');
      else next.set('tipo', key);
      return next;
    });
    setPaginaActual(1);
  };

  const resetFiltros = () => {
    setBuscar('');
    setFiltroConexion('');
    setFiltroEstado('');
    setFiltroOrigen('');
    setFiltroArea('');
    setPaginaActual(1);
  };

  const hayFiltros =
    Boolean(buscar.trim()) ||
    Boolean(filtroConexion) ||
    Boolean(filtroEstado) ||
    Boolean(filtroOrigen) ||
    Boolean(filtroArea);

  // Exportar a CSV
  const exportarCsv = () => {
    if (!filasFiltradas.length) return;
    const headers = [
      'Tipo',
      'Dispositivo',
      'Detalle',
      'N° Serie / ID',
      'Conexión',
      'Hostname',
      'Responsable',
      'Área',
      'Origen',
      'Estado',
      'Última Sincronización',
    ];
    const rows = filasFiltradas.map((r) => [
      `"${r.tipoLabel}"`,
      `"${(r.nombre || '').replace(/"/g, '""')}"`,
      `"${(r.subtitulo || '').replace(/"/g, '""')}"`,
      `"${(r.serial || '').replace(/"/g, '""')}"`,
      `"${(r.conexion || '').replace(/"/g, '""')}"`,
      `"${(r.pcHostname || '').replace(/"/g, '""')}"`,
      `"${(r.responsable || '').replace(/"/g, '""')}"`,
      `"${(r.area || '').replace(/"/g, '""')}"`,
      `"${(r.origen || '').replace(/"/g, '""')}"`,
      `"${(r.estado || '').replace(/"/g, '""')}"`,
      `"${(r.ultimaSinc ? formatFecha(r.ultimaSinc) : '').replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `perifericos_inventario_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const ratioPerif =
    computadoras.length > 0
      ? (todosLosPerifericos.length / computadoras.length).toFixed(1)
      : '0';

  if (cargando) return <StudioLoading message="Cargando inventario de periféricos…" />;

  return (
    <div className="flex flex-col space-y-4 pb-6 w-full" id="modulo-perifericos">
      {/* 1. ENCABEZADO EN CARD BLANCA (Estilo Stitch) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Periféricos</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {todosLosPerifericos.length} unidades en total · ~{ratioPerif} por estación
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Inventario consolidado de dispositivos de entrada, salida y accesorios detectados por agente y en stock.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={exportarCsv}
            disabled={!filasFiltradas.length}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#f1f5f9] hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-xs cursor-pointer"
            title="Exportar listado filtrado a CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar listado</span>
          </button>
          <WriteGate>
            <button
              type="button"
              onClick={() => setModalAltaOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c53030] hover:bg-[#9b2c2c] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar periférico manual</span>
            </button>
          </WriteGate>
        </div>
      </div>

      {/* 2. TIRA DE 6 KPIS SUPERIORES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Monitores */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Monitores
            </span>
            <Monitor className="w-4 h-4 text-blue-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {kpiStats.monitores.total}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {kpiStats.monitores.enUso} en uso · {kpiStats.monitores.stock} depósito
          </span>
        </div>

        {/* Teclados */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Teclados
            </span>
            <Keyboard className="w-4 h-4 text-orange-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {kpiStats.teclados.total}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {kpiStats.teclados.enUso} asignados · {kpiStats.teclados.stock} stock
          </span>
        </div>

        {/* Mouse */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Mouse Ópticos
            </span>
            <Mouse className="w-4 h-4 text-purple-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {kpiStats.mouse.total}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {kpiStats.mouse.enUso} asignados · {kpiStats.mouse.stock} stock
          </span>
        </div>

        {/* Webcams */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Webcams HD
            </span>
            <Video className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {kpiStats.webcams.total}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {kpiStats.webcams.enUso} salas/dir. · {kpiStats.webcams.stock} disp.
          </span>
        </div>

        {/* Audio y Parlantes */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Audio y Parlantes
            </span>
            <Speaker className="w-4 h-4 text-pink-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {kpiStats.audio.total}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {kpiStats.audio.enUso} en uso · {kpiStats.audio.stock} depósito
          </span>
        </div>

        {/* Otros / Impresoras / Celulares */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Otros Periféricos
            </span>
            <Printer className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {kpiStats.otros.total}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {kpiStats.otros.enUso} operativos · {kpiStats.otros.stock} stock
          </span>
        </div>
      </div>

      {/* 3. CARD UNIFICADA: SOLAPAS Y FILTROS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        {/* Cabecera integrada de Solapas */}
        <div className="p-2 sm:p-2.5 bg-slate-50/80 border-b border-slate-200 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 w-fit">
            {[
              { key: 'todos', label: 'Todos', count: conteos.todos },
              { key: 'monitores', label: 'Monitores', count: conteos.monitores },
              { key: 'teclados', label: 'Teclados', count: conteos.teclados },
              { key: 'mouse', label: 'Mouse', count: conteos.mouse },
              { key: 'webcams', label: 'Webcams', count: conteos.webcams },
              { key: 'audio', label: 'Audio', count: conteos.audio },
              { key: 'impresoras', label: 'Impresoras', count: conteos.impresoras },
              { key: 'televisores', label: 'Televisores', count: conteos.televisores },
              { key: 'celulares', label: 'Celulares', count: conteos.celulares },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => cambiarSolapa(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  tabActiva === tab.key
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                    tabActiva === tab.key
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros de ancho completo */}
        <FilterBar
          activeCount={
            [
              Boolean(buscar.trim()),
              Boolean(filtroConexion),
              Boolean(filtroEstado),
              Boolean(filtroOrigen),
              Boolean(filtroArea),
            ].filter(Boolean).length
          }
          onReset={resetFiltros}
        >
          <FilterBar.Search
            value={buscar}
            onChange={(val) => {
              setBuscar(val);
              setPaginaActual(1);
            }}
            placeholder="Buscar por número de serie, modelo, hostname..."
          />

          <FilterBar.Select
            value={filtroConexion}
            onChange={(val) => {
              setFiltroConexion(val);
              setPaginaActual(1);
            }}
          >
            <option value="">Conexión: Todas</option>
            <option value="USB">USB</option>
            <option value="HDMI">HDMI</option>
            <option value="DisplayPort">DisplayPort</option>
            <option value="Bluetooth">Bluetooth</option>
            <option value="Red">Red / IP</option>
          </FilterBar.Select>

          <FilterBar.Select
            value={filtroEstado}
            onChange={(val) => {
              setFiltroEstado(val);
              setPaginaActual(1);
            }}
          >
            <option value="">Estado: Todos</option>
            <option value="Asignado">Asignado</option>
            <option value="En stock">En stock</option>
            <option value="En reparación">En reparación</option>
            <option value="Baja">Baja</option>
          </FilterBar.Select>

          <FilterBar.Select
            value={filtroOrigen}
            onChange={(val) => {
              setFiltroOrigen(val);
              setPaginaActual(1);
            }}
          >
            <option value="">Origen: Todas</option>
            <option value="Agente">Agente v2.4</option>
            <option value="Carga manual">Carga manual</option>
          </FilterBar.Select>

          <FilterBar.Select
            value={filtroArea}
            onChange={(val) => {
              setFiltroArea(val);
              setPaginaActual(1);
            }}
          >
            <option value="">Área: Todas</option>
            <option value="Administración">Administración</option>
            <option value="Tesorería">Tesorería</option>
            <option value="Ventas">Ventas</option>
            <option value="Sistemas">Sistemas</option>
            <option value="Logística">Logística / Depósito</option>
          </FilterBar.Select>
        </FilterBar>
      </div>

      {/* 5. TABLA UNIFICADA DE PERIFÉRICOS (Full Width, 1:1 con Computadoras) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs w-full flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-3.5 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filasPaginadas.length > 0 &&
                      seleccionados.size === filasPaginadas.length
                    }
                    onChange={toggleSelectTodo}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-3.5 py-3.5">TIPO Y DISPOSITIVO</th>
                <th className="px-3.5 py-3.5">Nº SERIE / ID</th>
                <th className="px-3.5 py-3.5">CONEXIÓN</th>
                <th className="px-3.5 py-3.5">HOSTNAME VINCULADO</th>
                <th className="px-3.5 py-3.5">RESPONSABLE Y ÁREA</th>
                <th className="px-3.5 py-3.5">ORIGEN</th>
                <th className="px-3.5 py-3.5">ESTADO</th>
                <th className="px-3.5 py-3.5">ÚLTIMA SINC.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                    No se encontraron periféricos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filasPaginadas.map((row) => {
                  const isChecked = seleccionados.has(row.id);
                  const isAgent = row.origen.includes('Agente');

                  let estadoBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                  let estadoDot = 'bg-blue-500';
                  if (row.estado === 'En stock') {
                    estadoBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                    estadoDot = 'bg-purple-500';
                  } else if (row.estado === 'En reparación' || row.estado === 'En revisión') {
                    estadoBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                    estadoDot = 'bg-amber-500';
                  } else if (row.estado === 'Baja') {
                    estadoBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                    estadoDot = 'bg-rose-500';
                  }

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="px-3.5 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(row.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Tipo y Dispositivo */}
                      <td className="px-3.5 py-3.5 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                            {getIconForTipo(row.tipoLabel)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block truncate max-w-[240px]" title={row.nombre}>
                              {row.nombre}
                            </span>
                            <span className="text-xs text-slate-400 block truncate max-w-[240px]" title={row.subtitulo}>
                              {row.subtitulo}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* N° Serie / ID */}
                      <td className="px-3.5 py-3.5">
                        <span className="font-mono text-xs bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded text-slate-700 font-semibold inline-block max-w-[160px] truncate" title={row.serial}>
                          {row.serial}
                        </span>
                      </td>

                      {/* Conexión */}
                      <td className="px-3.5 py-3.5 font-medium text-slate-600 text-sm">
                        {row.conexion}
                      </td>

                      {/* Hostname Vinculado */}
                      <td className="px-3.5 py-3.5 text-sm">
                        {row.pcHostname && row.pcHostname !== '—' ? (
                          <button
                            type="button"
                            onClick={() => row.pcUuid && navigate(`/computadoras/${row.pcUuid}`)}
                            className="inline-flex items-center gap-1 font-mono font-bold text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            <Link2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>{row.pcHostname}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>

                      {/* Responsable y Área */}
                      <td className="px-3.5 py-3.5 text-sm">
                        <div>
                          <span className="font-semibold text-slate-800 block truncate max-w-[180px]" title={row.responsable}>
                            {row.responsable}
                          </span>
                          <span className="text-xs text-slate-400 block truncate max-w-[180px]" title={row.area}>
                            {row.area}
                          </span>
                        </div>
                      </td>

                      {/* Origen */}
                      <td className="px-3.5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isAgent
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAgent ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {row.origen}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="px-3.5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${estadoBadge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${estadoDot}`} />
                          {row.estado}
                        </span>
                      </td>

                      {/* Última Sinc */}
                      <td className="px-3.5 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                        {formatFecha(row.ultimaSinc)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PIE DE TABLA / PAGINACIÓN (Estilo Computadoras) */}
        <div className="bg-[#f8fafc] border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span>
              Mostrando{' '}
              <strong className="text-slate-800 font-semibold">
                {totalFiltradas === 0
                  ? 0
                  : filasPorPagina === 'todos'
                  ? 1
                  : (paginaActual - 1) * Number(filasPorPagina) + 1}
                -
                {filasPorPagina === 'todos'
                  ? totalFiltradas
                  : Math.min(paginaActual * Number(filasPorPagina), totalFiltradas)}
              </strong>{' '}
              de <strong className="text-slate-800 font-semibold">{totalFiltradas}</strong> periféricos
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 whitespace-nowrap">Por página:</span>
              <select
                value={filasPorPagina}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilasPorPagina(val === 'todos' ? 'todos' : Number(val));
                  setPaginaActual(1);
                }}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-semibold text-slate-700 !w-auto cursor-pointer"
              >
                <option value="todos">Todos</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Botones de navegación de página */}
          {filasPorPagina !== 'todos' && totalPaginas > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={paginaActual <= 1}
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
              <span className="px-2 py-0.5 text-xs font-semibold text-slate-700">
                {paginaActual} / {totalPaginas}
              </span>
              <button
                type="button"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ALTA DE PERIFÉRICO MANUAL */}
      <ModalAlta
        open={modalAltaOpen}
        onClose={() => setModalAltaOpen(false)}
      />
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, Outlet, useSearchParams } from 'react-router-dom';
import { Package, CheckCircle, Monitor, Search, Filter, Plus, MapPin, X, Check, Edit2, Trash2, Laptop, UserCheck, ChevronDown, Layers, ArrowUpRight, Warehouse } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchPerifericosM, fetchPerifericoM, actualizarPerifericoM, createPerifericoM, createComboPerifericoM, deletePerifericoM, asignarPerifericoM, sacarUnidadStockM } from '../api/perifericoManualApi';
import { fetchComputadoras, fetchComputadora, updateEstado, createComputadora, updateDatosStock, ingresarStock } from '../api/computadoraApi';
import ArmarComboModal from '../components/ArmarComboModal';
import ComputadoraStockFormFields from '../components/ComputadoraStockFormFields';
import StockPcLoteFormFields from '../components/StockPcLoteFormFields';
import FriendlySelect from '../components/FriendlySelect';
import {
  BadgeDisponibilidad,
  BadgeUnidadTrazable,
  StockEstadoLeyenda,
  StockEstadosUnidad,
  StockInfoBanner,
} from '../components/StockEstadoBadges';
import { labelTipoStock, normalizarTipoStock } from '../constants/tiposStock';
import { useCatalogo, opcionesCatalogo, opcionesEnumCatalogo, labelsEnumCatalogo, labelDeCatalogo } from '../hooks/useCatalogo';
import { StudioLoading, StudioError, StudioFilterBar } from '../components/studio/StudioUi';
import TableFilters from '../components/TableFilters';
import {
  buildNombreFromSpec,
  buildDefaultHostname,
  computadoraDesdeSacarUnidad,
  descripcionFromItem,
  etiquetaFromItem,
  resolveSpecFromItem,
  specSearchText,
  specToPayload,
  normalizeCatalogValue,
  normalizeUbicacionSede,
  UBICACION_DEPOSITO_DEFAULT,
} from '../utils/stockPcHelpers';
import { filtrarPcsAsignables, opcionesPcAsignable } from '../utils/perifericoPcHelpers';

function resolveTipoEquipoPc(pc) {
  const te = pc?.tipoEquipo;
  if (typeof te === 'string' && te.trim()) return te.trim();
  if (te && typeof te === 'object' && te.tipo) return String(te.tipo).trim();
  return pc?.especificacionEsperada?.tipoEquipo?.trim() || '';
}

function resolveCondicionPc(pc) {
  return pc?.condicion?.trim()
    || pc?.especificacionEsperada?.condicion?.trim()
    || '';
}

export default function PerifericoManualList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: tiposStockCatalogo } = useCatalogo('tipos_stock');
  const { items: estadoItems } = useCatalogo('estados_operativos');
  const { items: tiposEquipoItems } = useCatalogo('tipos_equipo');
  const { items: condicionesItems } = useCatalogo('condiciones_equipo');
  const { items: ubicCompItems } = useCatalogo('ubicaciones_computadora');
  const estadoLabels = useMemo(() => labelsEnumCatalogo(estadoItems), [estadoItems]);
  const [activeTab, setActiveTab] = useState('perifericos');
  const [formModeLotePc, setFormModeLotePc] = useState(false);

  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [pcsStock, setPcsStock] = useState([]);
  const [pcsAsignables, setPcsAsignables] = useState([]);
  const [cargandoPcs, setCargandoPcs] = useState(true);
  const [errorPcs, setErrorPcs] = useState(null);

  const [buscar, setBuscar] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formCargando, setFormCargando] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState('');

  // Form fields
  const [formNombre, setFormNombre] = useState('');
  const [formTipo, setFormTipo] = useState('teclado');
  const [formFabricante, setFormFabricante] = useState('');
  const [formConexion, setFormConexion] = useState('');
  const [formUbicacion, setFormUbicacion] = useState(UBICACION_DEPOSITO_DEFAULT);
  const [formCantidad, setFormCantidad] = useState('1');
  const [formCpu, setFormCpu] = useState('');
  const [formRam, setFormRam] = useState('');
  const [formDisco, setFormDisco] = useState('');
  const [formTipoEquipo, setFormTipoEquipo] = useState('');
  const [formCondicion, setFormCondicion] = useState('');
  const [formNumeroSerie, setFormNumeroSerie] = useState('');

  const resetFormSpec = () => {
    setFormCpu('');
    setFormRam('');
    setFormDisco('');
    setFormTipoEquipo('');
    setFormCondicion('');
  };

  const populateFormFromItem = (item) => {
    if (!item) return;
    const isLotePc = normalizarTipoStock(item.tipo) === 'computadora';
    const resolvedSpec = isLotePc ? resolveSpecFromItem(item) : null;

    setFormNombre(isLotePc ? descripcionFromItem(item) : (item.nombre || ''));
    setFormTipo(normalizarTipoStock(item.tipo) || 'teclado');
    setFormFabricante(item.fabricante || '');
    setFormConexion(item.conexion || '');
    setFormUbicacion(item.ubicacion || UBICACION_DEPOSITO_DEFAULT);
    setFormCantidad(String(item.cantidad ?? 1));
    setFormNumeroSerie(item.numeroSerie ?? '');
    if (isLotePc) {
      const tipoOpts = opcionesEnumCatalogo(tiposEquipoItems);
      const condOpts = opcionesEnumCatalogo(condicionesItems);
      setFormCpu(resolvedSpec.cpuModelo);
      setFormRam(resolvedSpec.ramTotalGb);
      setFormDisco(resolvedSpec.discoResumen);
      setFormTipoEquipo(normalizeCatalogValue(resolvedSpec.tipoEquipo, tipoOpts));
      setFormCondicion(normalizeCatalogValue(resolvedSpec.condicion, condOpts));
    } else {
      resetFormSpec();
    }
  };

  const formSpecPreview = useMemo(
    () => buildNombreFromSpec(specToPayload({
      cpuModelo: formCpu,
      ramTotalGb: formRam,
      discoResumen: formDisco,
      tipoEquipo: formTipoEquipo,
      condicion: formCondicion,
    })),
    [formCpu, formRam, formDisco, formTipoEquipo, formCondicion],
  );

  useEffect(() => {
    let cancel = false;
    setCargando(true);
    fetchPerifericosM()
      .then(data => { if (!cancel) setLista(data ?? []); })
      .catch(() => { if (!cancel) setError('No se pudo cargar el inventario de periféricos.'); })
      .finally(() => { if (!cancel) setCargando(false); });
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    let cancel = false;
    setCargandoPcs(true);
    fetchComputadoras()
      .then(data => {
        if (!cancel) {
          const todas = data ?? [];
          const sinAsignar = todas.filter(pc => pc.estadoActual === 'Sin Asignar');
          setPcsStock(sinAsignar);
          setPcsAsignables(filtrarPcsAsignables(todas));
        }
      })
      .catch(() => { if (!cancel) setErrorPcs('No se pudo cargar las computadoras en stock.'); })
      .finally(() => { if (!cancel) setCargandoPcs(false); });
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    const uuidEditar = searchParams.get('editarPc');
    if (!uuidEditar) return undefined;

    const tab = searchParams.get('tab');
    if (tab === 'perifericos' || tab === 'lotes-pc' || tab === 'unidades') {
      setActiveTab(tab);
    }

    let cancel = false;
    fetchComputadora(uuidEditar)
      .then((pc) => {
        if (cancel || !pc) return;
        handleOpenEditPc(pc);
        const next = new URLSearchParams(searchParams);
        next.delete('editarPc');
        next.delete('tab');
        setSearchParams(next, { replace: true });
      })
      .catch(() => {
        if (!cancel) setEditPcError('No se pudo abrir la PC para editar.');
      });

    return () => { cancel = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- abrir solo cuando llega editarPc por URL
  }, [searchParams.get('editarPc')]);

  const pcsNuevasStock = useMemo(() => {
    return lista.filter(c => normalizarTipoStock(c.tipo) === 'computadora');
  }, [lista]);

  const itemsFiltrados = useMemo(() => {
    return lista.filter(c => {
      if (normalizarTipoStock(c.tipo) === 'computadora') return false;
      const text = `${c.nombre || ''} ${c.fabricante || ''} ${c.id || ''} ${c.numeroSerie || ''} ${c.computadoraHostname || ''}`.toLowerCase();
      const matchesSearch = text.includes(buscar.toLowerCase());
      const matchesCategory = selectedCategory === 'All'
        || normalizarTipoStock(c.tipo) === normalizarTipoStock(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [lista, buscar, selectedCategory]);

  const handleUpdateStock = async (p, amount) => {
    const currentStock = p.cantidad ?? 1;
    const newStock = Math.max(0, currentStock + amount);
    if (newStock === currentStock) return;

    setLista(prev => prev.map(item => item.id === p.id ? { ...item, cantidad: newStock } : item));

    try {
      await actualizarPerifericoM(p.id, {
        tipo: p.tipo,
        cantidad: newStock,
        nombre: p.nombre,
        fabricante: p.fabricante,
        conexion: p.conexion,
        computadoraHostname: p.computadoraHostname,
        ubicacion: p.ubicacion,
        notas: p.notas,
      });
    } catch (err) {
      console.error("Error actualizando stock:", err);
      setLista(prev => prev.map(item => item.id === p.id ? { ...item, cantidad: currentStock } : item));
      alert("Hubo un error al actualizar el stock de " + (p.nombre || p.id));
    }
  };

  const handleOpenAdd = () => {
    setFormModeLotePc(false);
    setEditingItem(null);
    setFormNombre('');
    setFormTipo('teclado');
    setFormFabricante('');
    setFormConexion('');
    setFormUbicacion(UBICACION_DEPOSITO_DEFAULT);
    setFormCantidad('1');
    setFormNumeroSerie('');
    resetFormSpec();
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenAddLotePc = () => {
    setFormModeLotePc(true);
    setEditingItem(null);
    setFormNombre('');
    setFormTipo('computadora');
    setFormFabricante('');
    setFormConexion('');
    setFormUbicacion(UBICACION_DEPOSITO_DEFAULT);
    setFormCantidad('1');
    setFormNumeroSerie('');
    resetFormSpec();
    setIsFormOpen(true);
  };

  const handleOpenEdit = async (p) => {
    const isLotePc = normalizarTipoStock(p.tipo) === 'computadora';
    setFormModeLotePc(isLotePc);
    setEditingItem(p);
    setFormError('');
    setIsFormOpen(true);
    setFormCargando(true);
    resetFormSpec();
    setFormNombre('');
    setFormFabricante('');
    setFormConexion('');
    setFormUbicacion(UBICACION_DEPOSITO_DEFAULT);
    setFormCantidad('1');
    setFormNumeroSerie('');
    populateFormFromItem(p);

    try {
      const fresh = await fetchPerifericoM(p.id);
      if (fresh) {
        setEditingItem(fresh);
        populateFormFromItem(fresh);
        setLista(prev => prev.map(item => (item.id === fresh.id ? fresh : item)));
      }
    } catch {
      setFormError('No se pudieron cargar los datos guardados.');
    } finally {
      setFormCargando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const qty = parseInt(formCantidad, 10);
    if (isNaN(qty) || qty < 0) {
      setFormError('La cantidad debe ser un número válido.');
      return;
    }

    const tipoFinal = formModeLotePc ? 'computadora' : normalizarTipoStock(formTipo);
    const especificacionStock = formModeLotePc
      ? specToPayload({
        cpuModelo: formCpu,
        ramTotalGb: formRam,
        discoResumen: formDisco,
        tipoEquipo: formTipoEquipo,
        condicion: formCondicion,
      })
      : null;

    if (formModeLotePc) {
      if (!formCpu.trim()) {
        setFormError('La CPU es obligatoria para stock de PCs.');
        return;
      }
      const ram = parseInt(formRam, 10);
      if (!Number.isFinite(ram) || ram <= 0) {
        setFormError('La RAM (GB) es obligatoria y debe ser mayor a 0.');
        return;
      }
    } else if (!formNombre.trim()) {
      setFormError('Por favor redacta el nombre del componente.');
      return;
    }

    const numeroSerieFinal = formNumeroSerie.trim() || undefined;

    const nombreFinal = formModeLotePc
      ? (formNombre.trim() || undefined)
      : formNombre.trim();

    try {
      if (editingItem) {
        const payload = {
          nombre: nombreFinal,
          tipo: tipoFinal,
          fabricante: formFabricante,
          conexion: formConexion,
          cantidad: qty,
          computadoraHostname: editingItem.computadoraHostname,
          ubicacion: formUbicacion,
          notas: editingItem.notas,
          ...(formModeLotePc ? { especificacionStock } : { numeroSerie: numeroSerieFinal }),
        };
        const updated = await actualizarPerifericoM(editingItem.id, payload);
        if (updated) {
          setLista(prev => prev.map(item => (item.id === editingItem.id ? updated : item)));
        }
      } else {
        const payload = {
          nombre: nombreFinal,
          tipo: tipoFinal,
          fabricante: formFabricante,
          conexion: formConexion,
          ubicacion: formUbicacion,
          cantidad: qty,
          ...(formModeLotePc ? { especificacionStock } : { numeroSerie: numeroSerieFinal }),
        };
        const created = await createPerifericoM(payload);
        setLista(prev => [...prev, created]);
        if (formModeLotePc) setActiveTab('lotes-pc');
      }
      setIsFormOpen(false);
      setFormModeLotePc(false);
      resetFormSpec();
    } catch (err) {
      console.error("Error guardando periférico:", err);
      setFormError(err.message || 'Error al guardar el componente.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que querés eliminar este periférico? Esta acción no se puede deshacer.')) return;
    try {
      await deletePerifericoM(id);
      setLista(prev => prev.filter(item => item.id !== id));
      setIsFormOpen(false);
    } catch (err) {
      console.error("Error eliminando periférico:", err);
      alert('Error al eliminar el periférico.');
    }
  };

  // --- Combo creation state ---
  const [isComboOpen, setIsComboOpen] = useState(false);
  const [comboNombre, setComboNombre] = useState('');
  const [comboItems, setComboItems] = useState([
    { tipo: 'teclado', nombre: '', fabricante: '', conexion: '', cantidad: '1' },
    { tipo: 'mouse', nombre: '', fabricante: '', conexion: '', cantidad: '1' },
  ]);
  const [comboUbicacion, setComboUbicacion] = useState('');
  const [comboError, setComboError] = useState('');
  const [creandoCombo, setCreandoCombo] = useState(false);

  const handleOpenCombo = () => {
    setComboNombre('');
    setComboItems([
      { tipo: 'teclado', nombre: '', fabricante: '', conexion: '', cantidad: '1' },
      { tipo: 'mouse', nombre: '', fabricante: '', conexion: '', cantidad: '1' },
    ]);
    setComboUbicacion(UBICACION_DEPOSITO_DEFAULT);
    setComboError('');
    setIsComboOpen(true);
  };

  const handleComboItemChange = (idx, field, value) => {
    setComboItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleAddComboItem = () => {
    setComboItems(prev => [...prev, { tipo: 'otro', nombre: '', fabricante: '', conexion: '', cantidad: '1' }]);
  };

  const handleRemoveComboItem = (idx) => {
    if (comboItems.length <= 2) return;
    setComboItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitCombo = async (e) => {
    e.preventDefault();
    if (!comboNombre.trim()) { setComboError('El nombre del combo es obligatorio.'); return; }
    const items = comboItems.map(it => ({
      tipo: normalizarTipoStock(it.tipo),
      nombre: it.nombre.trim() || undefined,
      fabricante: it.fabricante.trim() || undefined,
      conexion: it.conexion.trim() || undefined,
      cantidad: parseInt(it.cantidad, 10) || 1,
      ubicacion: comboUbicacion.trim() || undefined,
    }));
    if (items.some(it => !it.tipo)) { setComboError('Todos los items deben tener un tipo.'); return; }
    setCreandoCombo(true);
    setComboError('');
    try {
      const creados = await createComboPerifericoM({ comboNombre: comboNombre.trim(), items });
      setLista(prev => [...prev, ...creados]);
      setIsComboOpen(false);
    } catch (err) {
      setComboError(err.message || 'Error al crear el combo.');
    } finally {
      setCreandoCombo(false);
    }
  };

  // --- PC Stock: search, assign modal state ---
  const [buscarLote, setBuscarLote] = useState('');
  const [buscarUnidad, setBuscarUnidad] = useState('');
  const [sacarUnidadLote, setSacarUnidadLote] = useState(null);
  const [sacarUnidadHostname, setSacarUnidadHostname] = useState('');
  const [sacarUnidadMotivo, setSacarUnidadMotivo] = useState('');
  const [sacarUnidadError, setSacarUnidadError] = useState('');
  const [sacandoUnidad, setSacandoUnidad] = useState(false);
  const [asignarPc, setAsignarPc] = useState(null);
  const [asignarA, setAsignarA] = useState('');
  const [asignarMotivo, setAsignarMotivo] = useState('');
  const [asignando, setAsignando] = useState(false);
  const [armarPc, setArmarPc] = useState(null);

  const [pcMenuOpen, setPcMenuOpen] = useState(false);
  const [nuevaPcOpen, setNuevaPcOpen] = useState(false);
  const [nuevaPcHostname, setNuevaPcHostname] = useState('');
  const [nuevaPcSo, setNuevaPcSo] = useState('');
  const [nuevaPcUbicacion, setNuevaPcUbicacion] = useState('');
  const [nuevaPcUbicacionStock, setNuevaPcUbicacionStock] = useState(UBICACION_DEPOSITO_DEFAULT);
  const [nuevaPcMotivo, setNuevaPcMotivo] = useState('');
  const [nuevaPcTipoEquipo, setNuevaPcTipoEquipo] = useState('');
  const [nuevaPcCondicion, setNuevaPcCondicion] = useState('');
  const [creandoPc, setCreandoPc] = useState(false);

  const [editPcOpen, setEditPcOpen] = useState(false);
  const [editPcCargando, setEditPcCargando] = useState(false);
  const [editPc, setEditPc] = useState(null);
  const [editPcSo, setEditPcSo] = useState('');
  const [editPcUbicacion, setEditPcUbicacion] = useState('');
  const [editPcUbicacionStock, setEditPcUbicacionStock] = useState('');
  const [editPcTipoEquipo, setEditPcTipoEquipo] = useState('');
  const [editPcCondicion, setEditPcCondicion] = useState('');
  const [guardandoPcEdit, setGuardandoPcEdit] = useState(false);
  const [ingresandoPcStock, setIngresandoPcStock] = useState(false);
  const [editPcMotivoIngreso, setEditPcMotivoIngreso] = useState('Ingreso a stock');
  const [editPcError, setEditPcError] = useState('');

  const [asignarDesdeListaOpen, setAsignarDesdeListaOpen] = useState(false);

  // --- Periférico: assign modal state ---
  const [asignarPeriferico, setAsignarPeriferico] = useState(null);
  const [pcUuidAsignar, setPcUuidAsignar] = useState('');
  const [motivoAsignarPerif, setMotivoAsignarPerif] = useState('');
  const [asignandoPerif, setAsignandoPerif] = useState(false);

  const opcionesPcAsignacion = useMemo(
    () => opcionesPcAsignable(pcsAsignables),
    [pcsAsignables],
  );

  const lotesFiltrados = useMemo(() => {
    if (!buscarLote) return pcsNuevasStock;
    const q = buscarLote.toLowerCase();
    return pcsNuevasStock.filter(p => {
      const text = `${p.nombre || ''} ${p.fabricante || ''} ${p.id || ''} ${p.ubicacion || ''} ${specSearchText(resolveSpecFromItem(p))}`.toLowerCase();
      return text.includes(q);
    });
  }, [pcsNuevasStock, buscarLote]);

  const unidadesFiltradas = useMemo(() => {
    if (!buscarUnidad) return pcsStock;
    const q = buscarUnidad.toLowerCase();
    return pcsStock.filter(pc => {
      const text = `${pc.hostname || ''} ${pc.uuid || ''} ${pc.sistemaOperativo || ''} ${pc.tipoEquipo || ''} ${pc.ubicacion || ''} ${pc.fabricante || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [pcsStock, buscarUnidad]);

  const totalUnidadesLotes = useMemo(
    () => pcsNuevasStock.reduce((sum, p) => sum + (p.cantidad ?? 1), 0),
    [pcsNuevasStock],
  );

  const unidadesConBaseline = useMemo(
    () => pcsStock.filter(pc => pc.estadoConciliacion === 'BASELINE_LISTO').length,
    [pcsStock],
  );

  const handleAsignar = async () => {
    if (!asignarA.trim()) return;
    setAsignando(true);
    try {
      await updateEstado(asignarPc.uuid, 'ASIGNADA', asignarMotivo.trim() || 'Asignación desde stock', { responsableInventario: asignarA.trim() });
      setPcsStock(prev => prev.filter(pc => pc.uuid !== asignarPc.uuid));
      setAsignarPc(null);
      setAsignarA('');
      setAsignarMotivo('');
    } catch (err) {
      console.error('Error asignando PC:', err);
      alert('Error al asignar la computadora.');
    } finally {
      setAsignando(false);
    }
  };

  const handleAsignarPeriferico = async () => {
    if (!pcUuidAsignar.trim() || !asignarPeriferico) return;
    setAsignandoPerif(true);
    try {
      const result = await asignarPerifericoM(
        asignarPeriferico.id,
        pcUuidAsignar.trim(),
        motivoAsignarPerif.trim() || 'Asignación desde stock'
      );
      if (!result) {
        alert('No se encontró el periférico.');
        return;
      }
      const data = await fetchPerifericosM();
      setLista(data ?? []);
      setAsignarPeriferico(null);
      setPcUuidAsignar('');
      setMotivoAsignarPerif('');
    } catch (err) {
      console.error('Error asignando periférico:', err);
      alert('Error al asignar el periférico.');
    } finally {
      setAsignandoPerif(false);
    }
  };

  const handleCrearPcStock = async () => {
    if (!nuevaPcHostname.trim()) return;
    setCreandoPc(true);
    try {
      const created = await createComputadora({
        hostname: nuevaPcHostname.trim(),
        sistemaOperativo: nuevaPcSo.trim() || undefined,
        ubicacion: nuevaPcUbicacion || undefined,
        tipoEquipo: nuevaPcTipoEquipo || undefined,
        condicion: nuevaPcCondicion || undefined,
        motivo: nuevaPcMotivo.trim() || 'Alta de equipo al stock',
      });
      if (created && nuevaPcUbicacionStock.trim()) {
        await updateEstado(created.uuid, 'SIN_ASIGNAR', 'Ingreso a stock', { ubicacionStock: nuevaPcUbicacionStock.trim() });
        created.estadoActual = 'Sin Asignar';
        created.ubicacionStock = nuevaPcUbicacionStock.trim();
      }
      if (created && created.estadoActual === 'Sin Asignar') {
        setPcsStock(prev => [...prev, created]);
      }
      setNuevaPcOpen(false);
      setNuevaPcHostname('');
      setNuevaPcSo('');
      setNuevaPcUbicacion('');
      setNuevaPcUbicacionStock(UBICACION_DEPOSITO_DEFAULT);
      setNuevaPcTipoEquipo('');
      setNuevaPcCondicion('');
      setNuevaPcMotivo('');
    } catch (err) {
      console.error('Error creando PC:', err);
      alert('Error al crear la computadora: ' + (err.message || ''));
    } finally {
      setCreandoPc(false);
    }
  };

  function handleOpenSacarUnidad(lote) {
    setSacarUnidadLote(lote);
    setSacarUnidadHostname(buildDefaultHostname(lote));
    setSacarUnidadMotivo('');
    setSacarUnidadError('');
  }

  async function handleConfirmSacarUnidad() {
    if (!sacarUnidadLote) return;
    setSacandoUnidad(true);
    setSacarUnidadError('');
    try {
      const result = await sacarUnidadStockM(sacarUnidadLote.id, {
        hostname: sacarUnidadHostname.trim() || undefined,
        motivo: sacarUnidadMotivo.trim() || undefined,
      });
      if (result?.lote) {
        setLista(prev => prev.map(item => (item.id === result.lote.id ? result.lote : item)));
      }
      if (result?.computadora) {
        const pc = computadoraDesdeSacarUnidad(result.computadora, result.lote ?? sacarUnidadLote);
        if (pc?.uuid) {
          setPcsStock(prev => [...prev, pc]);
        }
      }
      setSacarUnidadLote(null);
      setActiveTab('unidades');
    } catch (err) {
      setSacarUnidadError(err.message || 'No se pudo sacar la unidad.');
    } finally {
      setSacandoUnidad(false);
    }
  }

  const getUbicacionStock = (pc) => pc.ubicacionStock?.trim() || null;

  const populateEditPcForm = (pc) => {
    if (!pc) return;
    setEditPcSo(pc.sistemaOperativo || '');
    setEditPcUbicacion(normalizeUbicacionSede(pc.ubicacion, ubicCompItems));
    setEditPcUbicacionStock(getUbicacionStock(pc) || UBICACION_DEPOSITO_DEFAULT);
    setEditPcTipoEquipo(normalizeCatalogValue(
      resolveTipoEquipoPc(pc),
      opcionesEnumCatalogo(tiposEquipoItems),
    ));
    setEditPcCondicion(normalizeCatalogValue(
      resolveCondicionPc(pc),
      opcionesEnumCatalogo(condicionesItems),
    ));
  };

  async function handleOpenEditPc(pc) {
    setEditPcError('');
    setEditPcMotivoIngreso('Ingreso a stock');
    setEditPc(pc);
    setEditPcOpen(true);
    setEditPcCargando(true);
    populateEditPcForm(pc);

    try {
      const full = await fetchComputadora(pc.uuid);
      if (full) {
        setEditPc(full);
        populateEditPcForm(full);
        setPcsStock(prev => prev.map(p => (p.uuid === full.uuid ? { ...p, ...full } : p)));
      }
    } catch {
      setEditPcError('No se pudieron cargar los datos de la computadora.');
    } finally {
      setEditPcCargando(false);
    }
  }

  async function handleGuardarEditPc() {
    if (!editPc) return;
    setGuardandoPcEdit(true);
    setEditPcError('');
    try {
      const updated = await updateDatosStock(editPc.uuid, {
        sistemaOperativo: editPcSo.trim() || '',
        ubicacion: editPcUbicacion || '',
        ubicacionStock: editPcUbicacionStock.trim() || '',
        tipoEquipo: editPcTipoEquipo || '',
        condicion: editPcCondicion || '',
      });
      if (!updated) {
        setEditPcError('No se encontró la computadora.');
        return;
      }
      setPcsStock(prev => prev.map(p => (
        p.uuid === editPc.uuid ? { ...p, ...updated } : p
      )));
      setEditPcOpen(false);
      setEditPc(null);
    } catch (err) {
      setEditPcError(err.message || 'No se pudo guardar los cambios.');
    } finally {
      setGuardandoPcEdit(false);
    }
  }

  async function handleIngresarPcStock() {
    if (!editPc) return;
    setIngresandoPcStock(true);
    setEditPcError('');
    const ubicDeposito = editPcUbicacionStock.trim() || UBICACION_DEPOSITO_DEFAULT;
    const motivo = editPcMotivoIngreso.trim() || 'Ingreso a stock';

    try {
      const updated = await ingresarStock(editPc.uuid, {
        sistemaOperativo: editPcSo.trim() || '',
        ubicacion: editPcUbicacion || '',
        ubicacionStock: ubicDeposito,
        tipoEquipo: editPcTipoEquipo || '',
        condicion: editPcCondicion || '',
        motivo,
      });

      if (!updated) {
        setEditPcError('No se pudo ingresar la PC al stock.');
        return;
      }

      setPcsStock((prev) => {
        const idx = prev.findIndex(p => p.uuid === updated.uuid);
        if (idx >= 0) {
          return prev.map(p => (p.uuid === updated.uuid ? { ...p, ...updated } : p));
        }
        return [...prev, updated];
      });

      setEditPcOpen(false);
      setEditPc(null);
      setActiveTab('unidades');
    } catch (err) {
      setEditPcError(err.message || 'No se pudo ingresar al stock.');
    } finally {
      setIngresandoPcStock(false);
    }
  }

  const editPcYaEnDeposito = editPc?.estadoActual === 'Sin Asignar';

  function puedeArmarPcStock(pc) {
    return pc.origenAlta === 'STOCK' && pc.estadoConciliacion === 'SIN_BASELINE';
  }

  if (activeTab === 'perifericos' && cargando) {
    return (
      <>
        <StudioLoading />
        <Outlet />
      </>
    );
  }
  if (activeTab === 'perifericos' && error) {
    return (
      <>
        <StudioError message={error} />
        <Outlet />
      </>
    );
  }
  if (activeTab === 'lotes-pc' && cargando) {
    return (
      <>
        <StudioLoading />
        <Outlet />
      </>
    );
  }
  if (activeTab === 'lotes-pc' && error) {
    return (
      <>
        <StudioError message={error} />
        <Outlet />
      </>
    );
  }
  if (activeTab === 'unidades' && cargandoPcs) {
    return (
      <>
        <StudioLoading />
        <Outlet />
      </>
    );
  }
  if (activeTab === 'unidades' && errorPcs) {
    return (
      <>
        <StudioError message={errorPcs} />
        <Outlet />
      </>
    );
  }

  // KPIs (excluye tipo "computadora" — esas van en la pestaña Computadoras)
  const listaPerif = lista.filter(p => normalizarTipoStock(p.tipo) !== 'computadora');
  const totalItemsCount = listaPerif.reduce((sum, p) => sum + (p.cantidad ?? 1), 0);
  const totalAvailableCount = listaPerif.filter(p => p.estado === estadoLabels.SIN_ASIGNAR).reduce((sum, p) => sum + (p.cantidad ?? 1), 0);
  const totalAssignedCount = listaPerif.filter(p => p.estado === estadoLabels.ASIGNADA).reduce((sum, p) => sum + (p.cantidad ?? 1), 0);

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'computadora': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'camara_ip': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'teclado': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'mouse': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'monitor': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'impresora': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const uniqueCategories = [...new Set(lista.map(p => normalizarTipoStock(p.tipo)).filter(t => t && t !== 'computadora'))];

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-6 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Inventario IT y Control de Suministros</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {activeTab === 'perifericos' && 'Periféricos en depósito: teclados, monitores, mouse y otros componentes con control por cantidad.'}
            {activeTab === 'lotes-pc' && 'Contás cuántas PCs hay de cada tipo (ej. 3× Ryzen 5600G 8GB). Stock por cantidad — sin hostname ni agente.'}
            {activeTab === 'unidades' && 'Cada computadora tiene hostname y UUID. Armás el combo, asignás y conciliás con el agente CyberWatch.'}
          </p>
        </div>

        {activeTab === 'perifericos' && (
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
            <button
              onClick={handleOpenCombo}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm whitespace-nowrap"
            >
              <Layers className="w-4 h-4" />
              Combo
            </button>
          </div>
        )}

        {activeTab === 'lotes-pc' && (
          <button
            onClick={handleOpenAddLotePc}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm whitespace-nowrap ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            Cargar al stock
          </button>
        )}

        {activeTab === 'unidades' && (
          <div className="relative ml-auto sm:ml-0">
            <button
              onClick={() => setPcMenuOpen(prev => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nueva Asignación
              <ChevronDown className={`w-4 h-4 transition-transform ${pcMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {pcMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setPcMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden">
                  <button
                    onClick={() => { setPcMenuOpen(false); setNuevaPcOpen(true); }}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Laptop className="w-4 h-4 text-blue-600" />
                    Nueva computadora
                  </button>
                  <div className="border-t border-slate-100" />
                  <button
                    onClick={() => { setPcMenuOpen(false); setAsignarDesdeListaOpen(true); }}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    Asignar PC existente
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('perifericos')}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'perifericos'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          Periféricos
        </button>
        <button
          onClick={() => setActiveTab('lotes-pc')}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'lotes-pc'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          Stock de PCs
          {totalUnidadesLotes > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-700 rounded-full">{totalUnidadesLotes}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('unidades')}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'unidades'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Laptop className="w-4 h-4" />
          Computadoras
          {pcsStock.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">{pcsStock.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'perifericos' && (<>
      {/* Metrics Row (Simple, focuses only on count indicators) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">Total Adquirido</span>
            <span className="text-3xl font-black font-mono text-slate-900">{totalItemsCount} <span className="text-base font-normal text-slate-400">unidades</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">Disponible (En Bodega)</span>
            <span className="text-3xl font-black font-mono text-emerald-600">
              {totalAvailableCount} <span className="text-base font-medium text-slate-400">({totalItemsCount ? Math.round((totalAvailableCount / totalItemsCount) * 100) : 0}%)</span>
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">Asignado (En Uso)</span>
            <span className="text-3xl font-black font-mono text-indigo-600">
              {totalAssignedCount} <span className="text-base font-medium text-slate-400">({totalItemsCount ? Math.round((totalAssignedCount / totalItemsCount) * 100) : 0}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <StudioFilterBar>
        <TableFilters>
          <TableFilters.Search 
            value={buscar} 
            onChange={setBuscar} 
            placeholder="Buscar por componente, ID o ubicación..." 
          />
          <TableFilters.Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            label="Filtro"
          >
            <option value="All">Todas las categorías</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{labelTipoStock(cat)}</option>
            ))}
          </TableFilters.Select>
        </TableFilters>
      </StudioFilterBar>

      {/* Main Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">COD / ID</th>
                <th className="py-4 px-5">Componente IT / Fabricante</th>
                <th className="py-4 px-5">Categoría</th>
                <th className="py-4 px-5">Ubicación / Estado</th>
                <th className="py-4 px-5 text-center">Nivel de Stock</th>
                <th className="py-4 px-5 text-right">Controles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {itemsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-slate-400 font-medium">
                    No se encontraron componentes en el inventario que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                itemsFiltrados.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/perifericos/stock/${encodeURIComponent(c.id)}`)}
                  >
                    <td className="py-4 px-5">
                      <span className="font-mono font-bold text-blue-600 text-xs">
                        {c.id}
                      </span>
                    </td>
                    
                    <td className="py-4 px-5 font-bold text-slate-900">
                      <div className="space-y-1">
                        <p className="capitalize">{c.nombre ?? c.fabricante ?? '—'}</p>
                        {c.conexion && (
                          <p className="text-[11px] text-slate-400 font-normal">
                            Conexión: {c.conexion}
                          </p>
                        )}
                        {c.numeroSerie && (
                          <p className="text-[11px] text-slate-500 font-mono font-normal">
                            S/N: {c.numeroSerie}
                          </p>
                        )}
                        {c.comboNombre && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                            <Layers className="w-3 h-3" />
                            {c.comboNombre}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${getCategoryColor(c.tipo)}`}>
                        {labelTipoStock(c.tipo) || 'Sin tipo'}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex flex-col gap-1.5 items-start">
                        <BadgeDisponibilidad estadoActual={c.estado} estadoLabels={estadoLabels} />
                        {(c.computadoraUuid || c.computadoraHostname || c.ubicacion) && (
                          <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {c.computadoraUuid ? (
                              <Link
                                to={`/computadoras/${encodeURIComponent(c.computadoraUuid)}`}
                                className="truncate max-w-[150px] text-indigo-600 hover:underline"
                                title={c.computadoraHostname || c.computadoraUuid}
                              >
                                {c.computadoraHostname || c.computadoraUuid.slice(0, 8)}
                              </Link>
                            ) : (
                              <span className="truncate max-w-[150px]" title={c.computadoraHostname || c.ubicacion}>
                                {c.computadoraHostname || c.ubicacion}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className="font-bold font-mono text-slate-900 text-base">
                        {c.cantidad ?? 1}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-2">
                        <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded p-1 shadow-sm mr-2">
                          <button 
                            onClick={() => handleUpdateStock(c, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:text-red-600 hover:shadow-xs text-slate-500 font-bold transition-all cursor-pointer"
                            title="Restar 1 unidad"
                          >-</button>
                          <span className="text-slate-300 mx-0.5 text-xs">|</span>
                          <button 
                            onClick={() => handleUpdateStock(c, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:text-emerald-600 hover:shadow-xs text-slate-500 font-bold transition-all cursor-pointer"
                            title="Sumar 1 unidad"
                          >+</button>
                        </div>
                        <button
                          onClick={() => {
                            setAsignarPeriferico(c);
                            setPcUuidAsignar('');
                            setMotivoAsignarPerif('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Asignar
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                          title="Editar suministro"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      </>)}

      {activeTab === 'lotes-pc' && (
        <>
          <StockInfoBanner tipo="lotes" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">Total unidades</span>
                <span className="text-3xl font-black font-mono text-teal-600">{totalUnidadesLotes}</span>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">Ítems distintos</span>
                <span className="text-3xl font-black font-mono text-slate-900">{pcsNuevasStock.length}</span>
              </div>
            </div>
          </div>

          <StudioFilterBar>
            <TableFilters>
              <TableFilters.Search
                value={buscarLote}
                onChange={setBuscarLote}
                placeholder="Buscar por CPU, RAM, descripción, ubicación..."
              />
            </TableFilters>
          </StudioFilterBar>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-5">Etiqueta</th>
                    <th className="py-4 px-5">Descripción</th>
                    <th className="py-4 px-5">Tipo de equipo</th>
                    <th className="py-4 px-5">Condición</th>
                    <th className="py-4 px-5">Disponibilidad</th>
                    <th className="py-4 px-5">Ubicación</th>
                    <th className="py-4 px-5 text-center">Cantidad</th>
                    <th className="py-4 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {lotesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 px-4 text-center text-slate-400 font-medium">
                        No hay ítems en stock de PCs. Usá &quot;Cargar al stock&quot; para registrar ej. 3× Ryzen 5600G 8GB.
                      </td>
                    </tr>
                  ) : (
                    lotesFiltrados.map(lote => {
                      const loteSpec = resolveSpecFromItem(lote);
                      return (
                      <tr key={lote.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5">
                          <p className="text-xs font-semibold text-teal-800">{etiquetaFromItem(lote) || '—'}</p>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-xs font-medium text-slate-700">{lote.nombre?.trim() || '—'}</span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-xs font-medium text-slate-700">
                            {loteSpec.tipoEquipo
                              ? labelDeCatalogo(tiposEquipoItems, loteSpec.tipoEquipo)
                              : '—'}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-xs font-medium text-slate-700">
                            {loteSpec.condicion
                              ? labelDeCatalogo(condicionesItems, loteSpec.condicion)
                              : '—'}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <BadgeDisponibilidad estadoActual={lote.estado} estadoLabels={estadoLabels} />
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1 text-slate-700 text-xs font-medium">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{lote.ubicacion || UBICACION_DEPOSITO_DEFAULT}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span className="font-bold font-mono text-slate-900 text-base">{lote.cantidad ?? 1}</span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            {(lote.cantidad ?? 0) > 0 && loteSpec.cpuModelo && (
                              <button
                                type="button"
                                onClick={() => handleOpenSacarUnidad(lote)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                                title="Crear computadora trazable y restar 1 del lote"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                Sacar 1
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(lote)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded p-1 shadow-sm">
                              <button
                                onClick={() => handleUpdateStock(lote, -1)}
                                className="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:text-red-600 hover:shadow-xs text-slate-500 font-bold transition-all cursor-pointer"
                                title="Restar 1 unidad"
                              >-</button>
                              <span className="text-slate-300 mx-0.5 text-xs">|</span>
                              <button
                                onClick={() => handleUpdateStock(lote, 1)}
                                className="w-7 h-7 flex items-center justify-center rounded hover:bg-white hover:text-emerald-600 hover:shadow-xs text-slate-500 font-bold transition-all cursor-pointer"
                                title="Sumar 1 unidad"
                              >+</button>
                            </div>
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
      )}

      {activeTab === 'unidades' && (
        <>
          <StockInfoBanner tipo="unidades" />
          <StockEstadoLeyenda variant="compact" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">En depósito</span>
                <span className="text-3xl font-black font-mono text-blue-600">{pcsStock.length}</span>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-violet-50 text-violet-600 rounded-lg">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm text-slate-400 block font-bold uppercase tracking-wider mb-1">Combo armado</span>
                <span className="text-3xl font-black font-mono text-violet-600">{unidadesConBaseline}</span>
              </div>
            </div>
          </div>

          <StudioFilterBar>
            <TableFilters>
              <TableFilters.Search
                value={buscarUnidad}
                onChange={setBuscarUnidad}
                placeholder="Buscar por hostname, UUID, SO..."
              />
            </TableFilters>
          </StudioFilterBar>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-5">Equipo</th>
                    <th className="py-4 px-5">Estados</th>
                    <th className="py-4 px-5">Tipo / SO</th>
                    <th className="py-4 px-5">Ubicación</th>
                    <th className="py-4 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {unidadesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 px-4 text-center text-slate-400 font-medium">
                        No hay computadoras en depósito. Usá &quot;Nueva computadora&quot; para dar de alta una PC con hostname.
                      </td>
                    </tr>
                  ) : (
                    unidadesFiltradas.map(pc => (
                      <tr key={pc.uuid} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5">
                          <Link to={`/computadoras/${pc.uuid}`} className="font-mono font-bold text-blue-600 text-xs hover:underline hover:text-blue-800">
                            {pc.hostname || pc.uuid?.slice(0, 8)}
                          </Link>
                          <div className="mt-1">
                            <BadgeUnidadTrazable />
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <StockEstadosUnidad pc={pc} estadoLabels={estadoLabels} />
                        </td>
                        <td className="py-4 px-5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize bg-slate-50 text-slate-700 border-slate-100">
                            {pc.tipoEquipo || 'PC'}
                          </span>
                          {pc.sistemaOperativo && (
                            <span className="text-[11px] text-slate-400 ml-1.5">{pc.sistemaOperativo}</span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1 text-slate-700 text-xs font-medium">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{getUbicacionStock(pc) || UBICACION_DEPOSITO_DEFAULT}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="inline-flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPc(pc)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            {puedeArmarPcStock(pc) && (
                              <button
                                type="button"
                                onClick={() => setArmarPc(pc)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                              >
                                <Package className="w-3.5 h-3.5" />
                                Armar
                              </button>
                            )}
                            <button
                              onClick={() => { setAsignarPc(pc); setAsignarA(''); setAsignarMotivo(''); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Asignar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* POPUP MODAL: Assign PC */}
      <AnimatePresence>
        {asignarPc && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Asignar {asignarPc.hostname || asignarPc.uuid?.slice(0, 8)}
                </span>
                <button onClick={() => setAsignarPc(null)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="text-slate-700 block mb-1">Asignar a (responsable) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del responsable"
                    value={asignarA}
                    onChange={(e) => setAsignarA(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">Motivo</label>
                  <input
                    type="text"
                    placeholder="Ej: Nuevo ingreso, reemplazo..."
                    value={asignarMotivo}
                    onChange={(e) => setAsignarMotivo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAsignarPc(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAsignar}
                    disabled={!asignarA.trim() || asignando}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {asignando ? 'Asignando...' : 'Confirmar Asignación'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: Assign Periférico */}
      <AnimatePresence>
        {asignarPeriferico && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Asignar {asignarPeriferico.nombre || 'periférico'}
                </span>
                <button
                  onClick={() => setAsignarPeriferico(null)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs font-bold text-slate-700">
                <p className="text-slate-500 font-medium">
                  Vincula 1 unidad del stock a una PC trazable del inventario. Si hay más de 1 en stock, se descuenta del lote automáticamente.
                </p>
                <div>
                  <label className="text-slate-700 block mb-1">PC de stock *</label>
                  {pcsAsignables.length === 0 ? (
                    <p className="text-amber-700 font-medium">No hay PCs trazables de stock disponibles.</p>
                  ) : (
                    <FriendlySelect
                      name="pcUuidAsignarPerif"
                      value={pcUuidAsignar}
                      placeholder="Seleccionar PC…"
                      options={opcionesPcAsignacion}
                      onChange={setPcUuidAsignar}
                    />
                  )}
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">Motivo</label>
                  <input
                    type="text"
                    placeholder="Ej: Reemplazo, alta de puesto..."
                    value={motivoAsignarPerif}
                    onChange={(e) => setMotivoAsignarPerif(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAsignarPeriferico(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAsignarPeriferico}
                    disabled={!pcUuidAsignar.trim() || asignandoPerif || pcsAsignables.length === 0}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {asignandoPerif ? 'Asignando...' : 'Confirmar Asignación'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: Add new PC to stock */}
      <AnimatePresence>
        {nuevaPcOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  Nueva computadora
                </span>
                <button onClick={() => setNuevaPcOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs font-bold text-slate-700">
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-[11px] font-semibold">
                  Alta de una PC con hostname y UUID. Podés armar combo y conciliar con AgenteBacar.
                  Para contar stock sin hostname (ej. 3× Ryzen), usá la pestaña <strong>Stock de PCs</strong>.
                </div>
                <ComputadoraStockFormFields
                  hostname={nuevaPcHostname}
                  onHostnameChange={setNuevaPcHostname}
                  hostnameRequired
                  sistemaOperativo={nuevaPcSo}
                  onSistemaOperativoChange={setNuevaPcSo}
                  ubicacionSede={nuevaPcUbicacion}
                  onUbicacionSedeChange={setNuevaPcUbicacion}
                  tipoEquipo={nuevaPcTipoEquipo}
                  onTipoEquipoChange={setNuevaPcTipoEquipo}
                  condicion={nuevaPcCondicion}
                  onCondicionChange={setNuevaPcCondicion}
                  ubicacionDeposito={nuevaPcUbicacionStock}
                  onUbicacionDepositoChange={setNuevaPcUbicacionStock}
                  motivo={nuevaPcMotivo}
                  onMotivoChange={setNuevaPcMotivo}
                  showMotivo
                  tiposEquipoItems={tiposEquipoItems}
                  condicionesItems={condicionesItems}
                  ubicCompItems={ubicCompItems}
                  accent="blue"
                />
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNuevaPcOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCrearPcStock}
                    disabled={!nuevaPcHostname.trim() || creandoPc}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {creandoPc ? 'Creando...' : 'Agregar al Stock'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: Edit PC en stock (liberada) */}
      <AnimatePresence>
        {editPcOpen && editPc && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl max-h-[90vh] flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50 shrink-0">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  Editar {editPc.hostname || editPc.uuid?.slice(0, 8)}
                </span>
                <button
                  type="button"
                  onClick={() => { setEditPcOpen(false); setEditPc(null); }}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs font-bold text-slate-700 overflow-y-auto flex-1">
                {editPcCargando && (
                  <div className="p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[11px] font-semibold">
                    Cargando datos guardados…
                  </div>
                )}
                {editPcError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-[11px] font-semibold">
                    {editPcError}
                  </div>
                )}

                <ComputadoraStockFormFields
                  hostname={editPc.hostname || ''}
                  hostnameReadonly
                  especificacionEsperada={editPc.especificacionEsperada}
                  sistemaOperativo={editPcSo}
                  onSistemaOperativoChange={setEditPcSo}
                  ubicacionSede={editPcUbicacion}
                  onUbicacionSedeChange={setEditPcUbicacion}
                  tipoEquipo={editPcTipoEquipo}
                  onTipoEquipoChange={setEditPcTipoEquipo}
                  condicion={editPcCondicion}
                  onCondicionChange={setEditPcCondicion}
                  ubicacionDeposito={editPcUbicacionStock}
                  onUbicacionDepositoChange={setEditPcUbicacionStock}
                  tiposEquipoItems={tiposEquipoItems}
                  condicionesItems={condicionesItems}
                  ubicCompItems={ubicCompItems}
                  accent="blue"
                  disabled={editPcCargando || ingresandoPcStock}
                />

                {!editPcYaEnDeposito && (
                  <div>
                    <label className="text-slate-700 block mb-1">Motivo del ingreso</label>
                    <input
                      type="text"
                      value={editPcMotivoIngreso}
                      onChange={(e) => setEditPcMotivoIngreso(e.target.value)}
                      disabled={editPcCargando || ingresandoPcStock}
                      placeholder="Ej. Devolución desde usuario"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    {!editPcYaEnDeposito && (
                      <button
                        type="button"
                        onClick={handleIngresarPcStock}
                        disabled={ingresandoPcStock || editPcCargando || guardandoPcEdit}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Warehouse className="w-4 h-4" />
                        {ingresandoPcStock ? 'Ingresando...' : 'Ingresar a stock'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditPcOpen(false); setEditPc(null); }}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleGuardarEditPc}
                    disabled={guardandoPcEdit || editPcCargando || ingresandoPcStock}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {guardandoPcEdit ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: Assign from list */}
      <AnimatePresence>
        {asignarDesdeListaOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl max-h-[80vh] flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Seleccionar PC para asignar
                </span>
                <button onClick={() => setAsignarDesdeListaOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 border-b border-slate-100">
                <input
                  type="text"
                  placeholder="Buscar por hostname..."
                  value={buscarUnidad}
                  onChange={(e) => setBuscarUnidad(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                {unidadesFiltradas.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm font-medium">No hay computadoras disponibles en depósito.</div>
                ) : (
                  unidadesFiltradas.map(pc => (
                    <button
                      key={pc.uuid}
                      onClick={() => {
                        setAsignarDesdeListaOpen(false);
                        setAsignarPc(pc);
                        setAsignarA('');
                        setAsignarMotivo('');
                      }}
                      className="w-full px-5 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-mono font-bold text-sm text-slate-900">{pc.hostname || pc.uuid?.slice(0, 8)}</span>
                        <span className="text-xs text-slate-400 ml-2">{pc.sistemaOperativo || ''}</span>
                        {getUbicacionStock(pc) && (
                          <span className="text-xs text-slate-500 ml-2 flex items-center gap-1 inline-flex">
                            <MapPin className="w-3 h-3" />{getUbicacionStock(pc)}
                          </span>
                        )}
                      </div>
                      <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: Create Combo */}
      <AnimatePresence>
        {isComboOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full overflow-hidden shadow-xl max-h-[85vh] flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-600" />
                  Registrar Combo / Set
                </span>
                <button onClick={() => setIsComboOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitCombo} className="p-5 space-y-4 text-xs font-bold text-slate-700 overflow-y-auto flex-1">
                {comboError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-[11px] font-semibold">
                    {comboError}
                  </div>
                )}

                <div>
                  <label className="text-slate-700 block mb-1">Nombre del Combo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Combo Logitech MK270"
                    value={comboNombre}
                    onChange={(e) => setComboNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">Ubicación (compartida)</label>
                  <input
                    type="text"
                    placeholder="Ej. Depósito 1"
                    value={comboUbicacion}
                    onChange={(e) => setComboUbicacion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700">Items del combo ({comboItems.length})</label>
                    <button
                      type="button"
                      onClick={handleAddComboItem}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg font-bold text-[11px] transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Agregar item
                    </button>
                  </div>

                  {comboItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Item {idx + 1}</span>
                        {comboItems.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveComboItem(idx)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-slate-500 block mb-0.5 text-[10px]">Tipo *</label>
                          <select
                            required
                            value={item.tipo}
                            onChange={(e) => handleComboItemChange(idx, 'tipo', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-slate-800 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                          >
                            {opcionesCatalogo(tiposStockCatalogo, item.tipo).map(t => (
                              <option key={t.codigo} value={t.codigo}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5 text-[10px]">Nombre</label>
                          <input
                            type="text"
                            placeholder="Ej. K120"
                            value={item.nombre}
                            onChange={(e) => handleComboItemChange(idx, 'nombre', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5 text-[10px]">Fabricante</label>
                          <input
                            type="text"
                            placeholder="Ej. Logitech"
                            value={item.fabricante}
                            onChange={(e) => handleComboItemChange(idx, 'fabricante', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5 text-[10px]">Cantidad</label>
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => handleComboItemChange(idx, 'cantidad', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-slate-800 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComboOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creandoCombo}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {creandoCombo ? 'Creando...' : 'Crear Combo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: Register New Component or Edit Existing */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  {editingItem ? <Edit2 className="w-4 h-4 text-blue-600" /> : <Package className="w-4 h-4 text-blue-600" />}
                  <span>
                    {editingItem
                      ? (formModeLotePc ? 'Modificar ítem de stock' : 'Modificar suministro')
                      : (formModeLotePc ? 'Cargar stock de PC' : 'Registrar Nueva Adquisición IT')}
                  </span>
                </span>
                <button 
                  onClick={() => { setIsFormOpen(false); setFormModeLotePc(false); }}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form key={editingItem?.id ?? 'nuevo'} onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-bold text-slate-700">

                {formCargando && (
                  <div className="p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[11px] font-semibold">
                    Cargando datos guardados…
                  </div>
                )}
                
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-[11px] font-semibold">
                    {formError}
                  </div>
                )}

                {formModeLotePc ? (
                  <StockPcLoteFormFields
                    cpu={formCpu}
                    onCpuChange={setFormCpu}
                    ram={formRam}
                    onRamChange={setFormRam}
                    disco={formDisco}
                    onDiscoChange={setFormDisco}
                    tipoEquipo={formTipoEquipo}
                    onTipoEquipoChange={setFormTipoEquipo}
                    condicion={formCondicion}
                    onCondicionChange={setFormCondicion}
                    descripcion={formNombre}
                    onDescripcionChange={setFormNombre}
                    fabricante={formFabricante}
                    onFabricanteChange={setFormFabricante}
                    ubicacionDeposito={formUbicacion}
                    onUbicacionDepositoChange={setFormUbicacion}
                    cantidad={formCantidad}
                    onCantidadChange={setFormCantidad}
                    etiqueta={formSpecPreview}
                    tiposEquipoItems={tiposEquipoItems}
                    condicionesItems={condicionesItems}
                    showIntroBanner={!editingItem}
                    disabled={formCargando}
                  />
                ) : (
                <div>
                  <label className="text-slate-700 block mb-1">Nombre Comercial de Hardware / Software *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej. Memoria RAM DDR5 32GB 4800MHz"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                )}

                {!formModeLotePc && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 block mb-1">Categoría (Tipo)</label>
                    <select
                      required
                      value={formTipo}
                      onChange={(e) => setFormTipo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    >
                      {opcionesCatalogo(tiposStockCatalogo, formTipo)
                        .filter(t => normalizarTipoStock(t.codigo) !== 'computadora')
                        .map(t => (
                        <option key={t.codigo} value={t.codigo}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">Fabricante (Marca)</label>
                    <input 
                      type="text"
                      placeholder="Ej. Logitech, Dell, AMD"
                      value={formFabricante}
                      onChange={(e) => setFormFabricante(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
                )}

                {!formModeLotePc && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 block mb-1">Conexión</label>
                    <input 
                      type="text"
                      placeholder="Ej. USB, Bluetooth"
                      value={formConexion}
                      onChange={(e) => setFormConexion(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">
                      Número de serie
                      {normalizarTipoStock(formTipo) === 'monitor' && (
                        <span className="text-teal-700 font-normal normal-case"> (recomendado para matching con agente)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. SN123456789"
                      value={formNumeroSerie}
                      onChange={(e) => setFormNumeroSerie(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">Ubicación (depósito)</label>
                    <input 
                      type="text"
                      placeholder={UBICACION_DEPOSITO_DEFAULT}
                      value={formUbicacion}
                      onChange={(e) => setFormUbicacion(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">Cantidad *</label>
                    <input 
                      type="number"
                      min="1"
                      required
                      value={formCantidad}
                      onChange={(e) => setFormCantidad(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    {editingItem && (
                      <button 
                        type="button"
                        onClick={() => handleDelete(editingItem.id)}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={formCargando}
                      className={`px-5 py-2 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                        formModeLotePc ? 'bg-teal-600 hover:bg-teal-700' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{editingItem ? 'Guardar cambios' : 'Confirmar Registro'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: Sacar unidad del lote → computadora trazable */}
      <AnimatePresence>
        {sacarUnidadLote && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
            >
              <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-teal-600" />
                  Sacar 1 unidad del stock
                </span>
                <button onClick={() => setSacarUnidadLote(null)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs font-bold text-slate-700">
                <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-lg text-[11px] font-semibold">
                  Se crea una <strong>computadora trazable</strong> con las specs del lote y se resta 1 unidad del stock.
                  Quedará en la pestaña <strong>Computadoras</strong> lista para armar combo.
                </div>

                <div>
                  <p className="text-slate-500 font-medium mb-1">Lote</p>
                  <p className="text-slate-900">{sacarUnidadLote.nombre || '—'}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{etiquetaFromItem(sacarUnidadLote) || '—'}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Disponibles: {sacarUnidadLote.cantidad ?? 1}</p>
                </div>

                {sacarUnidadError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-[11px] font-semibold">
                    {sacarUnidadError}
                  </div>
                )}

                <div>
                  <label className="text-slate-700 block mb-1">Hostname *</label>
                  <input
                    type="text"
                    required
                    value={sacarUnidadHostname}
                    onChange={(e) => setSacarUnidadHostname(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">Motivo</label>
                  <input
                    type="text"
                    placeholder="Ej. Preparación de entrega"
                    value={sacarUnidadMotivo}
                    onChange={(e) => setSacarUnidadMotivo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSacarUnidadLote(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSacarUnidad}
                    disabled={!sacarUnidadHostname.trim() || sacandoUnidad}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {sacandoUnidad ? 'Creando…' : 'Sacar unidad'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {armarPc && (
        <ArmarComboModal
          computadora={armarPc}
          onClose={() => setArmarPc(null)}
          onSuccess={updated => {
            if (updated?.uuid) {
              setPcsStock(prev => prev.map(p => (p.uuid === updated.uuid ? { ...p, ...updated } : p)));
            }
            setArmarPc(null);
          }}
        />
      )}

      <Outlet />
    </div>
  );
}

import { useState } from 'react';
import {
  asignarPerifericoM,
  asignarUbicacionM,
  sacarUnidadStockM,
} from '../api/perifericoManualApi';
import {
  updateEstado,
  createComputadora,
} from '../api/computadoraApi';
import {
  buildDefaultHostname,
  computadoraDesdeSacarUnidad,
  UBICACION_DEPOSITO_DEFAULT,
} from '../utils/stockPcHelpers';
import { useEditPcStock } from './useEditPcStock';

export function useStockPcModals({
  setLista,
  setPcsStock,
  setTodasPcs,
  setActiveTab,
  refreshLista,
  refreshPcs,
  tiposEquipoItems,
  condicionesItems,
  ubicCompItems,
  onAfterAsignarPeriferico,
  onAfterAsignarUbicacion,
}) {
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

  const [asignarDesdeListaOpen, setAsignarDesdeListaOpen] = useState(false);

  const [asignarPeriferico, setAsignarPeriferico] = useState(null);
  const [pcUuidAsignar, setPcUuidAsignar] = useState('');
  const [motivoAsignarPerif, setMotivoAsignarPerif] = useState('');
  const [asignandoPerif, setAsignandoPerif] = useState(false);

  const [asignarUbicItem, setAsignarUbicItem] = useState(null);
  const [asignarUbicNueva, setAsignarUbicNueva] = useState('');
  const [asignarUbicMotivo, setAsignarUbicMotivo] = useState('');
  const [asignandoUbic, setAsignandoUbic] = useState(false);

  const mergePcEnListas = (prev, updated) => {
    const idx = prev.findIndex(p => p.uuid === updated.uuid);
    if (idx >= 0) {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updated };
      return next;
    }
    return [...prev, updated];
  };

  const syncPcLists = (updated) => {
    if (!updated?.uuid) return;
    setTodasPcs(prev => mergePcEnListas(prev, updated));
    setPcsStock(prev => {
      const merged = mergePcEnListas(prev, updated);
      const enDeposito = updated.estadoActual === 'Sin Asignar';
      if (enDeposito) return merged;
      return merged.filter(p => p.uuid !== updated.uuid);
    });
  };

  const editPcStock = useEditPcStock({
    tiposEquipoItems,
    condicionesItems,
    ubicCompItems,
    onUpdated: syncPcLists,
    onDeleted: (uuid) => {
      setPcsStock(prev => prev.filter(p => p.uuid !== uuid));
      setTodasPcs(prev => prev.filter(p => p.uuid !== uuid));
    },
    onAfterIngresarStock: () => setActiveTab('unidades'),
  });

  const handleAsignar = async () => {
    if (!asignarA.trim()) return;
    setAsignando(true);
    try {
      const updated = await updateEstado(asignarPc.uuid, 'ASIGNADA', asignarMotivo.trim() || 'Asignación desde stock', { responsableInventario: asignarA.trim() });
      if (updated) {
        setPcsStock(prev => prev.filter(p => p.uuid !== updated.uuid));
        setTodasPcs(prev => prev.map(p => (p.uuid === updated.uuid ? { ...p, ...updated } : p)));
      }
      setAsignarPc(null);
      setAsignarA('');
      setAsignarMotivo('');
    } catch (err) {
      console.error('Error asignando PC:', err);
      alert('Error al asignar la PC.');
    } finally {
      setAsignando(false);
    }
  };

  const handleAsignarPeriferico = async () => {
    if (!asignarPeriferico || !pcUuidAsignar.trim()) return;
    setAsignandoPerif(true);
    try {
      const result = await asignarPerifericoM(
        asignarPeriferico.id,
        pcUuidAsignar.trim(),
        motivoAsignarPerif.trim() || 'Asignación desde stock',
      );
      if (!result) {
        alert('No se encontró el periférico.');
        return;
      }
      await refreshLista();
      setAsignarPeriferico(null);
      setPcUuidAsignar('');
      setMotivoAsignarPerif('');
      onAfterAsignarPeriferico?.();
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
      if (created) {
        setTodasPcs(prev => [...prev, created]);
        if (created.estadoActual === 'Sin Asignar') {
          setPcsStock(prev => [...prev, created]);
        }
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
      alert(`Error al crear la computadora: ${err.message || ''}`);
    } finally {
      setCreandoPc(false);
    }
  };

  const handleOpenSacarUnidad = (lote) => {
    setSacarUnidadLote(lote);
    setSacarUnidadHostname(buildDefaultHostname(lote));
    setSacarUnidadMotivo('');
    setSacarUnidadError('');
  };

  const handleConfirmSacarUnidad = async () => {
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
        setTodasPcs(prev => [...prev, pc]);
        setPcsStock(prev => [...prev, pc]);
      }
      setSacarUnidadLote(null);
      setSacarUnidadHostname('');
      setSacarUnidadMotivo('');
      setActiveTab('unidades');
      await refreshPcs();
    } catch (err) {
      setSacarUnidadError(err.message || 'No se pudo sacar la unidad.');
    } finally {
      setSacandoUnidad(false);
    }
  };

  const openAsignarPeriferico = (c) => {
    setAsignarPeriferico(c);
    setPcUuidAsignar('');
    setMotivoAsignarPerif('');
  };

  const openAsignarPc = (pc) => {
    setAsignarPc(pc);
    setAsignarA('');
    setAsignarMotivo('');
  };

  const openAsignarUbicacion = (item) => {
    setAsignarUbicItem(item);
    setAsignarUbicNueva(item.ubicacion || '');
    setAsignarUbicMotivo('');
  };

  const handleAsignarUbicacion = async () => {
    if (!asignarUbicItem || !asignarUbicNueva.trim()) return;
    setAsignandoUbic(true);
    try {
      const updated = await asignarUbicacionM(
        asignarUbicItem.id,
        asignarUbicNueva.trim(),
        asignarUbicMotivo.trim() || `Asignado a ${asignarUbicNueva.trim()}`,
      );
      if (updated) {
        if ((asignarUbicItem.cantidad ?? 1) > 1) {
          await refreshLista();
        } else {
          setLista(prev => prev.map(item => (item.id === updated.id ? updated : item)));
        }
      }
      setAsignarUbicItem(null);
      setAsignarUbicNueva('');
      setAsignarUbicMotivo('');
      onAfterAsignarUbicacion?.();
    } catch (err) {
      console.error('Error asignando ubicación:', err);
      alert('Error al asignar la ubicación.');
    } finally {
      setAsignandoUbic(false);
    }
  };

  return {
    buscarLote,
    setBuscarLote,
    buscarUnidad,
    setBuscarUnidad,
    sacarUnidadLote,
    setSacarUnidadLote,
    sacarUnidadHostname,
    setSacarUnidadHostname,
    sacarUnidadMotivo,
    setSacarUnidadMotivo,
    sacarUnidadError,
    sacandoUnidad,
    asignarPc,
    setAsignarPc,
    asignarA,
    setAsignarA,
    asignarMotivo,
    setAsignarMotivo,
    asignando,
    armarPc,
    setArmarPc,
    pcMenuOpen,
    setPcMenuOpen,
    nuevaPcOpen,
    setNuevaPcOpen,
    nuevaPcHostname,
    setNuevaPcHostname,
    nuevaPcSo,
    setNuevaPcSo,
    nuevaPcUbicacion,
    setNuevaPcUbicacion,
    nuevaPcUbicacionStock,
    setNuevaPcUbicacionStock,
    nuevaPcMotivo,
    setNuevaPcMotivo,
    nuevaPcTipoEquipo,
    setNuevaPcTipoEquipo,
    nuevaPcCondicion,
    setNuevaPcCondicion,
    creandoPc,
    ...editPcStock,
    asignarDesdeListaOpen,
    setAsignarDesdeListaOpen,
    asignarPeriferico,
    setAsignarPeriferico,
    pcUuidAsignar,
    setPcUuidAsignar,
    motivoAsignarPerif,
    setMotivoAsignarPerif,
    asignandoPerif,
    handleAsignar,
    handleAsignarPeriferico,
    asignarUbicItem,
    setAsignarUbicItem,
    asignarUbicNueva,
    setAsignarUbicNueva,
    asignarUbicMotivo,
    setAsignarUbicMotivo,
    asignandoUbic,
    openAsignarUbicacion,
    handleAsignarUbicacion,
    handleCrearPcStock,
    handleOpenSacarUnidad,
    handleConfirmSacarUnidad,
    openAsignarPeriferico,
    openAsignarPc,
  };
}

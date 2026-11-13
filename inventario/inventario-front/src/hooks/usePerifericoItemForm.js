import { useState, useMemo } from 'react';
import {
  fetchPerifericoM,
  actualizarPerifericoM,
  createPerifericoM,
  deletePerifericoM,
  bajaUnidadStockM,
} from '../api/perifericoManualApi';
import { normalizarTipoStock } from '../constants/tiposStock';
import { opcionesEnumCatalogo } from '../hooks/useCatalogo';
import {
  buildNombreFromSpec,
  descripcionFromItem,
  resolveSpecFromItem,
  specToPayload,
  normalizeCatalogValue,
  UBICACION_DEPOSITO_DEFAULT,
} from '../utils/stockPcHelpers';

export function usePerifericoItemForm({
  lista, setLista, setActiveTab, tiposEquipoItems, condicionesItems, refreshLista,
}) {
  const [formModeLotePc, setFormModeLotePc] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formCargando, setFormCargando] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState('');

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
  const [bajaItem, setBajaItem] = useState(null);
  const [bajaMotivo, setBajaMotivo] = useState('');
  const [bajando, setBajando] = useState(false);

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
      console.error('Error actualizando stock:', err);
      setLista(prev => prev.map(item => item.id === p.id ? { ...item, cantidad: currentStock } : item));
      alert(`Hubo un error al actualizar el stock de ${p.nombre || p.id}`);
    }
  };

  const openBajaUnidad = (item) => {
    setBajaItem(item);
    setBajaMotivo('');
  };

  const handleConfirmarBajaUnidad = async () => {
    if (!bajaItem || !bajaMotivo.trim()) return;
    setBajando(true);
    try {
      await bajaUnidadStockM(bajaItem.id, bajaMotivo.trim());
      if (refreshLista) await refreshLista();
      setBajaItem(null);
      setBajaMotivo('');
    } catch (err) {
      alert(err?.message || 'No se pudo dar de baja la unidad');
    } finally {
      setBajando(false);
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

  const handleOpenAddInfra = (tipoDefault = 'router') => {
    setFormModeLotePc(false);
    setEditingItem(null);
    setFormNombre('');
    setFormTipo(tipoDefault);
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
      console.error('Error guardando periférico:', err);
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
      console.error('Error eliminando periférico:', err);
      alert('Error al eliminar el periférico.');
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormModeLotePc(false);
  };

  return {
    formModeLotePc,
    isFormOpen,
    formCargando,
    editingItem,
    formError,
    formNombre,
    setFormNombre,
    formTipo,
    setFormTipo,
    formFabricante,
    setFormFabricante,
    formConexion,
    setFormConexion,
    formUbicacion,
    setFormUbicacion,
    formCantidad,
    setFormCantidad,
    formCpu,
    setFormCpu,
    formRam,
    setFormRam,
    formDisco,
    setFormDisco,
    formTipoEquipo,
    setFormTipoEquipo,
    formCondicion,
    setFormCondicion,
    formNumeroSerie,
    setFormNumeroSerie,
    formSpecPreview,
    handleUpdateStock,
    bajaItem,
    setBajaItem,
    bajaMotivo,
    setBajaMotivo,
    bajando,
    openBajaUnidad,
    handleConfirmarBajaUnidad,
    handleOpenAdd,
    handleOpenAddInfra,
    handleOpenAddLotePc,
    handleOpenEdit,
    handleSubmit,
    handleDelete,
    closeForm,
  };
}

import { useMemo, useRef, useState } from 'react';
import {
  fetchComputadora,
  updateDatosStock,
  ingresarStock,
  deleteComputadora,
} from '../api/computadoraApi';
import { opcionesEnumCatalogo } from './useCatalogo';
import {
  buildNombreFromSpec,
  descripcionFromComputadora,
  normalizeCatalogValue,
  resolveSpecFromComputadora,
  specToPayload,
  UBICACION_DEPOSITO_DEFAULT,
} from '../utils/stockPcHelpers';
import { resolveTipoEquipoPc, resolveCondicionPc, getUbicacionStock } from '../utils/stockListHelpers';

function esSinAsignar(estadoActual) {
  if (!estadoActual) return false;
  if (typeof estadoActual === 'string') {
    return estadoActual.trim().toLowerCase() === 'sin asignar';
  }
  const nombre = estadoActual.nombre ?? estadoActual.Nombre;
  return String(nombre ?? '').trim().toLowerCase() === 'sin asignar';
}

function buildPayloadFromForm({
  formCpu,
  formRam,
  formDisco,
  formTipoEquipo,
  formCondicion,
  formDescripcion,
  formUbicacionStock,
}) {
  const especificacionEsperada = specToPayload({
    cpuModelo: formCpu,
    ramTotalGb: formRam,
    discoResumen: formDisco,
    tipoEquipo: formTipoEquipo,
    condicion: formCondicion,
  });
  return {
    tipoEquipo: formTipoEquipo || '',
    condicion: formCondicion || '',
    ubicacionStock: formUbicacionStock.trim() || '',
    descripcionStock: formDescripcion.trim() || '',
    especificacionEsperada,
  };
}

export function useEditPcStock({
  tiposEquipoItems,
  condicionesItems,
  ubicCompItems,
  onUpdated,
  onDeleted,
  onAfterIngresarStock,
}) {
  const onSavedRef = useRef(null);

  const [editPcOpen, setEditPcOpen] = useState(false);
  const [editPcCargando, setEditPcCargando] = useState(false);
  const [editPc, setEditPc] = useState(null);
  const [formCpu, setFormCpu] = useState('');
  const [formRam, setFormRam] = useState('');
  const [formDisco, setFormDisco] = useState('');
  const [formTipoEquipo, setFormTipoEquipo] = useState('');
  const [formCondicion, setFormCondicion] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formUbicacionStock, setFormUbicacionStock] = useState(UBICACION_DEPOSITO_DEFAULT);
  const [guardandoPcEdit, setGuardandoPcEdit] = useState(false);
  const [eliminandoPcEdit, setEliminandoPcEdit] = useState(false);
  const [ingresandoPcStock, setIngresandoPcStock] = useState(false);
  const [editPcMotivoIngreso, setEditPcMotivoIngreso] = useState('Ingreso a stock');
  const [editPcError, setEditPcError] = useState('');

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

  const populateEditPcForm = (pc) => {
    if (!pc) return;
    const spec = resolveSpecFromComputadora(pc);
    const tipoOpts = opcionesEnumCatalogo(tiposEquipoItems);
    const condOpts = opcionesEnumCatalogo(condicionesItems);
    setFormCpu(spec.cpuModelo || '');
    setFormRam(spec.ramTotalGb || '');
    setFormDisco(spec.discoResumen || '');
    setFormTipoEquipo(normalizeCatalogValue(
      resolveTipoEquipoPc(pc) || spec.tipoEquipo,
      tipoOpts,
    ));
    setFormCondicion(normalizeCatalogValue(
      resolveCondicionPc(pc) || spec.condicion,
      condOpts,
    ));
    setFormDescripcion(descripcionFromComputadora(pc));
    setFormUbicacionStock(getUbicacionStock(pc) || UBICACION_DEPOSITO_DEFAULT);
  };

  const notifyUpdated = (updated) => {
    onUpdated?.(updated);
    onSavedRef.current?.(updated);
  };

  const handleOpenEditPc = async (pc, options = {}) => {
    if (!pc?.uuid) return;
    onSavedRef.current = options.onSaved ?? null;
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
        notifyUpdated(full);
      }
    } catch {
      setEditPcError('No se pudieron cargar los datos de la computadora.');
    } finally {
      setEditPcCargando(false);
    }
  };

  const validateForm = () => {
    if (!formCpu.trim()) {
      setEditPcError('La CPU es obligatoria.');
      return false;
    }
    const ram = parseInt(formRam, 10);
    if (!Number.isFinite(ram) || ram <= 0) {
      setEditPcError('La RAM (GB) es obligatoria y debe ser mayor a 0.');
      return false;
    }
    return true;
  };

  const handleGuardarEditPc = async () => {
    if (!editPc) return;
    if (!validateForm()) return;
    setGuardandoPcEdit(true);
    setEditPcError('');
    try {
      const body = buildPayloadFromForm({
        formCpu,
        formRam,
        formDisco,
        formTipoEquipo,
        formCondicion,
        formDescripcion,
        formUbicacionStock,
      });
      const updated = await updateDatosStock(editPc.uuid, body);
      if (!updated) {
        setEditPcError('No se encontró la computadora.');
        return;
      }
      if (!updated.especificacionEsperada && body.especificacionEsperada) {
        updated.especificacionEsperada = body.especificacionEsperada;
      }
      if (!updated.descripcionStock && body.descripcionStock) {
        updated.descripcionStock = body.descripcionStock;
      }
      notifyUpdated(updated);
      setEditPcOpen(false);
      setEditPc(null);
      onSavedRef.current = null;
    } catch (err) {
      setEditPcError(err.message || 'No se pudo guardar los cambios.');
    } finally {
      setGuardandoPcEdit(false);
    }
  };

  const handleIngresarPcStock = async () => {
    if (!editPc) return;
    if (!validateForm()) return;
    setIngresandoPcStock(true);
    setEditPcError('');
    const motivo = editPcMotivoIngreso.trim() || 'Ingreso a stock';

    try {
      const body = {
        ...buildPayloadFromForm({
          formCpu,
          formRam,
          formDisco,
          formTipoEquipo,
          formCondicion,
          formDescripcion,
          formUbicacionStock,
        }),
        motivo,
      };
      const updated = await ingresarStock(editPc.uuid, body);

      if (!updated) {
        setEditPcError('No se pudo ingresar la PC al stock.');
        return;
      }

      notifyUpdated(updated);
      onAfterIngresarStock?.(updated);
      setEditPcOpen(false);
      setEditPc(null);
      onSavedRef.current = null;
    } catch (err) {
      setEditPcError(err.message || 'No se pudo ingresar al stock.');
    } finally {
      setIngresandoPcStock(false);
    }
  };

  const handleEliminarEditPc = async () => {
    if (!editPc?.uuid) return;
    const nombre = editPc.hostname || editPc.uuid.slice(0, 8);
    if (!window.confirm(`¿Eliminar la computadora "${nombre}"? Esta acción no se puede deshacer.`)) return;
    setEliminandoPcEdit(true);
    setEditPcError('');
    try {
      const ok = await deleteComputadora(editPc.uuid);
      if (!ok) {
        setEditPcError('No se encontró la computadora.');
        return;
      }
      onDeleted?.(editPc.uuid);
      setEditPcOpen(false);
      setEditPc(null);
      onSavedRef.current = null;
    } catch {
      setEditPcError('No se pudo eliminar la computadora.');
    } finally {
      setEliminandoPcEdit(false);
    }
  };

  const closeEditPc = () => {
    setEditPcOpen(false);
    setEditPc(null);
    onSavedRef.current = null;
  };

  const editPcYaEnDeposito = esSinAsignar(editPc?.estadoActual);

  return {
    editPcOpen,
    editPcCargando,
    editPc,
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
    formDescripcion,
    setFormDescripcion,
    formUbicacionStock,
    setFormUbicacionStock,
    formSpecPreview,
    guardandoPcEdit,
    eliminandoPcEdit,
    ingresandoPcStock,
    editPcMotivoIngreso,
    setEditPcMotivoIngreso,
    editPcError,
    setEditPcError,
    handleOpenEditPc,
    handleGuardarEditPc,
    handleIngresarPcStock,
    handleEliminarEditPc,
    closeEditPc,
    editPcYaEnDeposito,
  };
}

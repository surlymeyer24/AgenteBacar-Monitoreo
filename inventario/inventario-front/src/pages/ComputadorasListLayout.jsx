import { useCallback, useEffect, useMemo } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useComputadoras } from '../hooks/useQueries';
import { ComputadorasListContext } from '../context/ComputadorasListContext';
import { useCatalogo } from '../hooks/useCatalogo';
import { useEditPcStock } from '../hooks/useEditPcStock';
import EditPcStockModal from '../components/EditPcStockModal';
import { editPcStockModalProps } from '../utils/editPcStockModalProps';
import { fetchComputadora } from '../api/computadoraApi';

const LISTADO_FIELDS = [
  'uuid', 'hostname', 'tipoEquipo', 'usuarioActual', 'ubicacion',
  'sistemaOperativo', 'arquitectura', 'estadoActual', 'estadoConexion',
  'estadoAgente', 'ultimaSincronizacion', 'procesadorNombre',
  'responsableInventario', 'anydeskId', 'ubicacionStock',
  'condicion', 'origenAlta', 'estadoConciliacion', 'estadoPreparacion', 'estadoReporteAgente', 'comboEsperadoId',
  'especificacionEsperada', 'descripcionStock', 'loteOrigenId',
];

function pickListadoFields(dto) {
  const picked = {};
  for (const k of LISTADO_FIELDS) {
    if (!(k in dto)) continue;
    const v = dto[k];
    // No pisar el listado con null/undefined/vacío del detalle (parseo parcial del agente).
    if (v !== undefined && v !== null && v !== '') {
      picked[k] = v;
    }
  }
  if (!picked.procesadorNombre && dto.procesador) {
    const pn = dto.procesador.detallado?.nombreCompleto
      ?? dto.procesador.nombreRaw
      ?? dto.procesador.nombre;
    if (pn) picked.procesadorNombre = pn;
  }
  return picked;
}

export default function ComputadorasListLayout() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: todas = [], isLoading: cargando, error: queryError } = useComputadoras();
  const error = queryError ? 'No se pudo conectar con el servidor' : null;

  const { items: ubicCompItems } = useCatalogo('ubicaciones_computadora');
  const { items: tiposEquipoItems } = useCatalogo('tipos_equipo');
  const { items: condicionesItems } = useCatalogo('condiciones_equipo');

  const setTodas = useCallback(
    updater => {
      queryClient.setQueryData(['computadoras', {}], prev => {
        if (typeof updater === 'function') return updater(prev ?? []);
        return updater;
      });
    },
    [queryClient],
  );

  const recargar = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['computadoras'] }),
    [queryClient],
  );

  const mergeEnListado = useCallback((dto) => {
    if (!dto?.uuid) return;
    const safe = pickListadoFields(dto);
    setTodas(prev => {
      const i = prev.findIndex(p => p.uuid === dto.uuid);
      if (i < 0) return [...prev, safe];
      const next = [...prev];
      next[i] = { ...next[i], ...safe };
      return next;
    });
  }, [setTodas]);

  const removeEnListado = useCallback((uuid) => {
    if (!uuid) return;
    setTodas(prev => prev.filter(p => p.uuid !== uuid));
  }, [setTodas]);

  const editPcStock = useEditPcStock({
    tiposEquipoItems,
    condicionesItems,
    ubicCompItems,
    onUpdated: mergeEnListado,
    onDeleted: removeEnListado,
  });

  useEffect(() => {
    const uuidEditar = searchParams.get('editarPc');
    if (!uuidEditar) return undefined;

    let cancel = false;
    fetchComputadora(uuidEditar)
      .then((pc) => {
        if (cancel || !pc) return;
        editPcStock.handleOpenEditPc(pc);
        const next = new URLSearchParams(searchParams);
        next.delete('editarPc');
        setSearchParams(next, { replace: true });
      })
      .catch(() => {
        if (!cancel) editPcStock.setEditPcError('No se pudo abrir la PC para editar.');
      });

    return () => { cancel = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- abrir solo cuando llega editarPc por URL
  }, [searchParams.get('editarPc')]);

  const value = useMemo(
    () => ({
      todas,
      setTodas,
      cargando,
      error,
      recargar,
      mergeEnListado,
      removeEnListado,
      openEditPc: editPcStock.handleOpenEditPc,
    }),
    [todas, setTodas, cargando, error, recargar, mergeEnListado, removeEnListado, editPcStock.handleOpenEditPc],
  );

  return (
    <ComputadorasListContext.Provider value={value}>
      <Outlet />
      <EditPcStockModal
        {...editPcStockModalProps(editPcStock, { tiposEquipoItems, condicionesItems, ubicCompItems })}
      />
    </ComputadorasListContext.Provider>
  );
}

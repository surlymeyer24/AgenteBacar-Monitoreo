import { useCallback, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useComputadoras } from '../hooks/useQueries';
import { ComputadorasListContext } from '../context/ComputadorasListContext';

const LISTADO_FIELDS = [
  'uuid', 'hostname', 'tipoEquipo', 'usuarioActual', 'ubicacion',
  'sistemaOperativo', 'arquitectura', 'estadoActual', 'estadoConexion',
  'estadoAgente', 'ultimaSincronizacion', 'procesadorNombre',
  'responsableInventario', 'anydeskId', 'ubicacionStock',
];

function pickListadoFields(dto) {
  const picked = {};
  for (const k of LISTADO_FIELDS) {
    if (k in dto) picked[k] = dto[k];
  }
  return picked;
}

export default function ComputadorasListLayout() {
  const queryClient = useQueryClient();
  const { data: todas = [], isLoading: cargando, error: queryError } = useComputadoras();
  const error = queryError ? 'No se pudo conectar con el servidor' : null;

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

  const mergeEnListado = useCallback(dto => {
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

  const removeEnListado = useCallback(uuid => {
    if (!uuid) return;
    setTodas(prev => prev.filter(p => p.uuid !== uuid));
  }, [setTodas]);

  const value = useMemo(
    () => ({
      todas,
      setTodas,
      cargando,
      error,
      recargar,
      mergeEnListado,
      removeEnListado,
    }),
    [todas, setTodas, cargando, error, recargar, mergeEnListado, removeEnListado],
  );

  return (
    <ComputadorasListContext.Provider value={value}>
      <Outlet />
    </ComputadorasListContext.Provider>
  );
}

import { useCallback, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useComputadoras } from '../hooks/useQueries';
import { ComputadorasListContext } from '../context/ComputadorasListContext';

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
    setTodas(prev => {
      const i = prev.findIndex(p => p.uuid === dto.uuid);
      if (i < 0) return [...prev, dto];
      const next = [...prev];
      next[i] = { ...next[i], ...dto };
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

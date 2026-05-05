import { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { fetchComputadoras } from '../api/computadoraApi';
import { ComputadorasListContext } from '../context/ComputadorasListContext';

export default function ComputadorasListLayout() {
  const [todas, setTodas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(() => {
    setCargando(true);
    setError(null);
    return fetchComputadoras()
      .then(setTodas)
      .catch(() => setError('No se pudo conectar con el servidor'))
      .finally(() => setCargando(false));
  }, []);

  const mergeEnListado = useCallback(dto => {
    if (!dto?.uuid) return;
    setTodas(prev => {
      const i = prev.findIndex(p => p.uuid === dto.uuid);
      if (i < 0) return [...prev, dto];
      const next = [...prev];
      next[i] = { ...next[i], ...dto };
      return next;
    });
  }, []);

  const removeEnListado = useCallback(uuid => {
    if (!uuid) return;
    setTodas(prev => prev.filter(p => p.uuid !== uuid));
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

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
    [todas, cargando, error, recargar, mergeEnListado, removeEnListado],
  );

  return (
    <ComputadorasListContext.Provider value={value}>
      <Outlet />
    </ComputadorasListContext.Provider>
  );
}

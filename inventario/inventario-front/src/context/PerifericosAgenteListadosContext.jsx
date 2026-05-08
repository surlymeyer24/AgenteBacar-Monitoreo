import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  fetchPerifericosAgenteListados,
  peekCachedPerifericosAgenteListados,
  prefetchPerifericosAgenteListados,
} from '../api/perifericosAgenteApi';

const PerifericosAgenteListadosContext = createContext(null);

const RUTAS_USB_AUDIO =
  /^\/perifericos\/(teclados|mouse|webcams|parlantes|microfonos)$/;

export function PerifericosAgenteListadosProvider({ children }) {
  const location = useLocation();
  const necesitaListados = RUTAS_USB_AUDIO.test(location.pathname);

  const [listados, setListados] = useState(() => peekCachedPerifericosAgenteListados());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Precarga temprana: cualquier vista bajo /perifericos calienta el cache antes de abrir teclados/mouse/etc.
  useEffect(() => {
    if (!location.pathname.startsWith('/perifericos')) return;
    prefetchPerifericosAgenteListados();
  }, [location.pathname]);

  useLayoutEffect(() => {
    if (!necesitaListados) return;
    const cached = peekCachedPerifericosAgenteListados();
    if (cached) {
      setListados(cached);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
  }, [necesitaListados]);

  useEffect(() => {
    if (!necesitaListados) return;

    const cached = peekCachedPerifericosAgenteListados();
    if (cached) {
      setListados(cached);
      setLoading(false);
      setError(null);
      return;
    }

    let cancel = false;
    setError(null);

    fetchPerifericosAgenteListados()
      .then(data => {
        if (!cancel) {
          setListados(data);
          setLoading(false);
          setError(null);
        }
      })
      .catch(err => {
        if (!cancel) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancel = true;
      setLoading(false);
    };
  }, [necesitaListados]);

  const refresh = useCallback(() => {
    return fetchPerifericosAgenteListados({ bypassCache: true })
      .then(data => {
        setListados(data);
        setLoading(false);
        setError(null);
        return data;
      })
      .catch(err => {
        setError(err);
        setLoading(false);
        throw err;
      });
  }, []);

  const value = useMemo(
    () => ({ listados, loading, error, refresh }),
    [listados, loading, error, refresh]
  );

  return (
    <PerifericosAgenteListadosContext.Provider value={value}>
      {children}
    </PerifericosAgenteListadosContext.Provider>
  );
}

export function usePerifericosAgenteListados() {
  const ctx = useContext(PerifericosAgenteListadosContext);
  if (!ctx) {
    throw new Error('usePerifericosAgenteListados debe usarse dentro del proveedor');
  }
  return ctx;
}

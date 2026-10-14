import { useState, useEffect } from 'react';
import { fetchPerifericosM } from '../api/perifericoManualApi';
import { fetchComputadoras } from '../api/computadoraApi';
import { filtrarPcsAsignables } from '../utils/perifericoPcHelpers';

export function usePerifericoManualListData() {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [pcsStock, setPcsStock] = useState([]);
  const [todasPcs, setTodasPcs] = useState([]);
  const [pcsAsignables, setPcsAsignables] = useState([]);
  const [cargandoPcs, setCargandoPcs] = useState(true);
  const [errorPcs, setErrorPcs] = useState(null);

  const aplicarComputadoras = (todas) => {
    const lista = todas ?? [];
    setTodasPcs(lista);
    setPcsStock(lista.filter(pc => pc.estadoActual === 'Sin Asignar'));
    setPcsAsignables(filtrarPcsAsignables(lista));
    return lista;
  };

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
        if (!cancel) aplicarComputadoras(data);
      })
      .catch(() => { if (!cancel) setErrorPcs('No se pudo cargar las computadoras en stock.'); })
      .finally(() => { if (!cancel) setCargandoPcs(false); });
    return () => { cancel = true; };
  }, []);

  const refreshLista = async () => {
    const data = await fetchPerifericosM();
    setLista(data ?? []);
    return data ?? [];
  };

  const refreshPcs = async () => {
    const data = await fetchComputadoras();
    return aplicarComputadoras(data);
  };

  return {
    lista,
    setLista,
    cargando,
    error,
    pcsStock,
    setPcsStock,
    todasPcs,
    setTodasPcs,
    pcsAsignables,
    cargandoPcs,
    errorPcs,
    refreshLista,
    refreshPcs,
  };
}

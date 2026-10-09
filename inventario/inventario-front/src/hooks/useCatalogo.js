import { useEffect, useState } from 'react';
import { fetchCatalogo } from '../api/catalogoApi';
import { TIPOS_STOCK, labelTipoStock } from '../constants/tiposStock';
import { codigoCatalogoDesdeValor } from '../constants/ubicaciones';

const FALLBACK_TIPOS_STOCK = TIPOS_STOCK.map((codigo, i) => ({
  codigo,
  label: labelTipoStock(codigo),
  activo: true,
  orden: i + 1,
}));

export function useCatalogo(catalogoId, { incluirInactivos = false } = {}) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    fetchCatalogo(catalogoId, incluirInactivos)
      .then(data => {
        if (!cancelado) setItems(data);
      })
      .catch(err => {
        if (!cancelado) {
          setError(err.message);
          if (catalogoId === 'tipos_stock') {
            setItems(FALLBACK_TIPOS_STOCK);
          }
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => { cancelado = true; };
  }, [catalogoId, incluirInactivos]);

  return { items, cargando, error };
}

/**
 * Busca el label de un catálogo para un valor de enum Java (UPPERCASE).
 * Convierte a lowercase para matchear el codigo del catálogo.
 * Fallback: reemplaza _ por espacio.
 */
export function labelDeCatalogo(items, valor) {
  if (!valor) return '—';
  const codigo = codigoCatalogoDesdeValor(valor);
  const item = items.find(i => String(i.codigo).toLowerCase() === codigo);
  return item ? item.label : String(valor).replace(/_/g, ' ');
}

export function opcionesEnumCatalogo(items) {
  return items.map(i => ({ value: i.codigo.toUpperCase(), label: i.label }));
}

/**
 * Construye un mapa {ENUM_KEY: 'Label', ...} desde items del catálogo.
 * Drop-in replacement para constantes tipo ESTADO_OPERATIVO_LABELS.
 */
export function labelsEnumCatalogo(items) {
  const map = {};
  for (const item of items) {
    map[item.codigo.toUpperCase()] = item.label;
  }
  return map;
}

/**
 * Opciones para catálogos de texto libre (sin enum Java).
 * El label es el value que se almacena en Firestore.
 */
export function opcionesTextoLibre(items) {
  return items.map(i => ({ value: i.label, label: i.label }));
}

export function opcionesCatalogo(items, valorActual) {
  const actual = (valorActual ?? '').trim().toLowerCase();
  if (!actual) return items;

  const existe = items.some(it => it.codigo === actual);
  if (existe) return items;

  return [...items, { codigo: actual, label: actual.charAt(0).toUpperCase() + actual.slice(1), activo: false, orden: 9999 }];
}

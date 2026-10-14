import { useState } from 'react';
import { createComboPerifericoM } from '../api/perifericoManualApi';
import { normalizarTipoStock } from '../constants/tiposStock';
import { UBICACION_DEPOSITO_DEFAULT } from '../utils/stockPcHelpers';

const DEFAULT_COMBO_ITEMS = () => ([
  { tipo: 'teclado', nombre: '', fabricante: '', conexion: '', cantidad: '1' },
  { tipo: 'mouse', nombre: '', fabricante: '', conexion: '', cantidad: '1' },
]);

export function useStockComboForm({ setLista }) {
  const [isComboOpen, setIsComboOpen] = useState(false);
  const [comboNombre, setComboNombre] = useState('');
  const [comboItems, setComboItems] = useState(DEFAULT_COMBO_ITEMS());
  const [comboUbicacion, setComboUbicacion] = useState('');
  const [comboError, setComboError] = useState('');
  const [creandoCombo, setCreandoCombo] = useState(false);

  const handleOpenCombo = () => {
    setComboNombre('');
    setComboItems(DEFAULT_COMBO_ITEMS());
    setComboUbicacion(UBICACION_DEPOSITO_DEFAULT);
    setComboError('');
    setIsComboOpen(true);
  };

  const handleComboItemChange = (idx, field, value) => {
    setComboItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleAddComboItem = () => {
    setComboItems(prev => [...prev, { tipo: 'otro', nombre: '', fabricante: '', conexion: '', cantidad: '1' }]);
  };

  const handleRemoveComboItem = (idx) => {
    if (comboItems.length <= 2) return;
    setComboItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitCombo = async (e) => {
    e.preventDefault();
    if (!comboNombre.trim()) { setComboError('El nombre del combo es obligatorio.'); return; }
    const items = comboItems.map(it => ({
      tipo: normalizarTipoStock(it.tipo),
      nombre: it.nombre.trim() || undefined,
      fabricante: it.fabricante.trim() || undefined,
      conexion: it.conexion.trim() || undefined,
      cantidad: parseInt(it.cantidad, 10) || 1,
      ubicacion: comboUbicacion.trim() || undefined,
    }));
    if (items.some(it => !it.tipo)) { setComboError('Todos los items deben tener un tipo.'); return; }
    setCreandoCombo(true);
    setComboError('');
    try {
      const creados = await createComboPerifericoM({ comboNombre: comboNombre.trim(), items });
      setLista(prev => [...prev, ...creados]);
      setIsComboOpen(false);
    } catch (err) {
      setComboError(err.message || 'Error al crear el combo.');
    } finally {
      setCreandoCombo(false);
    }
  };

  return {
    isComboOpen,
    setIsComboOpen,
    comboNombre,
    setComboNombre,
    comboItems,
    comboUbicacion,
    setComboUbicacion,
    comboError,
    creandoCombo,
    handleOpenCombo,
    handleComboItemChange,
    handleAddComboItem,
    handleRemoveComboItem,
    handleSubmitCombo,
  };
}

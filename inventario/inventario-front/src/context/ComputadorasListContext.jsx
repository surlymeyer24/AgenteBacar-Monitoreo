import { createContext, useContext } from 'react';

/** Lista compartida entre `/computadoras` y `/computadoras/asignaciones` para navegar sin volver a pedir el API. */
export const ComputadorasListContext = createContext(null);

export function useComputadorasList() {
  const ctx = useContext(ComputadorasListContext);
  if (!ctx) {
    throw new Error('useComputadorasList debe usarse dentro de ComputadorasListLayout');
  }
  return ctx;
}

/** Detalle / otras pantallas: null si no hay provider (p. ej. tests aislados). */
export function useOptionalComputadorasList() {
  return useContext(ComputadorasListContext);
}

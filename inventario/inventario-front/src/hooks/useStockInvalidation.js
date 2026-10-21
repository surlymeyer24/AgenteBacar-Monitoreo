import { useQueryClient } from '@tanstack/react-query';

export function useStockInvalidation() {
  const qc = useQueryClient();
  return {
    invalidarUnidades: () => qc.invalidateQueries({ queryKey: ['stockUnidades'] }),
    invalidarAsignaciones: () => qc.invalidateQueries({ queryKey: ['stockAsignaciones'] }),
    invalidarTodo: () => {
      qc.invalidateQueries({ queryKey: ['stockUnidades'] });
      qc.invalidateQueries({ queryKey: ['stockAsignaciones'] });
    },
  };
}

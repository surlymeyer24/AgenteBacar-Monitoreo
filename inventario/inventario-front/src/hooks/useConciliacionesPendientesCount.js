import { useQuery } from '@tanstack/react-query';
import { fetchConciliacionPendientesCount } from '../api/conciliacionApi';

/** Contador del badge del sidebar; no importar el barrel useQueries desde el shell. */
export function useConciliacionesPendientesCount(options) {
  return useQuery({
    queryKey: ['conciliacionesPendientesCount'],
    queryFn: fetchConciliacionPendientesCount,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    ...options,
  });
}

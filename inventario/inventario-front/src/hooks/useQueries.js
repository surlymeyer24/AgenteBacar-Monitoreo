import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '../api/dashboardApi';
import { fetchComputadoras, fetchComputadorasRecientes } from '../api/computadoraApi';
import { fetchCamaras, fetchCamarasRecientes } from '../api/camaraApi';
import { fetchInternos } from '../api/internoIpApi';
import { fetchPerifericosM } from '../api/perifericoManualApi';
import { fetchNvrs } from '../api/nvrApi';
import { fetchMaquinas } from '../api/maquinaTesoreriaApi';
import { fetchServidores } from '../api/servidorApi';
import { fetchTelevisores } from '../api/televisorApi';
import { fetchMonitoresReportadosAgente } from '../api/monitorApi';
import { fetchCelulares } from '../api/celularApi';
import { fetchEtiquetasQr, fetchProgresosLogistica } from '../api/etiquetaQrApi';
import { fetchEventosHardware, fetchPendientesCount } from '../api/eventosHardwareApi';
import { fetchConciliacionPendientesCount } from '../api/conciliacionApi';
import { fetchResponsables, fetchResponsableDetalle } from '../api/responsableApi';

export function useDashboardStats(options) {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
    ...options,
  });
}

export function useComputadoras(params = {}, options) {
  return useQuery({
    queryKey: ['computadoras', params],
    queryFn: () => fetchComputadoras(params),
    ...options,
  });
}

export function useComputadorasRecientes(limit = 8, options) {
  return useQuery({
    queryKey: ['computadorasRecientes', limit],
    queryFn: () => fetchComputadorasRecientes(limit),
    ...options,
  });
}

export function useCamaras(params = {}, options) {
  return useQuery({
    queryKey: ['camaras', params],
    queryFn: () => fetchCamaras(params),
    ...options,
  });
}

export function useCamarasRecientes(limit = 8, options) {
  return useQuery({
    queryKey: ['camarasRecientes', limit],
    queryFn: () => fetchCamarasRecientes(limit),
    ...options,
  });
}

export function useInternos(options) {
  return useQuery({
    queryKey: ['internos'],
    queryFn: fetchInternos,
    ...options,
  });
}

export function usePerifericosM(options) {
  return useQuery({
    queryKey: ['perifericosM'],
    queryFn: fetchPerifericosM,
    ...options,
  });
}

export function useNvrs(options) {
  return useQuery({
    queryKey: ['nvrs'],
    queryFn: fetchNvrs,
    ...options,
  });
}

export function useMaquinas(tipo, options) {
  return useQuery({
    queryKey: ['maquinas', tipo ?? null],
    queryFn: () => fetchMaquinas(tipo),
    ...options,
  });
}

export function useServidores(options) {
  return useQuery({
    queryKey: ['servidores'],
    queryFn: fetchServidores,
    ...options,
  });
}

export function useTelevisores(options) {
  return useQuery({
    queryKey: ['televisores'],
    queryFn: fetchTelevisores,
    ...options,
  });
}

export function useMonitoresAgente(options) {
  return useQuery({
    queryKey: ['monitoresAgente'],
    queryFn: fetchMonitoresReportadosAgente,
    ...options,
  });
}

export function useCelulares(options) {
  return useQuery({
    queryKey: ['celulares'],
    queryFn: fetchCelulares,
    ...options,
  });
}

export function useEtiquetasQr(options) {
  return useQuery({
    queryKey: ['etiquetasQr'],
    queryFn: fetchEtiquetasQr,
    ...options,
  });
}

export function useProgresosLogistica(options) {
  return useQuery({
    queryKey: ['progresosLogistica'],
    queryFn: fetchProgresosLogistica,
    // Mostrar el último mapa cacheado de inmediato y refrescarlo en segundo plano
    // al volver desde una ficha donde pudo cambiar el checklist.
    staleTime: 0,
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useEventosHardware(params = {}, options) {
  return useQuery({
    queryKey: ['eventosHardware', params],
    queryFn: () => fetchEventosHardware(params),
    ...options,
  });
}

export function useEventosHardwarePendientesCount(options) {
  return useQuery({
    queryKey: ['eventosHardwarePendientesCount'],
    queryFn: fetchPendientesCount,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    ...options,
  });
}

export function useConciliacionesPendientesCount(options) {
  return useQuery({
    queryKey: ['conciliacionesPendientesCount'],
    queryFn: fetchConciliacionPendientesCount,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    ...options,
  });
}

export function useResponsables(options) {
  return useQuery({
    queryKey: ['responsables'],
    queryFn: fetchResponsables,
    ...options,
  });
}

export function useResponsableDetalle(id, options) {
  return useQuery({
    queryKey: ['responsables', id],
    queryFn: () => fetchResponsableDetalle(id),
    enabled: Boolean(id),
    ...options,
  });
}

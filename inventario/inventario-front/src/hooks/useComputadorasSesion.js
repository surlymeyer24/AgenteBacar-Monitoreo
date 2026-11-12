import { useCallback, useEffect, useState } from 'react';
import { fetchComputadorasSesion } from '../api/sesionBloqueoApi';
import { normalizarUltimaSincronizacion } from '../utils/syncActividad';

function itemToSesion(item) {
  const ultimaSyncRaw = item.ultimaSincronizacion ?? item.ultima_sincronizacion ?? null;
  const ultimaSync = normalizarUltimaSincronizacion(ultimaSyncRaw) ?? ultimaSyncRaw;
  const resumen = item.sesionResumenHoy ?? item.sesion_resumen_hoy ?? null;
  return {
    id: item.id,
    hostname: item.hostname ?? null,
    ubicacion: item.ubicacion ?? null,
    ultima_sincronizacion: ultimaSync,
    sesion_estado: item.sesionEstado ?? item.sesion_estado ?? null,
    sesion_bloqueo_auto_min: item.sesionBloqueoAutoMin ?? item.sesion_bloqueo_auto_min ?? null,
    sesion_resumen_hoy: resumen
      ? {
          fecha: resumen.fecha ?? null,
          horas_activa: resumen.horasActiva ?? resumen.horas_activa ?? 0,
          horas_bloqueada: resumen.horasBloqueada ?? resumen.horas_bloqueada ?? 0,
          horas_sin_usuario: resumen.horasSinUsuario ?? resumen.horas_sin_usuario ?? 0,
          transiciones: resumen.transiciones ?? 0,
          max_horas_activa_continua: resumen.maxHorasActivaContinua ?? resumen.max_horas_activa_continua ?? 0,
        }
      : null,
  };
}

export function useComputadorasSesion() {
  const [computadoras, setComputadoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => setRefreshToken((t) => t + 1), []);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    fetchComputadorasSesion()
      .then((data) => {
        if (!cancel) {
          const list = (Array.isArray(data) ? data : []).map(itemToSesion);
          setComputadoras(list);
          setLoading(false);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancel) {
          setError(err.message || 'Error al obtener computadoras de sesión.');
          setLoading(false);
        }
      });
    return () => {
      cancel = true;
    };
  }, [refreshToken]);

  return { computadoras, loading, error, refresh };
}

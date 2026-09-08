export const UBICACIONES_COMPUTADORA = [
  'SISTEMAS',
  'ADMINISTRACION',
  'SEGURIDAD_PRIVADA',
  'OPERACIONES',
  'TESORERIA',
  'CAPITAL_HUMANO',
  'MONITOREO',
  'MESA_ENTRADAS',
  'COMERCIAL',
  'GERENCIA',
  'DEPOSITO_CENTRAL',
  'SOPORTE_IT'
] as const;

export type UbicacionComputadora = typeof UBICACIONES_COMPUTADORA[number] | string;

export function labelUbicacionEnum(u?: string | null): string {
  if (!u) return 'Sin asignar';
  return u
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function coincideUbicacionFiltro(ubicacionActual?: string | null, filtroUbicacion?: string | null): boolean {
  if (!filtroUbicacion) return true;
  if (!ubicacionActual) return false;
  return (
    ubicacionActual.toUpperCase().trim() === filtroUbicacion.toUpperCase().trim() ||
    labelUbicacionEnum(ubicacionActual).toLowerCase() === filtroUbicacion.toLowerCase()
  );
}

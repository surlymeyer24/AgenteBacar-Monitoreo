export const ROLES_SISTEMA = [
  {
    value: 'VISUALIZADOR',
    label: 'Visualizador',
    descripcion: 'Solo lectura del inventario.',
  },
  {
    value: 'USUARIO',
    label: 'Usuario',
    descripcion: 'Puede crear y editar inventario; sin administración.',
  },
  {
    value: 'ADMINISTRADOR',
    label: 'Administrador',
    descripcion: 'Acceso total, usuarios y pantalla Sistema.',
  },
];

export function labelRolSistema(rol) {
  if (!rol) return 'Sin rol';
  return ROLES_SISTEMA.find(r => r.value === rol)?.label ?? rol;
}

export function badgeClassRol(rol) {
  switch (rol) {
    case 'ADMINISTRADOR':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'USUARIO':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'VISUALIZADOR':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-500 border-slate-200';
  }
}

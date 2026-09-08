export const AVAILABLE_ICONS = [
  { name: 'Laptop', label: 'Computadora / Notebook' },
  { name: 'Camera', label: 'Cámara IP / Seguridad' },
  { name: 'Keyboard', label: 'Teclado' },
  { name: 'Mouse', label: 'Mouse / Puntero' },
  { name: 'Monitor', label: 'Monitor / Pantalla' },
  { name: 'Printer', label: 'Impresora / Escáner' },
  { name: 'Video', label: 'Webcam / Video' },
  { name: 'Volume2', label: 'Parlante / Audio' },
  { name: 'Mic', label: 'Micrófono' },
  { name: 'Package', label: 'Paquete / Stock' },
  { name: 'Building2', label: 'Edificio / Sede' },
  { name: 'MapPin', label: 'Ubicación / Coordenada' },
  { name: 'Users', label: 'Departamento / Personal' },
  { name: 'Shield', label: 'Seguridad / Bóveda' },
  { name: 'Tag', label: 'Marca / Etiqueta' },
  { name: 'Sliders', label: 'Parámetro / Estado' },
  { name: 'Wrench', label: 'Mantenimiento / Taller' },
  { name: 'Wifi', label: 'Red / Conectividad' },
  { name: 'HardDrive', label: 'Disco / Almacenamiento' },
  { name: 'Cpu', label: 'Procesador / Chipset' },
  { name: 'Smartphone', label: 'Celular / Móvil' },
  { name: 'Tv', label: 'Televisor / Smart TV' },
  { name: 'CheckCircle2', label: 'Completado / Activo' },
  { name: 'FileKey', label: 'Licencia / Llave de Software' },
  { name: 'FileText', label: 'Documento / Suite Ofimática' },
  { name: 'ShieldCheck', label: 'Garantía / Seguridad Certificada' },
  { name: 'AlertTriangle', label: 'Alerta / Falla Crítica' },
  { name: 'Trash2', label: 'Baja / Desecho Tecnológico' },
  { name: 'Clock', label: 'Tiempo / Preventivo Programado' },
  { name: 'HeartHandshake', label: 'Donación / Convenio' },
  { name: 'Award', label: 'Certificación / Premium' },
  { name: 'Database', label: 'Base de Datos / Servidor' },
  { name: 'Terminal', label: 'Consola / Sistema Operativo' },
];

export const COLOR_OPTIONS = [
  { id: 'blue', name: 'Azul', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  { id: 'emerald', name: 'Verde', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { id: 'indigo', name: 'Índigo', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  { id: 'amber', name: 'Ámbar', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { id: 'rose', name: 'Rojo / Rosa', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  { id: 'purple', name: 'Púrpura', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  { id: 'sky', name: 'Celeste', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  { id: 'orange', name: 'Naranja', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  { id: 'violet', name: 'Violeta', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  { id: 'cyan', name: 'Cian', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  { id: 'slate', name: 'Gris Neutro', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
];

export function getColorClasses(codigo) {
  const idx = codigo ? codigo.charCodeAt(0) % COLOR_OPTIONS.length : 0;
  const opt = COLOR_OPTIONS[idx];
  return { bg: opt.bg, text: opt.text, border: opt.border };
}

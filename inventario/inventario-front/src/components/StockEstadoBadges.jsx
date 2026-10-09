import { Info } from 'lucide-react';
import { useState } from 'react';

/** Mapeo estado operativo → etiqueta de disponibilidad en depósito. */
export function labelDisponibilidad(estadoActual, estadoLabels = {}) {
  const e = (estadoActual ?? '').trim();
  if (e === estadoLabels.ASIGNADA || e === 'Asignada') return 'Asignada';
  if (e === estadoLabels.EN_MANTENIMIENTO || e === 'En mantenimiento') return 'En mantenimiento';
  if (e === estadoLabels.BAJA || e === 'Baja') return 'Baja';
  if (e === estadoLabels.SIN_ASIGNAR || e === 'Sin Asignar') return 'En depósito';
  if (e === estadoLabels.ACTIVA || e === 'Activa') return 'Activa';
  if (e === estadoLabels.INACTIVA || e === 'Inactiva') return 'Inactiva';
  return e || 'Sin estado';
}

const DISPONIBILIDAD_CLS = {
  'En depósito': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Asignada: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'En mantenimiento': 'bg-amber-50 text-amber-700 border-amber-200',
  Baja: 'bg-red-50 text-red-700 border-red-200',
  Activa: 'bg-blue-50 text-blue-700 border-blue-200',
  Inactiva: 'bg-slate-100 text-slate-600 border-slate-200',
};

const DISPONIBILIDAD_CLS_DARK = {
  'En depósito': 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  Asignada: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50',
  'En mantenimiento': 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  Baja: 'bg-red-900/40 text-red-300 border-red-700/50',
  Activa: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
  Inactiva: 'bg-slate-700/50 text-slate-300 border-slate-600',
};

const PREPARACION_MAP = {
  SIN_ARMAR: { label: 'Sin armar', cls: 'bg-slate-100 text-slate-600 border-slate-200', clsDark: 'bg-slate-700/50 text-slate-300 border-slate-600' },
  ARMADO: { label: 'Combo armado', cls: 'bg-violet-50 text-violet-700 border-violet-200', clsDark: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50' },
  NO_APLICA: { label: 'No aplica', cls: 'bg-slate-100 text-slate-400 border-slate-200', clsDark: 'bg-slate-700/50 text-slate-400 border-slate-600' },
};

const REPORTE_AGENTE_MAP = {
  SIN_REPORTE: { label: 'Sin reporte', cls: 'bg-slate-100 text-slate-500 border-slate-200', clsDark: 'bg-slate-700/50 text-slate-300 border-slate-600' },
  MATCH_SUGERIDO: { label: 'Match sugerido', cls: 'bg-amber-50 text-amber-700 border-amber-200', clsDark: 'bg-amber-900/40 text-amber-300 border-amber-700/50' },
  CONFIRMADA: { label: 'Confirmada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', clsDark: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50' },
  DISCREPANCIA: { label: 'Discrepancia', cls: 'bg-red-50 text-red-700 border-red-200', clsDark: 'bg-red-900/40 text-red-300 border-red-700/50' },
  NO_APLICA: { label: 'No aplica', cls: 'bg-slate-100 text-slate-400 border-slate-200', clsDark: 'bg-slate-700/50 text-slate-400 border-slate-600' },
};

function Badge({ label, cls, title, variant = 'light' }) {
  const shape = variant === 'dark' ? 'rounded' : 'rounded-full';
  const size = variant === 'dark' ? 'text-[11px]' : 'text-[10px]';
  return (
    <span
      title={title}
      className={`px-2 py-0.5 ${shape} ${size} font-bold border whitespace-nowrap ${cls}`}
    >
      {label}
    </span>
  );
}

export function BadgeDisponibilidad({ estadoActual, estadoLabels, variant = 'light' }) {
  const label = labelDisponibilidad(estadoActual, estadoLabels);
  const map = variant === 'dark' ? DISPONIBILIDAD_CLS_DARK : DISPONIBILIDAD_CLS;
  const cls = map[label] ?? (variant === 'dark' ? 'bg-slate-700/50 text-slate-300 border-slate-600' : 'bg-slate-100 text-slate-600 border-slate-200');
  return <Badge label={label} cls={cls} title="Disponibilidad: ¿dónde está el ítem?" variant={variant} />;
}

export function BadgePreparacion({ estadoPreparacion, variant = 'light' }) {
  const cfg = PREPARACION_MAP[estadoPreparacion] ?? PREPARACION_MAP.SIN_ARMAR;
  return <Badge label={cfg.label} cls={variant === 'dark' ? cfg.clsDark : cfg.cls} title="Preparación: ¿tiene combo/baseline armado?" variant={variant} />;
}

export function BadgeAgente({ estadoReporteAgente, variant = 'light' }) {
  const cfg = REPORTE_AGENTE_MAP[estadoReporteAgente] ?? REPORTE_AGENTE_MAP.SIN_REPORTE;
  return <Badge label={cfg.label} cls={variant === 'dark' ? cfg.clsDark : cfg.cls} title="Agente: ¿ya reportó AgenteBacar?" variant={variant} />;
}

/** Tres badges ortogonales para una computadora trazable en stock. */
export function StockEstadosUnidad({ pc, estadoLabels, variant = 'light', className = '' }) {
  return (
    <div className={`flex flex-wrap gap-1 mt-1.5 ${className}`}>
      <BadgeDisponibilidad estadoActual={pc.estadoActual} estadoLabels={estadoLabels} variant={variant} />
      <BadgePreparacion estadoPreparacion={pc.estadoPreparacion} variant={variant} />
      <BadgeAgente estadoReporteAgente={pc.estadoReporteAgente} variant={variant} />
    </div>
  );
}

/** Panel explicativo de las dimensiones de estado del stock. */
export function StockEstadoLeyenda({ variant = 'full' }) {
  const [abierta, setAbierta] = useState(variant === 'full');

  if (variant === 'compact') {
    return (
      <p className="text-xs text-slate-500 font-medium">
        Los estados se leen en tres ejes independientes:{' '}
        <span className="text-emerald-700 font-bold">Disponibilidad</span>,{' '}
        <span className="text-violet-700 font-bold">Preparación</span> y{' '}
        <span className="text-blue-700 font-bold">Agente</span>.
        {' '}
        <button
          type="button"
          onClick={() => setAbierta(v => !v)}
          className="text-blue-600 hover:underline font-bold"
        >
          {abierta ? 'Ocultar leyenda' : 'Ver leyenda'}
        </button>
        {abierta && <LeyendaDetalle className="mt-3" />}
      </p>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="flex items-start gap-2 mb-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-slate-800">Cómo leer los estados del stock</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Cada dimensión responde una pregunta distinta. No mezclan significados.
          </p>
        </div>
      </div>
      <LeyendaDetalle />
    </div>
  );
}

function LeyendaDetalle({ className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 text-xs ${className}`}>
      <div>
        <p className="font-bold text-emerald-700 uppercase tracking-wide mb-2">Disponibilidad</p>
        <ul className="space-y-1 text-slate-600 font-medium">
          <li><strong>En depósito</strong> — sin responsable asignado</li>
          <li><strong>Asignada</strong> — entregada a una persona</li>
          <li><strong>En mantenimiento / Baja</strong> — fuera de circulación</li>
        </ul>
      </div>
      <div>
        <p className="font-bold text-violet-700 uppercase tracking-wide mb-2">Preparación</p>
        <ul className="space-y-1 text-slate-600 font-medium">
          <li><strong>Sin armar</strong> — falta armar combo/baseline</li>
          <li><strong>Combo armado</strong> — baseline listo para el agente</li>
        </ul>
      </div>
      <div>
        <p className="font-bold text-blue-700 uppercase tracking-wide mb-2">Agente</p>
        <ul className="space-y-1 text-slate-600 font-medium">
          <li><strong>Sin reporte</strong> — AgenteBacar aún no sincronizó</li>
          <li><strong>Match sugerido</strong> — revisar en Conciliaciones</li>
          <li><strong>Confirmada / Discrepancia</strong> — conciliación cerrada</li>
        </ul>
      </div>
    </div>
  );
}

export function StockInfoBanner({ tipo }) {
  if (tipo === 'lotes') {
    return (
      <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-xs text-teal-900 font-medium">
        <strong>Stock de PCs</strong> — contás cuántas hay de cada tipo (ej. 3× Ryzen 5600G 8GB).
        Sin hostname ni agente. Para preparar una entrega, dala de alta en la pestaña{' '}
        <strong>Computadoras</strong>.
      </div>
    );
  }
  if (tipo === 'unidades') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-900 font-medium">
        <strong>Computadoras</strong> — cada fila es una PC con hostname y UUID.
        Armá el combo, asigná si corresponde e instalá el agente para conciliar con CyberWatch.
      </div>
    );
  }
  return null;
}

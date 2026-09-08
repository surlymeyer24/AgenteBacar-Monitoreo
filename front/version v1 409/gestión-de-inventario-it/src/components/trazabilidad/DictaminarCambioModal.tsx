import React, { useState } from 'react';
import { CambioHardwareDetectado, TipoResolucionDiscrepancia } from '../../types/trazabilidad';
import { 
  X, 
  Check, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  Server, 
  Monitor, 
  HardDrive, 
  FileText,
  Tag,
  ArrowRight,
  Info
} from 'lucide-react';

interface DictaminarCambioModalProps {
  cambio: CambioHardwareDetectado;
  tipoInicial?: TipoResolucionDiscrepancia;
  onClose: () => void;
  onConfirmar: (
    cambioId: string, 
    tipoResolucion: TipoResolucionDiscrepancia, 
    notaIt: string, 
    ticket?: string
  ) => void;
}

export default function DictaminarCambioModal({
  cambio,
  tipoInicial = 'autorizado',
  onClose,
  onConfirmar
}: DictaminarCambioModalProps) {
  const [tipoResolucion, setTipoResolucion] = useState<TipoResolucionDiscrepancia>(tipoInicial);
  const [ticket, setTicket] = useState('');
  const [notaIt, setNotaIt] = useState(() => {
    if (tipoInicial === 'autorizado') {
      return cambio.tipo_componente === 'ram' 
        ? 'Upgrade de memoria RAM solicitado por jefatura de área y ejecutado por soporte IT.' 
        : 'Reemplazo de componente debidamente autorizado en mantenimiento programado.';
    } else if (tipoInicial === 'no_autorizado') {
      return 'Modificación no documentada. Se abre incidente para auditoría de seguridad y verificación presencial.';
    }
    return 'Lectura descartada tras verificación física.';
  });

  const getComponentIcon = (tipo: string) => {
    switch (tipo) {
      case 'ram': return <Server className="w-4 h-4 text-purple-600" />;
      case 'cpu': return <Cpu className="w-4 h-4 text-blue-600" />;
      case 'monitor': return <Monitor className="w-4 h-4 text-amber-600" />;
      case 'disco': return <HardDrive className="w-4 h-4 text-emerald-600" />;
      default: return <Server className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaIt.trim()) return;
    onConfirmar(cambio.id, tipoResolucion, notaIt.trim(), ticket.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              tipoResolucion === 'autorizado' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : tipoResolucion === 'no_autorizado'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {tipoResolucion === 'autorizado' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white uppercase font-sans">
                Dictaminar Cambio de Hardware
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {cambio.hostname} • REF: {cambio.id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Summary of the Change */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase">
                {getComponentIcon(cambio.tipo_componente)}
                <span>Componente: {cambio.tipo_componente.toUpperCase()}</span>
              </div>
              <span className="font-mono text-slate-500">
                {new Date(cambio.timestamp).toLocaleDateString('es-AR')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Declarado Original (Stock)
                </span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                  {cambio.valor_esperado}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-blue-600 block">
                  Detectado por Agente (En vivo)
                </span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">
                  {cambio.valor_detectado}
                </span>
              </div>
            </div>
          </div>

          {/* Selector de Tipo de Dictamen */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Tipo de Dictamen Técnico:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTipoResolucion('autorizado')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  tipoResolucion === 'autorizado'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                <span className="block text-[11px]">Upgrade Autorizado</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoResolucion('no_autorizado')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  tipoResolucion === 'no_autorizado'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                <span className="block text-[11px]">No Autorizado / Alerta</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoResolucion('falso_positivo')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  tipoResolucion === 'falso_positivo'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <span className="block text-[11px]">Falso Positivo</span>
              </button>
            </div>
          </div>

          {/* Ticket IT (Jira / GLPI) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>N° de Ticket IT o Solicitud (Opcional):</span>
            </label>
            <input
              type="text"
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
              placeholder="Ej: IT-48291, JIRA-1049, MANT-02"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9c1313]/20 focus:border-[#9c1313]"
            />
          </div>

          {/* Justificación / Notas del Técnico */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Justificación técnica / Observaciones IT:</span>
            </label>
            <textarea
              value={notaIt}
              onChange={(e) => setNotaIt(e.target.value)}
              rows={3}
              required
              placeholder="Describa el motivo del cambio, si se procedió al reemplazo de memoria, cambio de monitor por rotura, etc."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9c1313]/20 focus:border-[#9c1313]"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!notaIt.trim()}
              className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                tipoResolucion === 'autorizado'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : tipoResolucion === 'no_autorizado'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Guardar Dictamen Técnico</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

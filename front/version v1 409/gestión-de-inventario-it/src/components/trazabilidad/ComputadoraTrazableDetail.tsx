import React, { useState } from 'react';
import { 
  ComputadoraTrazable, 
  DiscrepanciaResolucion,
  TipoResolucionDiscrepancia
} from '../../types/trazabilidad';
import { 
  BadgeOrigen, 
  BadgeConciliacion, 
  BadgeTipoEquipo, 
  BadgeCondicion 
} from './TrazabilidadBadges';
import { 
  ArrowLeft, 
  Box, 
  Radio, 
  Cpu, 
  Server, 
  HardDrive, 
  Monitor, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldAlert, 
  ShieldCheck, 
  Info, 
  Plus, 
  Send, 
  Sparkles,
  Link2,
  Calendar,
  User,
  MapPin
} from 'lucide-react';

interface ComputadoraTrazableDetailProps {
  computadora: ComputadoraTrazable;
  onBack: () => void;
  onOpenArmarModal: (uuid: string) => void;
  onOpenVincularModal?: (comp: ComputadoraTrazable) => void;
  onRegistrarResolucion: (uuid: string, resolucion: Omit<DiscrepanciaResolucion, 'id' | 'resuelto_at'>) => void;
}

export default function ComputadoraTrazableDetail({
  computadora,
  onBack,
  onOpenArmarModal,
  onOpenVincularModal,
  onRegistrarResolucion
}: ComputadoraTrazableDetailProps) {
  // Discrepancy resolution form states
  const [showResolucionForm, setShowResolucionForm] = useState(false);
  const [campoDiscrepancia, setCampoDiscrepancia] = useState<'cpu' | 'ram' | 'disco' | 'monitor' | 'periferico'>('cpu');
  const [tipoResolucion, setTipoResolucion] = useState<TipoResolucionDiscrepancia>('autorizado');
  const [notaIt, setNotaIt] = useState('');

  const { baseline_esperado, hardware_real } = computadora;

  // Comparison items logic
  interface ComparacionItem {
    campo: string;
    esperado: string;
    real: string;
    estado: 'ok' | 'warning' | 'error' | 'na';
    nota?: string;
  }

  const comparaciones: ComparacionItem[] = [];

  if (baseline_esperado && hardware_real) {
    // 1. CPU
    const cpuOk = hardware_real.cpu.toLowerCase().includes(baseline_esperado.cpu_modelo.toLowerCase().split(' ')[0]);
    comparaciones.push({
      campo: 'Procesador CPU',
      esperado: baseline_esperado.cpu_modelo,
      real: hardware_real.cpu,
      estado: cpuOk ? 'ok' : 'error',
      nota: !cpuOk ? 'Variación no coincidente de microprocesador' : undefined
    });

    // 2. RAM (Tolerancia OS)
    const diffRam = Math.abs(hardware_real.ram_gb - baseline_esperado.ram_total_gb);
    const ramOk = diffRam <= 1.0; // Tolerance OS for iGPU reserve
    comparaciones.push({
      campo: 'Memoria RAM',
      esperado: `${baseline_esperado.ram_total_gb} GB nominales`,
      real: `${hardware_real.ram_gb} GB útiles`,
      estado: ramOk ? 'ok' : 'error',
      nota: ramOk ? 'Dentro de tolerancia OS (reserva gráfica integrada)' : 'Capacidad dispar'
    });

    // 3. Disco
    comparaciones.push({
      campo: 'Almacenamiento (Disco)',
      esperado: baseline_esperado.disco_resumen,
      real: hardware_real.disco_resumen,
      estado: 'ok'
    });

    // 4. Monitor
    const monitorEsperado = baseline_esperado.perifericos.find(p => p.tipo === 'monitor');
    const monitorReal = hardware_real.monitores?.[0];
    if (monitorEsperado || monitorReal) {
      const matchBrand = monitorReal && monitorEsperado && 
        (monitorReal.nombre.toLowerCase().includes(monitorEsperado.fabricante.toLowerCase()) || 
         monitorReal.nombre.toLowerCase().includes(monitorEsperado.nombre.split(' ')[0].toLowerCase()));
      
      comparaciones.push({
        campo: 'Monitor',
        esperado: monitorEsperado ? `${monitorEsperado.nombre} [S/N: ${monitorEsperado.numero_serie}]` : 'No asignado',
        real: monitorReal ? `${monitorReal.nombre} (${monitorReal.resolucion})` : 'No detectado',
        estado: matchBrand ? 'ok' : (monitorEsperado && monitorReal ? 'warning' : 'na'),
        nota: matchBrand ? 'Match por marca/modelo (serial no disponible en agente)' : undefined
      });
    }
  }

  const handleGuardarResolucion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaIt.trim()) return;

    let campoLabel = 'Procesador CPU';
    let valEsp = baseline_esperado?.cpu_modelo || 'N/A';
    let valReal = hardware_real?.cpu || 'N/A';

    if (campoDiscrepancia === 'ram') {
      campoLabel = 'Memoria RAM';
      valEsp = `${baseline_esperado?.ram_total_gb || 16} GB`;
      valReal = `${hardware_real?.ram_gb || 0} GB`;
    } else if (campoDiscrepancia === 'monitor') {
      campoLabel = 'Monitor';
      valEsp = baseline_esperado?.perifericos.find(p => p.tipo === 'monitor')?.nombre || 'N/A';
      valReal = hardware_real?.monitores?.[0]?.nombre || 'N/A';
    }

    onRegistrarResolucion(computadora.uuid, {
      campo: campoDiscrepancia,
      campo_label: campoLabel,
      valor_esperado: valEsp,
      valor_real: valReal,
      tipo_resolucion: tipoResolucion,
      nota_it: notaIt,
      resuelto_por: 'mfernandez@bacarsa.com.ar'
    });

    setNotaIt('');
    setShowResolucionForm(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header with Breadcrumb and Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al listado</span>
          </button>

          <div className="flex items-center gap-2">
            {computadora.origen_alta === 'DETECTADA_POR_AGENTE' && onOpenVincularModal && (
              <button
                type="button"
                onClick={() => onOpenVincularModal(computadora)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Vincular a stock</span>
              </button>
            )}

            {computadora.estado_conciliacion === 'SIN_BASELINE' && (
              <button
                type="button"
                onClick={() => onOpenArmarModal(computadora.uuid)}
                className="px-4 py-1.5 bg-[#9c1313] hover:bg-red-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Armar combo</span>
              </button>
            )}
          </div>
        </div>

        {/* Hostname and Badges Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-900 font-mono tracking-tight">
                {computadora.hostname}
              </h1>
              <BadgeOrigen origen={computadora.origen_alta} />
              <BadgeConciliacion estado={computadora.estado_conciliacion} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="font-mono text-[11px] text-slate-400">UUID: {computadora.uuid}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <BadgeTipoEquipo tipo={computadora.tipo_equipo} />
                <BadgeCondicion condicion={computadora.condicion} />
              </div>
              {computadora.ubicacion && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {computadora.ubicacion}
                  </span>
                </>
              )}
            </div>
          </div>

          {computadora.responsable && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-right self-start sm:self-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Responsable Asignado</span>
              <span className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                {computadora.responsable}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Baseline Esperado Read-Only vs Hardware Real */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BLOQUE 1: BASELINE ESPERADO (POST-ARMADO READ-ONLY) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-emerald-600" />
              <h2 className="font-black text-xs text-slate-900 uppercase tracking-wider">
                Baseline Esperado (Post-armado)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              Solo Lectura
            </span>
          </div>

          <div className="p-5 space-y-4 flex-1 text-xs">
            {baseline_esperado ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CPU Esperada</span>
                    <span className="font-bold text-slate-900 text-xs">{baseline_esperado.cpu_modelo}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RAM Nominal</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">{baseline_esperado.ram_total_gb} GB</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Disco / SSD</span>
                    <span className="font-bold text-slate-900 text-xs">{baseline_esperado.disco_resumen}</span>
                  </div>
                </div>

                {/* Peripherals attached to baseline */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                    Periféricos Asignados al Baseline ({baseline_esperado.perifericos.length})
                  </span>
                  {baseline_esperado.perifericos.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px]">Sin periféricos vinculados al combo.</p>
                  ) : (
                    <div className="space-y-2">
                      {baseline_esperado.perifericos.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 text-slate-700">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="font-bold text-xs uppercase text-slate-800">{p.tipo}:</span>
                            <span>{p.nombre}</span>
                          </div>
                          <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500">
                            S/N: {p.numero_serie}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Signature and audit info */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Armado por: <strong className="text-slate-600">{baseline_esperado.armado_por}</strong></span>
                  <span>{new Date(baseline_esperado.armado_at).toLocaleDateString('es-AR')} {new Date(baseline_esperado.armado_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </>
            ) : (
              <div className="text-center py-10 space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 text-xs">Sin baseline configurado</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-0.5">
                    Esta computadora fue ingresada a stock pero aún no se le armó combo de periféricos ni se fijó su configuración base.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenArmarModal(computadora.uuid)}
                  className="px-4 py-1.5 bg-[#9c1313] hover:bg-red-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Armar combo ahora
                </button>
              </div>
            )}
          </div>
        </div>

        {/* BLOQUE 2: HARDWARE REAL DETECTADO POR AGENTE */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-blue-50/70 border-b border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
              <h2 className="font-black text-xs text-blue-900 uppercase tracking-wider">
                Hardware Real (Agente CyberWatch C#)
              </h2>
            </div>
            {hardware_real?.ultimo_reporte && (
              <span className="text-[10px] font-mono text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-300 font-bold">
                Online
              </span>
            )}
          </div>

          <div className="p-5 space-y-4 flex-1 text-xs">
            {hardware_real ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-blue-50/30 p-3 rounded-lg border border-blue-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">CPU Real</span>
                    <span className="font-bold text-slate-900 text-xs truncate block" title={hardware_real.cpu}>{hardware_real.cpu}</span>
                  </div>

                  <div className="bg-blue-50/30 p-3 rounded-lg border border-blue-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">RAM Detectada</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 text-xs">{hardware_real.ram_gb} GB</span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">OS OK</span>
                    </div>
                  </div>

                  <div className="bg-blue-50/30 p-3 rounded-lg border border-blue-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Disco Físico</span>
                    <span className="font-bold text-slate-900 text-xs">{hardware_real.disco_resumen}</span>
                  </div>
                </div>

                {/* Peripherals detected by agent */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                    Periféricos Reportados por Telemetría
                  </span>
                  <div className="space-y-2">
                    {hardware_real.monitores && hardware_real.monitores.length > 0 && (
                      <div className="flex items-center justify-between p-2.5 bg-blue-50/40 rounded-lg border border-blue-100 text-slate-700">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-bold text-xs uppercase text-slate-800">Monitor:</span>
                          <span>{hardware_real.monitores[0].nombre} ({hardware_real.monitores[0].resolucion})</span>
                        </div>
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Match por marca/modelo
                        </span>
                      </div>
                    )}
                    {hardware_real.teclado && (
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>⌨</span>
                          <span className="font-bold text-xs uppercase text-slate-800">Teclado:</span>
                          <span>{hardware_real.teclado}</span>
                        </div>
                      </div>
                    )}
                    {hardware_real.mouse && (
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>🖱</span>
                          <span className="font-bold text-xs uppercase text-slate-800">Mouse:</span>
                          <span>{hardware_real.mouse}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  {hardware_real.anydesk_id && <span>AnyDesk ID: <strong className="text-slate-700">{hardware_real.anydesk_id}</strong></span>}
                  {hardware_real.ip_publica && <span>IP: <strong className="text-slate-700">{hardware_real.ip_publica}</strong></span>}
                </div>
              </>
            ) : (
              <div className="text-center py-10 space-y-2 text-slate-400">
                <Radio className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">Sin telemetría reportada por el agente C# aún.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* BLOQUE 3: ESPERADO VS REAL (TABLA COMPARATIVA FASE 3) */}
      {baseline_esperado && hardware_real && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-400" />
              <h2 className="font-black text-xs uppercase tracking-wider text-white">
                Esperado vs Real: Cotejo de Componentes
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <span>Leyenda:</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">✓ Coincide</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">⚠ Aviso</span>
              <span className="flex items-center gap-1 text-rose-400 font-bold">✗ Discrepancia</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/90 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Componente</th>
                  <th className="py-3 px-4">Esperado (Declarado en Stock)</th>
                  <th className="py-3 px-4">Real (Reportado por Agente)</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4">Observaciones y Tolerancias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {comparaciones.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.campo}</td>
                    <td className="py-3 px-4 font-medium">{row.esperado}</td>
                    <td className="py-3 px-4 font-mono font-medium">{row.real}</td>
                    <td className="py-3 px-4 text-center">
                      {row.estado === 'ok' && (
                        <span className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                      {row.estado === 'warning' && (
                        <span className="inline-flex p-1 rounded-full bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                      )}
                      {row.estado === 'error' && (
                        <span className="inline-flex p-1 rounded-full bg-rose-100 text-rose-700">
                          <XCircle className="w-4 h-4" />
                        </span>
                      )}
                      {row.estado === 'na' && (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11.5px]">
                      {row.nota || 'Verificación exacta con especificación.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>Tolerancia RAM:</strong> 15.8 GB se considera match válido frente a 16 GB nominales debido a memoria compartida de la placa gráfica.
              </span>
            </div>

            {computadora.estado_conciliacion === 'DISCREPANCIA' && (
              <button
                type="button"
                onClick={() => setShowResolucionForm(!showResolucionForm)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer self-end sm:self-auto flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{showResolucionForm ? 'Ocultar formulario' : 'Gestionar Discrepancia IT'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* BLOQUE 4: WORKFLOW RESOLUCIÓN DE DISCREPANCIAS (FASE 4) */}
      {(computadora.estado_conciliacion === 'DISCREPANCIA' || (computadora.resoluciones_discrepancia && computadora.resoluciones_discrepancia.length > 0)) && (
        <div className="bg-white rounded-xl border border-rose-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider">
                Auditoría y Resolución de Discrepancias (Fase 4)
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setShowResolucionForm(!showResolucionForm)}
              className="text-xs font-bold text-[#9c1313] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar nota de IT</span>
            </button>
          </div>

          {/* Existing Resolutions List */}
          {computadora.resoluciones_discrepancia && computadora.resoluciones_discrepancia.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Historial de Resoluciones Registradas
              </span>
              <div className="space-y-2">
                {computadora.resoluciones_discrepancia.map((res) => (
                  <div key={res.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{res.campo_label}:</span>
                        <span className="text-slate-600 line-through">{res.valor_esperado}</span>
                        <span className="font-bold text-slate-900">→ {res.valor_real}</span>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        res.tipo_resolucion === 'autorizado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : res.tipo_resolucion === 'no_autorizado'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {res.tipo_resolucion.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-slate-700 bg-white p-2.5 rounded border border-slate-200/80 italic text-[11.5px]">
                      "{res.nota_it}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Auditado por: {res.resuelto_por}</span>
                      <span>{new Date(res.resuelto_at).toLocaleDateString('es-AR')} {new Date(res.resuelto_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form to add resolution */}
          {showResolucionForm && (
            <form onSubmit={handleGuardarResolucion} className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-3 animate-in fade-in">
              <span className="font-bold text-xs text-rose-950 uppercase tracking-wider block">
                Nuevo Dictamen Técnico de Discrepancia
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Componente en Conflicto</label>
                  <select
                    value={campoDiscrepancia}
                    onChange={(e) => setCampoDiscrepancia(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-red-500"
                  >
                    <option value="cpu">Procesador CPU (Ej: i3 declarado vs i5 real)</option>
                    <option value="ram">Memoria RAM</option>
                    <option value="disco">Disco / SSD</option>
                    <option value="monitor">Monitor / Pantalla</option>
                    <option value="periferico">Otro periférico</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Dictamen de Auditoría IT</label>
                  <select
                    value={tipoResolucion}
                    onChange={(e) => setTipoResolucion(e.target.value as TipoResolucionDiscrepancia)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-1 focus:ring-red-500"
                  >
                    <option value="autorizado">✅ Autorizado (Upgrade legítimo con aval IT)</option>
                    <option value="no_autorizado">❌ No autorizado (Sustracción o cambio indebido)</option>
                    <option value="falso_positivo">⚠ Falso positivo (Falla de lectura del agente o bug de driver)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 text-xs">Nota técnica de justificación (requerido)</label>
                <textarea
                  value={notaIt}
                  onChange={(e) => setNotaIt(e.target.value)}
                  rows={3}
                  placeholder="Describe la justificación, número de ticket de soporte o motivo de la variación..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResolucionForm(false)}
                  className="px-3 py-1.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#9c1313] hover:bg-red-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Guardar Resolución</span>
                </button>
              </div>
            </form>
          )}

        </div>
      )}

    </div>
  );
}

import { useState } from 'react';
import {
  Cpu, HardDrive, Server, Copy, Info, SlidersHorizontal,
  Zap, Check, ArrowUpRight, Activity, Gauge,
} from 'lucide-react';
import { getComputerRamDetails, getProcesadorDisplay, getRamPlacaDisplay } from '../utils/ramHelpers';

function fmtPct(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${n.toFixed(1)}%`;
}

export default function ComputadoraHardwareSection({
  computadora,
  onNavigateToPerifericos,
  countMonitores = 0,
  countImpresoras = 0,
  countPerifericos = 0,
}) {
  const ramDetails = getComputerRamDetails(computadora);
  const cpu = getProcesadorDisplay(computadora);
  const ramPlaca = getRamPlacaDisplay(computadora, ramDetails);
  const [copiedText, setCopiedText] = useState(null);

  const cpuUso = Number(computadora?.cpuUsoPorcentaje);
  const ramUsagePct = ramDetails.porcentajeUso ?? Number(computadora?.ramUsoPorcentaje);
  const ramUsagePctFmt = Number.isFinite(ramUsagePct) ? ramUsagePct : null;
  const ramUsageBarColor = ramUsagePctFmt != null && ramUsagePctFmt > 85
    ? 'bg-rose-500'
    : ramUsagePctFmt != null && ramUsagePctFmt > 70
      ? 'bg-amber-500'
      : 'bg-blue-600';
  const ramUsageTextColor = ramUsagePctFmt != null && ramUsagePctFmt > 85
    ? 'text-rose-700 bg-rose-50 border-rose-200'
    : ramUsagePctFmt != null && ramUsagePctFmt > 70
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-blue-700 bg-blue-50 border-blue-200';

  const arquitectura = computadora?.arquitectura ?? '—';

  function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  }

  const modulosOcupados = ramDetails.modulos.filter(m => m.ocupado);
  const modulosVacios = ramDetails.modulos.filter(m => !m.ocupado);

  return (
    <div className="space-y-6">

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* CPU */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                Procesador (CPU)
              </span>
              <div className="flex items-center gap-1">
                {cpu.fabricante && cpu.fabricante !== 'Desconocido' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                    {cpu.fabricante}
                  </span>
                )}
                {arquitectura !== '—' && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {arquitectura}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs font-bold text-slate-850 block leading-snug truncate" title={cpu.nombre}>
              {cpu.nombre}
            </span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {cpu.modeloBadge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                  {cpu.modeloBadge.startsWith('Core ') ? cpu.modeloBadge : `Core ${cpu.modeloBadge}`}
                </span>
              )}
              {cpu.generacion != null && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                  Gen {cpu.generacion}
                </span>
              )}
              {cpu.nucleosTexto && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                  {cpu.nucleosTexto}
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Frecuencia & Uso</span>
            <span className="font-mono font-bold text-slate-800">
              {cpu.frecuenciaMaxMhz > 0 ? `${cpu.frecuenciaMaxMhz} MHz` : '—'}
              {Number.isFinite(cpuUso) ? ` · ${fmtPct(cpuUso)} uso` : ''}
            </span>
          </div>
        </div>

        {/* RAM total */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-600" />
                Memoria RAM Total
              </span>
              {ramUsagePctFmt != null && (
                <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border ${ramUsageTextColor}`}>
                  {fmtPct(ramUsagePctFmt)} en uso
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-1 flex-wrap">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {ramDetails.totalGb > 0 ? `${ramDetails.totalGb.toFixed(1)} GB` : '—'}
              </span>
              {ramDetails.tipoMemoria && (
                <span className="text-xs font-bold text-slate-500">
                  {ramDetails.tipoMemoria}
                  {ramPlaca.canalModo ? ` · Modo ${ramPlaca.canalModo.toUpperCase()}` : ''}
                </span>
              )}
            </div>
            {ramUsagePctFmt != null && (
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 mt-2">
                <div
                  className={`h-full ${ramUsageBarColor} transition-all duration-500`}
                  style={{ width: `${Math.min(100, ramUsagePctFmt)}%` }}
                />
              </div>
            )}
          </div>
          {(ramDetails.enUsoGb != null || ramDetails.libreGb != null) && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">
                Usado: <strong className="text-slate-800">{ramDetails.enUsoGb ?? '—'} GB</strong>
              </span>
              <span className="text-slate-500">
                Libre: <strong className="text-emerald-700">{ramDetails.libreGb ?? '—'} GB</strong>
              </span>
            </div>
          )}
        </div>

        {/* Placa Base & Capacidad */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Placa Base & Capacidad
              </span>
              {ramPlaca.maxCapacidadGb != null && (
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Máx {ramPlaca.maxCapacidadGb} GB
                </span>
              )}
            </div>
            <span className="text-lg font-black text-slate-900 block mt-1">
              {ramDetails.slotsEtiqueta
                ? `${ramDetails.slotsEtiqueta} Ranuras`
                : ramDetails.totalGb > 0
                  ? 'Ranuras sin dato'
                  : '—'}
              {ramPlaca.canalModo && ramDetails.slotsEtiqueta ? ` (${ramPlaca.canalModo.toUpperCase()})` : ''}
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Factor de Forma</span>
            <span className="font-semibold text-slate-700">{ramDetails.factorForma}</span>
          </div>
        </div>
      </div>

      {/* Ficha técnica del procesador */}
      {(cpu.tieneDetalle || cpu.nombre !== '—') && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Cpu className="w-4 h-4 text-blue-600" />
                Ficha técnica del procesador (CPU)
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Especificaciones de microarquitectura, fabricante, frecuencias operativas, núcleos físicos y lógicos.
              </p>
            </div>
            {Number.isFinite(cpuUso) && (
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg flex items-center gap-1.5 shrink-0">
                <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                {fmtPct(cpuUso)} uso actual
              </span>
            )}
          </div>

          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm shrink-0">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-slate-900 text-sm sm:text-base font-mono">
                    {cpu.nombre}
                  </span>
                  {cpu.fabricante && cpu.fabricante !== 'Desconocido' && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-extrabold text-[10px] rounded-md font-mono uppercase">
                      {cpu.fabricante}
                    </span>
                  )}
                </div>
                {(cpu.gama || cpu.modelo || cpu.generacion != null) && (
                  <p className="text-xs text-slate-600 font-semibold mt-1">
                    {cpu.gama && (
                      <>Gama: <strong className="text-slate-900">{cpu.gamaEtiqueta}</strong></>
                    )}
                    {cpu.modelo && (
                      <> · Modelo: <strong className="text-slate-900">{cpu.modelo}</strong></>
                    )}
                    {cpu.generacion != null && (
                      <> · Generación: <strong className="text-slate-900">{cpu.generacion}ª Gen</strong></>
                    )}
                  </p>
                )}
              </div>
            </div>
            {cpu.frecuenciaMaxMhz > 0 && (
              <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-2 md:pt-0 border-slate-200 gap-1 shrink-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Frecuencia Máxima</span>
                <span className="text-base font-black text-blue-700 font-mono">
                  {cpu.frecuenciaMaxMhz} MHz
                </span>
                <span className="text-[10px] text-slate-500 font-semibold font-mono">
                  ~{(cpu.frecuenciaMaxMhz / 1000).toFixed(2)} GHz Turbo
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fabricante</span>
              <span className="font-black text-slate-900 text-sm mt-0.5 block">{cpu.fabricante || '—'}</span>
              <span className="text-[10px] text-slate-500 font-medium">{cpu.fabricanteCorp}</span>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gama & Serie</span>
              <span className="font-black text-slate-900 text-sm mt-0.5 block">{cpu.gamaEtiqueta || '—'}</span>
              <span className="text-[10px] text-slate-500 font-medium">{cpu.gamaSerieSub}</span>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Generación</span>
              <span className="font-black text-slate-900 text-sm mt-0.5 block">
                {cpu.generacion != null ? `${cpu.generacion}ª Gen` : '—'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Arquitectura x64</span>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Modelo</span>
              <span className="font-black text-slate-900 text-sm mt-0.5 block font-mono">{cpu.modelo || '—'}</span>
              <span className="text-[10px] text-slate-500 font-medium">Serie Desktop</span>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Núcleos Físicos</span>
              <span className="font-black text-blue-700 text-sm mt-0.5 block font-mono">
                {cpu.nucleosFisicos > 0 ? `${cpu.nucleosFisicos} Cores` : '—'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Procesamiento real</span>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Núcleos Lógicos</span>
              <span className="font-black text-indigo-700 text-sm mt-0.5 block font-mono">
                {cpu.nucleosLogicos > 0 ? `${cpu.nucleosLogicos} Threads` : '—'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Hilos de ejecución</span>
            </div>
          </div>

          {cpu.tieneDetalle && cpu.frecuenciaMaxMhz > 0 && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-[11px] text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Procesador <strong>{cpu.fabricante} {cpu.modeloBadge || cpu.gamaEtiqueta}</strong>
                  {cpu.nucleosFisicos > 0 && (
                    <> ({cpu.nucleosFisicos} núcleos físicos / {cpu.nucleosLogicos || cpu.nucleosFisicos} hilos lógicos)</>
                  )}
                  {' '}operando a una frecuencia máxima de <strong>{cpu.frecuenciaMaxMhz} MHz</strong>
                  {' '}(~{(cpu.frecuenciaMaxMhz / 1000).toFixed(2)} GHz).
                </span>
              </div>
              {arquitectura !== '—' && (
                <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 text-[10px]">
                  {arquitectura} · 64-bit
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Módulos RAM */}
      {ramDetails.mostrarSeccionRam && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Server className="w-4 h-4 text-indigo-600" />
                Módulos de memoria RAM & ranuras de placa (slots)
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Datos reportados por el agente vía WMI (Win32_PhysicalMemory).
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
                {ramDetails.slotsEtiqueta
                  ? `${ramDetails.slotsEtiqueta} slots ocupados`
                  : 'Slots sin dato de desglose'}
              </span>
              {ramPlaca.maxCapacidadGb != null && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                  Placa máx: {ramPlaca.maxCapacidadGb} GB
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Canal de memoria</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Modo {ramPlaca.canalModo ? ramPlaca.canalModo.toUpperCase() : ramDetails.canales}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Capacidad máx. placa</span>
              <span className="font-bold text-emerald-700 font-mono mt-0.5 block">
                {ramPlaca.maxCapacidadGb != null ? `${ramPlaca.maxCapacidadGb} GB RAM` : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Frecuencia / Bus</span>
              <span className="font-bold text-slate-800 font-mono mt-0.5 block">
                {ramDetails.frecuenciaMhz > 0 ? `${ramDetails.frecuenciaMhz} MT/s (MHz)` : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tecnología</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{ramDetails.tipoMemoria}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Uso de memoria</span>
              <span className="font-bold text-slate-800 font-mono mt-0.5 block">
                {ramUsagePctFmt != null && ramDetails.totalGb > 0
                  ? `${fmtPct(ramUsagePctFmt)} (${ramDetails.enUsoGb ?? '—'} GB / ${ramDetails.totalGb.toFixed(1)} GB)`
                  : '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
            {modulosOcupados.map((mod, idx) => (
              <div
                key={`ocupado-${idx}`}
                className="bg-white border-2 border-indigo-100 hover:border-indigo-300 transition-all rounded-xl p-4 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900 font-mono">{mod.slot}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {mod.inferido ? 'Resumen agente' : 'Detectado'}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 mt-0.5">{mod.fabricante}</p>
                      </div>
                    </div>
                    {mod.capacidadDisplay ? (
                      <span className="px-2.5 py-1 bg-indigo-600 text-white font-mono font-black text-xs rounded-lg shadow-sm">
                        {mod.capacidadDisplay}
                      </span>
                    ) : mod.capacidadGb > 0 ? (
                      <span className="px-2.5 py-1 bg-indigo-600 text-white font-mono font-black text-xs rounded-lg shadow-sm">
                        {mod.capacidadGb} GB
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-3 text-[11px] mt-3.5 pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tipo & frecuencia</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {mod.tipo}{mod.velocidadMhz > 0 ? ` @ ${mod.velocidadMhz} MHz` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Voltaje</span>
                      <span className="font-mono font-semibold text-slate-800">{mod.voltaje || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Part Number</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="font-mono font-bold text-slate-800 text-[10px] truncate max-w-[130px]" title={mod.partNumber || 'N/D'}>
                          {mod.partNumber || '—'}
                        </span>
                        {mod.partNumber && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(mod.partNumber)}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 cursor-pointer"
                            title="Copiar Part Number"
                          >
                            {copiedText === mod.partNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Número de serie</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="font-mono text-slate-600 text-[10px] truncate max-w-[110px]" title={mod.numeroSerie || 'N/D'}>
                          {mod.numeroSerie || '—'}
                        </span>
                        {mod.numeroSerie && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(mod.numeroSerie)}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 cursor-pointer"
                            title="Copiar número de serie"
                          >
                            {copiedText === mod.numeroSerie ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                  {mod.factorForma}
                  {mod.canal && mod.canal !== 'N/A' ? ` · Canal ${mod.canal}` : ''}
                </div>
              </div>
            ))}

            {modulosVacios.map((mod, idx) => (
              <div
                key={`vacio-${idx}`}
                className="bg-slate-50/70 border-2 border-dashed border-slate-200 hover:border-blue-300 transition-all rounded-xl p-4 flex flex-col justify-between text-xs"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-200/70 text-slate-400 rounded-lg shrink-0">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-slate-700 block">{mod.slot}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Ranura disponible en placa base</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/70 text-slate-600">
                      VACÍO
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200/80 rounded-lg p-3 mt-3 text-[11px] space-y-1">
                    <p className="text-slate-600 font-medium">
                      Admite ampliación hasta{' '}
                      <strong>
                        {ramDetails.maxCapacidadGb
                          ? `${ramDetails.maxCapacidadGb} GB`
                          : `16 GB o 32 GB ${ramDetails.tipoMemoria}`}
                      </strong>.
                    </p>
                    {ramDetails.slotsOcupados === 1 && (
                      <p className="text-slate-400 text-[10px]">
                        Instale un módulo idéntico para habilitar Dual-Channel y duplicar el ancho de banda de memoria.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {ramDetails.slotsOcupados === 1 && ramDetails.slotsTotales > 1 && (
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-blue-800">
                Este equipo opera en <strong>Single-Channel</strong> con {ramDetails.slotsTotales - ramDetails.slotsOcupados} ranura(s) libre(s).
                Agregar un segundo módulo idéntico habilitaría Dual-Channel.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Periféricos teaser */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Periféricos & dispositivos vinculados</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {countMonitores} monitor(es) • {countImpresoras} impresora(s) • {countPerifericos} periférico(s) USB / audio
            </p>
          </div>
        </div>
        {onNavigateToPerifericos && (
          <button
            type="button"
            onClick={onNavigateToPerifericos}
            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors shrink-0 self-start sm:self-auto cursor-pointer flex items-center gap-1"
          >
            Ver y administrar periféricos <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Discos */}
      {computadora.discos?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <HardDrive className="w-4 h-4 text-blue-600" />
            Particiones de disco duro & unidades de almacenamiento
          </h3>
          <div className="space-y-4 text-xs border-t border-slate-100 pt-4">
            {computadora.discos.map((d, i) => {
              const pct = Number(d.porcentajeUsado) || 0;
              const progressCls = pct > 85 ? 'bg-rose-600' : pct > 65 ? 'bg-amber-600' : 'bg-blue-600';
              const letra = d.letra ?? d.puntoMontaje ?? d.nombre ?? `Disco ${i + 1}`;
              return (
                <div key={letra + i} className="space-y-2">
                  <div className="flex justify-between items-center font-bold flex-wrap gap-1">
                    <span className="text-slate-800 font-mono flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                      Unidad {letra} ({d.tipoDisco || '—'})
                    </span>
                    <span className="text-slate-700 font-mono text-[11px]">
                      {Number(d.libreGB).toFixed(1)} GB libres de {Number(d.totalGB || 0).toFixed(0)} GB ({pct.toFixed(1)}% ocupado)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div className={`h-full ${progressCls} transition-all duration-300`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

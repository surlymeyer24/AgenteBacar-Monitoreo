import React, { useState } from 'react';
import { 
  ArrowRight, 
  Box, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Cpu, 
  Server, 
  Monitor, 
  ShieldAlert, 
  Sparkles, 
  Layers, 
  Link2 
} from 'lucide-react';

export default function TrazabilidadHelpFlow() {
  const [selectedJourney, setSelectedJourney] = useState<'feliz' | 'ram' | 'monitor' | 'retro' | 'discrepancia'>('feliz');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-wide uppercase font-sans">
              Cómo funciona la Trazabilidad Stock ↔ Agente
            </h1>
            <p className="text-xs text-slate-500">
              Ciclo de vida del activo tecnológico corporativo en Bacarsa: desde el depósito hasta la telemetría en vivo.
            </p>
          </div>
        </div>

        {/* Global Pipeline Visual Flow */}
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block font-mono">
            Pipeline General del Ciclo de Vida IT
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block">Paso 1</span>
              <span className="font-bold text-white block">Alta en Stock</span>
              <p className="text-[10.5px] text-slate-400">Tipo, condición y número de serie del chasis.</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block">Paso 2</span>
              <span className="font-bold text-white block">Armado de Combo</span>
              <p className="text-[10.5px] text-slate-400">Reserva monitor, mouse y teclado; fija baseline.</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block">Paso 3</span>
              <span className="font-bold text-white block">Entrega y Asignación</span>
              <p className="text-[10.5px] text-slate-400">Entrega física al colaborador o sucursal.</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block">Paso 4</span>
              <span className="font-bold text-blue-400 block">CyberWatch C#</span>
              <p className="text-[10.5px] text-slate-400">El agente escanea hardware real y envía a cloud.</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block">Paso 5</span>
              <span className="font-bold text-amber-400 block">Conciliación IT</span>
              <p className="text-[10.5px] text-slate-400">Algoritmo pondera score y propone match en bandeja.</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block">Paso 6</span>
              <span className="font-bold text-emerald-400 block">Audit & Baseline</span>
              <p className="text-[10.5px] text-slate-400">Estado Coincide o gestión de discrepancia.</p>
            </div>

          </div>
        </div>
      </div>

      {/* Interactive User Journeys */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Casos de Uso y Escenarios de Tolerancia
            </h2>
            <p className="text-xs text-slate-500">
              Haz clic en cada escenario para ver la regla de negocio aplicada en el frontend.
            </p>
          </div>

          {/* Scenario Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedJourney('feliz')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedJourney === 'feliz' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Flujo Feliz
            </button>
            <button
              type="button"
              onClick={() => setSelectedJourney('ram')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedJourney === 'ram' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Tolerancia RAM
            </button>
            <button
              type="button"
              onClick={() => setSelectedJourney('monitor')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedJourney === 'monitor' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Monitor sin Serial
            </button>
            <button
              type="button"
              onClick={() => setSelectedJourney('retro')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedJourney === 'retro' ? 'bg-white text-purple-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4. Sin Stock Previo
            </button>
            <button
              type="button"
              onClick={() => setSelectedJourney('discrepancia')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedJourney === 'discrepancia' ? 'bg-white text-rose-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5. Discrepancia CPU
            </button>
          </div>
        </div>

        {/* Journey Details Panel */}
        <div className="p-5 rounded-xl border text-xs space-y-4">
          
          {selectedJourney === 'feliz' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Escenario 1: Flujo Feliz de Ensamble y Vinculación</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                El técnico de IT ingresa una PC en stock (tipo Desktop, nueva). Luego utiliza <strong>"Armar computadora"</strong> para asignarle un monitor Dell U2419H, un teclado y un mouse. Al confirmarse, el baseline queda fijado. Cuando la PC se entrega al usuario y arranca con CyberWatch C#, el agente reporta las especificaciones exactas. El sistema genera una sugerencia con score 95% ("Alta confianza"). Al presionar <strong>"Sí, vincular"</strong>, el estado pasa a <strong>COINCIDE</strong>.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-900 font-mono text-[11px]">
                Stock (PC-STOCK-042) + Baseline listo ➔ Agente reporta telemetría ➔ Bandeja muestra Score 95% ➔ IT confirma ➔ Estado: COINCIDE
              </div>
            </div>
          )}

          {selectedJourney === 'ram' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                <Server className="w-5 h-5 text-blue-600" />
                <span>Escenario 2: Tolerancia de Memoria RAM por Reserva del Sistema Operativo</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                En stock se cargaron módulos comerciales por <strong>16 GB nominales</strong>. Sin embargo, Windows 11 y la tarjeta gráfica integrada (iGPU Intel Iris/UHD) reservan entre 100MB y 300MB de hardware RAM, por lo que el agente C# lee <strong>15.8 GB útiles</strong>. El motor de conciliación aplica la regla de tolerancia:
              </p>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-900 space-y-1">
                <span className="font-bold block">Regla en UI: "Dentro de tolerancia OS"</span>
                <p className="text-[11.5px]">
                  No se marca como discrepancia ni baja el puntaje si la diferencia es inferior a 0.8 GB con respecto a la potencia de 2 más cercana (8, 16, 32 GB).
                </p>
              </div>
            </div>
          )}

          {selectedJourney === 'monitor' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <Monitor className="w-5 h-5 text-amber-600" />
                <span>Escenario 3: Monitor sin Serial en Telemetría (EDID Genérico)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Muchos monitores conectados por VGA o adaptadores HDMI genéricos no devuelven su número de serie por WMI/EDID, reportando <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">GENERIC_PNP_MONITOR</code>. El sistema realiza el match analizando la marca y modelo detectado en el nombre amigable de Windows:
              </p>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900 space-y-1">
                <span className="font-bold block">Copy exacto en UI:</span>
                <p className="font-semibold text-xs text-amber-800">
                  "Match por marca/modelo (serial no disponible en agente)"
                </p>
                <p className="text-[11.5px] text-amber-700">
                  Advierte al técnico que el número de serie físico de stock no pudo ser contrastado por limitaciones del firmware del monitor.
                </p>
              </div>
            </div>
          )}

          {selectedJourney === 'retro' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
                <Link2 className="w-5 h-5 text-purple-600" />
                <span>Escenario 4: Máquina Nueva sin Stock Previo (Vinculación Retroactiva)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Un técnico instala CyberWatch C# en una PC que se compró de urgencia o se reasignó sin pasar por la carga previa de stock. El agente registra el equipo con origen <strong>DETECTADA_POR_AGENTE</strong> y estado <strong>PENDIENTE</strong>. Desde la bandeja o el detalle, IT dispone del botón <strong>"Vincular a stock"</strong> para asociarla retroactivamente a un activo existente, adoptando el origen <strong>DETECTADA_VINCULADA_RETRO</strong>.
              </p>
            </div>
          )}

          {selectedJourney === 'discrepancia' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Escenario 5: Discrepancia de Hardware (Ej: Core i3 esperado vs Core i5 real)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Si el baseline esperaba un procesador Core i3-10100 y el agente detecta un Core i5-10400, el estado pasa a <strong>DISCREPANCIA</strong>. El módulo de auditoría de Fase 4 permite a los técnicos asentar un dictamen:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800">
                  <span className="font-bold block">✅ Autorizado</span>
                  <span className="text-[11px]">Upgrade legítimo aprobado por jefatura de soporte.</span>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-rose-800">
                  <span className="font-bold block">❌ No autorizado</span>
                  <span className="text-[11px]">Cambio indebido de piezas o retiro de componentes.</span>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
                  <span className="font-bold block">⚠ Falso positivo</span>
                  <span className="text-[11px]">Error transitorio de telemetría del driver de Windows.</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

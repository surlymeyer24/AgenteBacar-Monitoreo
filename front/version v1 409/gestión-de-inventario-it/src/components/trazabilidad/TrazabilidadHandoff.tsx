import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  Layers, 
  Database, 
  Server, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function TrazabilidadHandoff() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const API_ENDPOINTS = [
    {
      method: 'GET',
      path: 'http://localhost:8081/api/trazabilidad/conciliaciones',
      desc: 'Obtiene el listado de sugerencias de match pendientes, stock sin agente y detectadas sin validar con scores calculados.'
    },
    {
      method: 'POST',
      path: 'http://localhost:8081/api/trazabilidad/conciliaciones/:id/confirmar',
      desc: 'Confirma vinculación lado stock ↔ lado agente. Cambia estado a COINCIDE y fija el UUID del agente en el activo.'
    },
    {
      method: 'POST',
      path: 'http://localhost:8081/api/trazabilidad/conciliaciones/:id/rechazar',
      desc: 'Rechaza sugerencia de match. Mantiene activo de stock disponible y marca la terminal detectada como independiente.'
    },
    {
      method: 'POST',
      path: 'http://localhost:8081/api/trazabilidad/computadoras/:uuid/armar-combo',
      desc: 'Fija el baseline_esperado inmutable post-armado y descuenta monitor/teclado/mouse de la tabla de periféricos disponibles.'
    },
    {
      method: 'POST',
      path: 'http://localhost:8081/api/trazabilidad/computadoras/:uuid/vincular-stock',
      desc: 'Asocia retroactivamente una terminal detectada por CyberWatch C# a una PC creada en stock (DETECTADA_VINCULADA_RETRO).'
    },
    {
      method: 'POST',
      path: 'http://localhost:8081/api/trazabilidad/computadoras/:uuid/discrepancias',
      desc: 'Registra un dictamen técnico de auditoría (autorizado, no_autorizado o falso_positivo) con nota de IT.'
    }
  ];

  const SAMPLE_BASELINE_JSON = `{
  "cpu_modelo": "Intel Core i5-12400",
  "ram_total_gb": 16,
  "disco_resumen": "SSD NVMe 512GB Kingston",
  "perifericos": [
    {
      "tipo": "monitor",
      "id_stock": "PER-MON-001",
      "nombre": "Dell UltraSharp U2419H 24\\"",
      "fabricante": "Dell",
      "numero_serie": "CN-0ABC123-74261"
    },
    {
      "tipo": "teclado",
      "id_stock": "PER-KBD-001",
      "nombre": "Dell Multimedia Keyboard KB216",
      "fabricante": "Dell",
      "numero_serie": "CN-KB216-9901"
    },
    {
      "tipo": "mouse",
      "id_stock": "PER-MOU-001",
      "nombre": "Logitech Marathon M720",
      "fabricante": "Logitech",
      "numero_serie": "LT-M720-66412"
    }
  ],
  "armado_at": "2026-09-04T14:30:00Z",
  "armado_por": "mfernandez@bacarsa.com.ar"
}`;

  const SAMPLE_SUGERENCIA_JSON = `{
  "score": 78,
  "lado_agente": {
    "hostname": "ADMIN-JP-01",
    "cpu": "Intel Core i5-12400",
    "ram_gb": 15.8,
    "monitor": "Dell U2419H",
    "serial_monitor": "GENERIC_PNP_MONITOR",
    "anydesk_id": "194827110"
  },
  "lado_stock": {
    "hostname": "PC-STOCK-042",
    "tipo": "desktop",
    "condicion": "nueva",
    "combo": "Monitor Dell U2419H (ABC123), Teclado Dell KB216, Mouse Logitech M720"
  },
  "campos_coincidentes": [
    "CPU (Intel Core i5-12400)",
    "RAM (tolerancia OS: 15.8 GB vs 16 GB)",
    "Monitor por modelo (Dell U2419H)"
  ],
  "campos_diferentes": [],
  "nota_match": "Match por marca/modelo (serial no disponible en agente)"
}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
            <Code2 className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-wide uppercase font-sans">
            Notas de Handoff para Desarrolladores
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Especificación de contratos de API REST, componentes React reutilizables y reglas de cálculo para el backend C# y Node.js.
        </p>
      </div>

      {/* Reusable Components Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#9c1313]" />
          <span>Componentes Reutilizables Implementados</span>
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Componente</th>
                <th className="p-3">Ruta / Propósito</th>
                <th className="p-3">Fase</th>
                <th className="p-3">Reutilización Clave</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-3 font-mono font-bold text-slate-900">ConciliacionesBandeja</td>
                <td className="p-3 font-mono text-[11px] text-red-700">/conciliaciones</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Fase 2 (Prioridad)</span></td>
                <td className="p-3 text-slate-500">Bandeja de sugerencias con tabs, score badges y filtros.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-slate-900">MatchConfirmacionModal</td>
                <td className="p-3 font-mono text-[11px] text-red-700">/conciliaciones/:id</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Fase 2</span></td>
                <td className="p-3 text-slate-500">Drawer/Modal comparativo lado a lado con tolerancia RAM y aviso de monitor.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-slate-900">ArmarComputadoraModal</td>
                <td className="p-3 text-slate-600">Modal desde Detalle o Stock</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Fase 1b (Refinada)</span></td>
                <td className="p-3 text-slate-500">Ensamble de periféricos 1-a-1, advertencia irreversible y preview de baseline.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-slate-900">ComputadoraTrazableDetail</td>
                <td className="p-3 font-mono text-[11px] text-red-700">/computadoras/:uuid</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Fases 1b, 3 y 4</span></td>
                <td className="p-3 text-slate-500">Bloque baseline inmutable, Esperado vs Real y auditoría de discrepancias.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-slate-900">PerifericosStockTrazabilidad</td>
                <td className="p-3 font-mono text-[11px] text-red-700">/perifericos/stock</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Fase 1a</span></td>
                <td className="p-3 text-slate-500">Tab periféricos y tab computadoras en stock con disparador de combo.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* REST API Endpoints Specification */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-600" />
          <span>Especificación de Endpoints REST (Backend)</span>
        </h3>

        <div className="space-y-2 text-xs">
          {API_ENDPOINTS.map((ep, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                  ep.method === 'GET' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {ep.method}
                </span>
                <span className="font-mono text-slate-800 font-semibold">{ep.path}</span>
              </div>
              <p className="text-slate-600 text-[11.5px] pl-1">
                {ep.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* JSON Payloads Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        
        {/* Sample 1: Baseline Esperado */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-slate-200 space-y-2 font-mono">
          <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800 font-sans">
            <span className="text-[11px] font-bold text-emerald-400 uppercase">Schema: baseline_esperado (Read-only)</span>
            <button
              type="button"
              onClick={() => copyToClipboard('baseline', SAMPLE_BASELINE_JSON)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === 'baseline' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedKey === 'baseline' ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <pre className="text-[10.5px] overflow-x-auto text-slate-300 leading-relaxed">
            {SAMPLE_BASELINE_JSON}
          </pre>
        </div>

        {/* Sample 2: Sugerencia de Conciliación */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-slate-200 space-y-2 font-mono">
          <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800 font-sans">
            <span className="text-[11px] font-bold text-amber-400 uppercase">Schema: sugerencia_conciliacion (Fase 2)</span>
            <button
              type="button"
              onClick={() => copyToClipboard('sugerencia', SAMPLE_SUGERENCIA_JSON)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === 'sugerencia' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedKey === 'sugerencia' ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <pre className="text-[10.5px] overflow-x-auto text-slate-300 leading-relaxed">
            {SAMPLE_SUGERENCIA_JSON}
          </pre>
        </div>

      </div>

    </div>
  );
}

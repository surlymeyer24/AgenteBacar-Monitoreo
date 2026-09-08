import React, { useState } from 'react';
import { AgentComputer, Asset } from '../types';
import { 
  Printer, Monitor, Keyboard, Mouse, Video, Volume2, Mic, 
  Search, Plus, ShieldCheck, Tag, Info, Laptop, Cpu, CheckCircle, 
  AlertTriangle, ArrowRight, BarChart3, PieChart, Users, MapPin, Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import HardwareComplementList from './HardwareComplementList';

interface PerifericosDashboardProps {
  computers: AgentComputer[];
  assets: Asset[];
}

export default function PerifericosDashboard({ computers, assets }: PerifericosDashboardProps) {
  const [selectedSubCategory, setSelectedSubCategory] = useState<'all' | 'impresoras' | 'monitores' | 'teclados' | 'mouse' | 'webcams' | 'parlantes' | 'microfonos'>('all');

  // Compute stats across both agent telemetry and manual assets
  const getCounts = () => {
    let monitores = 0;
    let teclados = 0;
    let mouses = 0;
    let impresoras = 0;
    let webcams = 0;
    let audio = 0;

    // Count from manual assets
    assets.forEach(asset => {
      if (asset.type === 'Peripheral' || asset.type === 'Monitor') {
        const name = asset.name.toLowerCase();
        if (name.includes('monitor') || name.includes('pantalla')) monitores++;
        else if (name.includes('teclado')) teclados++;
        else if (name.includes('mouse') || name.includes('raton')) mouses++;
        else if (name.includes('impresora') || name.includes('ricoh') || name.includes('hp')) impresoras++;
        else if (name.includes('camara') || name.includes('webcam')) webcams++;
        else if (name.includes('parlante') || name.includes('auricular') || name.includes('headset')) audio++;
      }
    });

    // Count from computer telemetry (since computers have peripherals detected)
    computers.forEach(comp => {
      if (comp.perifericos) {
        if (comp.perifericos.impresoras) impresoras += comp.perifericos.impresoras.length;
        // Assume keyboards, mice, webcams, audio are detected per computer
        monitores += 1; // Each computer typically has 1 main monitor detected
        teclados += 1;  
        mouses += 1;
      }
    });

    return { monitores, teclados, mouses, impresoras, webcams, audio };
  };

  const counts = getCounts();

  // Progress of stock vs minimum thresholds (visualizing stock safety levels)
  const stockSafetyList = [
    { name: 'Monitores Led 24"', current: counts.monitores, min: 10, category: 'monitores' },
    { name: 'Teclados Mecánicos USB', current: counts.teclados, min: 12, category: 'teclados' },
    { name: 'Mouses Ópticos USB', current: counts.mouses, min: 15, category: 'mouse' },
    { name: 'Toner RICOH 430 Black', current: 18, min: 5, category: 'impresoras' },
    { name: 'Cámaras Web HD 1080p', current: counts.webcams, min: 8, category: 'webcams' },
    { name: 'Auriculares con Micrófono', current: counts.audio, min: 14, category: 'parlantes' }
  ];

  if (selectedSubCategory !== 'all') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedSubCategory('all')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
          >
            ← Volver al Dashboard de Periféricos
          </button>
          <span className="text-xs font-mono font-bold text-slate-400 capitalize">MÓDULO: {selectedSubCategory}</span>
        </div>
        <HardwareComplementList category={selectedSubCategory} computers={computers} assets={assets} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Printer className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard de Control de Periféricos</h1>
          </div>
          <p className="text-slate-500 text-sm">Administración central de monitores, impresoras de red y accesorios complementarios detectados por agente y cargados manualmente.</p>
        </div>
      </div>

      {/* Grid KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { name: 'Monitores', count: counts.monitores, icon: <Monitor className="w-5 h-5" />, cat: 'monitores' },
          { name: 'Teclados', count: counts.teclados, icon: <Keyboard className="w-5 h-5" />, cat: 'teclados' },
          { name: 'Mouses', count: counts.mouses, icon: <Mouse className="w-5 h-5" />, cat: 'mouse' },
          { name: 'Impresoras', count: counts.impresoras, icon: <Printer className="w-5 h-5" />, cat: 'impresoras' },
          { name: 'Webcams', count: counts.webcams, icon: <Video className="w-5 h-5" />, cat: 'webcams' },
          { name: 'Audio/Mic', count: counts.audio, icon: <Volume2 className="w-5 h-5" />, cat: 'parlantes' }
        ].map(k => (
          <div 
            key={k.name}
            onClick={() => setSelectedSubCategory(k.cat as any)}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">{k.name}</span>
              <span className="text-slate-400 group-hover:text-indigo-600 transition-colors">{k.icon}</span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-950">{k.count}</span>
              <span className="text-[10px] text-slate-400">unids</span>
            </div>
            <div className="text-[10px] text-indigo-600 font-bold group-hover:underline flex items-center gap-0.5 mt-2">
              <span>Ver listado</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        ))}
      </div>

      {/* Distributive Graphics & Stock Safety Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distributive Map by Areas - Card 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs lg:col-span-2 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Distribución de Periféricos por Área</h3>
              <p className="text-xs text-slate-400">Asignación física según departamentos operativos.</p>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4">
            {[
              { area: 'Tecnología y Sistemas', pct: 42, count: 18, color: 'bg-[#0c66e4]' },
              { area: 'Administración y Finanzas', pct: 28, count: 12, color: 'bg-[#00a3bf]' },
              { area: 'Recursos Humanos / Capital Humano', pct: 15, count: 6, color: 'bg-[#6554c0]' },
              { area: 'Ventas y Atención Comercial', pct: 10, count: 4, color: 'bg-[#ff5630]' },
              { area: 'Almacén Central (Stock de Respaldo)', pct: 5, count: 2, color: 'bg-[#36b37e]' }
            ].map(item => (
              <div key={item.area} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block bg-slate-300" style={{ backgroundColor: item.color }} />
                    {item.area}
                  </span>
                  <span className="font-mono text-slate-500">{item.count} unids ({item.pct}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Safety Progress - Card 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Niveles de Stock Crítico</h3>
              <p className="text-xs text-slate-400">Periféricos disponibles vs. límite mínimo de seguridad.</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {stockSafetyList.map(st => {
              const isBelowMin = st.current < st.min;
              const ratio = Math.min(100, (st.current / st.min) * 100);

              return (
                <div key={st.name} className="p-3 border border-slate-100 rounded-xl space-y-2 bg-slate-50/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{st.name}</span>
                    {isBelowMin ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                        <AlertTriangle className="w-3 h-3" /> Crítico
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle className="w-3 h-3" /> Seguro
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-slate-150 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isBelowMin ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold font-mono">
                      <span>Disponible: {st.current}</span>
                      <span>Mínimo: {st.min}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

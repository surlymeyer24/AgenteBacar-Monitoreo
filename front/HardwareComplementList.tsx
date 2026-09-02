import React, { useState } from 'react';
import { AgentComputer, Asset } from '../types';
import { 
  Printer, Monitor, Keyboard, Mouse, Video, Volume2, Mic, 
  Search, Plus, ShieldCheck, Tag, Info, Laptop, Cpu, CheckCircle
} from 'lucide-react';

interface ExtractedItem {
  id: string;
  name: string;
  details: string;
  nodeHost: string;
  type: 'telemetry' | 'physical';
  status?: string;
  nodeHosts?: Array<{ hostname: string; status: 'ONLINE' | 'OFFLINE'; predeterminada: boolean }>;
}

interface HardwareComplementListProps {
  category: 'impresoras' | 'monitores' | 'teclados' | 'mouse' | 'webcams' | 'parlantes' | 'microfonos';
  computers: AgentComputer[];
  assets: Asset[];
}

export default function HardwareComplementList({ category, computers, assets }: HardwareComplementListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Extract from telemetry automatically
  const getExtractedItems = (): ExtractedItem[] => {
    // If category is printers, group them to show which PCs are using them
    if (category === 'impresoras') {
      const printerMap: Record<string, {
        id: string;
        name: string;
        details: string;
        nodeHost: string;
        type: 'telemetry' | 'physical';
        status?: string;
        nodeHosts: Array<{ hostname: string; status: 'ONLINE' | 'OFFLINE'; predeterminada: boolean }>;
      }> = {};

      computers.forEach(comp => {
        if (comp.perifericos?.impresoras) {
          comp.perifericos.impresoras.forEach((pr, idx) => {
            const normalizedName = pr.nombre.trim();
            if (!printerMap[normalizedName]) {
              printerMap[normalizedName] = {
                id: `PRN-EXT-${normalizedName.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}-${idx}`,
                name: pr.nombre,
                details: `Driver: ${pr.driver} | Puerto: ${pr.puerto}`,
                nodeHost: '',
                type: 'telemetry',
                status: 'OFFLINE',
                nodeHosts: []
              };
            }
            const isAlreadyAdded = printerMap[normalizedName].nodeHosts.some(h => h.hostname === comp.hostname);
            if (!isAlreadyAdded) {
              printerMap[normalizedName].nodeHosts.push({
                hostname: comp.hostname,
                status: comp.estado_conexion,
                predeterminada: !!pr.predeterminada
              });
            }
            if (comp.estado_conexion === 'ONLINE') {
              printerMap[normalizedName].status = 'ONLINE';
            }
          });
        }
      });

      // Also grab physical assets that contain "impresora" in the name
      assets.forEach(asset => {
        if (asset.type === 'Peripheral' && asset.name.toLowerCase().includes('impresora')) {
          const normalizedName = asset.name.trim();
          if (!printerMap[normalizedName]) {
            printerMap[normalizedName] = {
              id: asset.id,
              name: asset.name,
              details: `Marca: ${asset.manufacturer} | Modelo: ${asset.model} | Serie: ${asset.serialNumber}`,
              nodeHost: asset.assignedToUserId ? `Asignado (ID: ${asset.assignedToUserId})` : 'En Almacén',
              type: 'physical',
              status: asset.status === 'Available' || asset.status === 'Assigned' ? 'ONLINE' : 'OFFLINE',
              nodeHosts: []
            };
          }
        }
      });

      // Map dynamic representation of how many PCs are using this printer
      return Object.values(printerMap).map(pr => {
        const count = pr.nodeHosts.length;
        return {
          ...pr,
          nodeHost: count > 0 
            ? `${count} PC${count > 1 ? 's' : ''} utilizando este recurso`
            : pr.nodeHost || 'Sin configurar en terminales'
        };
      });
    }

    const list: ExtractedItem[] = [];

    // Telemetry extraction
    computers.forEach(comp => {
      if (category === 'monitores' && comp.perifericos?.monitores) {
        comp.perifericos.monitores.forEach((mon, idx) => {
          list.push({
            id: `MON-EXT-${comp.hostname}-${idx}`,
            name: mon.nombre,
            details: `Resolución: ${mon.resolucion} | Tamaño: ${mon.pulgadas || 'N/D'} pulgadas`,
            nodeHost: comp.hostname,
            type: 'telemetry',
            status: comp.estado_conexion === 'ONLINE' ? 'ONLINE' : 'OFFLINE'
          });
        });
      }

      if (category === 'webcams' && comp.perifericos?.dispositivos_usb) {
        comp.perifericos.dispositivos_usb
          .filter(u => u.categoria === 'Camera' || u.nombre.toLowerCase().includes('webcam') || u.nombre.toLowerCase().includes('cam'))
          .forEach((usb, idx) => {
            list.push({
              id: `CAM-EXT-${comp.hostname}-${idx}`,
              name: usb.nombre,
              details: `Fabricante: ${usb.fabricante || 'Generic USB'}`,
              nodeHost: comp.hostname,
              type: 'telemetry',
              status: comp.estado_conexion === 'ONLINE' ? 'ONLINE' : 'OFFLINE'
            });
          });
      }

      if (category === 'parlantes' && comp.perifericos?.dispositivos_usb) {
        comp.perifericos.dispositivos_usb
          .filter(u => u.categoria === 'Audio' || u.nombre.toLowerCase().includes('audio') || u.nombre.toLowerCase().includes('parlante') || u.nombre.toLowerCase().includes('headset'))
          .forEach((usb, idx) => {
            list.push({
              id: `AUD-EXT-${comp.hostname}-${idx}`,
              name: usb.nombre,
              details: `Fabricante: ${usb.fabricante || 'Generic USB Audio'}`,
              nodeHost: comp.hostname,
              type: 'telemetry',
              status: comp.estado_conexion === 'ONLINE' ? 'ONLINE' : 'OFFLINE'
            });
          });
      }
    });

    // Asset db extraction
    assets.forEach(asset => {
      let match = false;
      if (category === 'monitores' && asset.type === 'Monitor') match = true;
      if (category === 'teclados' && asset.name.toLowerCase().includes('teclado')) match = true;
      if (category === 'mouse' && asset.name.toLowerCase().includes('mouse')) match = true;
      if (category === 'webcams' && asset.name.toLowerCase().includes('webcam')) match = true;
      if (category === 'parlantes' && asset.name.toLowerCase().includes('parlante')) match = true;
      if (category === 'microfonos' && asset.name.toLowerCase().includes('micrófono')) match = true;

      if (match) {
        list.push({
          id: asset.id,
          name: asset.name,
          details: `Marca: ${asset.manufacturer} | Modelo: ${asset.model} | Serie: ${asset.serialNumber}`,
          nodeHost: asset.assignedToUserId ? `Asignado (ID: ${asset.assignedToUserId})` : 'En Almacén',
          type: 'physical',
          status: asset.status
        });
      }
    });

    // Apply mock default physical equipment if lists are dry in specific components
    if (list.length === 0) {
      if (category === 'teclados') {
        return [
          { id: 'KEY-001', name: 'Teclado Mecánico Redragon KUMARA K552', details: 'USB Cableado | Switch Red | Español', nodeHost: 'Soporte e IT (Oficina)', type: 'physical', status: 'Available' },
          { id: 'KEY-002', name: 'Dell QuietKey KB216 Keyboard', details: 'Membrana Standard USB OEM', nodeHost: 'Nómina (Ventas)', type: 'physical', status: 'Assigned' }
        ];
      }
      if (category === 'mouse') {
        return [
          { id: 'MSE-001', name: 'Mouse Inalámbrico Logitech MX Master 3S', details: 'Bluetooth & USB Receiver | Ergonómico', nodeHost: 'Daniel Ortega', type: 'physical', status: 'Assigned' },
          { id: 'MSE-002', name: 'Logitech Pebble M350', details: 'Silent Click | Slim', nodeHost: 'Almacén', type: 'physical', status: 'Available' }
        ];
      }
      if (category === 'microfonos') {
        return [
          { id: 'MIC-001', name: 'Micrófono USB Blue Yeti Nano', details: 'Patrón Cardioide / Omnidireccional | Podcasting', nodeHost: 'Salas de Reuniones A', type: 'physical', status: 'Available' }
        ];
      }
    }

    return list;
  };

  const getTitleAndDescription = () => {
    switch (category) {
      case 'impresoras':
        return {
          title: 'Administración de Impresoras',
          description: 'Gestión de equipos Ricoh, Lexmark, térmicas y plotters enlazadas a los servidores y computadoras corporativas de red.',
          icon: <Printer className="w-5 h-5 text-emerald-600" />
        };
      case 'monitores':
        return {
          title: 'Monitor de Pantallas y Monitores',
          description: 'Panel de monitores locales Dell, LG, Samsung identificados vía GPU de las computadoras del personal.',
          icon: <Monitor className="w-5 h-5 text-cyan-600" />
        };
      case 'teclados':
        return {
          title: 'Inventario de Teclados',
          description: 'Control de teclados mecánicos, ergonómicos e inalámbricos distribuidos a colaboradores.',
          icon: <Keyboard className="w-5 h-5 text-indigo-600" />
        };
      case 'mouse':
        return {
          title: 'Inventario de Mouse / Señaladores',
          description: 'Control y re-surtido de ratones o mouse ópticos inalámbricos y cargadores.',
          icon: <Mouse className="w-5 h-5 text-orange-600" />
        };
      case 'webcams':
        return {
          title: 'Cámaras Web (Webcams)',
          description: 'Inventario de webcams HD Logitech y cámaras embebidas identificadas por el agente Bacar.',
          icon: <Video className="w-5 h-5 text-amber-600" />
        };
      case 'parlantes':
        return {
          title: 'Parlantes y Auriculares',
          description: 'Equipos de audio, diademas call-center, altavoces corporativos Jabra y bocinas USB.',
          icon: <Volume2 className="w-5 h-5 text-purple-600" />
        };
      case 'microfonos':
        return {
          title: 'Sistemas de Micrófonos',
          description: 'Consolas de micrófonos de sala de juntas y micrófonos USB integrados de alta ganancia.',
          icon: <Mic className="w-5 h-5 text-rose-600" />
        };
    }
  };

  const { title, description, icon } = getTitleAndDescription();
  const items = getExtractedItems().filter(i => {
    const term = searchTerm.toLowerCase();
    const inHosts = i.nodeHosts?.some((h: any) => h.hostname.toLowerCase().includes(term));
    return (
      i.name.toLowerCase().includes(term) || 
      i.details.toLowerCase().includes(term) ||
      i.nodeHost.toLowerCase().includes(term) ||
      !!inHosts
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-slate-900 rounded-lg text-white">
            {icon}
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder={`Buscar por modelo, marca o computadora asociada...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-700"
          />
        </div>
        
        <div className="text-slate-500 text-xs font-semibold">
          Total de equipos: <span className="text-slate-900 font-bold">{items.length}</span>
        </div>
      </div>

      {/* Grid List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-widest">
                <th className="py-3 px-4">ID EQUIPO</th>
                <th className="py-3 px-4">DESCRIPCIÓN DE PERIFÉRICO</th>
                <th className="py-3 px-4">ESPECIFICACIONES / DETALLES</th>
                <th className="py-3 px-4">SITUACIÓN EN RED / ASOCIACIÓN</th>
                <th className="py-3 px-4 text-center">TIPO</th>
                <th className="py-3 px-4 text-center">ESTADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{it.id.substring(0, 15)}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span>{it.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{it.details}</td>
                  <td className="py-3.5 px-4">
                    {category === 'impresoras' && it.nodeHosts && it.nodeHosts.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                          PCs Vinculadas ({it.nodeHosts.length}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {it.nodeHosts.map((h, hIdx) => (
                            <span 
                              key={hIdx} 
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black border transition-all ${
                                h.status === 'ONLINE' 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}
                              title={`${h.hostname} - Estado: ${h.status} ${h.predeterminada ? '(Predeterminada)' : ''}`}
                            >
                              <Laptop className={`w-3 h-3 ${h.status === 'ONLINE' ? 'text-emerald-500' : 'text-slate-400'}`} />
                              <span>{h.hostname}</span>
                              {h.predeterminada && (
                                <span className="text-[8px] bg-indigo-600 text-white font-extrabold px-1 rounded transform scale-90">
                                  PRED
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Laptop className="w-3.5 h-3.5 text-slate-400" />
                        <span>{it.nodeHost}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${it.type === 'telemetry' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                      {it.type === 'telemetry' ? 'Autodetectado' : 'Físico Cargado'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${it.status === 'ONLINE' || it.status === 'Available' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      ● {it.status || 'Offline'}
                    </span>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    Sin equipos asociados o detectados por el Agente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

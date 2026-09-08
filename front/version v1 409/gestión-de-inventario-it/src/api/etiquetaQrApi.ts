import { INITIAL_AGENT_COMPUTERS, INITIAL_ASSETS } from '../mockData';
import { AgentComputer, Asset } from '../types';

export interface EtiquetaQrListItem {
  uuid: string;
  hostname: string;
  usuarioActual: string;
  ubicacion: string;
  tipoEquipo: string;
  cantidadMonitores: number;
  cantidadPerifericos: number;
}

export interface MonitorItem {
  tipo: string;
  nombre: string;
  detalle: string;
  numeroSerie?: string;
}

export interface PerifericoItem {
  tipo: string;
  nombre: string;
  detalle: string;
  numeroSerie?: string;
}

export interface EtiquetaQrDetalle {
  uuid: string;
  hostname: string;
  usuarioActual: string;
  ubicacion: string;
  tipoEquipo: string;
  responsableInventario?: string;
  monitores: MonitorItem[];
  perifericos: PerifericoItem[];
}

/**
 * Filtro de periféricos: solo lo que se desenchufa y viaja con la PC
 * INCLUYE: Teclados, Ratones / Mouse, Parlantes / Audio de salida, Hubs / USB relevantes, depósito asociados.
 * EXCLUYE: Cámaras (webcams), micrófonos, impresoras, Controlador HID, Media.
 */
function esPerifericoDeMudanzaValido(nombre: string, categoria?: string): boolean {
  const n = (nombre || '').toLowerCase();
  const c = (categoria || '').toLowerCase();

  // Exclusiones explícitas según regla de negocio
  if (
    n.includes('cam') ||
    n.includes('cámara') ||
    n.includes('camara') ||
    n.includes('webcam') ||
    c.includes('camera') ||
    c.includes('camara')
  ) {
    return false;
  }
  if (
    n.includes('mic') ||
    n.includes('micrófono') ||
    n.includes('microfono') ||
    c.includes('mic') ||
    c.includes('microfono')
  ) {
    return false;
  }
  if (
    n.includes('print') ||
    n.includes('impresora') ||
    n.includes('laser') ||
    n.includes('ricoh') ||
    n.includes('pdf') ||
    c.includes('printer')
  ) {
    return false;
  }
  if (
    n.includes('controlador hid') ||
    n.includes('hid compliant') ||
    n.includes('media player') ||
    n.includes('dispositivo compuesto')
  ) {
    return false;
  }

  // Inclusiones válidas
  if (
    n.includes('teclado') ||
    n.includes('keyboard') ||
    n.includes('mouse') ||
    n.includes('ratón') ||
    n.includes('raton') ||
    n.includes('parlante') ||
    n.includes('speaker') ||
    n.includes('headset') ||
    n.includes('audio') ||
    n.includes('hub') ||
    n.includes('adaptador') ||
    c.includes('audio') ||
    c.includes('input') ||
    c.includes('peripheral')
  ) {
    return true;
  }

  // Por defecto si es un USB relevante que no sea excluido
  return true;
}

function categorizarTipoPeriferico(nombre: string, categoria?: string): string {
  const n = (nombre || '').toLowerCase();
  const c = (categoria || '').toLowerCase();

  if (n.includes('teclado') || n.includes('keyboard')) return 'Teclado';
  if (n.includes('mouse') || n.includes('ratón') || n.includes('raton')) return 'Mouse';
  if (n.includes('parlante') || n.includes('speaker') || n.includes('audio') || c.includes('audio')) {
    return 'Parlante / Audio';
  }
  if (n.includes('depósito') || n.includes('deposito')) return 'Depósito';
  return 'USB / Periférico';
}

function obtenerDatosComputadoras(): { computers: AgentComputer[]; assets: Asset[] } {
  // Intentar leer datos de almacenamiento local sincronizado o usar los defaults
  const computers = INITIAL_AGENT_COMPUTERS;
  const assets = INITIAL_ASSETS;
  return { computers, assets };
}

/**
 * Endpoint GET /api/etiquetas-qr
 */
export async function fetchEtiquetasQr(): Promise<EtiquetaQrListItem[]> {
  const { computers, assets } = obtenerDatosComputadoras();

  const lista: EtiquetaQrListItem[] = computers.map(comp => {
    // Tipo de equipo
    const esNotebook =
      comp.procesador?.toLowerCase().includes('laptop') ||
      comp.hostname?.toLowerCase().includes('lap') ||
      comp.hostname?.toLowerCase().includes('nb') ||
      comp.hostname?.toLowerCase().includes('note');
    const tipoEquipo = esNotebook ? 'Notebook' : 'PC de Escritorio';

    // Monitores
    const monitores = comp.perifericos?.monitores || [];
    const cantidadMonitores = monitores.length;

    // Periféricos de mudanza
    const usbList = (comp.perifericos?.dispositivos_usb || []).filter(u =>
      esPerifericoDeMudanzaValido(u.nombre, u.categoria)
    );

    // Periféricos asociados desde assets si aplica
    const assetsAsociados = assets.filter(
      a => a.type === 'Peripheral' && a.location === comp.ubicacion
    );

    const cantidadPerifericos = usbList.length + assetsAsociados.length;

    return {
      uuid: comp.uuid,
      hostname: comp.hostname,
      usuarioActual: comp.responsable_inventario || 'SYSTEM',
      ubicacion: comp.ubicacion || 'SISTEMAS',
      tipoEquipo,
      cantidadMonitores,
      cantidadPerifericos,
    };
  });

  return lista;
}

/**
 * Endpoint GET /api/etiquetas-qr/{uuid}
 */
export async function fetchEtiquetaQr(uuid: string): Promise<EtiquetaQrDetalle | null> {
  const { computers, assets } = obtenerDatosComputadoras();
  const comp = computers.find(c => c.uuid.toLowerCase() === uuid.toLowerCase());
  if (!comp) return null;

  const esNotebook =
    comp.procesador?.toLowerCase().includes('laptop') ||
    comp.hostname?.toLowerCase().includes('lap') ||
    comp.hostname?.toLowerCase().includes('nb') ||
    comp.hostname?.toLowerCase().includes('note');
  const tipoEquipo = esNotebook ? 'Notebook' : 'PC de Escritorio';

  // Mapear monitores (pulgadas, resolución, S/N)
  const monitores: MonitorItem[] = (comp.perifericos?.monitores || []).map((m, idx) => {
    const detalleParts: string[] = [];
    if (m.pulgadas) detalleParts.push(`${m.pulgadas}"`);
    if (m.resolucion) detalleParts.push(m.resolucion);
    
    // Buscar si hay un Asset de tipo Monitor que coincida
    const assetMon = assets.find(
      a => a.type === 'Monitor' && (a.location === comp.ubicacion || a.name.includes(m.nombre))
    );

    return {
      tipo: 'Monitor',
      nombre: m.nombre || `Monitor ${idx + 1}`,
      detalle: detalleParts.join(' · ') || 'Monitor estándar',
      numeroSerie: assetMon?.serialNumber || undefined,
    };
  });

  // Mapear periféricos válidos de mudanza
  const perifericos: PerifericoItem[] = [];

  // USBs de la PC
  for (const u of comp.perifericos?.dispositivos_usb || []) {
    if (!esPerifericoDeMudanzaValido(u.nombre, u.categoria)) continue;
    const tipo = categorizarTipoPeriferico(u.nombre, u.categoria);
    const detalle = u.fabricante ? `Fabricante: ${u.fabricante}` : 'Conexión USB';
    perifericos.push({
      tipo,
      nombre: u.nombre,
      detalle,
    });
  }

  // Agregar periféricos de depósito asociados si la PC está en esa ubicación o si hay asignación
  const perifsDeposito = assets.filter(
    a => a.type === 'Peripheral' && a.location === comp.ubicacion
  );
  for (const p of perifsDeposito) {
    perifericos.push({
      tipo: `${categorizarTipoPeriferico(p.name)} (depósito)`,
      nombre: p.name,
      detalle: `Modelo: ${p.model || 'N/A'}${p.serialNumber ? ` · S/N: ${p.serialNumber}` : ''}`,
      numeroSerie: p.serialNumber,
    });
  }

  return {
    uuid: comp.uuid,
    hostname: comp.hostname,
    usuarioActual: comp.responsable_inventario || 'SYSTEM',
    ubicacion: comp.ubicacion || 'SISTEMAS',
    tipoEquipo,
    responsableInventario: comp.responsable_inventario || 'No asignado',
    monitores,
    perifericos,
  };
}

/**
 * Endpoint GET /api/etiquetas-qr/por-hostname/{hostname}
 */
export async function fetchEtiquetaQrPorHostname(hostname: string): Promise<EtiquetaQrDetalle | null> {
  const { computers } = obtenerDatosComputadoras();
  const comp = computers.find(c => c.hostname.toLowerCase() === hostname.toLowerCase());
  if (!comp) return null;
  return fetchEtiquetaQr(comp.uuid);
}

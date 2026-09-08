export type AssetType = 'Laptop' | 'Monitor' | 'Mobile' | 'Peripheral' | 'Server' | 'Network';
export type AssetStatus = 'Available' | 'Assigned' | 'In Repair' | 'Retired';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  serialNumber: string;
  status: AssetStatus;
  model: string;
  manufacturer: string;
  purchaseDate: string;
  cost: number;
  department: string;
  location: string;
  assignedToUserId?: string;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  avatarUrl?: string;
  location: string;
}

export interface Assignment {
  id: string;
  assetId: string;
  userId: string;
  assignedDate: string;
  returnedDate?: string;
  conditionOnAssign: string;
  conditionOnReturn?: string;
  status: 'Active' | 'Completed';
  notes?: string;
}

export interface Consumable {
  id: string;
  name: string;
  category: 'License' | 'Peripheral' | 'Accessory' | 'Component';
  stock: number;
  minStock: number;
  unitPrice: number;
  location: string;
  availableStock?: number;
  assignedStock?: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'Create' | 'Assign' | 'Return' | 'Stock' | 'Status' | 'Delete';
  user: string;
  description: string;
  details?: string;
}

export interface RamModulo {
  slot: string; // ej: "Slot 1 (Canal A / DIMM 1)"
  capacidad_gb: number; // ej: 8, 16, 4
  tipo: string; // ej: "DDR4", "DDR5", "DDR3"
  velocidad_mhz: number; // ej: 3200, 2666, 4800
  fabricante: string; // ej: "Kingston", "Samsung", "Crucial", "Corsair", "SK Hynix"
  numero_serie?: string;
  part_number?: string;
  factor_forma?: string; // "DIMM", "SO-DIMM"
  voltaje?: string; // "1.20V", "1.35V"
}

export interface RamDetalles {
  total_gb: number;
  en_uso_gb?: number;
  libre_gb?: number;
  porcentaje_uso?: number;
  tipo_memoria?: string; // ej: "DDR4 SDRAM"
  frecuencia_mhz?: number; // ej: 3200
  factor_forma?: string; // ej: "DIMM (Desktop)" o "SO-DIMM (Laptop)"
  canales?: string; // ej: "Dual-Channel" o "Single-Channel"
  slots_totales: number; // ej: 2 o 4
  slots_ocupados: number; // ej: 1 o 2
  max_capacidad_gb?: number; // ej: 32
  modulos: RamModulo[];
}

export interface ProcesadorDetallado {
  fabricante: string; // ej: "Intel", "AMD"
  frecuencia_max_mhz: number; // ej: 3601
  gama: string; // ej: "i5", "i7", "Ryzen 5"
  generacion: number | string; // ej: 3
  modelo: string; // ej: "3470"
  nombre_completo: string; // ej: "Intel(R) Core(TM) i5-3470 CPU @ 3.20GHz"
  nucleos_fisicos: number; // ej: 4
  nucleos_logicos: number; // ej: 4
}

export interface RamPlaca {
  canal_modo: string; // ej: "dual", "single"
  max_capacidad_gb: number; // ej: 32
  slots_ocupados: number; // ej: 2
  slots_totales: number; // ej: 2
}

export interface AgentComputer {
  uuid: string;
  hostname: string;
  sistema_operativo: string;
  anydesk_id: string;
  estado_conexion: 'ONLINE' | 'OFFLINE';
  ubicacion?: string;
  ram_uso_porcentaje: number;
  ram_total_gb: number;
  ram_placa?: RamPlaca;
  ram_detalles?: RamDetalles;
  cpu_uso_porcentaje: number;
  procesador: string;
  procesador_detallado?: ProcesadorDetallado;
  ip_publica: string;
  discos: Array<{
    punto_montaje: string;
    total_gb: number;
    libre_gb: number;
    tipo_disco: string;
    porcentaje_usado: number;
    libre_porcentaje?: number;
  }>;
  perifericos?: {
    impresoras?: Array<{
      nombre: string;
      driver: string;
      predeterminada?: boolean;
      puerto: string;
      tipo_impresora?: string;
    }>;
    monitores?: Array<{
      nombre: string;
      resolucion: string;
      pulgadas?: number;
    }>;
    dispositivos_usb?: Array<{
      nombre: string;
      categoria?: string;
      fabricante?: string;
    }>;
  };
  software_critico?: {
    antivirus: Array<{
      nombre: string;
      habilitado: boolean;
      ultima_act_firmas: string;
      firmas_desactualizadas: boolean;
    }>;
    alertas_seguridad?: string[];
  };
  windows_updates?: {
    total_pendientes: number;
    criticos_pendientes: number;
  };
  ultima_sincronizacion: string;
  errores_recientes?: Array<{
    fuente: string;
    mensaje: string;
    tipo: string;
    fecha: string;
  }>;
  // New detail fields for combined Hardware/Software view integration
  responsable_inventario?: string;
  estado_it?: string;
  historial_estados?: Array<{
    fecha: string;
    autor: string;
    estado_anterior: string;
    estado_nuevo: string;
    motivo: string;
  }>;
  os_detalles?: {
    edicion: string;
    version_mostrada: string;
    build: string;
    ubr: string;
    build_lab: string;
  };
  programas_instalados?: Array<{
    id: string;
    nombre: string;
    version: string;
    editor: string;
    arquitectura: string;
    fecha_instalacion: string;
  }>;
}

export interface CatalogoItem {
  id: string;
  orden: number;
  codigo: string;
  etiqueta: string;
  icono?: string;
  estado: 'activo' | 'inactivo';
  descripcion?: string;
  color?: string;
  esSistema?: boolean;
}

export type CatalogoTipo = 'tipos_stock' | 'ubicaciones' | 'areas' | 'marcas' | 'estados_equipos';

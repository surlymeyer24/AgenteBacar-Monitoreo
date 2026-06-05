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

export interface AgentComputer {
  uuid: string;
  hostname: string;
  sistema_operativo: string;
  anydesk_id: string;
  estado_conexion: 'ONLINE' | 'OFFLINE';
  ubicacion?: string;
  ram_uso_porcentaje: number;
  ram_total_gb: number;
  cpu_uso_porcentaje: number;
  procesador: string;
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

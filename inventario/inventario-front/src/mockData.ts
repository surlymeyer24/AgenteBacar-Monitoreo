import { Asset, User, Assignment, Consumable, ActivityLog, AgentComputer } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Sofia Rodríguez',
    email: 'sofia.rodriguez@techcorp.com',
    department: 'Ingeniería',
    role: 'Principal Frontend Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    location: 'Sede Principal - CDMX'
  },
  {
    id: 'user-2',
    name: 'Alejandro Gómez',
    email: 'alejandro.gomez@techcorp.com',
    department: 'Diseño UX/UI',
    role: 'Lead UX Designer',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    location: 'Trabajo Remoto - Guadalajara'
  },
  {
    id: 'user-3',
    name: 'Camila Silva',
    email: 'camila.silva@techcorp.com',
    department: 'Recursos Humanos',
    role: 'HR People Manager',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    location: 'Sede Principal - CDMX'
  },
  {
    id: 'user-4',
    name: 'Mateo Fernández',
    email: 'mateo.fernandez@techcorp.com',
    department: 'Ventas & Marketing',
    role: 'Growth Marketing Director',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    location: 'Sede Norte - Monterrey'
  },
  {
    id: 'user-5',
    name: 'Valeria Mendoza',
    email: 'valeria.mendoza@techcorp.com',
    department: 'Finanzas',
    role: 'Senior Financial Analyst',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    location: 'Sede Principal - CDMX'
  },
  {
    id: 'user-6',
    name: 'Daniel Ortega',
    email: 'daniel.ortega@techcorp.com',
    department: 'Soporte e IT',
    role: 'IT Security Administrator',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    location: 'Sede Principal - CDMX'
  }
];

export const INITIAL_ASSETS: Asset[] = [
  {
    id: 'AST-001',
    name: 'MacBook Pro 16"',
    type: 'Laptop',
    serialNumber: 'FVFG98R8Q05D',
    status: 'Assigned',
    model: 'M3 Pro, 36GB RAM, 1TB SSD',
    manufacturer: 'Apple',
    purchaseDate: '2025-01-15',
    cost: 3200,
    department: 'Ingeniería',
    location: 'Sede Principal - CDMX',
    assignedToUserId: 'user-1',
    notes: 'Entregado con funda protectora y cargador de 140W.'
  },
  {
    id: 'AST-002',
    name: 'ThinkPad X1 Carbon Gen 11',
    type: 'Laptop',
    serialNumber: 'L3-N8X92-J7',
    status: 'Assigned',
    model: 'Core i7, 32GB RAM, 1TB SSD',
    manufacturer: 'Lenovo',
    purchaseDate: '2024-11-20',
    cost: 2100,
    department: 'Finanzas',
    location: 'Sede Principal - CDMX',
    assignedToUserId: 'user-5',
    notes: 'Configurada con VPN de seguridad financiera.'
  },
  {
    id: 'AST-003',
    name: 'Monitor UltraSharp 27" USB-C Hub',
    type: 'Monitor',
    serialNumber: 'CN-0D54XF-74443',
    status: 'Available',
    model: 'U2723QE 4K IPS',
    manufacturer: 'Dell',
    purchaseDate: '2024-06-10',
    cost: 650,
    department: 'Soporte e IT',
    location: 'Almacén Central',
    notes: 'Incluye cable USB-C y soporte ergonómico.'
  },
  {
    id: 'AST-004',
    name: 'LG Curved UltraWide 34"',
    type: 'Monitor',
    serialNumber: '403LGMK9X822',
    status: 'Assigned',
    model: '34WN80C-B QHD',
    manufacturer: 'LG',
    purchaseDate: '2024-09-05',
    cost: 850,
    department: 'Diseño UX/UI',
    location: 'Trabajo Remoto - Guadalajara',
    assignedToUserId: 'user-2',
    notes: 'Despachado a domicilio mediante DHL.'
  },
  {
    id: 'AST-005',
    name: 'iPhone 15 Pro 256GB',
    type: 'Mobile',
    serialNumber: 'G6X7Y8Z9W0',
    status: 'Assigned',
    model: 'Titanio Natural',
    manufacturer: 'Apple',
    purchaseDate: '2024-10-02',
    cost: 1100,
    department: 'Ventas & Marketing',
    location: 'Sede Norte - Monterrey',
    assignedToUserId: 'user-4',
    notes: 'Línea de telefonía corporativa activa.'
  },
  {
    id: 'AST-006',
    name: 'Teclado MX Keys Mini',
    type: 'Peripheral',
    serialNumber: 'LZ142AA01',
    status: 'Available',
    model: 'Bluetooth Space Gray',
    manufacturer: 'Logitech',
    purchaseDate: '2025-02-10',
    cost: 120,
    department: 'Soporte e IT',
    location: 'Almacén Central'
  },
  {
    id: 'AST-007',
    name: 'Servidor PowerEdge R760',
    type: 'Server',
    serialNumber: '9X4D8H3',
    status: 'In Repair',
    model: '2x Intel Xeon, 256GB RAM, 8x 2TB SAS',
    manufacturer: 'Dell',
    purchaseDate: '2023-08-12',
    cost: 8500,
    department: 'Soporte e IT',
    location: 'Cuarto de Servidores CDMX',
    notes: 'Mantenimiento preventivo por falla en ventilador secundario.'
  },
  {
    id: 'AST-008',
    name: 'Cisco Catalyst 9300 Switch',
    type: 'Network',
    serialNumber: 'FOC2133U09W',
    status: 'Assigned',
    model: '48-Port PoE+, Network Advantage',
    manufacturer: 'Cisco',
    purchaseDate: '2023-05-18',
    cost: 4800,
    department: 'Soporte e IT',
    location: 'Cuarto de Telecomunicaciones CDMX',
    notes: 'Switch de distribución de red del segundo nivel.'
  },
  {
    id: 'AST-009',
    name: 'ThinkPad T14 Gen 4',
    type: 'Laptop',
    serialNumber: 'L3-P77X2-K9',
    status: 'Available',
    model: 'Ryzen 7 Pro, 16GB RAM, 512GB SSD',
    manufacturer: 'Lenovo',
    purchaseDate: '2025-01-20',
    cost: 1400,
    department: 'Soporte e IT',
    location: 'Almacén Central',
    notes: 'Preparada con la imagen base del sistema.'
  }
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'ASG-001',
    assetId: 'AST-001',
    userId: 'user-1',
    assignedDate: '2025-01-16',
    conditionOnAssign: 'Nuevo sellado en caja',
    status: 'Active',
    notes: 'Se acordó devolución en caso de renuncia o cambio.'
  },
  {
    id: 'ASG-002',
    assetId: 'AST-002',
    userId: 'user-5',
    assignedDate: '2024-11-21',
    conditionOnAssign: 'Excelente estado, cosmética limpia',
    status: 'Active',
    notes: 'Entregado en Sede CDMX por Oscar de IT.'
  },
  {
    id: 'ASG-003',
    assetId: 'AST-004',
    userId: 'user-2',
    assignedDate: '2024-09-08',
    conditionOnAssign: 'Excelentes condiciones',
    status: 'Active'
  },
  {
    id: 'ASG-004',
    assetId: 'AST-005',
    userId: 'user-4',
    assignedDate: '2024-10-02',
    conditionOnAssign: 'Nuevo, precintado',
    status: 'Active'
  }
];

export const INITIAL_CONSUMABLES: Consumable[] = [
  {
    id: 'CON-001',
    name: 'Microsoft 365 Enterprise E5',
    category: 'License',
    stock: 85,
    minStock: 20,
    unitPrice: 38,
    location: 'Cloud Portal'
  },
  {
    id: 'CON-002',
    name: 'Adobe Creative Cloud',
    category: 'License',
    stock: 12,
    minStock: 15,
    unitPrice: 80,
    location: 'Cloud Portal'
  },
  {
    id: 'CON-003',
    name: 'Mouse Ergonómico Logitech M720',
    category: 'Peripheral',
    stock: 28,
    minStock: 10,
    unitPrice: 65,
    location: 'Estantería B4 - CDMX'
  },
  {
    id: 'CON-004',
    name: 'Hub Multi-puerto USB-C 8-en-1',
    category: 'Accessory',
    stock: 40,
    minStock: 12,
    unitPrice: 45,
    location: 'Estantería A2 - CDMX'
  },
  {
    id: 'CON-005',
    name: 'Disco Duro Externo SSD 1TB Rugged',
    category: 'Component',
    stock: 8,
    minStock: 10,
    unitPrice: 110,
    location: 'Casillero de Seguridad IT'
  },
  {
    id: 'CON-006',
    name: 'Memoria RAM DDR5 16GB SODIMM',
    category: 'Component',
    stock: 18,
    minStock: 8,
    unitPrice: 75,
    location: 'Gabinete Técnico 1'
  }
];

export const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'ACT-001',
    timestamp: '2026-06-02 10:30',
    type: 'Assign',
    user: 'Daniel Ortega (IT Admin)',
    description: 'Asignación de Activo [AST-001] (MacBook Pro 16") a Sofia Rodríguez.',
    details: 'Condición: Nueva. Firmado digitalmente.'
  },
  {
    id: 'ACT-002',
    timestamp: '2026-06-02 09:12',
    type: 'Stock',
    user: 'Daniel Ortega (IT Admin)',
    description: 'Incrementó el stock de la licencia [CON-001] (Microsoft 365 Enterprise E5).',
    details: 'Se agregaron 25 licencias bajo orden de compra #OC-2026-904'
  },
  {
    id: 'ACT-003',
    timestamp: '2026-06-01 16:45',
    type: 'Status',
    user: 'Soporte Nivel 2',
    description: 'Actualizado estado de [AST-007] (Servidor PowerEdge R760) a [En Reparación].',
    details: 'Causa: Falla reportada en ventilador B2 del chasis.'
  },
  {
    id: 'ACT-004',
    timestamp: '2026-05-30 11:00',
    type: 'Create',
    user: 'Daniel Ortega (IT Admin)',
    description: 'Altas en base de datos del activo [AST-009] (ThinkPad T14 Gen 4).',
    details: 'Compra directa a distribuidor corporativo autorizado.'
  }
];

export const INITIAL_AGENT_COMPUTERS: AgentComputer[] = [
  {
    uuid: '00000000-0000-0000-0000-309C2389FE08',
    hostname: 'DESKTOP-P0TUHQI',
    sistema_operativo: 'Windows 11',
    anydesk_id: '1864637830',
    estado_conexion: 'ONLINE',
    ubicacion: 'SISTEMAS',
    ram_uso_porcentaje: 69.3,
    ram_total_gb: 7.89,
    cpu_uso_porcentaje: 7.1,
    procesador: 'Intel64 Family 6 Model 158 Stepping 9, GenuineIntel, 4 núcleos',
    ip_publica: '190.210.65.18',
    discos: [
      {
        punto_montaje: 'C:\\',
        total_gb: 237.56,
        libre_gb: 166.42,
        tipo_disco: 'SSD',
        porcentaje_usado: 29.9
      }
    ],
    perifericos: {
      impresoras: [
        { nombre: 'RICOH IM 430 PCL 6', driver: 'RICOH IM 430 PCL 6', predeterminada: false, puerto: 'IP_192.168.0.67', tipo_impresora: 'física (red)' },
        { nombre: 'PDFCreator', driver: 'PDFCreator', predeterminada: true, puerto: 'PDFCreator:', tipo_impresora: 'virtual' },
        { nombre: 'Operaciones Lexmark', driver: 'Lexmark Universal v2', predeterminada: false, puerto: '192.168.0.68_1', tipo_impresora: 'física' }
      ],
      monitores: [
        { nombre: 'SMB2230N LED IPS', resolucion: '1920x1080 (Principal)', pulgadas: 22 }
      ],
      dispositivos_usb: [
        { nombre: 'HD Pro Webcam C920', categoria: 'Camera', fabricante: 'Logitech' },
        { nombre: 'Logi USB Headset', categoria: 'Audio', fabricante: 'Logitech' }
      ]
    },
    software_critico: {
      antivirus: [
        { nombre: 'Windows Defender', habilitado: true, ultima_act_firmas: '2026-05-26 23:19', firmas_desactualizadas: false }
      ],
      alertas_seguridad: []
    },
    windows_updates: {
      total_pendientes: 7,
      criticos_pendientes: 0
    },
    errores_recientes: [
      { fuente: 'Service Control Manager', mensaje: 'El servicio AgenteBacar se terminó de manera inesperada. Esto ha sucedido 13 veces.\r\n', tipo: 'Error', fecha: 'Wed May 27 10:21:20 2026' }
    ],
    ultima_sincronizacion: '2026-05-27T14:50:27.891Z'
  },
  {
    uuid: '00000000-0000-0000-0000-309C238A0649',
    hostname: 'PC-SUPERV-SP2',
    sistema_operativo: 'Windows 11',
    anydesk_id: '1243642720',
    estado_conexion: 'ONLINE',
    ubicacion: 'SEGURIDAD_PRIVADA',
    ram_uso_porcentaje: 37.6,
    ram_total_gb: 7.89,
    cpu_uso_porcentaje: 23.7,
    procesador: 'Intel64 Family 6 Model 158 Stepping 9, GenuineIntel, 4 núcleos',
    ip_publica: '190.210.65.18',
    discos: [
      {
        punto_montaje: 'C:\\',
        total_gb: 237.56,
        libre_gb: 151.53,
        tipo_disco: 'SSD',
        porcentaje_usado: 36.2
      }
    ],
    perifericos: {
      impresoras: [
        { nombre: 'NPI4305AD (HP Laser 1102w)', driver: 'HP LaserJet Mono PCLmS', puerto: 'WSD-aeb3e9' },
        { nombre: 'RICOH IM 430', driver: 'Microsoft IPP Class Driver', predeterminada: false, puerto: 'WSD-797c76' }
      ],
      monitores: [
        { nombre: 'LG HD Display', resolucion: '1366x768 (Principal)', pulgadas: 19 }
      ]
    },
    software_critico: {
      antivirus: [
        { nombre: 'Windows Defender', habilitado: true, ultima_act_firmas: '2026-04-29 22:23', firmas_desactualizadas: false }
      ]
    },
    windows_updates: {
      total_pendientes: 12,
      criticos_pendientes: 0
    },
    ultima_sincronizacion: '2026-04-30T14:45:59.735Z'
  },
  {
    uuid: '00000000-0000-0000-0000-902B345150F3',
    hostname: 'OPSMF',
    sistema_operativo: 'Windows 10',
    anydesk_id: '812126105',
    estado_conexion: 'ONLINE',
    ubicacion: 'OPERACIONES',
    ram_uso_porcentaje: 54.7,
    ram_total_gb: 5.92,
    cpu_uso_porcentaje: 0.0,
    procesador: 'Intel64 Family 6 Model 42 Stepping 7, GenuineIntel, 2 núcleos',
    ip_publica: '190.210.65.18',
    discos: [
      { punto_montaje: 'C:\\', total_gb: 389.47, libre_gb: 324.8, tipo_disco: 'HardDrive', porcentaje_usado: 16.6 },
      { punto_montaje: 'D:\\', total_gb: 540.88, libre_gb: 537.57, tipo_disco: 'HardDrive', porcentaje_usado: 0.6 }
    ],
    software_critico: {
      antivirus: [
        { nombre: 'Windows Defender', habilitado: true, ultima_act_firmas: '2026-05-26 23:19', firmas_desactualizadas: false }
      ]
    },
    windows_updates: {
      total_pendientes: 10,
      criticos_pendientes: 0
    },
    errores_recientes: [
      { fuente: 'Service Control Manager', mensaje: 'El servicio AgenteBacar no pudo iniciarse debido al siguiente error: \r\n%%1053\r\n', tipo: 'Error', fecha: 'Wed May 27 10:21:21 2026' }
    ],
    ultima_sincronizacion: '2026-05-27T14:49:36.397Z'
  },
  {
    uuid: '03000200-0400-0500-0006-000700080009',
    hostname: 'BOX2',
    sistema_operativo: 'Windows 10',
    anydesk_id: '272229736',
    estado_conexion: 'ONLINE',
    ubicacion: 'TESORERIA',
    ram_uso_porcentaje: 73.1,
    ram_total_gb: 3.91,
    cpu_uso_porcentaje: 9.0,
    procesador: 'Intel64 Family 6 Model 94 Stepping 3, GenuineIntel, 4 núcleos',
    ip_publica: '190.210.65.18',
    discos: [
      { punto_montaje: 'C:\\', total_gb: 237.73, libre_gb: 135.7, tipo_disco: 'SSD', porcentaje_usado: 42.9 }
    ],
    software_critico: {
      antivirus: [
        { nombre: 'Windows Defender', habilitado: true, ultima_act_firmas: '2026-05-26 23:19', firmas_desactualizadas: false }
      ]
    },
    windows_updates: {
      total_pendientes: 10,
      criticos_pendientes: 0
    },
    ultima_sincronizacion: '2026-05-27T13:19:06.229Z'
  },
  {
    uuid: '031B021C-040D-0523-1306-4D0700080009',
    hostname: 'RecuentoA',
    sistema_operativo: 'Windows 10',
    anydesk_id: '861388469',
    estado_conexion: 'ONLINE',
    ubicacion: 'TESORERIA',
    ram_uso_porcentaje: 58.0,
    ram_total_gb: 7.86,
    cpu_uso_porcentaje: 15.3,
    procesador: 'Intel64 Family 6 Model 94 Stepping 3, GenuineIntel',
    ip_publica: '190.210.65.18',
    discos: [
      { punto_montaje: 'C:\\', total_gb: 194.27, libre_gb: 120.21, tipo_disco: 'HDD', porcentaje_usado: 38.1 }
    ],
    software_critico: {
      antivirus: [
        { nombre: 'Windows Defender', habilitado: true, ultima_act_firmas: '2026-05-26 13:56', firmas_desactualizadas: false }
      ]
    },
    windows_updates: {
      total_pendientes: 2,
      criticos_pendientes: 0
    },
    errores_recientes: [
      { fuente: 'disk', mensaje: 'El dispositivo, \\Device\\Harddisk0\\DR0, tiene un bloque defectuoso.', tipo: 'Error', fecha: 'Wed May 27 08:42:03 2026' }
    ],
    ultima_sincronizacion: '2026-05-27T14:48:01.816Z'
  },
  {
    uuid: '031B021C-040D-055B-0D06-960700080009',
    hostname: 'SegFisR',
    sistema_operativo: 'Windows 10',
    anydesk_id: '520887141',
    estado_conexion: 'ONLINE',
    ubicacion: 'SEGURIDAD_PRIVADA',
    ram_uso_porcentaje: 49.6,
    ram_total_gb: 7.91,
    cpu_uso_porcentaje: 53.8,
    procesador: 'Intel64 Family 6 Model 158 Stepping 9, GenuineIntel',
    ip_publica: '190.210.65.18',
    discos: [
      { punto_montaje: 'C:\\', total_gb: 291.91, libre_gb: 219.62, tipo_disco: 'SSD', porcentaje_usado: 24.8 }
    ],
    software_critico: {
      antivirus: [
        { nombre: 'Windows Defender', habilitado: true, ultima_act_firmas: '2026-05-26 23:19', firmas_desactualizadas: false }
      ]
    },
    windows_updates: {
      total_pendientes: 4,
      criticos_pendientes: 0
    },
    ultima_sincronizacion: '2026-05-27T14:46:44.801Z'
  },
  {
    uuid: '031B021C-040D-055B-0D06-F80700080009',
    hostname: 'GUADA-REARTES',
    sistema_operativo: 'Windows 11',
    anydesk_id: '1355267494',
    estado_conexion: 'ONLINE',
    ubicacion: 'SEGURIDAD_PRIVADA',
    ram_uso_porcentaje: 79.6,
    ram_total_gb: 7.91,
    cpu_uso_porcentaje: 2.3,
    procesador: 'Intel64 Family 6 Model 158 Stepping 9, GenuineIntel',
    ip_publica: '190.210.65.18',
    discos: [
      { punto_montaje: 'C:\\', total_gb: 237.56, libre_gb: 142.08, tipo_disco: 'SSD', porcentaje_usado: 40.2 }
    ],
    software_critico: {
      antivirus: [
        { nombre: 'Windows Defender', habilitado: true, ultima_act_firmas: '2025-11-18 01:55', firmas_desactualizadas: true }
      ],
      alertas_seguridad: ['Windows Defender: firmas desactualizadas']
    },
    windows_updates: {
      total_pendientes: 5,
      criticos_pendientes: 0
    },
    ultima_sincronizacion: '2026-05-27T14:46:08.696Z'
  },
  {
    uuid: '04B64500-C495-11EF-BFD3-8A501F173100',
    hostname: 'CAROLINA-SELEMIN',
    sistema_operativo: 'Windows 11',
    anydesk_id: '674662169',
    estado_conexion: 'ONLINE',
    ubicacion: 'ADMINISTRACION',
    ram_uso_porcentaje: 49.2,
    ram_total_gb: 15.74,
    cpu_uso_porcentaje: 17.6,
    procesador: 'Intel(R) Core(TM) i5, 12 núcleos',
    ip_publica: '190.210.65.18',
    discos: [
      { punto_montaje: 'C:\\', total_gb: 237.48, libre_gb: 141.72, tipo_disco: 'SSD', porcentaje_usado: 40.3 }
    ],
    software_critico: {
      antivirus: [
        { nombre: 'Windows Defender', habilitado: true, ultima_act_firmas: '2026-05-26 23:19', firmas_desactualizadas: false }
      ]
    },
    windows_updates: {
      total_pendientes: 2,
      criticos_pendientes: 0
    },
    ultima_sincronizacion: '2026-05-27T14:46:24.548Z'
  },
  {
    uuid: 'NOTE-IVANAB',
    hostname: 'NOTE-IVANAB',
    sistema_operativo: 'Windows 11',
    anydesk_id: '1631028844',
    estado_conexion: 'ONLINE',
    ubicacion: 'TESORERIA',
    ram_uso_porcentaje: 47.6,
    ram_total_gb: 13.84,
    cpu_uso_porcentaje: 0.4,
    procesador: 'AMD Ryzen 5, 8 núcleos',
    ip_publica: '190.210.65.18',
    discos: [
      { punto_montaje: 'C:\\', total_gb: 476.03, libre_gb: 389.84, tipo_disco: 'SSD', porcentaje_usado: 18.1 }
    ],
    software_critico: {
      antivirus: [
        { nombre: 'Windows Defender', habilitado: true, ultima_act_firmas: '2026-05-26 23:19', firmas_desactualizadas: false }
      ]
    },
    windows_updates: {
      total_pendientes: 2,
      criticos_pendientes: 0
    },
    ultima_sincronizacion: '2026-05-27T14:51:09.535Z'
  },
  {
    uuid: 'E4A5C0DA-A88A-6A15-ACCD-345A601BB1DE',
    hostname: 'Debora',
    sistema_operativo: 'Windows 11',
    anydesk_id: '543734970',
    estado_conexion: 'ONLINE',
    ubicacion: 'SISTEMAS',
    ram_uso_porcentaje: 74.9,
    ram_total_gb: 15.79,
    cpu_uso_porcentaje: 7.4,
    procesador: 'Intel Core i7, 6 núcleos',
    ip_publica: '190.210.65.18',
    discos: [
      { punto_montaje: 'C:\\', total_gb: 237.48, libre_gb: 93.76, tipo_disco: 'SSD', porcentaje_usado: 60.5 }
    ],
    software_critico: {
      antivirus: [
        { nombre: 'Windows Defender', habilitado: true, ultima_act_firmas: '2026-05-26 20:19', firmas_desactualizadas: false }
      ]
    },
    windows_updates: {
      total_pendientes: 1,
      criticos_pendientes: 0
    },
    ultima_sincronizacion: '2026-05-27T14:45:47.223Z'
  },
  {
    uuid: '704A41E9-8B4C-5E1D-ACD1-047C16887CB7',
    hostname: 'AGUSTINA-RRHH',
    sistema_operativo: 'Windows 10',
    anydesk_id: '1484482772',
    estado_conexion: 'ONLINE',
    ubicacion: 'CAPITAL_HUMANO',
    ram_uso_porcentaje: 80.0,
    ram_total_gb: 7.85,
    cpu_uso_porcentaje: 2.0,
    procesador: 'Intel Core i5, 4 núcleos',
    ip_publica: '190.210.65.18',
    discos: [
      { punto_montaje: 'C:\\', total_gb: 446.51, libre_gb: 326.34, tipo_disco: 'SSD', porcentaje_usado: 26.9 }
    ],
    software_critico: {
      antivirus: [
        { nombre: 'Windows Defender', habilitado: true, ultima_act_firmas: '2026-05-26 20:19', firmas_desactualizadas: false }
      ]
    },
    windows_updates: {
      total_pendientes: 3,
      criticos_pendientes: 0
    },
    ultima_sincronizacion: '2026-05-27T14:49:21.249Z'
  }
];


import { 
  ComputadoraTrazable, 
  SugerenciaConciliacion, 
  PerifericoStockItem, 
  KpisTrazabilidad,
  CambioHardwareDetectado
} from '../types/trazabilidad';

export const MOCK_PERIFERICOS_STOCK: PerifericoStockItem[] = [
  {
    id: 'PER-MON-001',
    tipo: 'monitor',
    nombre: 'Dell UltraSharp U2419H 24" FHD IPS',
    fabricante: 'Dell',
    modelo: 'U2419H',
    numero_serie: 'CN-0ABC123-74261',
    estado: 'disponible',
    ubicacion: 'Depósito Central - Rack M1'
  },
  {
    id: 'PER-MON-002',
    tipo: 'monitor',
    nombre: 'Samsung Essential Monitor S3 24"',
    fabricante: 'Samsung',
    modelo: 'S24C310',
    numero_serie: 'SAM-889102-X9',
    estado: 'disponible',
    ubicacion: 'Depósito Central - Rack M1'
  },
  {
    id: 'PER-MON-003',
    tipo: 'monitor',
    nombre: 'LG UltraGear 24ML600M IPS 75Hz',
    fabricante: 'LG',
    modelo: '24ML600M',
    numero_serie: 'LG-99214-BB1',
    estado: 'disponible',
    ubicacion: 'Depósito Central - Rack M2'
  },
  {
    id: 'PER-KBD-001',
    tipo: 'teclado',
    nombre: 'Dell Multimedia Keyboard KB216 (Español)',
    fabricante: 'Dell',
    modelo: 'KB216',
    numero_serie: 'CN-KB216-9901',
    estado: 'disponible',
    ubicacion: 'Depósito Central - Gaveta T1'
  },
  {
    id: 'PER-KBD-002',
    tipo: 'teclado',
    nombre: 'Logitech K120 USB Antiderrames',
    fabricante: 'Logitech',
    modelo: 'K120',
    numero_serie: 'LT-K120-77123',
    estado: 'disponible',
    ubicacion: 'Depósito Central - Gaveta T1'
  },
  {
    id: 'PER-MOU-001',
    tipo: 'mouse',
    nombre: 'Logitech Marathon M720 Wireless Precision',
    fabricante: 'Logitech',
    modelo: 'M720',
    numero_serie: 'LT-M720-66412',
    estado: 'disponible',
    ubicacion: 'Depósito Central - Gaveta M1'
  },
  {
    id: 'PER-MOU-002',
    tipo: 'mouse',
    nombre: 'Dell Optical Mouse MS116 USB Black',
    fabricante: 'Dell',
    modelo: 'MS116',
    numero_serie: 'CN-MS116-4412',
    estado: 'disponible',
    ubicacion: 'Depósito Central - Gaveta M1'
  },
  {
    id: 'PER-MOU-003',
    tipo: 'mouse',
    nombre: 'Genius DX-120 USB Óptico 1000DPI',
    fabricante: 'Genius',
    modelo: 'DX-120',
    numero_serie: 'GN-DX120-1102',
    estado: 'disponible',
    ubicacion: 'Depósito Central - Gaveta M2'
  }
];

export const MOCK_COMPUTADORAS_TRAZABLES: ComputadoraTrazable[] = [
  {
    uuid: 'bacar-pc-042-uuid',
    hostname: 'PC-STOCK-042',
    tipo_equipo: 'desktop',
    condicion: 'nueva',
    origen_alta: 'STOCK',
    estado_conciliacion: 'PENDIENTE',
    fecha_alta_stock: '2026-09-02T10:15:00Z',
    ubicacion: 'Depósito Central - Bahía 4',
    sector: 'Administración y Finanzas',
    responsable: 'María Fernández (Técnica IT)',
    combo_resumen: 'Dell U2419H + Dell KB216 + Logitech M720',
    baseline_esperado: {
      cpu_modelo: 'Intel Core i5-12400',
      ram_total_gb: 16,
      disco_resumen: 'SSD NVMe 512GB Kingston',
      perifericos: [
        {
          tipo: 'monitor',
          id_stock: 'PER-MON-001',
          nombre: 'Dell UltraSharp U2419H 24"',
          fabricante: 'Dell',
          numero_serie: 'CN-0ABC123-74261'
        },
        {
          tipo: 'teclado',
          id_stock: 'PER-KBD-001',
          nombre: 'Dell Multimedia Keyboard KB216',
          fabricante: 'Dell',
          numero_serie: 'CN-KB216-9901'
        },
        {
          tipo: 'mouse',
          id_stock: 'PER-MOU-001',
          nombre: 'Logitech Marathon M720',
          fabricante: 'Logitech',
          numero_serie: 'LT-M720-66412'
        }
      ],
      armado_at: '2026-09-03T11:30:00Z',
      armado_por: 'mfernandez@bacarsa.com.ar'
    },
    hardware_real: {
      cpu: 'Intel Core i5-12400 @ 2.50GHz (12 CPUs)',
      ram_gb: 15.8,
      disco_resumen: 'SSD NVMe 512GB (476.9 GB útiles)',
      monitores: [
        {
          nombre: 'Dell U2419H',
          resolucion: '1920x1080 (60Hz)',
          fabricante: 'Dell',
          serial: 'GENERIC_PNP_MONITOR'
        }
      ],
      teclado: 'Dell KB216 USB Keyboard',
      mouse: 'Logitech USB Receiver / M720',
      anydesk_id: '194827110',
      ip_publica: '190.210.65.22',
      ultimo_reporte: '2026-09-04T07:15:00Z'
    }
  },
  {
    uuid: 'bacar-pc-038-uuid',
    hostname: 'ADMIN-JP-01',
    tipo_equipo: 'desktop',
    condicion: 'nueva',
    origen_alta: 'STOCK',
    estado_conciliacion: 'COINCIDE',
    fecha_alta_stock: '2026-08-20T08:00:00Z',
    ubicacion: 'Casa Central - Piso 2',
    sector: 'Capital Humano',
    responsable: 'Juan Pérez (Jefe de Selección)',
    combo_resumen: 'Samsung S24C310 + Logitech K120 + Genius DX-120',
    baseline_esperado: {
      cpu_modelo: 'Intel Core i5-12400',
      ram_total_gb: 16,
      disco_resumen: 'SSD 512GB WD Blue',
      perifericos: [
        {
          tipo: 'monitor',
          id_stock: 'PER-MON-002',
          nombre: 'Samsung Essential Monitor S3 24"',
          fabricante: 'Samsung',
          numero_serie: 'SAM-889102-X9'
        },
        {
          tipo: 'teclado',
          id_stock: 'PER-KBD-002',
          nombre: 'Logitech K120 USB',
          fabricante: 'Logitech',
          numero_serie: 'LT-K120-77123'
        },
        {
          tipo: 'mouse',
          id_stock: 'PER-MOU-003',
          nombre: 'Genius DX-120 USB',
          fabricante: 'Genius',
          numero_serie: 'GN-DX120-1102'
        }
      ],
      armado_at: '2026-08-21T09:40:00Z',
      armado_por: 'mfernandez@bacarsa.com.ar'
    },
    hardware_real: {
      cpu: 'Intel Core i5-12400 @ 2.50GHz',
      ram_gb: 15.8,
      disco_resumen: 'SSD 512GB (476 GB útiles)',
      monitores: [
        {
          nombre: 'Samsung S24C310',
          resolucion: '1920x1080',
          fabricante: 'Samsung',
          serial: 'SAM-889102-X9'
        }
      ],
      teclado: 'Logitech K120 Keyboard',
      mouse: 'Genius Optical Mouse',
      anydesk_id: '1864637830',
      ip_publica: '190.210.65.18',
      ultimo_reporte: '2026-09-04T07:20:00Z'
    }
  },
  {
    uuid: 'bacar-pc-099-uuid',
    hostname: 'OPERACIONES-PC-09',
    tipo_equipo: 'desktop',
    condicion: 'usada',
    origen_alta: 'STOCK',
    estado_conciliacion: 'DISCREPANCIA',
    fecha_alta_stock: '2026-08-10T14:20:00Z',
    ubicacion: 'Centro de Operaciones Bacar',
    sector: 'Monitoreo y Alarmas',
    responsable: 'Lucas Varela',
    combo_resumen: 'LG 24ML600M + Teclado USB + Mouse Óptico',
    baseline_esperado: {
      cpu_modelo: 'Intel Core i3-10100',
      ram_total_gb: 8,
      disco_resumen: 'SSD 240GB Kingston',
      perifericos: [
        {
          tipo: 'monitor',
          id_stock: 'PER-MON-003',
          nombre: 'LG UltraGear 24ML600M',
          fabricante: 'LG',
          numero_serie: 'LG-99214-BB1'
        }
      ],
      armado_at: '2026-08-11T16:00:00Z',
      armado_por: 'dortega@bacarsa.com.ar'
    },
    hardware_real: {
      cpu: 'Intel Core i5-10400 CPU @ 2.90GHz',
      ram_gb: 16.0,
      disco_resumen: 'SSD 480GB Crucial BX500',
      monitores: [
        {
          nombre: 'LG 24ML600M',
          resolucion: '1920x1080',
          fabricante: 'LG'
        }
      ],
      anydesk_id: '1540921820',
      ip_publica: '190.210.65.34',
      ultimo_reporte: '2026-09-04T06:50:00Z'
    },
    resoluciones_discrepancia: [
      {
        id: 'DISC-01',
        campo: 'cpu',
        campo_label: 'Procesador CPU',
        valor_esperado: 'Intel Core i3-10100',
        valor_real: 'Intel Core i5-10400',
        tipo_resolucion: 'autorizado',
        nota_it: 'Upgrade de placa y CPU autorizado por Jefatura IT para puesto de monitoreo de video continuo.',
        resuelto_por: 'mfernandez@bacarsa.com.ar',
        resuelto_at: '2026-08-25T11:10:00Z'
      }
    ]
  },
  {
    uuid: '704A41E9-8B4C-5E1D-ACD1-047C16887CB7',
    hostname: 'AGUSTINA-RRHH',
    tipo_equipo: 'desktop',
    condicion: 'usada',
    origen_alta: 'STOCK',
    estado_conciliacion: 'DISCREPANCIA',
    fecha_alta_stock: '2026-05-11T13:50:15Z',
    ubicacion: 'Casa Central - Piso 1',
    sector: 'Recursos Humanos',
    responsable: 'Agustina Gómez',
    combo_resumen: 'Monitor LG W2243C + Teclado USB + Mouse Óptico',
    baseline_esperado: {
      cpu_modelo: 'Intel Core i5-3470',
      ram_total_gb: 8,
      disco_resumen: '256 GB SSD',
      perifericos: [
        {
          tipo: 'monitor',
          id_stock: 'PER-MON-LG-01',
          nombre: 'LG W2243C',
          fabricante: 'LG',
          numero_serie: 'LG-W2243C-9912'
        },
        {
          tipo: 'teclado',
          id_stock: 'PER-KBD-GEN-01',
          nombre: 'Teclado USB Estándar',
          fabricante: 'Genius',
          numero_serie: 'GN-KBD-4412'
        }
      ],
      armado_at: '2026-05-11T13:50:15Z',
      armado_por: 'soporte@bacarsa.com'
    },
    hardware_real: {
      cpu: 'Intel Core i5-3470 CPU @ 3.20GHz',
      ram_gb: 15.8,
      disco_resumen: 'SSD 256GB Kingston (238.4 GB útiles)',
      monitores: [
        {
          nombre: 'LG W2243C',
          resolucion: '1920x1080',
          fabricante: 'LG',
          serial: 'LG-W2243C-9912'
        }
      ],
      teclado: 'Teclado USB Genérico',
      mouse: 'Mouse Óptico USB',
      anydesk_id: '178491209',
      ip_publica: '190.210.65.41',
      ultimo_reporte: '2026-09-04T07:28:00Z'
    }
  },
  {
    uuid: 'bacar-callbox-04-uuid',
    hostname: 'CALL-BOX-04',
    tipo_equipo: 'desktop',
    condicion: 'usada',
    origen_alta: 'STOCK',
    estado_conciliacion: 'DISCREPANCIA',
    fecha_alta_stock: '2026-06-01T10:00:00Z',
    ubicacion: 'Centro de Contacto - Box 4',
    sector: 'Atención al Cliente',
    responsable: 'Gonzalo Morales',
    combo_resumen: 'Monitor Samsung S24C310 + Teclado Dell',
    baseline_esperado: {
      cpu_modelo: 'Intel Core i3-10100',
      ram_total_gb: 8,
      disco_resumen: 'SSD 240GB Kingston',
      perifericos: [
        {
          tipo: 'monitor',
          id_stock: 'PER-MON-SAM-04',
          nombre: 'Samsung S24C310',
          fabricante: 'Samsung',
          numero_serie: 'SAM-889102-X9'
        }
      ],
      armado_at: '2026-06-01T11:00:00Z',
      armado_por: 'soporte@bacarsa.com'
    },
    hardware_real: {
      cpu: 'Intel Core i3-10100 CPU @ 3.60GHz',
      ram_gb: 7.85,
      disco_resumen: 'SSD 240GB (223.5 GB útiles)',
      monitores: [],
      anydesk_id: '144910291',
      ip_publica: '190.210.65.77',
      ultimo_reporte: '2026-09-04T07:15:00Z'
    }
  },
  {
    uuid: 'bacar-pc-088-uuid',
    hostname: 'PC-STOCK-088',
    tipo_equipo: 'mini_pc',
    condicion: 'nueva',
    origen_alta: 'STOCK',
    estado_conciliacion: 'SIN_BASELINE',
    fecha_alta_stock: '2026-09-01T09:00:00Z',
    ubicacion: 'Depósito Central - Estante B',
    sector: 'Stock Disponible',
    responsable: 'Sin Asignar'
  },
  {
    uuid: 'bacar-pc-055-uuid',
    hostname: 'PC-STOCK-055',
    tipo_equipo: 'notebook',
    condicion: 'nueva',
    origen_alta: 'STOCK',
    estado_conciliacion: 'BASELINE_LISTO',
    fecha_alta_stock: '2026-09-03T14:00:00Z',
    ubicacion: 'Depósito Central - Caja Fuerte IT',
    sector: 'Gerencia General (Reserva)',
    responsable: 'En preparación para entrega',
    combo_resumen: 'Combo Notebook + Mouse Logitech M720',
    baseline_esperado: {
      cpu_modelo: 'Intel Core i7-1355U',
      ram_total_gb: 16,
      disco_resumen: 'SSD M.2 NVMe 512GB',
      perifericos: [
        {
          tipo: 'mouse',
          id_stock: 'PER-MOU-001',
          nombre: 'Logitech Marathon M720',
          fabricante: 'Logitech',
          numero_serie: 'LT-M720-66412'
        }
      ],
      armado_at: '2026-09-03T16:20:00Z',
      armado_por: 'mfernandez@bacarsa.com.ar'
    }
  },
  {
    uuid: 'bacar-agent-detect-01',
    hostname: 'DESKTOP-NEW-FIN-03',
    tipo_equipo: 'desktop',
    condicion: 'usada',
    origen_alta: 'DETECTADA_POR_AGENTE',
    estado_conciliacion: 'PENDIENTE',
    ubicacion: 'Sede Rosario - Finanzas',
    sector: 'Tesorería',
    responsable: 'Clara Domínguez',
    hardware_real: {
      cpu: 'AMD Ryzen 5 5600G with Radeon Graphics',
      ram_gb: 15.4,
      disco_resumen: 'SSD 480GB Kingston',
      monitores: [
        {
          nombre: 'ViewSonic VA2405',
          resolucion: '1920x1080',
          fabricante: 'ViewSonic'
        }
      ],
      anydesk_id: '1998234120',
      ip_publica: '181.44.112.5',
      ultimo_reporte: '2026-09-04T07:10:00Z'
    }
  },
  {
    uuid: 'bacar-agent-retro-02',
    hostname: 'NOTEBOOK-GER-01',
    tipo_equipo: 'notebook',
    condicion: 'nueva',
    origen_alta: 'DETECTADA_VINCULADA_RETRO',
    estado_conciliacion: 'COINCIDE',
    ubicacion: 'Gerencia - Piso 3',
    sector: 'Directorio',
    responsable: 'Carlos Bacar',
    baseline_esperado: {
      cpu_modelo: 'Intel Core i7-1270P',
      ram_total_gb: 32,
      disco_resumen: 'SSD 1TB Samsung 980 Pro',
      perifericos: [],
      armado_at: '2026-08-01T10:00:00Z',
      armado_por: 'dortega@bacarsa.com.ar'
    },
    hardware_real: {
      cpu: '12th Gen Intel Core i7-1270P',
      ram_gb: 31.7,
      disco_resumen: 'SSD 1TB Samsung (953 GB)',
      monitores: [
        {
          nombre: 'Internal Display 14" IPS',
          resolucion: '1920x1200'
        }
      ],
      anydesk_id: '1229048190',
      ip_publica: '190.210.65.11',
      ultimo_reporte: '2026-09-04T06:30:00Z'
    }
  },
  {
    uuid: 'bacar-legacy-srv-01',
    hostname: 'SRV-FILE-LEGACY-01',
    tipo_equipo: 'desktop',
    condicion: 'usada',
    origen_alta: 'LEGACY',
    estado_conciliacion: 'NO_APLICA',
    es_legacy: true,
    ubicacion: 'Rack Secundario - Depósito',
    sector: 'Infraestructura Pasiva',
    responsable: 'Equipo IT General'
  },
  {
    uuid: 'bacar-stock-old-015',
    hostname: 'PC-STOCK-015',
    tipo_equipo: 'desktop',
    condicion: 'usada',
    origen_alta: 'STOCK',
    estado_conciliacion: 'BASELINE_LISTO',
    fecha_alta_stock: '2026-07-15T10:00:00Z',
    dias_sin_agente: 51,
    ubicacion: 'Depósito Central - Estante A3',
    sector: 'Sucursal Córdoba Sur (Asignada)',
    responsable: 'En tránsito logístico',
    combo_resumen: 'Dell U2419H + Teclado USB',
    baseline_esperado: {
      cpu_modelo: 'Intel Core i5-10400',
      ram_total_gb: 8,
      disco_resumen: 'SSD 256GB',
      perifericos: [],
      armado_at: '2026-07-16T12:00:00Z',
      armado_por: 'mfernandez@bacarsa.com.ar'
    }
  }
];

export const MOCK_SUGERENCIAS_CONCILIACION: SugerenciaConciliacion[] = [
  {
    id: 'SUG-001',
    score: 78,
    fecha_sugerencia: '2026-09-04T07:15:20Z',
    estado: 'PENDIENTE',
    nivel_confianza: 'alta',
    lado_agente: {
      hostname: 'ADMIN-JP-01',
      cpu: 'Intel Core i5-12400',
      ram_gb: 15.8,
      disco: 'SSD NVMe 512GB (476.9 GB útiles)',
      monitor: 'Dell U2419H',
      serial_monitor: 'GENERIC_PNP_MONITOR',
      teclado: 'Dell KB216 USB Keyboard',
      mouse: 'Logitech USB Receiver / M720',
      anydesk_id: '194827110',
      ip: '190.210.65.22',
      version_agente: 'CyberWatch C# v2.4.1',
      ultimo_reporte: 'Hace 8 minutos'
    },
    lado_stock: {
      id: 'PC-STOCK-042',
      uuid: 'bacar-pc-042-uuid',
      hostname: 'PC-STOCK-042',
      tipo: 'desktop',
      condicion: 'nueva',
      combo: 'Monitor Dell U2419H (ABC123), Teclado Dell KB216, Mouse Logitech M720',
      cpu_esperada: 'Intel Core i5-12400',
      ram_esperada_gb: 16,
      disco_esperado: 'SSD NVMe 512GB Kingston',
      responsable: 'María Fernández (Técnica IT)',
      ubicacion: 'Depósito Central → Sector Administración',
      fecha_alta: '2026-09-02',
      perifericos: [
        {
          tipo: 'monitor',
          id_stock: 'PER-MON-001',
          nombre: 'Dell UltraSharp U2419H 24"',
          fabricante: 'Dell',
          numero_serie: 'CN-0ABC123-74261'
        }
      ]
    },
    campos_coincidentes: [
      'CPU (Intel Core i5-12400)',
      'RAM (tolerancia OS: 15.8 GB vs 16 GB)',
      'Monitor por modelo (Dell U2419H)',
      'Disco (NVMe 512GB)'
    ],
    campos_diferentes: [],
    nota_match: 'Match por marca/modelo (serial no disponible en agente)'
  },
  {
    id: 'SUG-002',
    score: 85,
    fecha_sugerencia: '2026-09-04T06:55:00Z',
    estado: 'PENDIENTE',
    nivel_confianza: 'alta',
    lado_agente: {
      hostname: 'DESKTOP-GER-02',
      cpu: 'Intel Core i7-1355U @ 1.70GHz',
      ram_gb: 15.8,
      disco: 'SSD 512GB Kioxia',
      monitor: 'Dell U2723QE (CN-0D54XF-74443)',
      serial_monitor: 'CN-0D54XF-74443',
      anydesk_id: '1772849102',
      ip: '190.210.65.19',
      version_agente: 'CyberWatch C# v2.4.1',
      ultimo_reporte: 'Hace 35 minutos'
    },
    lado_stock: {
      id: 'PC-STOCK-055',
      uuid: 'bacar-pc-055-uuid',
      hostname: 'PC-STOCK-055',
      tipo: 'notebook',
      condicion: 'nueva',
      combo: 'Notebook Core i7 + Mouse Logitech M720',
      cpu_esperada: 'Intel Core i7-1355U',
      ram_esperada_gb: 16,
      disco_esperado: 'SSD M.2 NVMe 512GB',
      responsable: 'Gerencia General (Reserva)',
      ubicacion: 'Depósito Central',
      fecha_alta: '2026-09-03'
    },
    campos_coincidentes: [
      'CPU (Intel Core i7-1355U)',
      'RAM (tolerancia OS: 15.8 GB vs 16 GB)',
      'Capacidad de almacenamiento (512GB SSD)'
    ],
    campos_diferentes: [],
    nota_match: 'Coincidencia exacta de arquitectura de procesador y memoria física esperada.'
  },
  {
    id: 'SUG-003',
    score: 55,
    fecha_sugerencia: '2026-09-04T05:40:00Z',
    estado: 'PENDIENTE',
    nivel_confianza: 'revision_manual',
    lado_agente: {
      hostname: 'DESKTOP-SUC-ROS-01',
      cpu: 'Intel Core i5-10400 @ 2.90GHz',
      ram_gb: 7.85,
      disco: 'SSD 240GB Kingston',
      monitor: 'Samsung S24C310',
      serial_monitor: 'GENERIC_PNP',
      anydesk_id: '166728190',
      ip: '181.44.112.9',
      version_agente: 'CyberWatch C# v2.4.0',
      ultimo_reporte: 'Hace 1 hora'
    },
    lado_stock: {
      id: 'PC-STOCK-015',
      uuid: 'bacar-stock-old-015',
      hostname: 'PC-STOCK-015',
      tipo: 'desktop',
      condicion: 'usada',
      combo: 'Dell U2419H + Teclado USB',
      cpu_esperada: 'Intel Core i5-10400',
      ram_esperada_gb: 8,
      disco_esperado: 'SSD 256GB',
      responsable: 'Sucursal Córdoba Sur (Asignada)',
      ubicacion: 'En tránsito logístico',
      fecha_alta: '2026-07-15'
    },
    campos_coincidentes: [
      'CPU (Intel Core i5-10400)',
      'RAM (tolerancia OS: 7.85 GB vs 8 GB)'
    ],
    campos_diferentes: [
      'Monitor: reportado Samsung vs esperado Dell U2419H',
      'IP de red: reporte proviene de subred Rosario en vez de Córdoba'
    ],
    nota_match: 'Monitor diferente al declarado en combo; se sugiere verificar si fue reemplazado en sucursal.'
  }
];

export const MOCK_KPIS_TRAZABILIDAD: KpisTrazabilidad = {
  total_computadoras: 11,
  porcentaje_validadas: 81.8,
  discrepancias_abiertas: 3,
  tiempo_medio_stock_agente_dias: 3.2,
  pcs_mas_30_dias_sin_agente: 1,
  sugerencias_pendientes: 3,
  stock_sin_agente: 2,
  detectadas_sin_validar: 1
};

export const MOCK_CAMBIOS_HARDWARE: CambioHardwareDetectado[] = [
  {
    id: 'CH-001',
    uuid: '704A41E9-8B4C-5E1D-ACD1-047C16887CB7',
    hostname: 'AGUSTINA-RRHH',
    tipo_componente: 'ram',
    tipo_evento: 'agregado',
    valor_esperado: '8 GB nominales (1 módulo)',
    valor_detectado: '16 GB detectados (15.8 GB útiles / 2 módulos)',
    explicacion_cambio: 'Se detectó la incorporación de un módulo de memoria RAM de 8 GB adicional. La máquina pasó de 8 GB a 16 GB.',
    timestamp: '2026-09-04T07:28:00Z',
    estado_seguimiento: 'pendiente',
    responsable: 'Agustina Gómez',
    sector: 'Recursos Humanos'
  },
  {
    id: 'CH-002',
    uuid: 'bacar-callbox-04-uuid',
    hostname: 'CALL-BOX-04',
    tipo_componente: 'monitor',
    tipo_evento: 'removido',
    valor_esperado: 'Samsung S24C310 (24" FHD)',
    valor_detectado: '0 monitores detectados (Desconectado)',
    explicacion_cambio: 'El monitor asignado en el inventario no reporta señal de video en el agente CyberWatch. Podría estar apagado, desconectado o trasladado.',
    timestamp: '2026-09-04T07:15:00Z',
    estado_seguimiento: 'pendiente',
    responsable: 'Gonzalo Morales',
    sector: 'Atención al Cliente'
  },
  {
    id: 'CH-003',
    uuid: 'bacar-pc-099-uuid',
    hostname: 'OPERACIONES-PC-09',
    tipo_componente: 'cpu',
    tipo_evento: 'modificado',
    valor_esperado: 'Intel Core i3-10100',
    valor_detectado: 'Intel Core i5-10400 CPU @ 2.90GHz',
    explicacion_cambio: 'Reemplazo de procesador y placa madre. Variación estructural de hardware.',
    timestamp: '2026-08-25T11:10:00Z',
    estado_seguimiento: 'autorizado',
    responsable: 'Lucas Varela',
    sector: 'Monitoreo y Alarmas',
    nota_it: 'Upgrade de placa y CPU autorizado por Jefatura IT para puesto de monitoreo de video continuo. Ticket IT #49120.',
    revisado_por: 'mfernandez@bacarsa.com.ar',
    revisado_en: '2026-08-25T11:10:00Z'
  },
  {
    id: 'CH-004',
    uuid: 'bacar-pc-099-uuid',
    hostname: 'OPERACIONES-PC-09',
    tipo_componente: 'disco',
    tipo_evento: 'agregado',
    valor_esperado: 'SSD 240GB Kingston',
    valor_detectado: 'SSD 480GB Crucial BX500',
    explicacion_cambio: 'Se amplió el almacenamiento local de 240GB a 480GB.',
    timestamp: '2026-08-25T11:10:00Z',
    estado_seguimiento: 'autorizado',
    responsable: 'Lucas Varela',
    sector: 'Monitoreo y Alarmas',
    nota_it: 'Clonación y reemplazo de disco de sistema por agotamiento de espacio. Ticket IT #49122.',
    revisado_por: 'mfernandez@bacarsa.com.ar',
    revisado_en: '2026-08-25T11:10:00Z'
  }
];

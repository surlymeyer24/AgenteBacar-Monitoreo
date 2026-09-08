import { CatalogoItem, CatalogoTipo } from '../types';

export interface CatalogoConfig {
  id: CatalogoTipo;
  nombre: string;
  descripcion: string;
  icono: string;
  badgeColor: string;
}

export const CATALOGOS_CONFIG: CatalogoConfig[] = [
  {
    id: 'tipos_stock',
    nombre: 'Tipos de Stock',
    descripcion: 'Categorías y tipos de activos físicos, consumibles y periféricos.',
    icono: 'Package',
    badgeColor: 'indigo'
  },
  {
    id: 'ubicaciones',
    nombre: 'Sedes y Ubicaciones',
    descripcion: 'Edificios, pisos y dependencias geográficas de la organización.',
    icono: 'MapPin',
    badgeColor: 'emerald'
  },
  {
    id: 'areas',
    nombre: 'Áreas y Departamentos',
    descripcion: 'Sectores organizacionales a los que se asigna el equipamiento.',
    icono: 'Building2',
    badgeColor: 'blue'
  },
  {
    id: 'marcas',
    nombre: 'Marcas y Fabricantes',
    descripcion: 'Proveedores y fabricantes oficiales de hardware y accesorios.',
    icono: 'Tag',
    badgeColor: 'amber'
  },
  {
    id: 'estados_equipos',
    nombre: 'Estados Operativos',
    descripcion: 'Ciclo de vida y disponibilidad técnica de cada equipo.',
    icono: 'Sliders',
    badgeColor: 'rose'
  },
  {
    id: 'licencias_software',
    nombre: 'Licencias y Software',
    descripcion: 'Programas corporativos, suites ofimáticas, SO y licencias digitales.',
    icono: 'FileKey',
    badgeColor: 'purple'
  },
  {
    id: 'tipos_mantenimiento',
    nombre: 'Tipos de Mantenimiento',
    descripcion: 'Categorías y protocolos de intervención técnica para equipamiento IT.',
    icono: 'Wrench',
    badgeColor: 'sky'
  },
  {
    id: 'motivos_baja',
    nombre: 'Motivos de Baja',
    descripcion: 'Causales de desincorporación, rotura o desecho de activos tecnológicos.',
    icono: 'Trash2',
    badgeColor: 'rose'
  },
  {
    id: 'proveedores_garantia',
    nombre: 'Garantías y Proveedores',
    descripcion: 'Contratos de soporte oficial, marcas de garantía y laboratorios externos.',
    icono: 'ShieldCheck',
    badgeColor: 'emerald'
  }
];

export const CATALOGOS_DEFAULT_DATA: Record<CatalogoTipo, CatalogoItem[]> = {
  tipos_stock: [
    { id: 'ts-1', orden: 1, codigo: 'computadora', etiqueta: 'Computadora', icono: 'Laptop', estado: 'activo', color: 'blue', esSistema: true, descripcion: 'Estaciones de trabajo de escritorio y notebooks corporativas.' },
    { id: 'ts-2', orden: 2, codigo: 'camara_ip', etiqueta: 'Camara IP', icono: 'Camera', estado: 'activo', color: 'emerald', esSistema: true, descripcion: 'Cámaras de videovigilancia e infraestructura de seguridad.' },
    { id: 'ts-3', orden: 3, codigo: 'teclado', etiqueta: 'Teclado', icono: 'Keyboard', estado: 'activo', color: 'amber', esSistema: true, descripcion: 'Teclados estándar, mecánicos y ergonómicos USB/Wireless.' },
    { id: 'ts-4', orden: 4, codigo: 'mouse', etiqueta: 'Mouse', icono: 'Mouse', estado: 'activo', color: 'purple', esSistema: true, descripcion: 'Ratones ópticos, láser e inalámbricos.' },
    { id: 'ts-5', orden: 5, codigo: 'monitor', etiqueta: 'Monitor', icono: 'Monitor', estado: 'activo', color: 'indigo', esSistema: true, descripcion: 'Pantallas LED/IPS de 22" a 32".' },
    { id: 'ts-6', orden: 6, codigo: 'impresora', etiqueta: 'Impresora', icono: 'Printer', estado: 'activo', color: 'sky', esSistema: true, descripcion: 'Impresoras térmicas, multifuncionales y láser de red.' },
    { id: 'ts-7', orden: 7, codigo: 'webcam', etiqueta: 'Webcam', icono: 'Video', estado: 'activo', color: 'rose', esSistema: true, descripcion: 'Cámaras web FHD/4K para videoconferencias.' },
    { id: 'ts-8', orden: 8, codigo: 'parlante', etiqueta: 'Parlante', icono: 'Volume2', estado: 'activo', color: 'orange', esSistema: true, descripcion: 'Dispositivos de salida de audio y altavoces estéreo.' },
    { id: 'ts-9', orden: 9, codigo: 'microfono', etiqueta: 'Micrófono', icono: 'Mic', estado: 'activo', color: 'violet', esSistema: true, descripcion: 'Micrófonos USB y vinchas para call center.' },
    { id: 'ts-10', orden: 10, codigo: 'otro', etiqueta: 'Otro', icono: 'Package', estado: 'activo', color: 'slate', esSistema: true, descripcion: 'Accesorios y periféricos generales no clasificados.' }
  ],
  ubicaciones: [
    { id: 'ub-1', orden: 1, codigo: 'central_p1', etiqueta: 'Edificio Central - Piso 1', icono: 'Building2', estado: 'activo', color: 'indigo', descripcion: 'Atención al público y mesa de entradas.' },
    { id: 'ub-2', orden: 2, codigo: 'central_p2', etiqueta: 'Edificio Central - Piso 2', icono: 'Building2', estado: 'activo', color: 'indigo', descripcion: 'Operaciones comerciales y administración.' },
    { id: 'ub-3', orden: 3, codigo: 'central_p3', etiqueta: 'Edificio Central - Piso 3', icono: 'Building2', estado: 'activo', color: 'indigo', descripcion: 'IT, Sistemas y Data Center principal.' },
    { id: 'ub-4', orden: 4, codigo: 'tesoreria_blindada', etiqueta: 'Tesorería Blindada', icono: 'Shield', estado: 'activo', color: 'rose', descripcion: 'Bóveda y procesamiento de valores de alta seguridad.' },
    { id: 'ub-5', orden: 5, codigo: 'sucursal_norte', etiqueta: 'Sucursal Norte', icono: 'MapPin', estado: 'activo', color: 'emerald', descripcion: 'Sede operativa de zona norte.' },
    { id: 'ub-6', orden: 6, codigo: 'sucursal_sur', etiqueta: 'Sucursal Sur', icono: 'MapPin', estado: 'activo', color: 'emerald', descripcion: 'Sede operativa de zona sur.' },
    { id: 'ub-7', orden: 7, codigo: 'almacen_central_it', etiqueta: 'Almacén Central - IT', icono: 'Package', estado: 'activo', color: 'amber', descripcion: 'Bodega de recambios, repuestos y stock de tecnología.' }
  ],
  areas: [
    { id: 'ar-1', orden: 1, codigo: 'sistemas_it', etiqueta: 'IT & Sistemas', icono: 'Laptop', estado: 'activo', color: 'indigo', descripcion: 'Desarrollo, infraestructura y soporte técnico corporativo.' },
    { id: 'ar-2', orden: 2, codigo: 'tesoreria', etiqueta: 'Tesorería & Valores', icono: 'Shield', estado: 'activo', color: 'rose', descripcion: 'Custodia, arqueo y recaudación monetaria.' },
    { id: 'ar-3', orden: 3, codigo: 'operaciones', etiqueta: 'Operaciones', icono: 'Sliders', estado: 'activo', color: 'blue', descripcion: 'Coordinación logística y gestión de servicios.' },
    { id: 'ar-4', orden: 4, codigo: 'recursos_humanos', etiqueta: 'Recursos Humanos', icono: 'Users', estado: 'activo', color: 'purple', descripcion: 'Gestión de talento, personal y liquidación.' },
    { id: 'ar-5', orden: 5, codigo: 'finanzas', etiqueta: 'Finanzas & Contabilidad', icono: 'Tag', estado: 'activo', color: 'emerald', descripcion: 'Auditoría contable y planificación financiera.' },
    { id: 'ar-6', orden: 6, codigo: 'seguridad_patrimonial', etiqueta: 'Seguridad Patrimonial', icono: 'Camera', estado: 'activo', color: 'amber', descripcion: 'Monitoreo de cámaras, accesos y control perimetral.' }
  ],
  marcas: [
    { id: 'mc-1', orden: 1, codigo: 'dell', etiqueta: 'Dell Technologies', icono: 'Laptop', estado: 'activo', color: 'blue', descripcion: 'Equipos OptiPlex, Latitude y PowerEdge.' },
    { id: 'mc-2', orden: 2, codigo: 'hp', etiqueta: 'HP Inc.', icono: 'Printer', estado: 'activo', color: 'sky', descripcion: 'Workstations ProDesk, LaserJet y ScanJets.' },
    { id: 'mc-3', orden: 3, codigo: 'lenovo', etiqueta: 'Lenovo', icono: 'Laptop', estado: 'activo', color: 'rose', descripcion: 'ThinkCentre, ThinkPad y monitores ThinkVision.' },
    { id: 'mc-4', orden: 4, codigo: 'logitech', etiqueta: 'Logitech', icono: 'Mouse', estado: 'activo', color: 'amber', descripcion: 'Periféricos USB, teclados, mouse y webcams Brio.' },
    { id: 'mc-5', orden: 5, codigo: 'samsung', etiqueta: 'Samsung', icono: 'Monitor', estado: 'activo', color: 'indigo', descripcion: 'Monitores curvos, Smart TVs y unidades SSD.' },
    { id: 'mc-6', orden: 6, codigo: 'hikvision', etiqueta: 'Hikvision', icono: 'Camera', estado: 'activo', color: 'emerald', descripcion: 'Cámaras IP, NVRs y sistemas biométricos.' },
    { id: 'mc-7', orden: 7, codigo: 'cisco', etiqueta: 'Cisco Systems', icono: 'Wifi', estado: 'activo', color: 'cyan', descripcion: 'Routers, Switches Catalyst y firewalls.' },
    { id: 'mc-8', orden: 8, codigo: 'kingston', etiqueta: 'Kingston', icono: 'HardDrive', estado: 'activo', color: 'violet', descripcion: 'Módulos RAM DDR4/DDR5 y discos SSD NVMe.' }
  ],
  estados_equipos: [
    { id: 'ee-1', orden: 1, codigo: 'operativo', etiqueta: 'Operativo en Puesto', icono: 'CheckCircle2', estado: 'activo', color: 'emerald', descripcion: 'Asignado a usuario activo y en funcionamiento regular.' },
    { id: 'ee-2', orden: 2, codigo: 'en_stock', etiqueta: 'En Stock / Disponible', icono: 'Package', estado: 'activo', color: 'indigo', descripcion: 'En almacén listo para ser asignado o desplegado.' },
    { id: 'ee-3', orden: 3, codigo: 'en_mantenimiento', etiqueta: 'En Taller / Mantenimiento', icono: 'Wrench', estado: 'activo', color: 'amber', descripcion: 'En revisión técnica, formateo o reemplazo de componentes.' },
    { id: 'ee-4', orden: 4, codigo: 'en_traslado', etiqueta: 'En Tránsito / Mudanza', icono: 'ArrowUp', estado: 'activo', color: 'blue', descripcion: 'En proceso de embalaje o traslado logístico entre sedes.' },
    { id: 'ee-5', orden: 5, codigo: 'baja_definitiva', etiqueta: 'Baja Definitiva', icono: 'Trash2', estado: 'activo', color: 'rose', descripcion: 'Desmantelado, obsoleto o fuera de inventario.' }
  ],
  licencias_software: [
    { id: 'ls-1', orden: 1, codigo: 'windows_11_pro', etiqueta: 'Windows 11 Pro OEM/Retail', icono: 'Laptop', estado: 'activo', color: 'blue', descripcion: 'Licencia digital de sistema operativo empresarial.' },
    { id: 'ls-2', orden: 2, codigo: 'm365_business', etiqueta: 'Microsoft 365 Business Standard', icono: 'FileText', estado: 'activo', color: 'indigo', descripcion: 'Suscripción corporativa Word, Excel, Teams, Exchange y OneDrive.' },
    { id: 'ls-3', orden: 3, codigo: 'crowdstrike_edr', etiqueta: 'CrowdStrike Falcon EDR', icono: 'ShieldCheck', estado: 'activo', color: 'rose', descripcion: 'Protección de endpoint y detección de amenazas en tiempo real.' },
    { id: 'ls-4', orden: 4, codigo: 'autocad_lt', etiqueta: 'AutoCAD LT Arquitectura', icono: 'Award', estado: 'activo', color: 'amber', descripcion: 'Licencia anual de diseño CAD para planos técnicos y obras.' },
    { id: 'ls-5', orden: 5, codigo: 'anydesk_enterprise', etiqueta: 'AnyDesk Enterprise Remoto', icono: 'Sliders', estado: 'activo', color: 'emerald', descripcion: 'Acceso remoto desatendido para soporte IT corporativo.' },
    { id: 'ls-6', orden: 6, codigo: 'sql_server_standard', etiqueta: 'MS SQL Server Standard', icono: 'Database', estado: 'activo', color: 'violet', descripcion: 'Motor de base de datos relacional para servidores principales.' }
  ],
  tipos_mantenimiento: [
    { id: 'tm-1', orden: 1, codigo: 'preventivo_programado', etiqueta: 'Mantenimiento Preventivo Programado', icono: 'Clock', estado: 'activo', color: 'emerald', descripcion: 'Inspección de rutina periódica, limpieza de ventiladores y test de integridad.' },
    { id: 'tm-2', orden: 2, codigo: 'correctivo_falla', etiqueta: 'Mantenimiento Correctivo por Falla', icono: 'AlertTriangle', estado: 'activo', color: 'rose', descripcion: 'Reparación de componentes dañados o diagnóstico ante caída del equipo.' },
    { id: 'tm-3', orden: 3, codigo: 'upgrade_hardware', etiqueta: 'Actualización de Hardware (RAM / SSD)', icono: 'HardDrive', estado: 'activo', color: 'indigo', descripcion: 'Sustitución de disco mecánico a SSD NVMe o ampliación de módulos de memoria.' },
    { id: 'tm-4', orden: 4, codigo: 'limpieza_pasta_termica', etiqueta: 'Limpieza Profunda & Pasta Térmica', icono: 'Wrench', estado: 'activo', color: 'amber', descripcion: 'Desarme de chasis, extracción de polvo y sustitución de compuesto térmico en CPU.' },
    { id: 'tm-5', orden: 5, codigo: 'formateo_imagen_so', etiqueta: 'Formateo & Reinstalación de SO', icono: 'Terminal', estado: 'activo', color: 'sky', descripcion: 'Clonación de imagen oficial corporativa y configuración de dominios.' }
  ],
  motivos_baja: [
    { id: 'mb-1', orden: 1, codigo: 'obsolescencia_eol', etiqueta: 'Obsolescencia Técnica (Fin de Vida Útil)', icono: 'Clock', estado: 'activo', color: 'slate', descripcion: 'El equipo ya no soporta parches de seguridad o requerimientos operativos actuales.' },
    { id: 'mb-2', orden: 2, codigo: 'falla_irreparable', etiqueta: 'Falla Irreparable / Costo Inviable', icono: 'AlertTriangle', estado: 'activo', color: 'rose', descripcion: 'Daño en placa base o display cuyo presupuesto supera el valor de recambio.' },
    { id: 'mb-3', orden: 3, codigo: 'dano_fisico_siniestro', etiqueta: 'Siniestro o Daño Accidental', icono: 'Trash2', estado: 'activo', color: 'orange', descripcion: 'Caída de líquidos, golpe estructural o sobretensión eléctrica con peritaje.' },
    { id: 'mb-4', orden: 4, codigo: 'extravio_hurto', etiqueta: 'Extravío o Robo con Denuncia', icono: 'Shield', estado: 'activo', color: 'rose', descripcion: 'Activo sustraído formalmente denunciado ante autoridades competentes.' },
    { id: 'mb-5', orden: 5, codigo: 'donacion_institucional', etiqueta: 'Donación Institucional / Educativa', icono: 'HeartHandshake', estado: 'activo', color: 'emerald', descripcion: 'Cese de uso corporativo y transferencia formal a escuelas u ONGs.' },
    { id: 'mb-6', orden: 6, codigo: 'recambio_flota', etiqueta: 'Recambio Programado de Flota', icono: 'CheckCircle2', estado: 'activo', color: 'blue', descripcion: 'Cumplimiento del período de amortización patrimonial (36-48 meses).' }
  ],
  proveedores_garantia: [
    { id: 'pg-1', orden: 1, codigo: 'dell_prosupport', etiqueta: 'Dell ProSupport Plus 24/7', icono: 'ShieldCheck', estado: 'activo', color: 'blue', descripcion: 'Garantía oficial con atención en sitio al siguiente día laborable (NBD).' },
    { id: 'pg-2', orden: 2, codigo: 'hp_care_pack', etiqueta: 'HP Care Pack Next Business Day', icono: 'ShieldCheck', estado: 'activo', color: 'sky', descripcion: 'Soporte de fabricante directo para líneas ProDesk, EliteDesk y LaserJet.' },
    { id: 'pg-3', orden: 3, codigo: 'lenovo_premier', etiqueta: 'Lenovo Premier Support', icono: 'ShieldCheck', estado: 'activo', color: 'rose', descripcion: 'Atención técnica dedicada para ThinkPad y ThinkCentre empresariales.' },
    { id: 'pg-4', orden: 4, codigo: 'servicio_tecnico_oficial', etiqueta: 'Laboratorio Técnico Especializado', icono: 'Wrench', estado: 'activo', color: 'amber', descripcion: 'Proveedor tercerizado para microsoldadura, pantallas y fuentes de poder.' },
    { id: 'pg-5', orden: 5, codigo: 'distribuidor_mayorista', etiqueta: 'Distribuidor Mayorista de Insumos', icono: 'Building2', estado: 'activo', color: 'indigo', descripcion: 'Provisión continua de teclados, discos SSD, tóner y cables certificados.' }
  ]
};

export const AVAILABLE_ICONS = [
  { name: 'Laptop', label: 'Computadora / Notebook' },
  { name: 'Camera', label: 'Cámara IP / Seguridad' },
  { name: 'Keyboard', label: 'Teclado' },
  { name: 'Mouse', label: 'Mouse / Puntero' },
  { name: 'Monitor', label: 'Monitor / Pantalla' },
  { name: 'Printer', label: 'Impresora / Escáner' },
  { name: 'Video', label: 'Webcam / Video' },
  { name: 'Volume2', label: 'Parlante / Audio' },
  { name: 'Mic', label: 'Micrófono' },
  { name: 'Package', label: 'Paquete / Stock' },
  { name: 'Building2', label: 'Edificio / Sede' },
  { name: 'MapPin', label: 'Ubicación / Coordenada' },
  { name: 'Users', label: 'Departamento / Personal' },
  { name: 'Shield', label: 'Seguridad / Bóveda' },
  { name: 'Tag', label: 'Marca / Etiqueta' },
  { name: 'Sliders', label: 'Parámetro / Estado' },
  { name: 'Wrench', label: 'Mantenimiento / Taller' },
  { name: 'Wifi', label: 'Red / Conectividad' },
  { name: 'HardDrive', label: 'Disco / Almacenamiento' },
  { name: 'Cpu', label: 'Procesador / Chipset' },
  { name: 'Smartphone', label: 'Celular / Móvil' },
  { name: 'Tv', label: 'Televisor / Smart TV' },
  { name: 'CheckCircle2', label: 'Completado / Activo' },
  { name: 'FileKey', label: 'Licencia / Llave de Software' },
  { name: 'FileText', label: 'Documento / Suite Ofimática' },
  { name: 'ShieldCheck', label: 'Garantía / Seguridad Certificada' },
  { name: 'AlertTriangle', label: 'Alerta / Falla Crítica' },
  { name: 'Trash2', label: 'Baja / Desecho Tecnológico' },
  { name: 'Clock', label: 'Tiempo / Preventivo Programado' },
  { name: 'HeartHandshake', label: 'Donación / Convenio' },
  { name: 'Award', label: 'Certificación / Premium' },
  { name: 'Database', label: 'Base de Datos / Servidor' },
  { name: 'Terminal', label: 'Consola / Sistema Operativo' }
];

export const COLOR_OPTIONS = [
  { id: 'blue', name: 'Azul', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  { id: 'emerald', name: 'Verde', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { id: 'indigo', name: 'Índigo', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  { id: 'amber', name: 'Ámbar', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { id: 'rose', name: 'Rojo / Rosa', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  { id: 'purple', name: 'Púrpura', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  { id: 'sky', name: 'Celeste', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  { id: 'orange', name: 'Naranja', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  { id: 'violet', name: 'Violeta', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  { id: 'cyan', name: 'Cian', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  { id: 'slate', name: 'Gris Neutro', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' }
];

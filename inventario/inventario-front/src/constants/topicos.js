export const TOPICOS = [
  { id: 'inicio', label: 'Inicio', iconKey: 'LayoutDashboard', path: '/' },
  {
    id: 'hardware',
    label: 'Hardware',
    iconKey: 'Cpu',
    children: [
      { id: 'computadoras', label: 'Computadoras', path: '/computadoras', iconKey: 'Monitor' },
      { id: 'impresoras', label: 'Impresoras', path: '/perifericos/impresoras', iconKey: 'Printer' },
      { id: 'monitores', label: 'Monitores', path: '/perifericos/monitores', iconKey: 'Tv2' },
    ],
  },
  {
    id: 'perifericos',
    label: 'Periféricos',
    iconKey: 'Puzzle',
    path: '/perifericos',
    children: [
      { id: 'teclados', label: 'Teclados', path: '/perifericos/teclados', iconKey: 'Keyboard' },
      { id: 'mouse', label: 'Mouse', path: '/perifericos/mouse', iconKey: 'Mouse' },
      { id: 'webcams', label: 'Webcams', path: '/perifericos/webcams', iconKey: 'Webcam' },
      { id: 'parlantes', label: 'Parlantes', path: '/perifericos/parlantes', iconKey: 'Volume2' },
      { id: 'microfonos', label: 'Micrófonos', path: '/perifericos/microfonos', iconKey: 'Mic' },
      { id: 'perifericos-stock', label: 'Stock', path: '/perifericos/stock', iconKey: 'PackageOpen' },
    ],
  },
  {
    id: 'infraestructura',
    label: 'Infraestructura',
    iconKey: 'Building2',
    path: '/infraestructura',
    children: [
      { id: 'nvrs', label: 'NVR', path: '/nvrs', iconKey: 'Video' },
      { id: 'camaras', label: 'Cámaras', path: '/camaras', iconKey: 'Cctv' },
      { id: 'routers', label: 'Routers', path: '/routers', iconKey: 'Router' },
      { id: 'switches', label: 'Switches', path: '/switches', iconKey: 'EthernetPort' },
      { id: 'maquinas-tesoreria', label: 'Máq. Tesorería', path: '/maquinas-tesoreria', iconKey: 'Banknote' },
    ],
  },
  { id: 'sistema', label: 'Sistema', iconKey: 'Settings', path: '/system' },
];

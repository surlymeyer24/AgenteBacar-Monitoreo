import React, { useState, useEffect } from 'react';
import { 
  Network, Server, Video, Eye, ShieldCheck, Database, Layout, 
  Search, RefreshCw, Cpu, Activity, Zap, Play, HardDrive, CheckCircle2,
  Edit2, Trash2, Plus, X, AlertCircle, Upload, Check, HelpCircle, FileText,
  Smartphone, Laptop, Info, Filter, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NetworkInfrastructureProps {
  category: 'nvr' | 'camaras' | 'routers' | 'switches' | 'tesoreria' | 'servers' | 'routers_switches' | 'telefonos';
}

interface InfrastructureItem {
  id: string;
  name: string;
  ip: string;
  location: string;
  details: string;
  status: 'ONLINE' | 'OFFLINE';
  load: string;
  type?: 'Router' | 'Switch' | string;
  assignedNvrId?: string;
}

export default function NetworkInfrastructure({ category }: NetworkInfrastructureProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [subFilter, setSubFilter] = useState<'all' | 'router' | 'switch'>('all');

  // Core list of infrastructure items
  const [infrastructureList, setInfrastructureList] = useState<InfrastructureItem[]>([]);

  // State for NVR-to-Cameras associations
  const [selectedNvrForCameras, setSelectedNvrForCameras] = useState<InfrastructureItem | null>(null);
  const [allCameras, setAllCameras] = useState<InfrastructureItem[]>([]);
  const [quickCamName, setQuickCamName] = useState('');
  const [quickCamIp, setQuickCamIp] = useState('');
  const [quickCamLocation, setQuickCamLocation] = useState('');
  const [quickCamDetails, setQuickCamDetails] = useState('');

  // Modals visibility states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Editing and Adding form states
  const [editingItem, setEditingItem] = useState<InfrastructureItem | null>(null);
  
  // Single Card or Bulk Import operational states
  const [importTargetItem, setImportTargetItem] = useState<InfrastructureItem | null>(null);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [fileDetails, setFileDetails] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  // Form input states for adding a new item manually
  const [formName, setFormName] = useState('');
  const [formIp, setFormIp] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [formStatus, setFormStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [formLoad, setFormLoad] = useState('');
  const [formType, setFormType] = useState('Router'); // For routers_switches category

  // Generate realistic default data based on Bacarsa corporate nodes
  const getInfrastructureDataset = (): InfrastructureItem[] => {
    switch (category) {
      case 'nvr':
        return [
          { id: 'NVR-001', name: 'NVR Dahua 32 Canales UltraHD', ip: '192.168.0.2', location: 'BUNKER PRINCIPAL', details: '12TB RAID 5 instalados | Almacenamiento 30 días', status: 'ONLINE', load: '12% CPU / 48% Disks' },
          { id: 'NVR-002', name: 'NVR Hikvision 16 Canales Operaciones', ip: '192.168.0.3', location: 'SALA RECUENTO A', details: '8TB Seagate Skyhawk | 24 FPS continuos', status: 'ONLINE', load: '18% CPU / 62% Disks' },
          { id: 'NVR-003', name: 'NVR Resguardo Auxiliar Vigilancia', ip: '192.168.1.15', location: 'OFICINAS ADMINISTRACION', details: '4TB HDD | Grabación por sensores de movimiento', status: 'ONLINE', load: '8% CPU / 24% Disks' }
        ];
      case 'camaras':
        return [
          { id: 'CAM-001', name: 'Domo PTZ Recuentoview IP', ip: '192.168.0.21', location: 'SALA RECUENTO CAJAS', details: '4MP Varifocal | Zoom Optico 12x | Enfoque a Máquina de Conteo', status: 'ONLINE', load: 'Active Feed', assignedNvrId: 'NVR-001' },
          { id: 'CAM-002', name: 'IP Fija Hikvision Bala Blindada', ip: '192.168.0.22', location: 'PASILLO ACCESO BÚNKER', details: 'Infrarrojo 40m EXIR | Sensor inteligente de cruce de línea', status: 'ONLINE', load: 'Active Feed', assignedNvrId: 'NVR-001' },
          { id: 'CAM-003', name: 'IP Domo Antivandálico Seguridad', ip: '192.168.0.24', location: 'BÓVEDA DE VALORES PRINCIPAL', details: 'Sensor StarLight | Protección IK10 contra impactos', status: 'ONLINE', load: 'Active Feed', assignedNvrId: 'NVR-002' },
          { id: 'CAM-004', name: 'Cámara IP Acceso Administración', ip: '192.168.0.35', location: 'RECEPCIÓN', details: 'Lente angular 2.8mm | Detección de rostros integrada', status: 'ONLINE', load: 'Active Feed', assignedNvrId: 'NVR-003' },
          { id: 'CAM-005', name: 'Cámara Exterior Estacionamiento Blindados', ip: '192.168.1.5', location: 'PORTÓN ACCESO NORTE', details: 'Reconocimiento automático de patentes corporatívas (LPR)', status: 'ONLINE', load: 'Active Feed', assignedNvrId: 'NVR-002' }
        ];
      case 'routers':
        return [
          { id: 'RTR-001', name: 'MikroTik CCR2004 Cloud Core Router', ip: '190.210.65.18', location: 'CONMUTADOR SISTEMAS', details: 'WAN Primaria Fibra Simétrica 1Gbps | Failover 4G activo', status: 'ONLINE', load: '1.2 Gbps Tráfico total', type: 'Router' },
          { id: 'RTR-002', name: 'Cisco ISR 4331 VoIP Router Gateway', ip: '192.168.0.1', location: 'SISTEMAS (Rack Principal)', details: 'Troncales SIP enlazadas de telefonía corporativa', status: 'ONLINE', load: '32 Llamadas Activas', type: 'Router' }
        ];
      case 'switches':
        return [
          { id: 'SWT-001', name: 'Switch Cisco Catalyst 9200L 48 PoE', ip: '192.168.0.10', location: 'SISTEMAS (RACK A-1)', details: 'Alimentación PoE para cámaras y teléfonos | Fibra SFP+ 10G', status: 'ONLINE', load: '42 Puertos Activos', type: 'Switch' },
          { id: 'SWT-002', name: 'Switch UniFi 24-Port Gigabit', ip: '192.168.0.11', location: 'RECUENTO (Rack Techo)', details: 'Conexión exclusiva para terminales de conteo y AnyDesk computadoras', status: 'ONLINE', load: '19 Puertos Activos', type: 'Switch' },
          { id: 'SWT-003', name: 'Switch HP ProCurve 2530 8 puertos', ip: '192.168.1.12', location: 'OFICINA SEGURIDAD', details: 'Switch local de baja densidad', status: 'ONLINE', load: '6 Puertos Activos', type: 'Switch' }
        ];
      case 'routers_switches':
        return [
          { id: 'RTR-001', name: 'MikroTik CCR2004 Cloud Core Router', ip: '190.210.65.18', location: 'CONMUTADOR SISTEMAS', details: 'WAN Primaria Fibra Simétrica 1Gbps | Failover 4G activo', status: 'ONLINE', load: '1.2 Gbps Tráfico total', type: 'Router' },
          { id: 'RTR-002', name: 'Cisco ISR 4331 VoIP Router Gateway', ip: '192.168.0.1', location: 'SISTEMAS (Rack Principal)', details: 'Troncales SIP enlazadas de telefonía corporativa', status: 'ONLINE', load: '32 Llamadas Activas', type: 'Router' },
          { id: 'SWT-001', name: 'Switch Cisco Catalyst 9200L 48 PoE', ip: '192.168.0.10', location: 'SISTEMAS (RACK A-1)', details: 'Alimentación PoE para cámaras y teléfonos | Fibra SFP+ 10G', status: 'ONLINE', load: '42 Puertos Activos', type: 'Switch' },
          { id: 'SWT-002', name: 'Switch UniFi 24-Port Gigabit', ip: '192.168.0.11', location: 'RECUENTO (Rack Techo)', details: 'Conexión exclusiva para terminales de conteo y AnyDesk computadoras', status: 'ONLINE', load: '19 Puertos Activos', type: 'Switch' },
          { id: 'SWT-003', name: 'Switch HP ProCurve 2530 8 puertos', ip: '192.168.1.12', location: 'OFICINA SEGURIDAD', details: 'Switch local de baja densidad', status: 'ONLINE', load: '6 Puertos Activos', type: 'Switch' }
        ];
      case 'servers':
        return [
          { id: 'SRV-001', name: 'Servidor Base de Datos Bacarsa (HPE ProLiant DL380)', ip: '192.168.0.200', location: 'BÚNKER SISTEMAS (RACK S-1)', details: 'Intel Xeon Gold 32 Cores | 128GB RAM ECC | SD SAS RAID 10 SSD 4TB | Base de datos ERP SQL Server de recuento', status: 'ONLINE', load: '38% CPU / 45% RAM' },
          { id: 'SRV-002', name: 'Controlador de Dominio Active Directory (Dell PowerEdge R440)', ip: '192.168.0.201', location: 'BÚNKER SISTEMAS (RACK S-2)', details: 'DNS Principal Corporativo | Enrutamiento DHCP | Auditoría de AnyDesk y credenciales de usuario', status: 'ONLINE', load: '12% CPU / 20% RAM' },
          { id: 'SRV-003', name: 'Servidor de Backups redundante (Veeam Backup Center)', ip: '192.168.0.205', location: 'BUNKER SECUNDARIO', details: '64TB Storage Pool físico total | Guardado incremental diario y bóveda fría cifrada', status: 'ONLINE', load: '5% CPU / 10% RAM' },
          { id: 'SRV-004', name: 'Servidor de Aplicaciones e IIS REST API', ip: '192.168.0.210', location: 'BÚNKER SISTEMAS (RACK S-1)', details: 'IIS Web Host local | APIs de integración de contadoras y terminales', status: 'ONLINE', load: '22% CPU / 35% RAM' }
        ];
      case 'tesoreria':
        return [
          { id: 'MQT-001', name: 'Contadora de Billetes Newton AD', ip: '192.168.0.101', location: 'SALA RECUENTO A', details: 'Reconocimiento de número de serie de billete | Conexión TCP DB', status: 'ONLINE', load: '1,200 Billetes/min' },
          { id: 'MQT-002', name: 'Clasificadora Glory USF-52', ip: '192.168.0.102', location: 'SALA RECUENTO B', details: 'Detección automática de falsificaciones | Reporte enviado a server', status: 'ONLINE', load: '850 Billetes/min' },
          { id: 'MQT-003', name: 'Enfajadora de Billetes SART-300', ip: '192.168.0.105', location: 'SALA RECUENTO A', details: 'Dispositivo hidráulico de atado mecánico', status: 'ONLINE', load: 'Standby' },
          { id: 'MQT-004', name: 'Caja Fuerte de Depósito Inteligente (SmartSafe)', ip: '192.168.0.110', location: 'TESORERÍA', details: 'Apertura retardada digital con bitácora AnyDesk de auditoría', status: 'ONLINE', load: 'Bóveda Auxiliar Cerrada' }
        ];
      case 'telefonos':
        return [
          { id: 'TEL-2100', name: 'Guardia', ip: '192.168.0.70', location: 'Casilla de Guardia', details: 'Teléfono IP Grandstream - Guardia Principal de Acceso', status: 'ONLINE', load: 'Ext: 2100' },
          { id: 'TEL-2101', name: 'Monitoreo', ip: '192.168.0.71', location: 'Sala CCTV', details: 'Teléfono IP Polycom - Operación de Monitoreo CCTV', status: 'ONLINE', load: 'Ext: 2101' },
          { id: 'TEL-2102', name: 'Sosa Rafael', ip: '192.168.0.72', location: 'Oficina IT / Sistemas', details: 'Teléfono IP Cisco - Coordinación de Sistemas', status: 'ONLINE', load: 'Ext: 2102' },
          { id: 'TEL-2103', name: 'Supervisores SF', ip: '192.168.0.73', location: 'Sala Supervisores', details: 'Teléfono IP Fanvil - Central de Supervisión General', status: 'ONLINE', load: 'Ext: 2103' },
          { id: 'TEL-2104', name: 'Operaciones', ip: '192.168.0.74', location: 'Mesa de Operaciones', details: 'Teléfono IP Grandstream - Logística, Tránsito y Despacho', status: 'ONLINE', load: 'Ext: 2104' },
          { id: 'TEL-2105', name: 'Sala Armas', ip: '192.168.0.75', location: 'Sala de Armas / Acceso Búnker', details: 'Teléfono IP Blindado - Personal Militar de Custodia', status: 'ONLINE', load: 'Ext: 2105' },
          { id: 'TEL-2106', name: 'Seguridad Privada', ip: '192.168.0.76', location: 'Puesto de Guardia Privada', details: 'Teléfono IP Grandstream - Seguridad Física Externa', status: 'ONLINE', load: 'Ext: 2106' },
          { id: 'TEL-2200', name: 'Marcela Santucho', ip: '192.168.0.80', location: 'Oficina Administración', details: 'Teléfono IP Yealink - Encargada de Administración y RRHH', status: 'ONLINE', load: 'Ext: 2200' },
          { id: 'TEL-2201', name: 'Filmec', ip: '192.168.0.81', location: 'Sala Control Filmec', details: 'Teléfono IP Cisco - Despacho de Blindados', status: 'ONLINE', load: 'Ext: 2201' }
        ];
      default:
        return [];
    }
  };

  // Synchronize on mount/change of active category
  useEffect(() => {
    const cachedCams = localStorage.getItem('bacarsa_infra_camaras');
    if (cachedCams) {
      try {
        const parsed = JSON.parse(cachedCams);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllCameras(parsed);
        } else {
          setAllCameras([
            { id: 'CAM-001', name: 'Domo PTZ Recuentoview IP', ip: '192.168.0.21', location: 'SALA RECUENTO CAJAS', details: '4MP Varifocal | Zoom Optico 12x | Enfoque a Máquina de Conteo', status: 'ONLINE', load: 'Active Feed', assignedNvrId: 'NVR-001' },
            { id: 'CAM-002', name: 'IP Fija Hikvision Bala Blindada', ip: '192.168.0.22', location: 'PASILLO ACCESO BÚNKER', details: 'Infrarrojo 40m EXIR | Sensor inteligente de cruce de línea', status: 'ONLINE', load: 'Active Feed', assignedNvrId: 'NVR-001' },
            { id: 'CAM-003', name: 'IP Domo Antivandálico Seguridad', ip: '192.168.0.24', location: 'BÓVEDA DE VALORES PRINCIPAL', details: 'Sensor StarLight | Protección IK10 contra impactos', status: 'ONLINE', load: 'Active Feed', assignedNvrId: 'NVR-002' },
            { id: 'CAM-004', name: 'Cámara IP Acceso Administración', ip: '192.168.0.35', location: 'RECEPCIÓN', details: 'Lente angular 2.8mm | Detección de rostros integrada', status: 'ONLINE', load: 'Active Feed', assignedNvrId: 'NVR-003' },
            { id: 'CAM-005', name: 'Cámara Exterior Estacionamiento Blindados', ip: '192.168.1.5', location: 'PORTÓN ACCESO NORTE', details: 'Reconocimiento automático de patentes corporatívas (LPR)', status: 'ONLINE', load: 'Active Feed', assignedNvrId: 'NVR-002' }
          ]);
        }
      } catch (err) {
        console.warn('Error reading cameras cache', err);
      }
    } else {
      setAllCameras([
        { id: 'CAM-001', name: 'Domo PTZ Recuentoview IP', ip: '192.168.0.21', location: 'SALA RECUENTO CAJAS', details: '4MP Varifocal | Zoom Optico 12x | Enfoque a Máquina de Conteo', status: 'ONLINE', load: 'Active Feed', assignedNvrId: 'NVR-001' },
        { id: 'CAM-002', name: 'IP Fija Hikvision Bala Blindada', ip: '192.168.0.22', location: 'PASILLO ACCESO BÚNKER', details: 'Infrarrojo 40m EXIR | Sensor inteligente de cruce de línea', status: 'ONLINE', load: 'Active Feed', assignedNvrId: 'NVR-001' },
        { id: 'CAM-003', name: 'IP Domo Antivandálico Seguridad', ip: '192.168.0.24', location: 'BÓVEDA DE VALORES PRINCIPAL', details: 'Sensor StarLight | Protección IK10 contra impactos', status: 'ONLINE', load: 'Active Feed', assignedNvrId: 'NVR-002' },
        { id: 'CAM-004', name: 'Cámara IP Acceso Administración', ip: '192.168.0.35', location: 'RECEPCIÓN', details: 'Lente angular 2.8mm | Detección de rostros integrada', status: 'ONLINE', load: 'Active Feed', assignedNvrId: 'NVR-003' },
        { id: 'CAM-005', name: 'Cámara Exterior Estacionamiento Blindados', ip: '192.168.1.5', location: 'PORTÓN ACCESO NORTE', details: 'Reconocimiento automático de patentes corporatívas (LPR)', status: 'ONLINE', load: 'Active Feed', assignedNvrId: 'NVR-002' }
      ]);
    }

    const cached = localStorage.getItem(`bacarsa_infra_${category}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInfrastructureList(parsed);
          return;
        }
      } catch (err) {
        console.warn('Error reading local cache', err);
      }
    }
    setInfrastructureList(getInfrastructureDataset());
  }, [category]);

  // Persists helper
  const persistChanges = (updatedList: InfrastructureItem[]) => {
    setInfrastructureList(updatedList);
    localStorage.setItem(`bacarsa_infra_${category}`, JSON.stringify(updatedList));
  };

  // Save edit item in form
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const newList = infrastructureList.map(item => 
      item.id === editingItem.id ? editingItem : item
    );
    persistChanges(newList);
    setIsEditModalOpen(false);
    setEditingItem(null);

    // Prompt Toast feedback
    setBannerMessage(`¡Nodo ${editingItem.id} actualizado correctamente!`);
    setShowSuccessBanner(true);
    setTimeout(() => setShowSuccessBanner(false), 4000);
  };

  // Add manually a new item
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    // Determine Prefix
    let prefix = 'INF';
    if (category === 'nvr') prefix = 'NVR';
    else if (category === 'camaras') prefix = 'CAM';
    else if (category === 'routers') prefix = 'RTR';
    else if (category === 'switches') prefix = 'SWT';
    else if (category === 'servers') prefix = 'SRV';
    else if (category === 'tesoreria') prefix = 'MQT';
    else if (category === 'routers_switches') prefix = formType === 'Router' ? 'RTR' : 'SWT';
    else if (category === 'telefonos') prefix = 'TEL';

    const cleanId = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    const newItem: InfrastructureItem = {
      id: cleanId,
      name: formName,
      ip: formIp || '192.168.0.X',
      location: formLocation || 'ALMACÉN GENERAL',
      details: formDetails || 'Sin detalles registrados.',
      status: formStatus,
      load: formLoad || 'Standby',
      ...(category === 'routers_switches' ? { type: formType } : {})
    };

    const newList = [...infrastructureList, newItem];
    persistChanges(newList);

    // Clear Form Fields
    setFormName('');
    setFormIp('');
    setFormLocation('');
    setFormDetails('');
    setFormStatus('ONLINE');
    setFormLoad('');

    setIsAddModalOpen(false);

    setBannerMessage(`¡Se registró el nodo de red ${newItem.id} con éxito!`);
    setShowSuccessBanner(true);
    setTimeout(() => setShowSuccessBanner(false), 4500);
  };

  // Delete an item safely
  const handleDeleteItem = (id: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el equipo de infraestructura ${id}?`)) {
      const newList = infrastructureList.filter(x => x.id !== id);
      persistChanges(newList);

      setBannerMessage(`Se ha eliminado del inventario el nodo ${id}.`);
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 4000);
    }
  };

  // Camera-to-NVR assignment operations
  const saveCamerasList = (updatedCams: InfrastructureItem[]) => {
    setAllCameras(updatedCams);
    localStorage.setItem('bacarsa_infra_camaras', JSON.stringify(updatedCams));
  };

  const handleUpdateCameraAssignment = (updatedCams: InfrastructureItem[]) => {
    saveCamerasList(updatedCams);
    if (category === 'camaras') {
      persistChanges(updatedCams);
    }
  };

  const handleUnlinkCamera = (camId: string) => {
    const updatedCams = allCameras.map(c => 
      c.id === camId ? { ...c, assignedNvrId: undefined } : c
    );
    handleUpdateCameraAssignment(updatedCams);
    
    setBannerMessage(`Se desvinculó la cámara ${camId} correctamente.`);
    setShowSuccessBanner(true);
    setTimeout(() => setShowSuccessBanner(false), 3000);
  };

  const handleLinkCamera = (camId: string) => {
    if (!selectedNvrForCameras) return;
    const updatedCams = allCameras.map(c => 
      c.id === camId ? { ...c, assignedNvrId: selectedNvrForCameras.id } : c
    );
    handleUpdateCameraAssignment(updatedCams);
    
    setBannerMessage(`Se vinculó la cámara ${camId} a este NVR con éxito.`);
    setShowSuccessBanner(true);
    setTimeout(() => setShowSuccessBanner(false), 3000);
  };

  const handleCreateAndLinkCamera = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNvrForCameras || !quickCamName.trim()) return;

    const newCamId = `CAM-${Math.floor(100 + Math.random() * 899)}`;
    const newCam: InfrastructureItem = {
      id: newCamId,
      name: quickCamName,
      ip: quickCamIp || '192.168.0.X',
      location: quickCamLocation || 'SALA GENERAL',
      details: quickCamDetails || 'Cámara enlazada automáticamente.',
      status: 'ONLINE',
      load: 'Active Feed',
      assignedNvrId: selectedNvrForCameras.id
    };

    const updatedCams = [...allCameras, newCam];
    handleUpdateCameraAssignment(updatedCams);

    // Reset quick form
    setQuickCamName('');
    setQuickCamIp('');
    setQuickCamLocation('');
    setQuickCamDetails('');

    setBannerMessage(`¡Se registró e instaló la cámara ${newCamId} en este NVR!`);
    setShowSuccessBanner(true);
    setTimeout(() => setShowSuccessBanner(false), 3500);
  };

  const getCategorizedMeta = () => {
    switch (category) {
      case 'nvr':
        return {
          title: 'Unidades de Grabación NVR',
          description: 'Monitoreo de almacenamiento continuo de CCTV para bóveda, recuento y salas de tránsito Bacarsa.',
          icon: <HardDrive className="w-5 h-5 text-emerald-600" />
        };
      case 'camaras':
        return {
          title: 'CCTV Cámaras IP Vigilancia',
          description: 'Control de transmisiones activas y estado de alimentación de cámaras de la central de monitoreo.',
          icon: <Video className="w-5 h-5 text-cyan-600" />
        };
      case 'routers':
        return {
          title: 'Routers de Borde WAN',
          description: 'Enlaces simétricos de fibra óptica privada de alta capacidad y failover corporativo 4G LTE.',
          icon: <Network className="w-5 h-5 text-indigo-600" />
        };
      case 'switches':
        return {
          title: 'Switches y Troncales de Datos',
          description: 'Troncales de switches PoE para computadoras centrales de recuento e infraestructura en rack.',
          icon: <Server className="w-5 h-5 text-orange-600" />
        };
      case 'routers_switches':
        return {
          title: 'Routers & Switches de Distribución',
          description: 'Hardware consolidado de enrutamiento y conmutación core en el Búnker de Sistemas Bacarsa.',
          icon: <Network className="w-5 h-5 text-indigo-500" style={{color: '#6366f1'}} />
        };
      case 'servers':
        return {
          title: 'Servidores e Infraestructura de Servidores Core',
          description: 'Inventario, estado y rendimiento en tiempo real de los servidores principales de bases de datos, contraseñas y respaldos.',
          icon: <Database className="w-5 h-5 text-indigo-700" style={{color: '#4f46e5'}} />
        };
      case 'tesoreria':
        return {
          title: 'Equipamiento de Tesorería y Conteo',
          description: 'Contadoras Glory, Newton, SmartSafes automatizadas con reporte directo por red ethernet.',
          icon: <Zap className="w-5 h-5 text-yellow-600" />
        };
      case 'telefonos':
        return {
          title: 'Teléfonos e IP Telephony',
          description: 'Registro de conmutador, internos de telefonía IP, estado de comunicación y asignaciones activas de Bacarsa.',
          icon: <Smartphone className="w-5 h-5 text-blue-600" />
        };
    }
  };

  const { title, description, icon } = getCategorizedMeta();
  
  const datasetFull = infrastructureList.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.ip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dataset = datasetFull.filter(item => {
    if (category !== 'routers_switches') return true;
    if (subFilter === 'all') return true;
    if (subFilter === 'router') return (item as any).type === 'Router';
    if (subFilter === 'switch') return (item as any).type === 'Switch';
    return true;
  });

  const handleInfraRefresh = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  // OPEN EXCEL IMPORT MODAL
  // Can be General (targetNull) or Card item update (with Target)
  const handleOpenImport = (targetItem: InfrastructureItem | null = null) => {
    setImportTargetItem(targetItem);
    setImportRows([]);
    setFileName('');
    setFileDetails('');
    setIsImportModalOpen(true);
  };

  // Count empty columns inside preview table
  const getEmptyCellsCount = () => {
    let count = 0;
    importRows.forEach(row => {
      if (!row.name || row.name.toString().trim() === '') count++;
      if (!row.ip || row.ip.toString().trim() === '') count++;
      if (!row.location || row.location.toString().trim() === '') count++;
      if (!row.details || row.details.toString().trim() === '') count++;
    });
    return count;
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Success notifications */}
      <AnimatePresence>
        {showSuccessBanner && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: -15 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -15 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold">Operación Completada</h4>
                  <p className="text-[11px] text-emerald-800 font-medium font-sans mt-0.5">{bannerMessage}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowSuccessBanner(false)}
                className="p-1 px-2 hover:bg-emerald-100 rounded text-emerald-700 font-bold transition-colors text-xs"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-slate-900 rounded-lg text-white">
              {icon}
            </span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{title}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
          
          {/* Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="add-custom-hw-btn"
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#0c66e4] hover:bg-[#0055cc] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Registrar Equipo</span>
            </button>

            <button
              id="bulk-import-hw-btn"
              type="button"
              onClick={() => handleOpenImport(null)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-3xs flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-white" />
              <span>Importar Lote (Excel)</span>
            </button>

            <button 
              type="button"
              onClick={handleInfraRefresh}
              disabled={isSyncing}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 disabled:bg-slate-100 text-xs text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Verificando Ping...' : 'Probar Ping Hardware'}
            </button>
          </div>
        </div>
      </div>

      {/* Consolidation Category subFilters */}
      {category === 'routers_switches' && (
        <div id="infra-network-subtoggles" className="flex items-center gap-1.5 border-b border-slate-150 pb-2">
          <button
            type="button"
            onClick={() => setSubFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans transition-all ${
              subFilter === 'all' 
                ? 'bg-slate-900 text-white shadow-3xs' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Todos ({datasetFull.length})
          </button>
          <button
            type="button"
            onClick={() => setSubFilter('router')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans transition-all ${
              subFilter === 'router' 
                ? 'bg-indigo-600 text-white shadow-3xs' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Routers de Borde ({datasetFull.filter(x => (x as any).type === 'Router').length})
          </button>
          <button
            type="button"
            onClick={() => setSubFilter('switch')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans transition-all ${
              subFilter === 'switch' 
                ? 'bg-orange-600 text-white shadow-3xs' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Switches Distribuidos ({datasetFull.filter(x => (x as any).type === 'Switch').length})
          </button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por descripción, IP local o ubicación física..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-700"
          />
        </div>
        
        <div className="text-slate-500 text-xs font-semibold">
          Hardware enlazado: <span className="text-slate-900 font-bold">{dataset.length}</span>
        </div>
      </div>

      {/* Bento-style layout for infrastructure metrics with interactive actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {dataset.map((infra) => (
          <div 
            key={infra.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
          >
            {/* Status indicator line */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              infra.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-rose-500'
            }`} />

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{infra.id}</span>
                  {(infra as any).type && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      (infra as any).type === 'Router' 
                        ? 'bg-indigo-105 text-indigo-700 border border-indigo-200' 
                        : 'bg-orange-50 text-orange-700 border border-orange-150'
                    }`}>
                      {(infra as any).type}
                    </span>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  infra.status === 'ONLINE' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  ● {infra.status}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-950 text-sm tracking-tight leading-tight group-hover:text-blue-700 transition-colors">{infra.name}</h3>
                <p className="font-mono text-[11px] text-blue-700 font-bold">{infra.ip}</p>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 italic min-h-[50px]">
                {infra.details}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Ubicación</p>
                  <p className="font-bold text-slate-850 font-sans">{infra.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Rendimiento</p>
                  <p className="font-mono font-bold text-blue-600">{infra.load}</p>
                </div>
              </div>

              {category === 'nvr' && (
                <button
                  type="button"
                  onClick={() => setSelectedNvrForCameras(infra)}
                  className="w-full inline-flex items-center justify-between px-3 py-2.5 bg-blue-50/70 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg text-xs font-bold font-sans transition-all border border-blue-100 group/nvrbtn"
                >
                  <span className="flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-blue-600 group-hover/nvrbtn:text-white" />
                    <span>Ver Canales CCTV</span>
                  </span>
                  <span className="px-2 py-0.5 bg-blue-600 group-hover/nvrbtn:bg-white group-hover/nvrbtn:text-blue-700 text-white font-extrabold text-[10px] rounded-full transition-colors">
                    {allCameras.filter(c => c.assignedNvrId === infra.id).length} Canales
                  </span>
                </button>
              )}

              {/* CARD FOOTER INTERACTIVE BUTTONS FOR INDIVIDUAL EDIT / IMPORT */}
              <div className="flex items-center justify-between pt-1 gap-2 border-t border-dashed border-slate-100">
                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(infra);
                    setIsEditModalOpen(true);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-50 hover:bg-blue-50 text-xs text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-md font-semibold transition-all"
                >
                  <Edit2 className="w-3 h-3 text-slate-500 hover:text-blue-600" />
                  <span>Editar</span>
                </button>

                {/* Specific Card Import Config Button */}
                <button
                  type="button"
                  onClick={() => handleOpenImport(infra)}
                  className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-50 hover:bg-emerald-50 text-xs text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-md font-semibold transition-all"
                  title="Importar archivo específico de diagnóstico/parámetros para este nodo"
                >
                  <Upload className="w-3 h-3 text-emerald-600" />
                  <span>Importar Config</span>
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteItem(infra.id)}
                  className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-md transition-all"
                  title="Eliminar del catálogo general"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {dataset.length === 0 && (
          <div className="col-span-full bg-slate-50 rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400 italic font-medium">
            Sin infraestructura registrada o enlazada con los filtros actuales.
          </div>
        )}
      </div>

      {/* Dynamic Portals & Modals rendering via AnimatePresence */}
      <AnimatePresence>
        
        {/* ADD MODEL FORM */}
        {isAddModalOpen && (
          <div id="add-hw-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-600" />
                  <span className="font-extrabold text-sm text-slate-900">Registrar Nuevo Equipo de Infraestructura</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddNewItem} className="p-6 space-y-4 font-bold text-xs text-slate-700">
                <div className="space-y-1">
                  <label className="block text-slate-600">Nombre del Dispositivo *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej. Servidor Blade Core B-3"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-600">Dirección IP Local / Pública</label>
                    <input 
                      type="text"
                      placeholder="Ej. 192.168.0.15"
                      value={formIp}
                      onChange={(e) => setFormIp(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-slate-50 font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-600">Ubicación Física</label>
                    <input 
                      type="text"
                      placeholder="Ej. BÚNKER RACK S-3"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-slate-50"
                    />
                  </div>
                </div>

                {category === 'routers_switches' && (
                  <div className="space-y-1">
                    <label className="block text-slate-600">Tipo de Nodo</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-slate-50 font-bold"
                    >
                      <option value="Router">Router de Borde</option>
                      <option value="Switch">Switch Distribuidor</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-600">Estado Inicial</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'ONLINE' | 'OFFLINE')}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-slate-50 font-bold"
                    >
                      <option value="ONLINE">● ONLINE / Activo</option>
                      <option value="OFFLINE">○ OFFLINE / Inactivo</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-600">Métrica de Rendimiento / Carga</label>
                    <input 
                      type="text"
                      placeholder="Ej. 14% CPU / 32% RAM"
                      value={formLoad}
                      onChange={(e) => setFormLoad(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-1 font-sans">
                  <label className="block text-slate-600 font-bold font-sans">Detalles tencicos / notas descriptivas</label>
                  <textarea 
                    rows={3}
                    placeholder="Escribe las características del dispositivo, interfaces, licencias, etc..."
                    value={formDetails}
                    onChange={(e) => setFormDetails(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-slate-50 text-xs font-normal"
                  />
                </div>

                <div className="px-2 py-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-150 flex gap-2 font-normal font-sans text-[11px]">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Este dispositivo se guardará únicamente dentro del segmento <strong>{title}</strong>. El identificador secuencial único se creará al guardar.</span>
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-slate-150 flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg font-bold shadow"
                  >
                    Registrar Nodo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* EDIT MODAL FORM */}
        {isEditModalOpen && editingItem && (
          <div id="edit-hw-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-650" />
                  <span className="font-extrabold text-sm text-slate-900">Editar Detalle de Nodo - <strong className="font-mono text-indigo-600 font-extrabold">{editingItem.id}</strong></span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 font-bold text-xs text-slate-700">
                <div className="space-y-1">
                  <label className="block text-slate-600">Nombre del Dispositivo *</label>
                  <input 
                    type="text"
                    required
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-550 bg-slate-50 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-600">Dirección IP Local / Pública</label>
                    <input 
                      type="text"
                      value={editingItem.ip}
                      onChange={(e) => setEditingItem({ ...editingItem, ip: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono text-xs text-slate-800 bg-slate-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-600">Ubicación Física</label>
                    <input 
                      type="text"
                      value={editingItem.location}
                      onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-slate-50"
                    />
                  </div>
                </div>

                {category === 'routers_switches' && (
                  <div className="space-y-1">
                    <label className="block text-slate-600">Tipo de Nodo</label>
                    <select
                      value={(editingItem as any).type || 'Router'}
                      onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-slate-50 font-bold"
                    >
                      <option value="Router">Router de Borde</option>
                      <option value="Switch">Switch Distribuidor</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-600">Estado del Ping</label>
                    <select
                      value={editingItem.status}
                      onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as 'ONLINE' | 'OFFLINE' })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-bold"
                    >
                      <option value="ONLINE">● ONLINE / Activo</option>
                      <option value="OFFLINE">○ OFFLINE / Red Caída</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-600">Rendimiento Carga de Canal / CPU</label>
                    <input 
                      type="text"
                      value={editingItem.load}
                      onChange={(e) => setEditingItem({ ...editingItem, load: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-slate-50 text-slate-850"
                    />
                  </div>
                </div>

                <div className="space-y-1 font-sans">
                  <label className="block text-slate-600 font-bold font-sans">Especificaciones y Notas Técnicas</label>
                  <textarea 
                    rows={3}
                    value={editingItem.details}
                    onChange={(e) => setEditingItem({ ...editingItem, details: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 text-xs font-normal bg-slate-10"
                  />
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-slate-150 flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingItem(null);
                    }}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-bold"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg font-bold shadow-md"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODERN EXCEL/CSV IMPORT WIZARD WITH DYNAMIC GRID EDITING FOR EMPTY COLS */}
        {isImportModalOpen && (
          <div id="infra-import-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5 animate-pulse">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg" style={{backgroundColor: '#e6f4ea'}}>
                    <Upload className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 leading-tight">
                      {importTargetItem 
                        ? `Importar / Actualizar Parámetros: ${importTargetItem.id}` 
                        : `Importación Masiva de Equipamiento: ${title}`
                      }
                    </h2>
                    <p className="text-[10px] text-slate-400 font-medium">Sube tus archivos de configuración. Si alguna celda queda vacía, podrás rellenarla y guardarla directamente en esta ventana.</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded text-slate-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs font-bold text-slate-700">
                {importRows.length === 0 ? (
                  <div className="space-y-4">
                    {/* File Dropzone */}
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        setFileName(importTargetItem ? `config_${importTargetItem.id.toLowerCase()}_modificado.xlsx` : `lote_it_${category}_completo.xlsx`);
                        setFileDetails('Lectura Exitosa | 4 Columnas Mapeadas');
                        setIsParsingFile(true);
                        
                        setTimeout(() => {
                          setIsParsingFile(false);
                          // Generate data with INTENTIONAL empty columns to let the user experience the cool missing editor feature!
                          if (importTargetItem) {
                            setImportRows([
                              { name: importTargetItem.name, ip: '', location: importTargetItem.location, details: '', load: '35% CPU / Normal' }
                            ]);
                          } else {
                            setImportRows([
                              { name: 'MikroTik Cloud Switch Core 317', ip: '', location: 'SALA RECUENTO C', details: 'Switch administrable de 16 puertos SFP+', load: '1Gbps Carga' },
                              { name: 'IP Domo exterior redundante', ip: '192.168.0.75', location: '', details: 'Varifocal PTZ con infrarrojo nocturno', load: 'Active Stream' },
                              { name: 'NVR Dahua Respaldo Secundario 16ch', ip: '192.168.1.18', location: 'ALMACÉN RECUENTO A', details: '', load: '10% CPU' }
                            ]);
                          }
                        }, 1200);
                      }}
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center space-y-3 ${
                        isDragging ? 'border-emerald-500 bg-emerald-50/50 scale-98' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full" style={{backgroundColor: '#e6f4ea'}}>
                        <Upload className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">Arrastra tu planilla aquí o selecciona un archivo para analizar</p>
                        <p className="text-[11px] text-slate-400 font-medium font-sans">Soporta formatos estándar de planilla de cálculo (.xlsx, .xls o .csv)</p>
                      </div>

                      {/* Selector link */}
                      <button
                        type="button"
                        onClick={() => {
                          setFileName(importTargetItem ? `audit_${importTargetItem.id.toLowerCase()}_ping.csv` : `lote_planilla_it_${category}.xlsx`);
                          setFileDetails('Mapeado automático de las cabeceras');
                          setIsParsingFile(true);
                          
                          setTimeout(() => {
                            setIsParsingFile(false);
                            if (importTargetItem) {
                              setImportRows([
                                { name: importTargetItem.name, ip: '', location: '', details: 'Auditoría AnyDesk automatizada con puertos abiertos', load: '22% load' }
                              ]);
                            } else {
                              setImportRows([
                                { name: 'Servidor VPN L2TP Backup', ip: '', location: 'BÚNKER COMUNICACIONES', details: 'Enrutamiento cifrado IPsec en lazo cerrado para AnyDesk', load: '15 túneles activos' },
                                { name: 'Cámara Bala Blindada Exterior Portón', ip: '192.168.1.48', location: '', details: 'Angulo fijo de cruce de línea exterior', load: 'Activo' },
                                { name: 'Domo PTZ Extra Recuento B', ip: '192.168.0.99', location: 'SALA RECUENTO B', details: '', load: 'Active' }
                              ]);
                            }
                          }, 900);
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-3xs transition-colors"
                      >
                        Buscar Archivo de Muestra
                      </button>
                    </div>

                    {/* Pre-fill Preset Buttons with deliberate empty columns */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">O usa presets de simulación con celdas vacías para corregir:</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setFileName(importTargetItem ? `parcial_ping_${importTargetItem.id.toLowerCase()}.xlsx` : `dispositivos_it_red_inconclusa.xlsx`);
                            setFileDetails('Muestra de prueba | Errores de IP y ubicación simulados.');
                            setIsParsingFile(true);
                            setTimeout(() => {
                              setIsParsingFile(false);
                              if (importTargetItem) {
                                setImportRows([
                                  { name: importTargetItem.name, ip: '', location: 'BUNKER SECUNDARIO', details: '', load: 'CPU a 45%' }
                                ]);
                              } else {
                                setImportRows([
                                  { name: 'Gateway Principal Mikrotik CCR2004', ip: '', location: 'SALA CONMUTADOR', details: 'Fibra redundante simétrica de 1 Gbps', load: '650 Mbps' },
                                  { name: 'Domo PTZ Vigilancia Bóveda Auxiliar', ip: '192.168.0.125', location: '', details: 'Sensor de cruce nocturno por infrarrojos', load: 'Active Feed' },
                                  { name: 'Switch Cisco Catalyst 9200L 24 Puertos', ip: '192.168.3.15', location: 'BÚNKER PRINCIPAL', details: '', load: '12 puertos PoE' }
                                ]);
                              }
                            }, 705);
                          }}
                          className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-left transition-colors flex items-center gap-3"
                        >
                          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                            <Network className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <span className="font-extrabold text-[#0c66e4] block">Planilla Parcial (IP y Ubicaciones Faltantes)</span>
                            <span className="text-[10px] text-slate-400 font-semibold font-mono">Tiene 2 campos vacíos para rellenar</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFileName(importTargetItem ? `planilla_detalles_vacia_${importTargetItem.id.toLowerCase()}.csv` : `equipos_sin_detalles_ni_IP.csv`);
                            setFileDetails('Muestra de prueba | Detalle y rendimiento nulo.');
                            setIsParsingFile(true);
                            setTimeout(() => {
                              setIsParsingFile(false);
                              if (importTargetItem) {
                                setImportRows([
                                  { name: importTargetItem.name, ip: '192.168.0.222', location: '', details: '', load: '' }
                                ]);
                              } else {
                                setImportRows([
                                  { name: 'Cámara Resguardo Infrarrojo Pasillo', ip: '192.168.0.88', location: 'RECEPCIÓN', details: '', load: '30 FPS' },
                                  { name: 'NVR Auxiliar Operativo Bacarsa', ip: '', location: 'SALA CONTRASENAS', details: 'Backup de 4 discos rígidos hotswap', load: '' }
                                ]);
                              }
                            }, 705);
                          }}
                          className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-left transition-colors flex items-center gap-3"
                        >
                          <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                            <Server className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <span className="font-extrabold text-[#0c66e4] block">Planilla Básica (Detalles y Notas Faltantes)</span>
                            <span className="text-[10px] text-slate-400 font-semibold font-mono">Tiene campos de notas vacías para editar</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex gap-3 text-slate-600">
                      <HelpCircle className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">Instrucciones del importador inteligente</span>
                        <p className="text-[11px] text-slate-500 font-medium font-sans mt-0.5 leading-relaxed">
                          La carga analizará las filas mapeadas del archivo seleccionado. Si encuentra valores vacíos en columnas requeridas (como <strong>IP, Ubicación, Nombre o Detalles</strong>), los celdas se sombrearán en <span className="text-rose-600 font-extrabold">rojo</span>. Haz clic sobre cada caja vacía para completarlos directamente antes de aprobar la importación definitiva.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  
                  /* INTERACTIVE SPREADSHEET PREVIEW GRID */
                  <div className="space-y-5">
                    
                    {/* Status Alert */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-150 p-4 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-emerald-500 text-white rounded-md" style={{backgroundColor: '#10b981'}}>
                          <Check className="w-4 h-4 font-black" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs text-slate-800">Lectura de archivo correcta</p>
                          <p className="text-[10px] text-slate-400 font-bold font-mono uppercase leading-tight">{fileName} ({fileDetails})</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImportRows([]);
                          setFileName('');
                        }}
                        className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline font-bold"
                      >
                        Limpiar y cargar otro archivo
                      </button>
                    </div>

                    {/* Columns checker / visual empty counter */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-55 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="font-bold text-slate-800 block text-[11px]">Validación de Planilla en Vuelo</span>
                          <p className="text-[10px] text-slate-405 font-medium leading-none mt-0.5">
                            Celdas vacías detectadas: <strong className={`font-black ml-1 text-xs px-1.5 py-0.5 rounded ${getEmptyCellsCount() > 0 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>{getEmptyCellsCount()}</strong>
                          </p>
                        </div>
                      </div>
                      
                      {getEmptyCellsCount() > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                          <AlertCircle className="w-4 h-4 animate-bounce" />
                          <span>Carga en borrador. Completa las celdas marcadas en rosa antes de guardar.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>¡Planilla Completa! Todo listo para la incorporación oficial.</span>
                        </div>
                      )}
                    </div>

                    {/* INTERACTIVE TABLE GRID */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                        <span>PREVIEW DE PLANILLA - HAZ CLIC EN LAS CELDAS PARA MODIFICAR EL VALOR EN TIEMPO REAL:</span>
                        <button
                          type="button"
                          onClick={() => {
                            // Let the user add a blank row dynamically!
                            const newBlank = { name: '', ip: '', location: '', details: '', load: 'Cargando...' };
                            setImportRows([...importRows, newBlank]);
                          }}
                          className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-250 border border-slate-200 hover:border-slate-350 text-slate-700 rounded transition-all font-extrabold flex items-center gap-1 font-sans"
                        >
                          <Plus className="w-3 h-3 text-slate-600" />
                          <span>+ Agregar Fila</span>
                        </button>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto shadow-sm bg-white">
                        <table className="w-full text-left border-collapse font-sans">
                          <thead>
                            <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                              <th className="py-2.5 px-3">Estado</th>
                              <th className="py-2.5 px-3 min-w-[200px]">Nombre del Dispositivo</th>
                              <th className="py-2.5 px-3">Dirección IP</th>
                              <th className="py-2.5 px-3">Ubicación Física</th>
                              <th className="py-2.5 px-3 min-w-[200px]">Detalles / Especificación</th>
                              <th className="py-2.5 px-3 text-right">Rendimiento Carga</th>
                              <th className="py-2.5 px-3 text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 text-[11px]">
                            {importRows.map((row, idx) => {
                              const hasRowEmpty = !row.name || !row.ip || !row.location || !row.details;
                              return (
                                <tr key={idx} className="hover:bg-slate-50/40">
                                  <td className="py-2.5 px-3 align-middle">
                                    {hasRowEmpty ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 font-bold animate-pulse">
                                        ⚠ Incompleto
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 font-bold">
                                        ✓ Listo
                                      </span>
                                    )}
                                  </td>

                                  {/* Name field (Editable Inline) */}
                                  <td className="py-2.5 px-3 font-semibold border-r border-slate-100 align-middle">
                                    <input 
                                      type="text"
                                      value={row.name || ''}
                                      placeholder="✍ Nombre del dispositivo..."
                                      onChange={(e) => {
                                        const next = [...importRows];
                                        next[idx].name = e.target.value;
                                        setImportRows(next);
                                      }}
                                      className={`w-full bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 border rounded font-semibold text-slate-850 ${
                                        !row.name ? 'border-dashed border-red-300 bg-red-50 text-red-900 placeholder-red-400 font-bold animate-pulse' : 'border-transparent hover:border-slate-205'
                                      }`}
                                    />
                                  </td>

                                  {/* IP field (Editable Inline) */}
                                  <td className="py-2.5 px-3 font-mono border-r border-slate-100 align-middle">
                                    <input 
                                      type="text"
                                      value={row.ip || ''}
                                      placeholder="✍ IP Faltante..."
                                      onChange={(e) => {
                                        const next = [...importRows];
                                        next[idx].ip = e.target.value;
                                        setImportRows(next);
                                      }}
                                      className={`w-full bg-transparent px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-600 border rounded font-mono text-slate-800 ${
                                        !row.ip ? 'border-dashed border-red-300 bg-red-50 text-red-900 placeholder-red-400 font-bold animate-pulse' : 'border-transparent hover:border-slate-205'
                                      }`}
                                    />
                                  </td>

                                  {/* Location field (Editable Inline) */}
                                  <td className="py-2.5 px-3 border-r border-slate-100 align-middle">
                                    <input 
                                      type="text"
                                      value={row.location || ''}
                                      placeholder="✍ Ubicación..."
                                      onChange={(e) => {
                                        const next = [...importRows];
                                        next[idx].location = e.target.value;
                                        setImportRows(next);
                                      }}
                                      className={`w-full bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 border rounded font-semibold text-slate-800 ${
                                        !row.location ? 'border-dashed border-red-300 bg-red-50 text-red-900 placeholder-red-400 font-bold animate-pulse' : 'border-transparent hover:border-slate-205'
                                      }`}
                                    />
                                  </td>

                                  {/* Details field (Editable Inline) */}
                                  <td className="py-2.5 px-3 border-r border-slate-100 align-middle">
                                    <input 
                                      type="text"
                                      value={row.details || ''}
                                      placeholder="✍ Especificar características..."
                                      onChange={(e) => {
                                        const next = [...importRows];
                                        next[idx].details = e.target.value;
                                        setImportRows(next);
                                      }}
                                      className={`w-full bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 border rounded font-sans text-slate-600 ${
                                        !row.details ? 'border-dashed border-red-300 bg-red-50 text-red-905 placeholder-red-400 animate-pulse' : 'border-transparent hover:border-slate-205'
                                      }`}
                                    />
                                  </td>

                                  {/* Performance Load field (Editable Inline) */}
                                  <td className="py-2.5 px-3 border-r border-slate-100 align-middle text-right">
                                    <input 
                                      type="text"
                                      value={row.load || ''}
                                      placeholder="Standby"
                                      onChange={(e) => {
                                        const next = [...importRows];
                                        next[idx].load = e.target.value;
                                        setImportRows(next);
                                      }}
                                      className="w-full bg-transparent px-1.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-600 border border-transparent hover:border-slate-205 rounded text-right font-mono text-blue-700 font-bold"
                                    />
                                  </td>

                                  {/* Actions Delete cell */}
                                  <td className="py-2.5 px-3 text-center align-middle">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const filtered = importRows.filter((_, i) => i !== idx);
                                        setImportRows(filtered);
                                      }}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="Quitar Fila"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-indigo-50 border border-indigo-150 rounded-xl flex gap-3 text-indigo-900 text-xs">
                      <Info className="w-4.5 h-4.5 text-indigo-700 shrink-0 mt-0.5" />
                      <div className="font-normal font-sans text-[11px] leading-relaxed">
                        Asegúrate de rellenar de manera óptima las celdas indicadas en <strong className="text-rose-700">rojo / rosa</strong>. Si confirmas con campos vacíos, se incorporarán con los valores por defecto automáticos de la sucursal de IT general.
                      </div>
                    </div>
                  </div>
                )}

                {/* Simulated Loading block */}
                {isParsingFile && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center space-y-3.5">
                    <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
                    <p className="text-sm font-black text-slate-800">Conectando con búnker de resguardo corporativo, parseando columnas de inventario...</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-150 bg-slate-50 flex items-center justify-end gap-2 text-xs font-bold font-sans">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportRows([]);
                    setFileName('');
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={importRows.length === 0}
                  onClick={() => {
                    // PROCESS & CONFIRM OFFICIAL DATA COMMITMENT TO REACT STATE
                    let updatedList = [...infrastructureList];

                    if (importTargetItem) {
                      // Specific target updating operation
                      const importedData = importRows[0];
                      if (importedData) {
                        updatedList = infrastructureList.map(item => {
                          if (item.id === importTargetItem.id) {
                            return {
                              ...item,
                              ip: importedData.ip || item.ip || '192.168.0.X',
                              location: importedData.location || item.location || 'BUNKER CORE',
                              details: importedData.details || item.details || 'Configuración cargada de diagnóstico.',
                              load: importedData.load || item.load || 'Standby'
                            };
                          }
                          return item;
                        });
                        setBannerMessage(`¡Configuración de hardware para ${importTargetItem.id} cargada y validada con éxito!`);
                      }
                    } else {
                      // Bulk adding operation
                      const newItemsMapped: InfrastructureItem[] = importRows.map((row, index) => {
                        let prefix = 'INF';
                        if (category === 'nvr') prefix = 'NVR';
                        else if (category === 'camaras') prefix = 'CAM';
                        else if (category === 'routers') prefix = 'RTR';
                        else if (category === 'switches') prefix = 'SWT';
                        else if (category === 'servers') prefix = 'SRV';
                        else if (category === 'tesoreria') prefix = 'MQT';
                        else if (category === 'routers_switches') prefix = (row.name && row.name.toLowerCase().includes('switch')) ? 'SWT' : 'RTR';

                        return {
                          id: `${prefix}-9${Math.floor(10 + Math.random() * 89)}`,
                          name: row.name || `Nuevo Dispositivo ${category.toUpperCase()}`,
                          ip: row.ip || '192.168.0.X',
                          location: row.location || 'SALA PRINCIPAL',
                          details: row.details || 'Equipo registrado mediante carga masiva.',
                          status: 'ONLINE',
                          load: row.load || 'Cargando...',
                          ...(category === 'routers_switches' ? { type: (row.name && row.name.toLowerCase().includes('switch')) ? 'Switch' : 'Router' } : {})
                        };
                      });

                      updatedList = [...infrastructureList, ...newItemsMapped];
                      setBannerMessage(`¡Lote de carga masiva finalizado! Se añadieron ${newItemsMapped.length} equipos de infraestructura a ${title}.`);
                    }

                    persistChanges(updatedList);
                    setIsImportModalOpen(false);
                    setImportRows([]);
                    setFileName('');
                    setShowSuccessBanner(true);
                    
                    // Auto-hide success toast
                    setTimeout(() => {
                      setShowSuccessBanner(false);
                    }, 5000);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>
                    {importTargetItem 
                      ? 'Actualizar Equipo' 
                      : `Confirmar e Importar ${importRows.length} Equipos`
                    }
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL PARA MOSTRAR CÁMARAS ASIGNADAS AL NVR SELECCIONADO */}
        {selectedNvrForCameras && (
          <div id="nvr-cameras-modal-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-150 bg-slate-900 text-white flex items-center justify-between col-span-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg text-white" style={{backgroundColor: '#2563eb'}}>
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white leading-tight">
                      Cámaras CCTV Asignadas al NVR: <span className="font-mono text-blue-400">{selectedNvrForCameras.id}</span>
                    </h2>
                    <p className="text-[10px] text-slate-350 font-medium mt-0.5">
                      {selectedNvrForCameras.name} &bull; IP: <span className="font-mono">{selectedNvrForCameras.ip}</span> &bull; Ubicación: {selectedNvrForCameras.location}
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedNvrForCameras(null)}
                  className="p-1 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-300 transition-colors"
                >
                  Cerrar
                </button>
              </div>

              {/* Main Content Grid Splitter */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-y-auto max-h-[75vh]">
                
                {/* Left Side: Video Matrix Grid */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                      <span className="inline-block w-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      Canales de Transmisión Activos ({allCameras.filter(c => c.assignedNvrId === selectedNvrForCameras.id).length})
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">
                      Compresión H.265+ Activa
                    </span>
                  </div>

                  {/* Camera list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {allCameras.filter(c => c.assignedNvrId === selectedNvrForCameras.id).map((cam) => (
                      <div 
                        key={cam.id} 
                        className="bg-slate-950 text-slate-100 rounded-xl p-4 border border-slate-800 relative overflow-hidden flex flex-col justify-between space-y-3.5 shadow-md hover:border-blue-500/50 transition-all group"
                      >
                        {/* Styled Simulated Video Feed */}
                        <div className="aspect-video w-full bg-slate-900 rounded-lg border border-slate-800/80 relative overflow-hidden flex flex-col justify-between p-2.5 font-mono text-[9px] text-emerald-400">
                          {/* Scanline Effect */}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent pointer-events-none bg-[size:100%_4px]" />
                          
                          <div className="flex justify-between items-start z-10">
                            <span className="bg-black/75 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold tracking-tight">
                              {cam.id}
                            </span>
                            <span className="flex items-center gap-1 bg-black/75 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                              LIVE / 24 FPS
                            </span>
                          </div>

                          <div className="flex justify-between items-end z-10">
                            <div className="bg-black/75 p-1 rounded max-w-[85%]">
                              <p className="font-sans font-extrabold text-white truncate">{cam.name}</p>
                              <p className="truncate text-[8px] text-slate-300">IP: {cam.ip}</p>
                            </div>
                            <span className="bg-blue-600/90 text-white font-bold px-1.5 py-0.5 rounded font-mono text-[8px] border border-blue-450">
                              4K UHD
                            </span>
                          </div>
                        </div>

                        {/* Metadata Details & Unlink action */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] text-slate-350">
                            <div>
                              <p className="text-slate-500 text-[8px] uppercase font-bold">Ubicación</p>
                              <p className="font-bold text-slate-350">{cam.location}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-500 text-[8px] uppercase font-bold">Estado</p>
                              <p className="font-bold text-emerald-400">{cam.status}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-900 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleUnlinkCamera(cam.id)}
                              className="w-full py-1.5 text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 hover:border-rose-500 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all animate-none"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Desvincular Canal IP</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {allCameras.filter(c => c.assignedNvrId === selectedNvrForCameras.id).length === 0 && (
                      <div className="col-span-full border border-dashed border-slate-350 rounded-xl p-8 bg-slate-50 text-center text-slate-400 italic font-medium flex flex-col items-center justify-center space-y-2">
                        <Video className="w-8 h-8 text-slate-400" style={{color: '#94a3b8'}} />
                        <p className="text-xs text-slate-500 font-bold">No hay cámaras asignadas a esta grabadora.</p>
                        <p className="text-[10px] text-slate-400 font-normal">Usa las herramientas de la derecha para vincular una cámara IP existente o registrar una nueva directamente.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Quick Assignment & Creation Panel */}
                <div className="space-y-6 lg:border-l lg:border-slate-150 lg:pl-6">
                  
                  {/* Tool 1: Link Existing Camera */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="text-xs font-black text-slate-950 uppercase tracking-wide flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-blue-600" />
                      Vincular Canal IP Existente
                    </h3>
                    <p className="text-[10px] text-slate-550 font-normal leading-relaxed">Asocia instantáneamente una cámara IP secundaria que se encuentre libre o asignada a otra grabadora.</p>

                    {allCameras.filter(c => c.assignedNvrId !== selectedNvrForCameras.id).length > 0 ? (
                      <div className="space-y-2 pt-1">
                        <select
                          id="link-existing-cam-select"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleLinkCamera(e.target.value);
                              e.target.value = ''; // Reset select state
                            }
                          }}
                          className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white font-bold text-xs cursor-pointer"
                          defaultValue=""
                        >
                          <option value="" disabled>Seleccione una cámara para vincular...</option>
                          {allCameras.filter(c => c.assignedNvrId !== selectedNvrForCameras.id).map(c => (
                            <option key={c.id} value={c.id}>
                              {c.id} - {c.name} ({c.location}) {c.assignedNvrId ? `[Actual: ${c.assignedNvrId}]` : '[Sin Grabadora]'}
                            </option>
                          ))}
                        </select>
                        <p className="text-[9px] text-blue-600 font-medium">Reasociar cámaras reconfigura dinámicamente los registros de transmisión y almacenamiento en tiempo real.</p>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic">No hay cámaras externas disponibles en el sistema.</div>
                    )}
                  </div>

                  {/* Tool 2: Create brand new Camera directly linked here */}
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-black text-slate-950 uppercase tracking-wide flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      Instalar Nueva Cámara IP Directa
                    </h3>
                    <p className="text-[10px] text-slate-550 font-normal leading-relaxed">Registra e instala un canal de video totalmente nuevo directamente sobre este NVR en un solo paso.</p>

                    <form onSubmit={handleCreateAndLinkCamera} className="space-y-3 pt-1 text-xs text-slate-700">
                      <div className="space-y-1">
                        <label className="block text-slate-600 text-[10px] font-bold">Nombre del Domo/Bala *</label>
                        <input 
                          type="text"
                          required
                          placeholder="Ej. Domo PTZ Exterior Bóveda"
                          value={quickCamName}
                          onChange={(e) => setQuickCamName(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-650 bg-slate-50 font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-slate-600 text-[10px] font-bold">Dirección IP</label>
                          <input 
                            type="text"
                            placeholder="Ej. 192.168.0.45"
                            value={quickCamIp}
                            onChange={(e) => setQuickCamIp(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-slate-600 text-[10px] font-bold">Ubicación</label>
                          <input 
                            type="text"
                            placeholder="Ej. BÓVEDA SECUNDARIA"
                            value={quickCamLocation}
                            onChange={(e) => setQuickCamLocation(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 font-sans">
                        <label className="block text-slate-600 text-[10px] font-bold font-sans">Notas y Detalles Técnicos</label>
                        <textarea 
                          rows={2}
                          placeholder="Especificaciones o interfaces (4MP Varifocal, IK10)..."
                          value={quickCamDetails}
                          onChange={(e) => setQuickCamDetails(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50 text-[11px] font-normal"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2 bg-[#0c66e4] hover:bg-[#0055cc] hover:shadow-md text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 text-white" />
                        <span>Instalar y Vincular Canal</span>
                      </button>
                    </form>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedNvrForCameras(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Entendido, Cerrar Canales
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

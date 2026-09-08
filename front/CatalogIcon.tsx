import React from 'react';
import { 
  Laptop, Camera, Keyboard, Mouse, Monitor, Printer, Video, Volume2, 
  Mic, Package, Building2, MapPin, Users, Shield, Tag, Sliders, 
  Wrench, Wifi, HardDrive, Cpu, Smartphone, Tv, CheckCircle2, Box, HelpCircle,
  FileKey, FileText, Award, AlertTriangle, HeartHandshake, Trash2, Clock, Settings,
  Database, Terminal, Key, ShieldCheck
} from 'lucide-react';

interface CatalogIconProps {
  name?: string;
  className?: string;
}

export function CatalogIcon({ name = 'Package', className = 'w-4 h-4' }: CatalogIconProps) {
  const iconMap: Record<string, React.ElementType> = {
    Laptop,
    Camera,
    Keyboard,
    Mouse,
    Monitor,
    Printer,
    Video,
    Volume2,
    Mic,
    Package,
    Building2,
    MapPin,
    Users,
    Shield,
    Tag,
    Sliders,
    Wrench,
    Wifi,
    HardDrive,
    Cpu,
    Smartphone,
    Tv,
    CheckCircle2,
    Box,
    FileKey,
    FileText,
    Award,
    AlertTriangle,
    HeartHandshake,
    Trash2,
    Clock,
    Settings,
    Database,
    Terminal,
    Key,
    ShieldCheck,
    HelpCircle
  };

  const IconComponent = iconMap[name] || Package;
  return <IconComponent className={className} />;
}

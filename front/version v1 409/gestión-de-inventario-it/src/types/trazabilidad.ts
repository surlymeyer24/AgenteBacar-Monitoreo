// Types for Trazabilidad Stock ↔ Agente (CyberWatch / Bacarsa)

export type OrigenAlta = 
  | 'STOCK' 
  | 'DETECTADA_POR_AGENTE' 
  | 'DETECTADA_VINCULADA_RETRO' 
  | 'LEGACY';

export type EstadoConciliacion = 
  | 'SIN_BASELINE' 
  | 'BASELINE_LISTO' 
  | 'PENDIENTE' 
  | 'COINCIDE' 
  | 'DISCREPANCIA' 
  | 'NO_APLICA';

export type TipoEquipo = 'mini_pc' | 'desktop' | 'notebook';

export type CondicionEquipo = 'nueva' | 'usada';

export interface PerifericoStockItem {
  id: string;
  tipo: 'monitor' | 'teclado' | 'mouse' | 'otro';
  nombre: string;
  fabricante: string;
  modelo: string;
  numero_serie: string;
  estado: 'disponible' | 'asignado' | 'en_combo' | 'baja';
  ubicacion: string;
}

export interface PerifericoBaseline {
  tipo: 'monitor' | 'teclado' | 'mouse' | 'otro';
  id_stock: string;
  nombre: string;
  fabricante: string;
  numero_serie: string;
}

export interface BaselineEsperado {
  cpu_modelo: string;
  ram_total_gb: number;
  disco_resumen: string;
  perifericos: PerifericoBaseline[];
  armado_at: string;
  armado_por: string;
}

export interface LadoAgente {
  hostname: string;
  cpu: string;
  ram_gb: number;
  disco?: string;
  monitor?: string;
  serial_monitor?: string;
  teclado?: string;
  mouse?: string;
  anydesk_id?: string;
  ip?: string;
  version_agente?: string;
  ultimo_reporte?: string;
}

export interface LadoStock {
  id: string;
  uuid: string;
  hostname: string;
  tipo: TipoEquipo;
  condicion: CondicionEquipo;
  combo: string;
  cpu_esperada?: string;
  ram_esperada_gb?: number;
  disco_esperado?: string;
  perifericos?: PerifericoBaseline[];
  responsable?: string;
  ubicacion?: string;
  fecha_alta?: string;
}

export interface SugerenciaConciliacion {
  id: string;
  score: number; // 0 - 100
  lado_agente: LadoAgente;
  lado_stock: LadoStock;
  campos_coincidentes: string[];
  campos_diferentes: string[];
  nota_match: string;
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO' | 'POSTERGADO';
  fecha_sugerencia: string;
  nivel_confianza?: 'alta' | 'revision_manual' | 'baja';
}

export type TipoResolucionDiscrepancia = 'autorizado' | 'no_autorizado' | 'falso_positivo';

export interface DiscrepanciaResolucion {
  id: string;
  campo: 'cpu' | 'ram' | 'disco' | 'monitor' | 'periferico';
  campo_label: string;
  valor_esperado: string;
  valor_real: string;
  tipo_resolucion: TipoResolucionDiscrepancia;
  nota_it: string;
  resuelto_por: string;
  resuelto_at: string;
}

export interface ComputadoraTrazable {
  uuid: string;
  hostname: string;
  tipo_equipo: TipoEquipo;
  condicion: CondicionEquipo;
  origen_alta: OrigenAlta;
  estado_conciliacion: EstadoConciliacion;
  baseline_esperado?: BaselineEsperado;
  hardware_real?: {
    cpu: string;
    ram_gb: number;
    disco_resumen: string;
    monitores: Array<{ nombre: string; resolucion: string; serial?: string; fabricante?: string }>;
    teclado?: string;
    mouse?: string;
    anydesk_id?: string;
    ip_publica?: string;
    ultimo_reporte?: string;
  };
  responsable?: string;
  ubicacion?: string;
  sector?: string;
  anydesk_id?: string;
  dias_sin_agente?: number;
  resoluciones_discrepancia?: DiscrepanciaResolucion[];
  fecha_alta_stock?: string;
  combo_resumen?: string;
  es_legacy?: boolean;
}

export interface KpisTrazabilidad {
  total_computadoras: number;
  porcentaje_validadas: number;
  discrepancias_abiertas: number;
  tiempo_medio_stock_agente_dias: number;
  pcs_mas_30_dias_sin_agente: number;
  sugerencias_pendientes: number;
  stock_sin_agente: number;
  detectadas_sin_validar: number;
}

export interface CambioHardwareDetectado {
  id: string;
  uuid: string;
  hostname: string;
  tipo_componente: 'ram' | 'monitor' | 'disco' | 'cpu';
  tipo_evento: 'agregado' | 'removido' | 'modificado';
  valor_esperado: string;
  valor_detectado: string;
  explicacion_cambio: string;
  timestamp: string;
  estado_seguimiento: 'pendiente' | 'en_revision' | 'autorizado' | 'no_autorizado' | 'falso_positivo';
  responsable?: string;
  sector?: string;
  nota_it?: string;
  revisado_por?: string;
  revisado_en?: string;
}

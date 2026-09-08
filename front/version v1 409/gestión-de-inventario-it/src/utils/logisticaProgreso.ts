export interface ItemProgreso {
  id: string;
  etiquetado: boolean;
  fechaEtiquetado?: string;
  embalado: boolean;
  fechaEmbalado?: string;
  enDestino: boolean;
  fechaEnDestino?: string;
  notas?: string;
}

export interface FichaLogisticaProgreso {
  uuid: string;
  hostname: string;
  ubicacionOrigen?: string;
  ubicacionDestino?: string;
  notaGeneral?: string;
  tecnicoResponsable?: string;
  ultimaModificacion: string;
  items: Record<string, ItemProgreso>;
}

export type EstadoGeneralPuesto = 
  | 'PENDIENTE' 
  | 'ETIQUETANDO' 
  | 'ETIQUETADO_TOTAL' 
  | 'EMBALANDO' 
  | 'EMBALADO_LISTO' 
  | 'EN_DESTINO_PARCIAL' 
  | 'LISTO_EN_DESTINO';

const STORAGE_KEY_PREFIX = 'bacar_logistica_progreso_';
const STORAGE_INDEX_KEY = 'bacar_logistica_progreso_index';

/**
 * Carga el estado de progreso de una ficha por su UUID
 */
export function getProgresoFicha(uuid: string): FichaLogisticaProgreso | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${uuid}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer progreso de localStorage:', e);
    return null;
  }
}

/**
 * Guarda el estado de progreso de una ficha en localStorage y actualiza el índice global
 */
export function saveProgresoFicha(progreso: FichaLogisticaProgreso): void {
  try {
    progreso.ultimaModificacion = new Date().toISOString();
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${progreso.uuid}`, JSON.stringify(progreso));

    // Actualizar índice para listas generales
    const indexRaw = localStorage.getItem(STORAGE_INDEX_KEY);
    const index: Record<string, { estado: EstadoGeneralPuesto; pctGlobal: number; etiquetadoPct: number; embaladoPct: number; destinoPct: number }> = indexRaw ? JSON.parse(indexRaw) : {};
    
    const resumen = calcularResumenProgreso(progreso);
    index[progreso.uuid] = {
      estado: resumen.estadoGeneral,
      pctGlobal: resumen.porcentajeGlobal,
      etiquetadoPct: resumen.porcentajeEtiquetado,
      embaladoPct: resumen.porcentajeEmbalado,
      destinoPct: resumen.porcentajeEnDestino,
    };

    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(index));
  } catch (e) {
    console.error('Error al guardar progreso en localStorage:', e);
  }
}

/**
 * Obtiene el índice de progreso de todas las fichas guardadas
 */
export function getAllProgresoIndex(): Record<string, { estado: EstadoGeneralPuesto; pctGlobal: number; etiquetadoPct: number; embaladoPct: number; destinoPct: number }> {
  try {
    const indexRaw = localStorage.getItem(STORAGE_INDEX_KEY);
    return indexRaw ? JSON.parse(indexRaw) : {};
  } catch (e) {
    return {};
  }
}

export interface ResumenProgresoCalculado {
  totalItems: number;
  cantEtiquetados: number;
  cantEmbalados: number;
  cantEnDestino: number;
  porcentajeEtiquetado: number;
  porcentajeEmbalado: number;
  porcentajeEnDestino: number;
  porcentajeGlobal: number; // Promedio ponderado de las 3 fases
  estadoGeneral: EstadoGeneralPuesto;
  etiquetaEstado: string;
  colorBadge: string;
}

/**
 * Calcula porcentajes y estado general a partir de los items de la ficha
 */
export function calcularResumenProgreso(
  progreso: FichaLogisticaProgreso | null, 
  totalItemsDisponibles?: number
): ResumenProgresoCalculado {
  const items = Object.values(progreso?.items || {});
  const totalItems = totalItemsDisponibles !== undefined ? totalItemsDisponibles : items.length;

  if (totalItems === 0) {
    return {
      totalItems: 0,
      cantEtiquetados: 0,
      cantEmbalados: 0,
      cantEnDestino: 0,
      porcentajeEtiquetado: 0,
      porcentajeEmbalado: 0,
      porcentajeEnDestino: 0,
      porcentajeGlobal: 0,
      estadoGeneral: 'PENDIENTE',
      etiquetaEstado: 'Pendiente',
      colorBadge: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }

  const cantEtiquetados = items.filter(i => i.etiquetado).length;
  const cantEmbalados = items.filter(i => i.embalado).length;
  const cantEnDestino = items.filter(i => i.enDestino).length;

  const pctEtiquetado = Math.round((cantEtiquetados / totalItems) * 100);
  const pctEmbalado = Math.round((cantEmbalados / totalItems) * 100);
  const pctEnDestino = Math.round((cantEnDestino / totalItems) * 100);

  // Ponderación: 30% etiquetado, 35% embalado, 35% en destino
  const pctGlobal = Math.round((pctEtiquetado * 0.3) + (pctEmbalado * 0.35) + (pctEnDestino * 0.35));

  let estadoGeneral: EstadoGeneralPuesto = 'PENDIENTE';
  let etiquetaEstado = 'Sin Iniciar';
  let colorBadge = 'bg-slate-100 text-slate-700 border-slate-300';

  if (cantEnDestino === totalItems && totalItems > 0) {
    estadoGeneral = 'LISTO_EN_DESTINO';
    etiquetaEstado = 'Listo en Destino ✓';
    colorBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
  } else if (cantEnDestino > 0) {
    estadoGeneral = 'EN_DESTINO_PARCIAL';
    etiquetaEstado = `En Destino (${cantEnDestino}/${totalItems})`;
    colorBadge = 'bg-teal-100 text-teal-800 border-teal-300 font-bold';
  } else if (cantEmbalados === totalItems && totalItems > 0) {
    estadoGeneral = 'EMBALADO_LISTO';
    etiquetaEstado = 'Embalado Completo 📦';
    colorBadge = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
  } else if (cantEmbalados > 0) {
    estadoGeneral = 'EMBALANDO';
    etiquetaEstado = `Embalando (${cantEmbalados}/${totalItems})`;
    colorBadge = 'bg-orange-100 text-orange-800 border-orange-300 font-semibold';
  } else if (cantEtiquetados === totalItems && totalItems > 0) {
    estadoGeneral = 'ETIQUETADO_TOTAL';
    etiquetaEstado = 'Etiquetado 100% 🏷️';
    colorBadge = 'bg-blue-100 text-blue-800 border-blue-300 font-semibold';
  } else if (cantEtiquetados > 0) {
    estadoGeneral = 'ETIQUETANDO';
    etiquetaEstado = `Etiquetando (${cantEtiquetados}/${totalItems})`;
    colorBadge = 'bg-indigo-100 text-indigo-800 border-indigo-300 font-medium';
  }

  return {
    totalItems,
    cantEtiquetados,
    cantEmbalados,
    cantEnDestino,
    porcentajeEtiquetado: pctEtiquetado,
    porcentajeEmbalado: pctEmbalado,
    porcentajeEnDestino: pctEnDestino,
    porcentajeGlobal: pctGlobal,
    estadoGeneral,
    etiquetaEstado,
    colorBadge,
  };
}

export interface BulkUpdateItemParam {
  uuid: string;
  hostname: string;
  ubicacion?: string;
  cantidadMonitores?: number;
  cantidadPerifericos?: number;
}

/**
 * Actualiza masivamente una o todas las fases de un grupo de equipos seleccionados
 */
export function actualizarFaseMasiva(
  items: BulkUpdateItemParam[],
  fase: 'etiquetado' | 'embalado' | 'enDestino' | 'todas',
  valor: boolean
): number {
  let modificados = 0;
  const now = new Date().toISOString();

  items.forEach(item => {
    let progreso = getProgresoFicha(item.uuid);
    
    if (!progreso) {
      // Inicializar items estándar para este puesto
      const itemsInit: Record<string, ItemProgreso> = {
        [`pc-${item.uuid}`]: {
          id: `pc-${item.uuid}`,
          etiquetado: false,
          embalado: false,
          enDestino: false,
        },
      };

      const cantMon = item.cantidadMonitores || 0;
      for (let i = 0; i < cantMon; i++) {
        const idMon = `mon-${i}-Monitor ${i + 1}`;
        itemsInit[idMon] = {
          id: idMon,
          etiquetado: false,
          embalado: false,
          enDestino: false,
        };
      }

      const cantPerif = item.cantidadPerifericos || 0;
      for (let i = 0; i < cantPerif; i++) {
        const idPerif = `perif-${i}-Periférico ${i + 1}`;
        itemsInit[idPerif] = {
          id: idPerif,
          etiquetado: false,
          embalado: false,
          enDestino: false,
        };
      }

      progreso = {
        uuid: item.uuid,
        hostname: item.hostname,
        ubicacionOrigen: item.ubicacion,
        ultimaModificacion: now,
        items: itemsInit,
      };
    }

    // Actualizar items de este puesto
    Object.keys(progreso.items).forEach(id => {
      const it = progreso!.items[id];
      if (fase === 'todas') {
        it.etiquetado = valor;
        it.embalado = valor;
        it.enDestino = valor;
        if (valor) {
          if (!it.fechaEtiquetado) it.fechaEtiquetado = now;
          if (!it.fechaEmbalado) it.fechaEmbalado = now;
          if (!it.fechaEnDestino) it.fechaEnDestino = now;
        } else {
          it.fechaEtiquetado = undefined;
          it.fechaEmbalado = undefined;
          it.fechaEnDestino = undefined;
        }
      } else {
        it[fase] = valor;
        if (fase === 'etiquetado') {
          it.fechaEtiquetado = valor ? now : undefined;
        } else if (fase === 'embalado') {
          it.fechaEmbalado = valor ? now : undefined;
        } else if (fase === 'enDestino') {
          it.fechaEnDestino = valor ? now : undefined;
        }
      }
    });

    saveProgresoFicha(progreso);
    modificados++;
  });

  return modificados;
}

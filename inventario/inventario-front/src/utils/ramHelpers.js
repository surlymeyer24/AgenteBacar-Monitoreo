/**
 * Arma la vista de RAM a partir de los datos del agente (modulos + ramPlaca).
 * Si el agente aún no sincronizó módulos, deriva un resumen mínimo desde ramTotalGb.
 */
export function getComputerRamDetails(computadora) {
  const modulosApi = computadora?.modulos ?? [];
  const placa = computadora?.ramPlaca ?? {};

  const modulosConCapacidad = modulosApi.filter(m => (Number(m.capacidadGB) || 0) > 0);
  const ocupadosApi = modulosApi.filter(esModuloOcupado);

  const totalGb = Number(computadora?.ramTotalGb) > 0
    ? Number(computadora.ramTotalGb)
    : modulosConCapacidad.reduce((acc, m) => acc + (Number(m.capacidadGB) || 0), 0);

  const usagePct = Number(computadora?.ramUsoPorcentaje);
  const porcentajeUso = Number.isFinite(usagePct) ? usagePct : null;
  const usedGb = porcentajeUso != null ? (totalGb * porcentajeUso) / 100 : null;
  const freeGb = usedGb != null ? Math.max(0, totalGb - usedGb) : null;

  // Contar slots: solo módulos reales o ram_placa; ram_total_gb no indica cuántos sticks hay.
  let slotsOcupados = Math.max(
    ocupadosApi.length,
    modulosConCapacidad.length,
    Number(placa.slotsOcupados) || 0,
  );

  let slotsTotales = Math.max(
    Number(placa.slotsTotales) || 0,
    modulosApi.length,
    slotsOcupados,
  );
  if (slotsTotales < 1 && slotsOcupados > 0) {
    slotsTotales = slotsOcupados;
  }

  // Fallback: datos viejos del agente suelen reportar solo módulos instalados (máx. 2).
  slotsTotales = corregirSlotsTotales(
    slotsTotales,
    slotsOcupados,
    modulosApi,
    computadora?.tipoEquipo,
  );

  const canalModo = (placa.canalModo ?? '').toLowerCase();
  const canales = canalModo === 'dual'
    ? 'Dual-Channel (128-bit)'
    : slotsOcupados >= 2
      ? 'Dual-Channel (128-bit)'
      : 'Single-Channel (64-bit)';

  const primerOcupado = ocupadosApi[0] || modulosConCapacidad[0];
  const tipoMemoria = primerOcupado?.tecnologia
    || inferirTipoMemoria(computadora)
    || 'DDR4 SDRAM';
  const frecuenciaMhz = primerOcupado?.velocidadMHz
    ? Number(primerOcupado.velocidadMHz)
    : modulosConCapacidad.reduce((max, m) => Math.max(max, Number(m.velocidadMHz) || 0), 0);
  const factorForma = formatearFactorForma(primerOcupado);

  let modulos = modulosApi.length > 0
    ? modulosApi.map(mapearModuloRam)
    : [];

  // Sin detalle por módulo: solo total agregado (puede ser 1×8, 2×4, etc.; no se puede saber).
  if (modulos.length === 0 && totalGb > 0) {
    modulos = [{
      ocupado: true,
      slot: 'Total instalado',
      locator: 'Total',
      canal: null,
      fabricante: 'Sin desglose por módulo (agente no sincronizó modulos_ram)',
      capacidadGb: 0,
      capacidadDisplay: `${totalGb.toFixed(1)} GB total`,
      tipo: tipoMemoria,
      velocidadMhz: frecuenciaMhz,
      partNumber: null,
      numeroSerie: null,
      factorForma,
      voltaje: null,
      pines: null,
      inferido: true,
      resumenTotal: true,
    }];
  }

  // Ranuras vacías explícitas del agente + slots libres inferidos
  const vaciosAgente = modulos.filter(m => !m.ocupado);
  if (vaciosAgente.length === 0 && slotsTotales > slotsOcupados) {
    for (let i = slotsOcupados + 1; i <= slotsTotales; i += 1) {
      modulos.push({
        ocupado: false,
        slot: `Slot ${i}`,
        locator: `Slot ${i}`,
        inferido: true,
      });
    }
  }

  const mostrarSeccionRam = modulos.length > 0
    || (Number(placa.slotsTotales) || 0) > 0
    || totalGb > 0;

  const slotsEtiqueta = slotsTotales > 0
    ? `${slotsOcupados} de ${slotsTotales}`
    : null;

  return {
    totalGb: totalGb || 0,
    enUsoGb: usedGb != null ? Number(usedGb.toFixed(2)) : null,
    libreGb: freeGb != null ? Number(freeGb.toFixed(2)) : null,
    porcentajeUso,
    tipoMemoria,
    frecuenciaMhz,
    factorForma,
    canales,
    slotsTotales,
    slotsOcupados,
    slotsEtiqueta,
    maxCapacidadGb: placa.maxCapacidadGb ?? null,
    modulos,
    mostrarSeccionRam,
  };
}

function slotsTipicosPorTipo(tipoEquipo) {
  const tipo = (tipoEquipo?.tipo ?? '').toLowerCase();
  if (tipo === 'notebook' || tipo === 'tablet') return 2;
  if (tipo === 'servidor') return 8;
  if (tipo === 'desktop' || tipo === 'all-in-one') return 4;
  return 4;
}

function modulosSonSodimm(modulos) {
  if (!modulos?.length) return false;
  return modulos.every(m => String(m.formFactor ?? '').toUpperCase().includes('SODIMM'));
}

function modulosSonDimm(modulos) {
  if (!modulos?.length) return false;
  return modulos.every(m => String(m.formFactor ?? '').toUpperCase() === 'DIMM');
}

/** Corrige subconteo típico cuando WMI solo reporta sticks instalados. */
function corregirSlotsTotales(slotsTotales, slotsOcupados, modulos, tipoEquipo) {
  const slotsTipo = slotsTipicosPorTipo(tipoEquipo);
  const esSodimm = modulosSonSodimm(modulos);
  const esDimm = modulosSonDimm(modulos);
  let slots = Math.max(slotsTotales, slotsOcupados);

  if (slots <= slotsOcupados || slots <= 2) {
    if (esSodimm) {
      slots = Math.max(slots, Math.min(slotsTipo, 2));
    } else if (esDimm && slotsTipo >= 4) {
      slots = Math.max(slots, 4);
    } else if (slotsTipo > slotsOcupados) {
      slots = Math.max(slots, slotsTipo);
    }
  }

  if (esDimm && slotsTipo >= 4 && slots <= 2 && slotsOcupados <= 2) {
    slots = Math.max(slots, 4);
  }

  return Math.max(slots, slotsOcupados);
}

/** Módulo ocupado si el agente lo marca así o reporta capacidad > 0. */
function esModuloOcupado(m) {
  if (m?.ocupado === false) return false;
  if (m?.ocupado === true) return true;
  return (Number(m?.capacidadGB) || 0) > 0;
}

function mapearModuloRam(m, idx) {
  const capacidadGb = Number(m.capacidadGB) || 0;
  const ocupado = m.ocupado === false ? false : (m.ocupado === true || capacidadGb > 0);
  const locator = m.locator || '';
  const slotBase = m.slot || locator || `Slot ${idx + 1}`;
  const slotLabel = formatearEtiquetaSlot(slotBase, locator, m.canal, idx);
  const voltaje = m.voltajeV != null ? `${Number(m.voltajeV).toFixed(2)}V` : null;
  const factorForma = formatearFactorForma(m);

  return {
    ocupado,
    slot: slotLabel,
    locator: locator || slotBase,
    canal: m.canal,
    fabricante: m.fabricante || '—',
    capacidadGb: Number(m.capacidadGB) || 0,
    tipo: m.tecnologia || '—',
    velocidadMhz: Number(m.velocidadMHz) || 0,
    partNumber: m.modelo && m.modelo !== 'N/A' ? m.modelo : null,
    numeroSerie: m.numeroSerie && m.numeroSerie !== 'N/A' ? m.numeroSerie : null,
    factorForma,
    voltaje,
    pines: m.pines || null,
  };
}

function formatearFactorForma(modulo) {
  if (!modulo) return 'DIMM (288-pin)';
  if (modulo.formFactor) {
    const ff = String(modulo.formFactor);
    if (modulo.pines) {
      const p = String(modulo.pines).includes('pin') ? modulo.pines : `${modulo.pines}-pin`;
      return `${ff} (${p})`;
    }
    return ff === 'DIMM' ? 'DIMM (288-pin)' : ff;
  }
  if (modulo.pines) {
    const p = String(modulo.pines).includes('pin') ? modulo.pines : `${modulo.pines}-pin`;
    return `DIMM (${p})`;
  }
  return 'DIMM (288-pin)';
}

function formatearEtiquetaSlot(slot, locator, canal, idx) {
  if (locator && locator !== slot && !locator.startsWith('Slot ')) {
    const canalTxt = canal && canal !== 'N/A' ? ` / Canal ${canal}` : '';
    return `${slot}${canalTxt ? ` (${locator}${canalTxt})` : ` (${locator})`}`;
  }
  if (canal && canal !== 'N/A') {
    return `${slot} (Canal ${canal})`;
  }
  return slot || `Slot ${idx + 1}`;
}

function inferirTipoMemoria(computadora) {
  const proc = [
    computadora?.procesador?.detallado?.generacion,
    computadora?.procesador?.gama,
    computadora?.procesador?.nombreRaw,
    computadora?.procesador?.detallado?.nombreCompleto,
  ].filter(Boolean).join(' ').toLowerCase();

  if (proc.includes('13') || proc.includes('14') || proc.includes('ryzen 9 9')) {
    return 'DDR5 SDRAM';
  }
  return null;
}

/** Etiqueta legible del procesador con gama/modelo si el agente los reportó. */
export function getProcesadorDisplay(computadora) {
  const p = computadora?.procesador;
  const d = p?.detallado;
  const nombre = d?.nombreCompleto || p?.nombreRaw || '—';
  const gama = d?.gama || p?.gama;
  const modelo = d?.modelo || p?.modelo;
  const generacion = d?.generacion ?? p?.generacion;
  const nucleosFisicos = Number(d?.nucleosFisicos ?? p?.nucleosFisicos ?? computadora?.nucleosFisicos) || 0;
  const nucleosLogicos = Number(d?.nucleosLogicos ?? p?.nucleosLogicos) || nucleosFisicos;
  const frecuenciaMaxMhz = Number(d?.frecuenciaMaxMhz ?? p?.frecuenciaMaxMhz) || 0;
  const fabricante = d?.fabricante || p?.fabricante || inferirFabricante(nombre);

  const gamaEtiqueta = formatearGamaCpu(fabricante, gama, modelo);
  const modeloBadge = gama && modelo ? `${gama.startsWith('i') ? `Core ${gama}` : gama}-${modelo}` : modelo;

  let subtitulo = null;
  if (gama && modelo) {
    subtitulo = `${gamaEtiqueta} · ${modelo}${generacion != null ? ` · Gen ${generacion}` : ''}`;
  } else if (gama) {
    subtitulo = gamaEtiqueta;
  }

  let nucleosTexto = null;
  if (nucleosFisicos > 0 && nucleosLogicos > 0 && nucleosLogicos !== nucleosFisicos) {
    nucleosTexto = `${nucleosFisicos}C / ${nucleosLogicos}T`;
  } else if (nucleosFisicos > 0) {
    nucleosTexto = `${nucleosFisicos}C / ${nucleosLogicos || nucleosFisicos}T`;
  }

  const tieneDetalle = Boolean(gama || modelo || generacion != null || frecuenciaMaxMhz > 0);

  return {
    nombre,
    subtitulo,
    gama,
    gamaEtiqueta,
    modelo,
    modeloBadge,
    generacion,
    nucleosFisicos,
    nucleosLogicos,
    nucleosTexto,
    frecuenciaMaxMhz,
    fabricante,
    fabricanteCorp: etiquetaFabricanteCorp(fabricante),
    gamaSerieSub: subtituloSerieCpu(gama, fabricante),
    tieneDetalle,
  };
}

/** Vista unificada de ram_placa + detalle calculado. */
export function getRamPlacaDisplay(computadora, ramDetails) {
  const placa = computadora?.ramPlaca ?? {};
  const canalModo = (placa.canalModo ?? ramDetails.canales ?? '').toString().toLowerCase().includes('dual')
    ? 'dual'
    : 'single';

  return {
    slotsTotales: ramDetails.slotsTotales,
    slotsOcupados: ramDetails.slotsOcupados,
    canalModo,
    maxCapacidadGb: placa.maxCapacidadGb ?? ramDetails.maxCapacidadGb ?? null,
  };
}

function inferirFabricante(nombre) {
  const n = (nombre ?? '').toLowerCase();
  if (n.includes('amd') || n.includes('ryzen')) return 'AMD';
  if (n.includes('intel')) return 'Intel';
  return 'Desconocido';
}

function formatearGamaCpu(fabricante, gama, modelo) {
  if (!gama) return modelo || '—';
  const f = (fabricante ?? '').toLowerCase();
  if (f.includes('amd') || gama.toLowerCase().includes('ryzen')) {
    return gama.toLowerCase().includes('ryzen') ? gama : `Ryzen ${gama.replace(/\D/g, '') || gama}`;
  }
  if (/^i[3579]$/i.test(gama)) return `Core ${gama}`;
  return gama;
}

function etiquetaFabricanteCorp(fabricante) {
  if ((fabricante ?? '').toLowerCase().includes('amd')) return 'Advanced Micro Devices';
  if ((fabricante ?? '').toLowerCase().includes('intel')) return 'Intel Corp.';
  return fabricante || '—';
}

function subtituloSerieCpu(gama, fabricante) {
  if (!gama) return 'Serie estándar';
  const g = gama.toLowerCase();
  if (g.includes('i7') || g.includes('ryzen 7') || g.includes('ryzen 9')) return 'Gama alta rendimiento';
  if (g.includes('i5') || g.includes('ryzen 5')) return 'Gama media IT';
  if (g.includes('i3') || g.includes('ryzen 3')) return 'Gama entrada / oficina';
  return (fabricante ?? '').includes('AMD') ? 'Serie AMD' : 'Serie Intel';
}

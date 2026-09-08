import { AgentComputer, RamDetalles, RamModulo } from '../types';

/**
 * Returns complete RAM details for an AgentComputer.
 * If the computer already has custom `ram_detalles`, returns them with updated usage stats.
 * Otherwise, generates consistent, realistic hardware memory modules based on system specs.
 */
export function getComputerRamDetails(computer: AgentComputer): RamDetalles {
  const totalGb = computer.ram_total_gb > 0 ? computer.ram_total_gb : 8;
  const usagePct = computer.ram_uso_porcentaje || 50;
  const usedGb = (totalGb * usagePct) / 100;
  const freeGb = Math.max(0, totalGb - usedGb);

  // If already explicitly defined in the computer object
  if (computer.ram_detalles && computer.ram_detalles.modulos.length > 0) {
    return {
      ...computer.ram_detalles,
      total_gb: totalGb,
      en_uso_gb: Number(usedGb.toFixed(2)),
      libre_gb: Number(freeGb.toFixed(2)),
      porcentaje_uso: usagePct,
      max_capacidad_gb: computer.ram_placa?.max_capacidad_gb || computer.ram_detalles.max_capacidad_gb || (computer.ram_detalles.slots_totales * 16),
      slots_totales: computer.ram_placa?.slots_totales || computer.ram_detalles.slots_totales,
      slots_ocupados: computer.ram_placa?.slots_ocupados || computer.ram_detalles.slots_ocupados,
      canales: computer.ram_placa?.canal_modo ? (computer.ram_placa.canal_modo.toLowerCase() === 'dual' ? 'Dual-Channel (128-bit)' : 'Single-Channel (64-bit)') : computer.ram_detalles.canales,
    };
  }

  // Derive intelligent, realistic RAM hardware specs based on total RAM, CPU/OS and ram_placa
  const isLaptop = (computer.hostname.toLowerCase().includes('note') || 
                    computer.hostname.toLowerCase().includes('laptop') || 
                    computer.hostname.toLowerCase().includes('guada'));
  const factorForma = isLaptop ? 'SO-DIMM (260-pin)' : 'DIMM (288-pin)';
  const isModernDdr5 = computer.procesador.toLowerCase().includes('12') || computer.procesador.toLowerCase().includes('13') || computer.procesador.toLowerCase().includes('ryzen 7');
  const isLegacyGen3 = computer.procesador_detallado?.generacion === 3 || computer.procesador.includes('i5-3470') || computer.procesador.includes('Model 42') || computer.procesador.includes('Model 158');
  const tipoMemoria = isModernDdr5 ? 'DDR5 SDRAM' : (isLegacyGen3 && computer.procesador_detallado?.generacion === 3 ? 'DDR3 SDRAM' : 'DDR4 SDRAM');
  const frecuenciaBase = isModernDdr5 ? 4800 : (tipoMemoria === 'DDR3 SDRAM' ? 1600 : (totalGb >= 16 ? 3200 : 2666));

  let slotsTotales = computer.ram_placa?.slots_totales || (isLaptop ? 2 : 4);
  let slotsOcupados = computer.ram_placa?.slots_ocupados || 1;
  let canales = computer.ram_placa?.canal_modo 
    ? (computer.ram_placa.canal_modo.toLowerCase() === 'dual' ? 'Dual-Channel (128-bit)' : 'Single-Channel (64-bit)')
    : 'Single-Channel (64-bit)';
  const maxCapacidadGb = computer.ram_placa?.max_capacidad_gb || (slotsTotales * 16);
  const modulos: RamModulo[] = [];

  // Determine configuration based on total GB
  if (totalGb >= 28) { // ~32 GB
    slotsOcupados = 2;
    canales = 'Dual-Channel (128-bit)';
    modulos.push({
      slot: 'Slot 1 (DIMM A1 / Canal A)',
      capacidad_gb: 16,
      tipo: tipoMemoria,
      velocidad_mhz: frecuenciaBase,
      fabricante: 'Kingston Fury Beast',
      part_number: 'KF432C16BB1/16',
      numero_serie: '9C28FA10',
      factor_forma: factorForma,
      voltaje: '1.35V'
    });
    modulos.push({
      slot: 'Slot 2 (DIMM B1 / Canal B)',
      capacidad_gb: 16,
      tipo: tipoMemoria,
      velocidad_mhz: frecuenciaBase,
      fabricante: 'Kingston Fury Beast',
      part_number: 'KF432C16BB1/16',
      numero_serie: '9C28FA11',
      factor_forma: factorForma,
      voltaje: '1.35V'
    });
  } else if (totalGb >= 14) { // ~16 GB
    slotsOcupados = 2;
    canales = 'Dual-Channel (128-bit)';
    modulos.push({
      slot: 'Slot 1 (DIMM 1 / Canal A)',
      capacidad_gb: 8,
      tipo: tipoMemoria,
      velocidad_mhz: frecuenciaBase,
      fabricante: 'Samsung Electronics',
      part_number: 'M471A1K43DB1-CWE',
      numero_serie: '48F29A01',
      factor_forma: factorForma,
      voltaje: '1.20V'
    });
    modulos.push({
      slot: 'Slot 2 (DIMM 2 / Canal B)',
      capacidad_gb: 8,
      tipo: tipoMemoria,
      velocidad_mhz: frecuenciaBase,
      fabricante: 'Samsung Electronics',
      part_number: 'M471A1K43DB1-CWE',
      numero_serie: '48F29A02',
      factor_forma: factorForma,
      voltaje: '1.20V'
    });
  } else if (totalGb >= 10) { // ~12-14 GB
    slotsOcupados = 2;
    canales = 'Dual-Channel (Asimétrico Flex)';
    modulos.push({
      slot: 'Slot 1 (DIMM 1 / Canal A)',
      capacidad_gb: 8,
      tipo: 'DDR4 SDRAM',
      velocidad_mhz: 2666,
      fabricante: 'Crucial Micron',
      part_number: 'CT8G4SFRA266',
      numero_serie: '2987110A',
      factor_forma: factorForma,
      voltaje: '1.20V'
    });
    modulos.push({
      slot: 'Slot 2 (DIMM 2 / Canal B)',
      capacidad_gb: 8,
      tipo: 'DDR4 SDRAM',
      velocidad_mhz: 2666,
      fabricante: 'Crucial Micron',
      part_number: 'CT8G4SFRA266',
      numero_serie: '2987110B',
      factor_forma: factorForma,
      voltaje: '1.20V'
    });
  } else if (totalGb >= 7) { // ~8 GB
    if (slotsOcupados === 2 || computer.ram_placa?.slots_ocupados === 2) {
      slotsOcupados = 2;
      canales = 'Dual-Channel (128-bit)';
      modulos.push({
        slot: 'Slot 1 (DIMM 1 / Canal A)',
        capacidad_gb: 4,
        tipo: tipoMemoria,
        velocidad_mhz: frecuenciaBase,
        fabricante: 'Kingston ValueRAM',
        part_number: tipoMemoria === 'DDR3 SDRAM' ? 'KVR16N11S8/4' : 'KVR26N19S6/4',
        numero_serie: '73B182C0',
        factor_forma: factorForma,
        voltaje: tipoMemoria === 'DDR3 SDRAM' ? '1.50V' : '1.20V'
      });
      modulos.push({
        slot: 'Slot 2 (DIMM 2 / Canal B)',
        capacidad_gb: 4,
        tipo: tipoMemoria,
        velocidad_mhz: frecuenciaBase,
        fabricante: 'Kingston ValueRAM',
        part_number: tipoMemoria === 'DDR3 SDRAM' ? 'KVR16N11S8/4' : 'KVR26N19S6/4',
        numero_serie: '73B182C1',
        factor_forma: factorForma,
        voltaje: tipoMemoria === 'DDR3 SDRAM' ? '1.50V' : '1.20V'
      });
    } else {
      slotsOcupados = 1;
      canales = 'Single-Channel (64-bit)';
      modulos.push({
        slot: 'Slot 1 (DIMM A1 / Canal A)',
        capacidad_gb: 8,
        tipo: tipoMemoria,
        velocidad_mhz: frecuenciaBase,
        fabricante: 'Kingston ValueRAM',
        part_number: 'KVR26N19S8/8',
        numero_serie: '73B182C0',
        factor_forma: factorForma,
        voltaje: '1.20V'
      });
    }
  } else if (totalGb >= 5) { // ~6 GB
    slotsOcupados = 2;
    canales = 'Dual-Channel (Asimétrico)';
    modulos.push({
      slot: 'Slot 1 (DIMM 1)',
      capacidad_gb: 4,
      tipo: 'DDR3/DDR4 SDRAM',
      velocidad_mhz: 2400,
      fabricante: 'Samsung Electronics',
      part_number: 'M378A5244CB0-CRC',
      numero_serie: '127A8819',
      factor_forma: factorForma,
      voltaje: '1.20V'
    });
    modulos.push({
      slot: 'Slot 2 (DIMM 2)',
      capacidad_gb: 2,
      tipo: 'DDR3/DDR4 SDRAM',
      velocidad_mhz: 2400,
      fabricante: 'Samsung Electronics',
      part_number: 'M378A2838EB1-CRC',
      numero_serie: '127A8820',
      factor_forma: factorForma,
      voltaje: '1.20V'
    });
  } else { // <= 4 GB
    slotsOcupados = 1;
    canales = 'Single-Channel (64-bit)';
    modulos.push({
      slot: 'Slot 1 (DIMM 1)',
      capacidad_gb: 4,
      tipo: 'DDR4 SDRAM',
      velocidad_mhz: 2400,
      fabricante: 'SK Hynix',
      part_number: 'HMA851S6CJR6N-VK',
      numero_serie: 'A491823C',
      factor_forma: factorForma,
      voltaje: '1.20V'
    });
  }

  return {
    total_gb: totalGb,
    en_uso_gb: Number(usedGb.toFixed(2)),
    libre_gb: Number(freeGb.toFixed(2)),
    porcentaje_uso: usagePct,
    tipo_memoria: tipoMemoria,
    frecuencia_mhz: frecuenciaBase,
    factor_forma: factorForma,
    canales: canales,
    slots_totales: slotsTotales,
    slots_ocupados: slotsOcupados,
    max_capacidad_gb: maxCapacidadGb,
    modulos: modulos,
  };
}

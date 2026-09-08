package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.RamPlacaDTO;
import com.bacarsa.inventario.models.RamPlaca;

public class RamPlacaMapper {

    private RamPlacaMapper() {}

    public static RamPlacaDTO toDTO(RamPlaca placa) {
        if (placa == null) {
            return null;
        }
        RamPlacaDTO dto = new RamPlacaDTO();
        dto.setSlotsTotales(placa.getSlotsTotales());
        dto.setSlotsOcupados(placa.getSlotsOcupados());
        dto.setCanalModo(placa.getCanalModo());
        dto.setMaxCapacidadGb(placa.getMaxCapacidadGb());
        return dto;
    }
}

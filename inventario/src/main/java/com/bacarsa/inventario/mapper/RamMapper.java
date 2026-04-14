package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.RamDTO;
import com.bacarsa.inventario.models.Ram;

public class RamMapper {

    private RamMapper() {}

    public static RamDTO toDTO(Ram ram) {
        if (ram == null) {
            return null;
        }
        RamDTO dto = new RamDTO();
        dto.setCapacidadGB(ram.getCapacidadGB());
        dto.setVelocidadMHz(ram.getVelocidadMHz());
        dto.setModelo(ram.getModelo());
        dto.setFabricante(ram.getFabricante());
        return dto;
    }
}

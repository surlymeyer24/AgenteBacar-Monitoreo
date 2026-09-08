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
        dto.setOcupado(ram.isOcupado());
        dto.setSlot(ram.getSlot());
        dto.setLocator(ram.getLocator());
        dto.setBanco(ram.getBanco());
        dto.setCanal(ram.getCanal());
        dto.setCapacidadGB(ram.getCapacidadGB());
        dto.setVelocidadMHz(ram.getVelocidadMHz());
        dto.setModelo(ram.getModelo());
        dto.setFabricante(ram.getFabricante());
        dto.setTecnologia(ram.getTecnologia());
        dto.setNumeroSerie(ram.getNumeroSerie());
        dto.setFormFactor(ram.getFormFactor());
        dto.setPines(ram.getPines() != null ? String.valueOf(ram.getPines()) : null);
        dto.setVoltajeV(ram.getVoltajeV());
        dto.setAnchoDatos(ram.getAnchoDatos());
        return dto;
    }
}

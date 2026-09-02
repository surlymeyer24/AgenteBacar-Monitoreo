package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.TelevisorDTO;
import com.bacarsa.inventario.models.Televisor;

public class TelevisorMapper {

    private TelevisorMapper() {}

    public static TelevisorDTO toDTO(Televisor tv) {
        if (tv == null) {
            return null;
        }
        TelevisorDTO dto = new TelevisorDTO();
        dto.setId(tv.getId());
        dto.setMarca(tv.getMarca());
        dto.setModelo(tv.getModelo());
        dto.setNumeroSerie(tv.getNumeroSerie());
        dto.setArea(tv.getArea());
        dto.setDireccionIp(tv.getDireccionIp());
        dto.setEstado(tv.getEstado());
        return dto;
    }
}

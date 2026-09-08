package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.ProcesadorDetalladoDTO;
import com.bacarsa.inventario.models.ProcesadorDetallado;

public class ProcesadorDetalladoMapper {

    private ProcesadorDetalladoMapper() {}

    public static ProcesadorDetalladoDTO toDTO(ProcesadorDetallado detallado) {
        if (detallado == null) {
            return null;
        }
        ProcesadorDetalladoDTO dto = new ProcesadorDetalladoDTO();
        dto.setNombreCompleto(detallado.getNombreCompleto());
        dto.setFabricante(detallado.getFabricante());
        dto.setGama(detallado.getGama());
        dto.setModelo(detallado.getModelo());
        dto.setGeneracion(detallado.getGeneracion());
        dto.setNucleosFisicos(detallado.getNucleosFisicos());
        dto.setNucleosLogicos(detallado.getNucleosLogicos());
        dto.setFrecuenciaMaxMhz(detallado.getFrecuenciaMaxMhz());
        return dto;
    }
}

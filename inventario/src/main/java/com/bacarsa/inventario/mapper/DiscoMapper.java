package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.DiscoDTO;
import com.bacarsa.inventario.models.Disco;

public class DiscoMapper {

    private DiscoMapper() {
        // Constructor privado para evitar instanciación
    }

    public static DiscoDTO toDTO(Disco disco) {
        if (disco == null) {
            return null;
        }
        DiscoDTO dto = new DiscoDTO();
        dto.setLibreGB(disco.getLibreGB());
        dto.setUsadoGB(disco.getUsadoGB());
        dto.setTotalGB(disco.getTotalGB());
        dto.setTipoDisco(disco.getTipoDisco());
        dto.setPuntoMontaje(disco.getPuntoMontaje());
        dto.setPorcentajeUsado(disco.getPorcentajeUsado());
        dto.setDispositivo(disco.getDispositivo());
        dto.setDiscoFisicoIndex(disco.getDiscoFisicoIndex());
        dto.setModeloDisco(disco.getModeloDisco());

        
        return dto;
    }

}

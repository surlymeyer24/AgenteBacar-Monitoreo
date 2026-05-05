package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.MaquinaTesoreriaDTO;
import com.bacarsa.inventario.models.MaquinaTesoreria;

public class MaquinaTesoreriaMapper {

    private MaquinaTesoreriaMapper() {}

    public static MaquinaTesoreriaDTO toDTO(MaquinaTesoreria maquina) {
        if (maquina == null) {
            return null;
        }
        MaquinaTesoreriaDTO dto = new MaquinaTesoreriaDTO();
        dto.setId(maquina.getId());
        dto.setTipo(maquina.getTipo() == null ? null : maquina.getTipo().name());
        dto.setModelo(maquina.getModelo());
        dto.setNroSerie(maquina.getNroSerie());
        dto.setVida(maquina.getVida());
        dto.setEstado(maquina.getEstadoActual() == null ? null : maquina.getEstadoActual().getNombre());
        dto.setHistorialEstados(CambioEstadoMapper.toDTOList(maquina.getHistorialEstados()));
        return dto;
    }
}

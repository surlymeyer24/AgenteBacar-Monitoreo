package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.InternoIpDTO;
import com.bacarsa.inventario.models.InternoIp;

public class InternoIpMapper {

    private InternoIpMapper() {
    }

    public static InternoIpDTO toDTO(InternoIp interno) {
        if (interno == null) {
            return null;
        }
        InternoIpDTO dto = new InternoIpDTO();
        dto.setId(interno.getId());
        dto.setNumeroInterno(interno.getNumeroInterno());
        dto.setAsignadoA(interno.getAsignadoA());
        dto.setDireccionIp(interno.getDireccionIp());
        dto.setMacAddress(interno.getMacAddress());
        dto.setMarcaModelo(interno.getMarcaModelo());
        dto.setEstado(interno.getEstadoActual() == null ? null : interno.getEstadoActual().getNombre());
        dto.setHistorialEstados(CambioEstadoMapper.toDTOList(interno.getHistorialEstados()));
        return dto;
    }
}

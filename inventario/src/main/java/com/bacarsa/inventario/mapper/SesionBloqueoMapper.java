package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.SesionBloqueoDTO;
import com.bacarsa.inventario.models.SesionBloqueo;
import com.google.cloud.Timestamp;

public class SesionBloqueoMapper {

    private SesionBloqueoMapper() {}

    public static SesionBloqueoDTO toDTO(SesionBloqueo b) {
        if (b == null) return null;
        SesionBloqueoDTO dto = new SesionBloqueoDTO();
        dto.setId(b.getId());
        dto.setComputadoraId(b.getComputadoraId());
        dto.setHostname(b.getHostname());
        dto.setUbicacion(b.getUbicacion());
        dto.setBloqueadoEn(toIso(b.getBloqueadoEn()));
        dto.setEstadoAnterior(b.getEstadoAnterior());
        dto.setSesionBloqueoAutoMin(b.getSesionBloqueoAutoMin());
        return dto;
    }

    private static String toIso(Timestamp ts) {
        if (ts == null) return null;
        return ts.toDate().toInstant().toString();
    }
}

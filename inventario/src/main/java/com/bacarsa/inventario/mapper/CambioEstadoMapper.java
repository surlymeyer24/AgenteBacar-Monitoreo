package com.bacarsa.inventario.mapper;

import java.util.List;

import com.bacarsa.inventario.dto.CambioEstadoDTO;
import com.bacarsa.inventario.models.CambioEstado;
import com.google.cloud.Timestamp;



public class CambioEstadoMapper {
    
    private CambioEstadoMapper() {
        // Constructor privado para evitar instanciación
    }


    public static CambioEstadoDTO toDTO(CambioEstado cambioEstado) {
        if (cambioEstado == null) {
            return null;
        }
        CambioEstadoDTO dto = new CambioEstadoDTO();
        dto.setEstado(cambioEstado.getEstado() == null ? null : cambioEstado.getEstado().getNombre());
        dto.setMotivo(cambioEstado.getMotivo());
        dto.setFechaHoraInicio(formatFechaHora(cambioEstado.getFechaHoraInicio()));
        dto.setFechaHoraFin(formatFechaHora(cambioEstado.getFechaHoraFin()));
        dto.setActivo(cambioEstado.esEstadoActual());
        dto.setUbicacionStock(cambioEstado.getUbicacionStock());
        dto.setResponsableInventario(cambioEstado.getResponsableInventario());
        return dto;
    }

    private static String formatFechaHora(Timestamp fechaHora) {
        if (fechaHora == null) {
            return null;
        }
        return fechaHora.toDate().toInstant().toString();
    }

    public static List<CambioEstadoDTO> toDTOList(List<CambioEstado> cambios) {
        if (cambios == null) {
            return null;
        }
        return cambios.stream()
                .map(CambioEstadoMapper::toDTO)
                .toList();
    }


}

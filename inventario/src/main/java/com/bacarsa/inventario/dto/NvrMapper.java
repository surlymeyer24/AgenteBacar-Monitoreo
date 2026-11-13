package com.bacarsa.inventario.dto;

import com.bacarsa.inventario.historial.HistorialLectura;
import com.bacarsa.inventario.models.Nvr;

public class NvrMapper {

    private NvrMapper() {}

    public static NvrDTO toDTO(Nvr nvr) {
        if (nvr == null) return null;
        NvrDTO dto = new NvrDTO();
        dto.setId(nvr.getId());
        dto.setNombre(nvr.getNombre());
        dto.setDireccionIp(nvr.getDireccionIp());
        dto.setPuerto(nvr.getPuerto());
        dto.setDescripcion(nvr.getDescripcion());
        dto.setUsuario(nvr.getUsuario());
        dto.setPassword(nvr.getPassword());
        dto.setEstado(nvr.getEstado());
        dto.setHistorial(HistorialLectura.aDtoOrdenado(nvr.getHistorial()));
        return dto;
    }
}

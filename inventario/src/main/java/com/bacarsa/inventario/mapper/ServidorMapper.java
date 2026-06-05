package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.ServidorDTO;
import com.bacarsa.inventario.models.Servidor;

public class ServidorMapper {

    private ServidorMapper() {}

    public static ServidorDTO toDTO(Servidor s) {
        if (s == null) return null;
        ServidorDTO dto = new ServidorDTO();
        dto.setId(s.getId());
        dto.setNombre(s.getNombre());
        dto.setHostname(s.getHostname());
        dto.setIp(s.getIp());
        dto.setSistemaOperativo(s.getSistemaOperativo());
        dto.setUbicacion(s.getUbicacion());
        dto.setDescripcion(s.getDescripcion());
        dto.setEstado(s.getEstado());
        return dto;
    }
}

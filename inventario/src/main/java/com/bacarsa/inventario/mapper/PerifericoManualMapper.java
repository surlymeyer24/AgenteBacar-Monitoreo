package com.bacarsa.inventario.mapper;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

import com.bacarsa.inventario.dto.PerifericoManualDTO;
import com.bacarsa.inventario.models.PerifericoManual;

public class PerifericoManualMapper {

    private PerifericoManualMapper() {}

    public static PerifericoManualDTO toDTO(PerifericoManual p) {
        if (p == null) return null;
        PerifericoManualDTO dto = new PerifericoManualDTO();
        dto.setId(p.getId());
        dto.setTipo(p.getTipo());
        dto.setCantidad(p.getCantidad());
        dto.setNombre(p.getNombre());
        dto.setFabricante(p.getFabricante());
        dto.setConexion(p.getConexion());
        dto.setComputadoraHostname(p.getComputadoraHostname());
        dto.setUbicacion(p.getUbicacion());
        dto.setNotas(p.getNotas());
        dto.setEstado(p.getEstadoActual() == null ? null : p.getEstadoActual().getNombre());
        dto.setFechaAlta(parseFecha(p.getFechaAlta()));
        dto.setComboId(p.getComboId());
        dto.setComboNombre(p.getComboNombre());
        dto.setHistorialEstados(CambioEstadoMapper.toDTOList(p.getHistorialEstados()));
        return dto;
    }

    private static LocalDate parseFecha(String iso) {
        if (iso == null || iso.isBlank()) return null;
        try {
            return LocalDate.parse(iso.trim());
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}

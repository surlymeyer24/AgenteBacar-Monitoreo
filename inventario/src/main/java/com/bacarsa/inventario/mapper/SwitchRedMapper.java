package com.bacarsa.inventario.mapper;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

import com.bacarsa.inventario.dto.SwitchRedDTO;
import com.bacarsa.inventario.models.SwitchRed;

public class SwitchRedMapper {

    private SwitchRedMapper() {}

    private static LocalDate parseFechaAltaIso(String iso) {
        if (iso == null || iso.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(iso.trim());
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    public static SwitchRedDTO toDTO(SwitchRed sw) {
        if (sw == null) {
            return null;
        }
        SwitchRedDTO dto = new SwitchRedDTO();
        dto.setId(sw.getId());
        dto.setNombre(sw.getNombre());
        dto.setMarca(sw.getMarca());
        dto.setModelo(sw.getModelo());
        dto.setIp(sw.getIp());
        dto.setNumeroSerie(sw.getNumeroSerie());
        dto.setSitio(sw.getSitio());
        dto.setIpPublica(sw.getIpPublica());
        dto.setEstadoOmada(sw.getEstado());
        dto.setVersion(sw.getVersion());
        dto.setMacUplink(sw.getMacUplink());
        dto.setSalto(sw.getSalto());
        dto.setCantidadPuertos(sw.getCantidadPuertos());
        dto.setTipo(sw.getTipo());
        dto.setVlans(sw.getVlans());
        dto.setUbicacion(sw.getUbicacion() == null ? null : sw.getUbicacion().name());
        dto.setEstado(sw.getEstadoActual() == null ? null : sw.getEstadoActual().getNombre());
        dto.setFechaAlta(parseFechaAltaIso(sw.getFechaAlta()));
        dto.setHistorialEstados(CambioEstadoMapper.toDTOList(sw.getHistorialEstados()));
        return dto;
    }
}

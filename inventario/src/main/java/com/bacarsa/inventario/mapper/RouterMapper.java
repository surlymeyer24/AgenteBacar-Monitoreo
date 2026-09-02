package com.bacarsa.inventario.mapper;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

import com.bacarsa.inventario.dto.RouterDTO;
import com.bacarsa.inventario.models.Router;

public class RouterMapper {

    private RouterMapper() {}

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

    public static RouterDTO toDTO(Router router) {
        if (router == null) {
            return null;
        }
        RouterDTO dto = new RouterDTO();
        dto.setId(router.getId());
        dto.setNombre(router.getNombre());
        dto.setMarca(router.getMarca());
        dto.setModelo(router.getModelo());
        dto.setIp(router.getIp());
        dto.setNumeroSerie(router.getNumeroSerie());
        dto.setFirmware(router.getFirmware());
        dto.setSitio(router.getSitio());
        dto.setIpPublica(router.getIpPublica());
        dto.setEstadoOmada(router.getEstado());
        dto.setVersion(router.getVersion());
        dto.setMacUplink(router.getMacUplink());
        dto.setSalto(router.getSalto());
        dto.setGrupoWlan(router.getGrupoWlan());
        dto.setCantidadPuertosWan(router.getCantidadPuertosWan());
        dto.setCantidadPuertosLan(router.getCantidadPuertosLan());
        dto.setGateway(router.getGateway());
        dto.setUbicacion(router.getUbicacion() == null ? null : router.getUbicacion().name());
        dto.setEstado(router.getEstadoActual() == null ? null : router.getEstadoActual().getNombre());
        dto.setFechaAlta(parseFechaAltaIso(router.getFechaAlta()));
        dto.setHistorialEstados(CambioEstadoMapper.toDTOList(router.getHistorialEstados()));
        return dto;
    }
}

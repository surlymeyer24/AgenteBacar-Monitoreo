package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.RouterDTO;
import com.bacarsa.inventario.models.Router;

public class RouterMapper {

    private RouterMapper() {}

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
        dto.setCantidadPuertosWan(router.getCantidadPuertosWan());
        dto.setCantidadPuertosLan(router.getCantidadPuertosLan());
        dto.setGateway(router.getGateway());
        dto.setUbicacion(router.getUbicacion() == null ? null : router.getUbicacion().name());
        dto.setEstado(router.getEstadoActual() == null ? null : router.getEstadoActual().getNombre());
        dto.setFechaAlta(router.getFechaAlta());
        dto.setHistorialEstados(CambioEstadoMapper.toDTOList(router.getHistorialEstados()));
        return dto;
    }
}

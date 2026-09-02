package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.AccessPointDTO;
import com.bacarsa.inventario.models.AccessPoint;

public class AccessPointMapper {

    private AccessPointMapper() {}

    public static AccessPointDTO toDTO(AccessPoint ap) {
        if (ap == null) {
            return null;
        }
        AccessPointDTO dto = new AccessPointDTO();
        dto.setId(ap.getId());
        dto.setNombre(ap.getNombre());
        dto.setMarca(ap.getMarca());
        dto.setModelo(ap.getModelo());
        dto.setIp(ap.getIp());
        dto.setMac(ap.getMac());
        dto.setSwitchUplink(ap.getSwitchUplink());
        dto.setUbicacion(ap.getUbicacion() == null ? null : ap.getUbicacion().name());
        dto.setEstado(ap.getEstado());
        return dto;
    }
}

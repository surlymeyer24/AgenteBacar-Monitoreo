package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.SwitchRedDTO;
import com.bacarsa.inventario.models.SwitchRed;

public class SwitchRedMapper {

    private SwitchRedMapper() {}

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
        dto.setFechaAlta(sw.getFechaAlta());
        dto.setHistorialEstados(CambioEstadoMapper.toDTOList(sw.getHistorialEstados()));
        return dto;
    }
}

package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.EventoHardwareDTO;
import com.bacarsa.inventario.models.EventoHardware;
import com.google.cloud.Timestamp;

public class EventoHardwareMapper {

    private EventoHardwareMapper() {}

    public static EventoHardwareDTO toDTO(EventoHardware e) {
        if (e == null) return null;
        EventoHardwareDTO dto = new EventoHardwareDTO();
        dto.setId(e.getId());
        dto.setUuid(e.getUuid());
        dto.setHostname(e.getHostname());
        dto.setTipoComponente(e.getTipoComponente());
        dto.setTipoEvento(e.getTipoEvento());
        dto.setTimestamp(toIso(e.getTimestamp()));
        dto.setAntes(e.getAntes());
        dto.setDespues(e.getDespues());
        dto.setFingerprint(e.getFingerprint());
        dto.setOrigen(e.getOrigen());
        dto.setVersionAgente(e.getVersionAgente());
        dto.setExpireAt(toIso(e.getExpireAt()));
        dto.setEstadoSeguimiento(e.getEstadoSeguimiento());
        dto.setLeido(e.getLeido());
        dto.setRevisadoPor(e.getRevisadoPor());
        dto.setRevisadoEn(toIso(e.getRevisadoEn()));
        dto.setNotasIt(e.getNotasIt());
        return dto;
    }

    private static String toIso(Timestamp ts) {
        if (ts == null) return null;
        return ts.toDate().toInstant().toString();
    }
}

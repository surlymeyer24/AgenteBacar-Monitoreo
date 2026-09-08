package com.bacarsa.inventario.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventoHardwareDTO {

    private String id;
    private String uuid;
    private String hostname;
    private String tipoComponente;
    private String tipoEvento;
    private String timestamp;
    private Map<String, Object> antes;
    private Map<String, Object> despues;
    private String fingerprint;
    private String origen;
    private String versionAgente;
    private String expireAt;
    private String estadoSeguimiento;
    private Boolean leido;
    private String revisadoPor;
    private String revisadoEn;
    private String notasIt;
}

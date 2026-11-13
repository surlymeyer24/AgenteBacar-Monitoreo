package com.bacarsa.inventario.dto;

import java.util.List;

import lombok.Data;

@Data
public class RenglonHistorialDTO {
    private String tipo;
    private String actoId;
    private String cuando;
    private String desde;
    private String hasta;
    private String estado;
    private String estadoAnterior;
    private String motivo;
    private String quienUid;
    private String quienNombre;
    private String origen;
    private Boolean pasadoDesconocido;
    private boolean vigente;
    private List<CambioFichaDTO> cambios;
}

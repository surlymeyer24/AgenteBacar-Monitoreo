package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComputadoraSesionDTO {
    private String id;
    private String hostname;
    private String ubicacion;
    private String ultimaSincronizacion;
    private String sesionEstado;
    private Integer sesionBloqueoAutoMin;
    private SesionResumenHoyDTO sesionResumenHoy;
}

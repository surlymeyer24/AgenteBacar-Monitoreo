package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovimientoStockDTO {

    private String id;
    private String codigo;
    private String tipo;
    private String marca;
    private String modelo;
    private String serieOImei;
    private String responsable;
    private String area;
    private String accion;
    private String estado;
    private String fecha;
    private String fechaDevolucion;
    private String motivo;
    private String actorUid;
    private String descripcionCompleta;
    private Integer cantidad;
    private String loteOrigen;
}

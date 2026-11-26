package com.bacarsa.inventario.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ModificarUnidadStockDTO {

    private String marca;
    private String modelo;
    private String serieOImei;
    private String condicion;
    private String ubicacion;
    private String hostname;
    private String notas;
    private Integer cantidad;
    private String comentarios;

    /** Spec de PC: al enviar alguno, los tres son obligatorios. */
    private String cpuModelo;
    private Integer ramTotalGb;
    private String discoResumen;
}

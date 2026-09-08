package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EspecificacionStockDTO {

    private String cpuModelo;
    private Integer ramTotalGb;
    private String discoResumen;
    private String tipoEquipo;
    private String condicion;
}

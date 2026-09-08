package com.bacarsa.inventario.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BaselineEsperadoDTO {

    private String cpuModelo;
    private Integer ramTotalGb;
    private String discoResumen;
    private List<BaselinePerifericoEsperadoDTO> perifericos;
    /** ISO-8601 */
    private String armadoAt;
    private String armadoPor;
}

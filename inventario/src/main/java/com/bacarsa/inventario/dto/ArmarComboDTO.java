package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArmarComboDTO {

    private String monitorId;
    private String mouseId;
    private String tecladoId;
    private String cpuModelo;
    private Integer ramTotalGb;
    private String discoResumen;
    private String motivo;
}

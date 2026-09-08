package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RamPlacaDTO {

    private int slotsTotales;
    private int slotsOcupados;
    private String canalModo;
    private Integer maxCapacidadGb;
}

package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonitorAgenteDTO {
    private String nombre;
    private String resolucion;
    private Double pulgadas;
    private Double anchoCm;
    private Double altoCm;
    private String numeroSerie;
    private String fabricante;
}

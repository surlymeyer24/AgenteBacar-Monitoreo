package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RamDTO {

    private boolean ocupado = true;
    private String slot;
    private String locator;
    private String banco;
    private String canal;
    private int capacidadGB;
    private int velocidadMHz;
    private String modelo;
    private String fabricante;
    private String tecnologia;
    private String numeroSerie;
    private String formFactor;
    private String pines;
    private Double voltajeV;
    private Integer anchoDatos;
}

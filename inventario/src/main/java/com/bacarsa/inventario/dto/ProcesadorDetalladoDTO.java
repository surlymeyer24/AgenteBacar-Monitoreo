package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcesadorDetalladoDTO {

    private String nombreCompleto;
    private String fabricante;
    private String gama;
    private String modelo;
    private Integer generacion;
    private Integer nucleosFisicos;
    private Integer nucleosLogicos;
    private Integer frecuenciaMaxMhz;
}

package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BaselinePerifericoEsperadoDTO {

    private String tipo;
    private String idStock;
    private String nombre;
    private String fabricante;
    private String numeroSerie;
}

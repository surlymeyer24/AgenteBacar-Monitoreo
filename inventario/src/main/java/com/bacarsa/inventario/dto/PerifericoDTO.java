package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerifericoDTO {

    private String id;
    private String nombre;
    private String marca;
    private String tipo;
    private String computadoraUuid;
}

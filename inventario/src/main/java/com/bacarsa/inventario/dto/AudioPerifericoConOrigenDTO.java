package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AudioPerifericoConOrigenDTO {

    private String nombre;
    private String fabricante;
    private String estado;
    private String pcUuid;
    private String pcHostname;
}

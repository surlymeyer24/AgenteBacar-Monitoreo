package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsbPerifericoConOrigenDTO {

    private String nombre;
    private String fabricante;
    private String categoria;
    private String clase;
    private String conexion;
    private String vid;
    private String pid;
    private String pcUuid;
    private String pcHostname;
}

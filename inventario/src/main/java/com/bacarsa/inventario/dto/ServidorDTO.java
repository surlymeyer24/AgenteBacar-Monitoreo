package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServidorDTO {

    private String id;
    private String nombre;
    private String hostname;
    private String ip;
    private String sistemaOperativo;
    private String ubicacion;
    private String descripcion;
    private String estado;
}

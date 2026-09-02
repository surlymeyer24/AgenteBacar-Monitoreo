package com.bacarsa.inventario.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActualizarPerifericoDTO {

    private String tipo;
    private Integer cantidad;
    private String nombre;
    private String fabricante;
    private String conexion;
    private String computadoraHostname;
    private String ubicacion;
    private String notas;
    private LocalDate fechaAlta;
    private String comboId;
    private String comboNombre;
}

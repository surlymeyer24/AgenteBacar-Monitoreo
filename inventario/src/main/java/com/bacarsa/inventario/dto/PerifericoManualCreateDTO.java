package com.bacarsa.inventario.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerifericoManualCreateDTO {

    @NotBlank
    private String tipo;
    private int cantidad = 1;
    private String nombre;
    private String fabricante;
    private String conexion;
    private String computadoraHostname;
    private String notas;
    private LocalDate fechaAlta;
    private String motivo;
}

package com.bacarsa.inventario.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouterCreateDTO {

    @NotBlank
    private String nombre;
    private String marca;
    private String modelo;
    private String ip;
    private String numeroSerie;
    private String firmware;
    private int cantidadPuertosWan;
    private int cantidadPuertosLan;
    private String gateway;
    @NotBlank
    private String ubicacion;
    private LocalDate fechaAlta;
}

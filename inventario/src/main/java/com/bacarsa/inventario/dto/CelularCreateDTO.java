package com.bacarsa.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CelularCreateDTO {

    @NotBlank
    private String marca;

    @NotBlank
    private String modelo;

    @NotBlank
    private String imei;

    @NotNull
    private Boolean conCargador;

    @NotBlank
    private String condicion;

    private String lineaNumero;
    private String responsable;
    private String area;
    private String estado;
}

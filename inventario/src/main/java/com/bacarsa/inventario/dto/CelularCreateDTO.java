package com.bacarsa.inventario.dto;

import jakarta.validation.constraints.NotBlank;
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

    private String imei;
    private String lineaNumero;
    private String responsable;

    @NotBlank
    private String area;

    @NotBlank
    private String estado;
}

package com.bacarsa.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TelevisorCreateDTO {

    @NotBlank
    private String marca;

    private String modelo;

    private String numeroSerie;

    @NotBlank
    private String area;

    private String direccionIp;

    @NotBlank
    private String estado;
}

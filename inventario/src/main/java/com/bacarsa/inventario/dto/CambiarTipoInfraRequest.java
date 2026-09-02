package com.bacarsa.inventario.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CambiarTipoInfraRequest {

    @NotBlank
    private String tipoOrigen;

    @NotBlank
    private String tipoDestino;

    @NotBlank
    private String id;

    private RouterCreateDTO router;

    @JsonProperty("switch")
    private SwitchRedCreateDTO switchRed;

    @JsonProperty("accessPoint")
    private AccessPointCreateDTO accessPoint;
}

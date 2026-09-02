package com.bacarsa.inventario.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ActualizarProgresoLogisticaDTO {

    @NotBlank
    private String fase;

    @NotEmpty
    private List<@NotBlank String> itemIds;

    @NotNull
    private Boolean completado;
}

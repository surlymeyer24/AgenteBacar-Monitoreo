package com.bacarsa.inventario.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ActualizarProgresoLogisticaMasivoDTO {

    @NotEmpty
    @Size(max = 200)
    private List<@NotBlank String> uuids;

    @NotEmpty
    @Size(max = 3)
    private List<@NotBlank String> fases;

    @NotNull
    private Boolean completado;
}

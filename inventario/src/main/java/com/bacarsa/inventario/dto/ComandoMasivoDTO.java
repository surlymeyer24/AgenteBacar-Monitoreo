package com.bacarsa.inventario.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComandoMasivoDTO {

    @NotNull
    @NotEmpty
    private List<String> uuids;

    @NotBlank
    private String comando; // "ACTUALIZAR_DATOS" | "ACTUALIZAR_AGENTE"
}

package com.bacarsa.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComandoDTO {
    @NotBlank
    private String comando; // "ACTUALIZAR_DATOS" | "ACTUALIZAR_AGENTE"


}

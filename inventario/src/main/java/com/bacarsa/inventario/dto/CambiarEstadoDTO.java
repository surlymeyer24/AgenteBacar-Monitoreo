package com.bacarsa.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CambiarEstadoDTO {
    @NotBlank
    private String estado;
    @NotBlank
    private String motivo;

}

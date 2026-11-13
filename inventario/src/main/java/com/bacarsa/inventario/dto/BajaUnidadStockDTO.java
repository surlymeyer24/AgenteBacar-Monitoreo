package com.bacarsa.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class BajaUnidadStockDTO {

    @NotBlank(message = "El motivo de la baja es obligatorio")
    private String motivo;

    private String usuario;
}

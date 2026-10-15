package com.bacarsa.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsignarUnidadStockDTO {

    @NotBlank(message = "El nombre del responsable es obligatorio")
    private String responsable;

    private String area;
    private String motivo;
}

package com.bacarsa.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AltaUnidadStockDTO {

    @NotBlank(message = "El tipo es obligatorio")
    private String tipo;

    private String marca;
    private String modelo;
    private String serieOImei;
    private String condicion;
    private String ubicacion;
    private String hostname;
    private String notas;
    private String motivo;
}

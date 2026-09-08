package com.bacarsa.inventario.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IngresarStockDTO {
    private String sistemaOperativo;
    private String tipoEquipo;
    private String condicion;
    private String ubicacion;
    private String ubicacionStock;
    @Size(max = 2000)
    private String motivo;
}

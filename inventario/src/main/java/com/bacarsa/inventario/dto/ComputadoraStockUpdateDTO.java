package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComputadoraStockUpdateDTO {
    private String sistemaOperativo;
    private String tipoEquipo;
    private String condicion;
    private String ubicacion;
    private String ubicacionStock;
}

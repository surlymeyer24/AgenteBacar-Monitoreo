package com.bacarsa.inventario.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ModificarUnidadStockDTO {

    private String marca;
    private String modelo;
    private String serieOImei;
    private String condicion;
    private String ubicacion;
    private String hostname;
    private String notas;
}

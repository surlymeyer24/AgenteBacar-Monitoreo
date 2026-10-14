package com.bacarsa.inventario.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UnidadStockDTO {

    private String codigo;
    private String tipo;
    private String marca;
    private String modelo;
    private String serieOImei;
    private String condicion;
    private String estadoDeposito;
    private String fechaIngreso;
    private String ubicacion;
}

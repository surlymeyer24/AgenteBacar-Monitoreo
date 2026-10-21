package com.bacarsa.inventario.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UnidadStockDTO {

    private String id;
    private String codigo;
    private String coleccion;
    private String tipo;
    private String marca;
    private String modelo;
    private String serieOImei;
    private String condicion;
    private String estadoDeposito;
    private String fechaIngreso;
    private String ubicacion;
    private Integer cantidad;
    private String comentarios;
    private String descripcionCompleta;
}

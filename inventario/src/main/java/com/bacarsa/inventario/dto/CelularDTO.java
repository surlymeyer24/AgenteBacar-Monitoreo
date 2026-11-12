package com.bacarsa.inventario.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CelularDTO {

    private String id;
    private String marca;
    private String modelo;
    private String imei;
    private Boolean conCargador;
    private String condicion;
    private String lineaNumero;
    private String responsable;
    private String area;
    private String estado;
    private List<RenglonHistorialDTO> historial;
}

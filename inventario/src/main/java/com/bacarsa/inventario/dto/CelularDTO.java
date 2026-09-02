package com.bacarsa.inventario.dto;

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
    private String lineaNumero;
    private String responsable;
    private String area;
    private String estado;
}

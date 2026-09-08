package com.bacarsa.inventario.models;

import lombok.Getter;

@Getter
public enum OrigenConciliacion {
    PRIMER_REPORTE("Primer reporte"),
    RETROACTIVA("Retroactiva");

    private final String nombre;

    OrigenConciliacion(String nombre) {
        this.nombre = nombre;
    }
}

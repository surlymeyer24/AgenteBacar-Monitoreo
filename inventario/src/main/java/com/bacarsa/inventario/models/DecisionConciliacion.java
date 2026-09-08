package com.bacarsa.inventario.models;

import lombok.Getter;

@Getter
public enum DecisionConciliacion {
    PENDIENTE("Pendiente"),
    CONFIRMADA("Confirmada"),
    RECHAZADA("Rechazada"),
    POSPUESTA("Pospuesta");

    private final String nombre;

    DecisionConciliacion(String nombre) {
        this.nombre = nombre;
    }
}

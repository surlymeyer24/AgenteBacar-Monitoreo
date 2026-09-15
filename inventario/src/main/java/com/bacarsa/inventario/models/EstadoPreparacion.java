package com.bacarsa.inventario.models;

import lombok.Getter;

@Getter
public enum EstadoPreparacion {
    SIN_ARMAR("Sin armar", "PC en stock sin combo/baseline armado"),
    ARMADO("Armado", "Combo armado con baseline listo"),
    NO_APLICA("No aplica", "PC legacy anterior al sistema de trazabilidad");

    private final String nombre;
    private final String descripcion;

    EstadoPreparacion(String nombre, String descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }
}

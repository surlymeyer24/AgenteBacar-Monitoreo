package com.bacarsa.inventario.models;

import lombok.Getter;

@Getter
public enum EstadoConciliacion {
    PENDIENTE("Pendiente", "Conciliación pendiente de confirmación IT"),
    COINCIDE("Coincide", "Snapshot del agente coincide con baseline de stock"),
    DISCREPANCIA("Discrepancia", "Diferencias detectadas entre stock y agente"),
    SIN_BASELINE("Sin baseline", "PC en stock sin baseline armado o sin datos suficientes"),
    NO_APLICA("No aplica", "PC legacy anterior al sistema de trazabilidad"),
    BASELINE_LISTO("Baseline listo", "Combo armado con baseline; pendiente primer reporte del agente");

    private final String nombre;
    private final String descripcion;

    EstadoConciliacion(String nombre, String descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }
}

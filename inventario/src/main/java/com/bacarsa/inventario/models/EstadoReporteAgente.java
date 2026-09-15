package com.bacarsa.inventario.models;

import lombok.Getter;

@Getter
public enum EstadoReporteAgente {
    SIN_REPORTE("Sin reporte", "El agente aún no sincronizó"),
    MATCH_SUGERIDO("Match sugerido", "El agente reportó; match pendiente de confirmación IT"),
    CONFIRMADA("Confirmada", "Snapshot del agente coincide con baseline de stock"),
    DISCREPANCIA("Discrepancia", "Diferencias detectadas entre stock y agente"),
    NO_APLICA("No aplica", "PC legacy anterior al sistema de trazabilidad");

    private final String nombre;
    private final String descripcion;

    EstadoReporteAgente(String nombre, String descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }
}

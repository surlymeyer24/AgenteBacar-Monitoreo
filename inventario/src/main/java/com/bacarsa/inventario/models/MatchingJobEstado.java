package com.bacarsa.inventario.models;

import lombok.Getter;

@Getter
public enum MatchingJobEstado {
    MATCHING_PENDIENTE("Pendiente", "Primer reporte detectado; matching aún no ejecutado"),
    MATCHING_EN_PROCESO("En proceso", "Matching en ejecución"),
    MATCHING_OK("OK", "Matching completado"),
    MATCHING_ERROR("Error", "Matching falló; pendiente de reintento");

    private final String nombre;
    private final String descripcion;

    MatchingJobEstado(String nombre, String descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }
}

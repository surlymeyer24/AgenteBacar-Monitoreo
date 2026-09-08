package com.bacarsa.inventario.models;

import lombok.Getter;

@Getter
public enum OrigenAlta {
    STOCK("Stock", "PC cargada manualmente en stock"),
    DETECTADA_POR_AGENTE("Detectada por agente", "PC creada automáticamente por primer reporte del agente"),
    DETECTADA_VINCULADA_RETRO("Vinculada retroactivamente", "PC detectada por agente, luego vinculada a stock existente"),
    LEGACY("Legacy", "PC anterior al sistema de trazabilidad stock-agente");

    private final String nombre;
    private final String descripcion;

    OrigenAlta(String nombre, String descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }
}

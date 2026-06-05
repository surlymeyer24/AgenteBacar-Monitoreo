package com.bacarsa.inventario.models;

import lombok.Getter;


@Getter
public enum EstadoOperativo {
    ASIGNADA("Asignada", "Equipo dado de alta y con usuario o responsable definido"),
    SIN_ASIGNAR("Sin Asignar", "Equipo en inventario sin usuario/responsable asignado"),
    EN_MANTENIMIENTO("En mantenimiento", "Equipo en mantenimiento, no operativo temporalmente"),
    BAJA("Baja", "Equipo dado de baja"),
    ACTIVA("Activa", "Equipo activo y operativo"),
    INACTIVA("Inactiva", "Equipo inactivo o fuera de servicio");

    private final String nombre;
    private final String descripcion;

    EstadoOperativo(String nombre, String descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }

    /**
     * Regla para el valor simbólico {@code DERIVAR_ASIGNACION} del API: si hay texto de
     * asignación no vacío (p. ej. {@code usuarioActual} en PC o {@code responsable} en cámara)
     * se usa {@link #ASIGNADA}; si no, {@link #SIN_ASIGNAR}.
     */
    public static EstadoOperativo inferirAsignacionDesdeTexto(String textoAsignacion) {
        if (textoAsignacion != null && !textoAsignacion.isBlank()) {
            return ASIGNADA;
        }
        return SIN_ASIGNAR;
    }
}

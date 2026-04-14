package com.bacarsa.inventario.models;

import lombok.Getter;


@Getter
public enum EstadoOperativo {
    ACTIVO("Activo", "Equipo operativo"),
    EN_MANTENIMIENTO("En mantenimiento", "Equipo en mantenimiento, no operativo"),
    FUERA_DE_SERVICIO("Fuera de servicio", "Equipo fuera de servicio, no operativo");

    private final String nombre;
    private final String descripcion;

    EstadoOperativo(String nombre, String descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }


}

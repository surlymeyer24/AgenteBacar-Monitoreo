package com.bacarsa.inventario.models;

import java.time.LocalDateTime;

public class Sesion {
    private LocalDateTime fechaHoraInicio;
    private LocalDateTime fechaHoraFin;
    private Usuario usuario;


    public boolean esActual(LocalDateTime fechaHora) {
        return (fechaHoraFin == null || fechaHora.isBefore(fechaHoraFin)) && fechaHora.isAfter(fechaHoraInicio);
    }

}

package com.bacarsa.inventario.models;

import java.time.Duration;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CambioEstado {

    private LocalDateTime fechaHoraInicio;
    private LocalDateTime fechaHoraFin;
    private String motivo;
    private Estado estado;

    public boolean esEstadoActual() {
        return fechaHoraFin == null;
    }

    public Duration getDuracion() {
        LocalDateTime fin = (fechaHoraFin != null) ? fechaHoraFin : LocalDateTime.now();
        return Duration.between(fechaHoraInicio, fin);
    }
}

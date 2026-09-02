package com.bacarsa.inventario.models;

import java.time.Duration;
import java.time.Instant;

import com.google.cloud.Timestamp;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CambioEstado {

    /** Firestore persiste instantes como {@link Timestamp}, no como {@code LocalDateTime}. */
    private Timestamp fechaHoraInicio;
    private Timestamp fechaHoraFin;
    private String motivo;
    private Estado estado;
    private String ubicacionStock;
    private String responsableInventario;

    public boolean esEstadoActual() {
        return fechaHoraFin == null;
    }

    public Duration calcularDuracion() {
        if (fechaHoraInicio == null) {
            return Duration.ZERO;
        }
        Instant inicio = fechaHoraInicio.toDate().toInstant();
        Instant fin = fechaHoraFin != null ? fechaHoraFin.toDate().toInstant() : Instant.now();
        return Duration.between(inicio, fin);
    }
}

package com.bacarsa.inventario.models;

import java.time.Duration;
import java.time.Instant;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.PropertyName;

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

    @Getter(onMethod_ = @PropertyName("ubicacion_stock"))
    @Setter(onMethod_ = @PropertyName("ubicacion_stock"))
    private String ubicacionStock;

    @Getter(onMethod_ = @PropertyName("responsable_inventario"))
    @Setter(onMethod_ = @PropertyName("responsable_inventario"))
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

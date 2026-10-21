package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MovimientoStock {

    @DocumentId
    private String id;

    private String codigo;
    private String tipo;
    private String marca;
    private String modelo;

    @Getter(onMethod_ = @PropertyName("serie_o_imei"))
    @Setter(onMethod_ = @PropertyName("serie_o_imei"))
    private String serieOImei;

    private String responsable;
    private String area;
    private String accion; // Asignación, Liberación de stock, Devolución
    private String estado; // Activa, Finalizada, Pendiente
    private String fecha;

    @Getter(onMethod_ = @PropertyName("fecha_devolucion"))
    @Setter(onMethod_ = @PropertyName("fecha_devolucion"))
    private String fechaDevolucion;

    private String motivo;

    @Getter(onMethod_ = @PropertyName("actor_uid"))
    @Setter(onMethod_ = @PropertyName("actor_uid"))
    private String actorUid;

    @Getter(onMethod_ = @PropertyName("tipo_movimiento"))
    @Setter(onMethod_ = @PropertyName("tipo_movimiento"))
    private String tipoMovimiento;

    @Getter(onMethod_ = @PropertyName("periferico_id"))
    @Setter(onMethod_ = @PropertyName("periferico_id"))
    private String perifericoId;

    @Getter(onMethod_ = @PropertyName("computadora_uuid"))
    @Setter(onMethod_ = @PropertyName("computadora_uuid"))
    private String computadoraUuid;

    @Getter(onMethod_ = @PropertyName("ubicacion_origen"))
    @Setter(onMethod_ = @PropertyName("ubicacion_origen"))
    private String ubicacionOrigen;

    @Getter(onMethod_ = @PropertyName("ubicacion_destino"))
    @Setter(onMethod_ = @PropertyName("ubicacion_destino"))
    private String ubicacionDestino;

    @Getter(onMethod_ = @PropertyName("estado_anterior"))
    @Setter(onMethod_ = @PropertyName("estado_anterior"))
    private String estadoAnterior;

    @Getter(onMethod_ = @PropertyName("estado_nuevo"))
    @Setter(onMethod_ = @PropertyName("estado_nuevo"))
    private String estadoNuevo;
}

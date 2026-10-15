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
}

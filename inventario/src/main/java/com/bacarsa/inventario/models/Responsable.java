package com.bacarsa.inventario.models;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Responsable {

    private String id;
    private String nombre;

    @Getter(onMethod_ = @PropertyName("cantidad_equipos"))
    @Setter(onMethod_ = @PropertyName("cantidad_equipos"))
    private int cantidadEquipos;

    @Getter(onMethod_ = @PropertyName("actualizado_at"))
    @Setter(onMethod_ = @PropertyName("actualizado_at"))
    private Timestamp actualizadoAt;
}

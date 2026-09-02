package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Celular {

    @DocumentId
    private String id;

    private String marca;
    private String modelo;
    private String imei;

    @Getter(onMethod_ = @PropertyName("linea_numero"))
    @Setter(onMethod_ = @PropertyName("linea_numero"))
    private String lineaNumero;

    private String responsable;
    private String area;
    private String estado;
}

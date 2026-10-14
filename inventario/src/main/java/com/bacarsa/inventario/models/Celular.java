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

    @Getter(onMethod_ = @PropertyName("codigo_interno"))
    @Setter(onMethod_ = @PropertyName("codigo_interno"))
    private String codigoInterno;

    private String marca;
    private String modelo;
    private String imei;

    @Getter(onMethod_ = @PropertyName("con_cargador"))
    @Setter(onMethod_ = @PropertyName("con_cargador"))
    private Boolean conCargador;

    private String condicion;

    @Getter(onMethod_ = @PropertyName("linea_numero"))
    @Setter(onMethod_ = @PropertyName("linea_numero"))
    private String lineaNumero;

    private String responsable;
    private String area;
    private String estado;
}

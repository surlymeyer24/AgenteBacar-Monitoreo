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

    @Getter(onMethod_ = @PropertyName("asignado_desde_stock"))
    @Setter(onMethod_ = @PropertyName("asignado_desde_stock"))
    private Boolean asignadoDesdeStock;

    @Getter(onMethod_ = @PropertyName("fecha_asignacion"))
    @Setter(onMethod_ = @PropertyName("fecha_asignacion"))
    private String fechaAsignacion;
}

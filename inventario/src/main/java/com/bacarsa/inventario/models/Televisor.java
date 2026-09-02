package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Televisor {

    @DocumentId
    private String id;

    private String marca;
    private String modelo;

    @Getter(onMethod_ = @PropertyName("numero_serie"))
    @Setter(onMethod_ = @PropertyName("numero_serie"))
    private String numeroSerie;

    private String area;

    @Getter(onMethod_ = @PropertyName("direccion_ip"))
    @Setter(onMethod_ = @PropertyName("direccion_ip"))
    private String direccionIp;

    private String estado;
}

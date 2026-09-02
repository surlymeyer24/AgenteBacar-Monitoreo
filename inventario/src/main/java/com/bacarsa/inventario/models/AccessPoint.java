package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccessPoint {

    @DocumentId
    private String id;

    private String nombre;
    private String marca;
    private String modelo;
    private String ip;
    private String mac;

    @Getter(onMethod_ = @PropertyName("switch_uplink"))
    @Setter(onMethod_ = @PropertyName("switch_uplink"))
    private String switchUplink;

    private UbicacionRed ubicacion;
    private String estado;
}

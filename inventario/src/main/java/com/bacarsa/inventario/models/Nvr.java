package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.DocumentId;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Nvr {
    @DocumentId
    private String id;
    private String nombre;
    private String direccionIp;
    private Integer puerto;        // opcional; puerto de gestión HTTP/ONVIF de la NVR
    private String descripcion;    // opcional; texto libre

}

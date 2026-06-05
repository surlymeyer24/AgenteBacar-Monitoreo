package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.DocumentId;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Servidor {

    @DocumentId
    private String id;

    private String nombre;
    private String hostname;
    private String ip;
    private String sistemaOperativo;
    private String ubicacion;
    private String descripcion;
    /** activo / inactivo / mantenimiento */
    private String estado;
}

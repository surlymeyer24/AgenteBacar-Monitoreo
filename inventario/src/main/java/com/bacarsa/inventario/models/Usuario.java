package com.bacarsa.inventario.models;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class Usuario {
    private String id;
    private String nombre;
    private String email;
    private Rol rol;
    private boolean activo;

}

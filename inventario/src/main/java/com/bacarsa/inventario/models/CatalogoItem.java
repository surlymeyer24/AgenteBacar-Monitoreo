package com.bacarsa.inventario.models;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CatalogoItem {
    private String id;
    private String catalogo;
    private String codigo;
    private String label;
    private boolean activo;
    private int orden;
    private String icono;
}

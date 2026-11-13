package com.bacarsa.inventario.dto;

import lombok.Data;

@Data
public class CambioFichaDTO {
    private String campo;
    private String valorAnterior;
    private String valorNuevo;
}

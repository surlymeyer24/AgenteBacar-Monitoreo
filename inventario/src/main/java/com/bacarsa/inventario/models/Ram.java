package com.bacarsa.inventario.models;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Ram extends ComponenteHW {

    private int capacidadGB;
    private int velocidadMHz;
    private String modelo;
    private String fabricante;

    @Override
    public String toString() {
        return String.format("%s %dGB %dMHz", modelo, capacidadGB, velocidadMHz);
    }
}

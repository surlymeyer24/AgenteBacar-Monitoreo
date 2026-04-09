package com.bacarsa.inventario.models;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Disco extends ComponenteHW {

    private String tipo;
    private String modeloDisco;
    private double totalGB;
    private double libreGB;
    private String puntoMontaje;

    public double getEspacioUsado() {
        return totalGB - libreGB;
    }

    @Override
    public String toString() {
        return String.format("%s %s - %s (%.1f/%.1f GB libres) [%s]",
                getNombre(), getMarca(), tipo, libreGB, totalGB, puntoMontaje);
    }
}

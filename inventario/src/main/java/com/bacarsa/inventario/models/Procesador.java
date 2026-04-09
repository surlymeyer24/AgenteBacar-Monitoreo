package com.bacarsa.inventario.models;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Procesador extends ComponenteHW {

    private String nombreRaw;
    private int nucleosFisicos;
    private String arquitectura;

    @Override
    public String toString() {
        return String.format("%s - %d nucleos (%s)", nombreRaw, nucleosFisicos, arquitectura);
    }
}

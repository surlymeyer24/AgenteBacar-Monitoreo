package com.bacarsa.inventario.models;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Procesador {

    private String nombreRaw;
    private int nucleosFisicos;
    private String arquitectura;
    private FabricanteProcesador fabricante;

    @Override
    public String toString() {
        return String.format("%s - %d nucleos (%s)", nombreRaw, nucleosFisicos, arquitectura);
    }
}

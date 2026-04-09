package com.bacarsa.inventario.models;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Periferico extends ComponenteHW {

    private String tipo;
    private Computadora computadora;
    private Estado estadoActual;
    private List<CambioEstado> historialEstados;

    public boolean isAsignado() {
        return computadora != null;
    }

    @Override
    public String toString() {
        return String.format("%s %s - %s", getNombre(), getMarca(), tipo);
    }
}

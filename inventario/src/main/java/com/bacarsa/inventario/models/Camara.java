package com.bacarsa.inventario.models;

import java.time.LocalDate;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Camara {

    private String nombre;
    private String marca;
    private String descripcion;
    private UbicacionCamara ubicacion;
    private LocalDate fechaAlta;
    private Estado estadoActual;
    private List<CambioEstado> historialEstados;

    public Estado getEstadoActual() {
        return estadoActual;
    }
}

package com.bacarsa.inventario.models;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.google.cloud.firestore.annotation.DocumentId;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Camara {

    @DocumentId
    private String id;

    private String nombre;
    private String marca;
    private String descripcion;
    private String responsable;
    private UbicacionCamara ubicacion;
    private LocalDate fechaAlta;
    private Estado estadoActual;
    private List<CambioEstado> historialEstados;

    public Camara() {
        this.historialEstados = new ArrayList<>();
    }

    public Estado getEstadoActual() {
        if (historialEstados != null) {
            for (CambioEstado cambio : historialEstados) {
                if (cambio.esEstadoActual()) {
                    return cambio.getEstado();
                }
            }
        }
        return estadoActual;
    }
}

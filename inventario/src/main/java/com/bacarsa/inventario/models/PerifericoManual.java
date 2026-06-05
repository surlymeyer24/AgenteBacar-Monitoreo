package com.bacarsa.inventario.models;

import java.util.ArrayList;
import java.util.List;

import com.google.cloud.firestore.annotation.DocumentId;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PerifericoManual {

    @DocumentId
    private String id;

    private String tipo;
    private int cantidad = 1;
    private String nombre;
    private String fabricante;
    private String conexion;
    private String computadoraHostname;
    private String ubicacion;
    private String notas;
    /** ISO-8601 fecha calendario ({@code yyyy-MM-dd}). */
    private String fechaAlta;
    private Estado estadoActual;
    private List<CambioEstado> historialEstados;

    public PerifericoManual() {
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

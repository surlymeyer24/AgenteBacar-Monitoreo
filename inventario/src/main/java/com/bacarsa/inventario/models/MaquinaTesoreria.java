package com.bacarsa.inventario.models;

import java.util.ArrayList;
import java.util.List;

import com.google.cloud.firestore.annotation.DocumentId;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MaquinaTesoreria {

    @DocumentId
    private String id;

    private TipoMaquina tipo;
    private String modelo;
    private String nroSerie;
    /** Observación libre; relevante principalmente para RECONTADORA (odómetro o descripción). */
    private String vida;
    private Estado estadoActual;
    private List<CambioEstado> historialEstados;

    public MaquinaTesoreria() {
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

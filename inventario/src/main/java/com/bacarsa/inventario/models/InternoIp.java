package com.bacarsa.inventario.models;

import java.util.ArrayList;
import java.util.List;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InternoIp {

    @DocumentId
    private String id;

    @PropertyName("numero_interno")
    private String numeroInterno;

    @PropertyName("asignado_a")
    private String asignadoA;

    @PropertyName("direccion_ip")
    private String direccionIp;

    @PropertyName("mac_address")
    private String macAddress;

    @PropertyName("marca_modelo")
    private String marcaModelo;

    @PropertyName("estado_actual")
    private Estado estadoActual;

    @PropertyName("historial_estados")
    private List<CambioEstado> historialEstados;

    public InternoIp() {
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

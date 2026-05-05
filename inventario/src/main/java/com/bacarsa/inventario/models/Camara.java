package com.bacarsa.inventario.models;

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
    /** Ubicación / punto de instalación (texto libre, p. ej. nombre legible desde inventario). */
    private String ubicacion;
    /** Dirección IP de la cámara en la red. */
    private String direccionIp;
    /** Puerto de servicio (p. ej. ONVIF / HTTP). */
    private Integer puerto;
    /** Modelo / tipo de equipo (p. ej. fabricante-modelo). */
    private String tipo;
    /** ISO-8601 fecha calendario ({@code yyyy-MM-dd}); Firestore no serializa bien {@link java.time.LocalDate} en POJOs. */
    private String fechaAlta;
    private Estado estadoActual;
    private List<CambioEstado> historialEstados;
    private String nvrId; // ID de la NVR a la que está asociada esta cámara (si aplica)

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

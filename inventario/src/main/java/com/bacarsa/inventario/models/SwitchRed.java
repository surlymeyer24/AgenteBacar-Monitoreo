package com.bacarsa.inventario.models;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SwitchRed {

    @DocumentId
    private String id;

    private String nombre;
    private String marca;
    private String modelo;
    private String ip;

    @Getter(onMethod_ = @PropertyName("numero_serie"))
    @Setter(onMethod_ = @PropertyName("numero_serie"))
    private String numeroSerie;

    @Getter(onMethod_ = @PropertyName("cantidad_puertos"))
    @Setter(onMethod_ = @PropertyName("cantidad_puertos"))
    private int cantidadPuertos;

    private String tipo; // "MANAGED" | "UNMANAGED"
    private List<String> vlans;
    private UbicacionRed ubicacion;
    private Estado estadoActual;
    private List<CambioEstado> historialEstados;

    @Getter(onMethod_ = @PropertyName("fecha_alta"))
    @Setter(onMethod_ = @PropertyName("fecha_alta"))
    private LocalDate fechaAlta;

    public SwitchRed() {
        this.historialEstados = new ArrayList<>();
        this.vlans = new ArrayList<>();
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

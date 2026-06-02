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
public class Router {

    @DocumentId
    private String id;

    private String nombre;
    private String marca;
    private String modelo;
    private String ip;

    @Getter(onMethod_ = @PropertyName("numero_serie"))
    @Setter(onMethod_ = @PropertyName("numero_serie"))
    private String numeroSerie;

    @Getter(onMethod_ = @PropertyName("sitio"))
    @Setter(onMethod_ = @PropertyName("sitio"))
    private String sitio;

    @Getter(onMethod_ = @PropertyName("ip_publica"))
    @Setter(onMethod_ = @PropertyName("ip_publica"))
    private String ipPublica;

    @Getter(onMethod_ = @PropertyName("estado"))
    @Setter(onMethod_ = @PropertyName("estado"))
    private String estado;

    @Getter(onMethod_ = @PropertyName("version"))
    @Setter(onMethod_ = @PropertyName("version"))
    private String version;

    @Getter(onMethod_ = @PropertyName("mac_uplink"))
    @Setter(onMethod_ = @PropertyName("mac_uplink"))
    private String macUplink;

    @Getter(onMethod_ = @PropertyName("salto"))
    @Setter(onMethod_ = @PropertyName("salto"))
    private Integer salto;

    @Getter(onMethod_ = @PropertyName("grupo_wlan"))
    @Setter(onMethod_ = @PropertyName("grupo_wlan"))
    private String grupoWlan;

    private String firmware;

    @Getter(onMethod_ = @PropertyName("cantidad_puertos_wan"))
    @Setter(onMethod_ = @PropertyName("cantidad_puertos_wan"))
    private int cantidadPuertosWan;

    @Getter(onMethod_ = @PropertyName("cantidad_puertos_lan"))
    @Setter(onMethod_ = @PropertyName("cantidad_puertos_lan"))
    private int cantidadPuertosLan;

    private String gateway;
    private UbicacionRed ubicacion;
    private Estado estadoActual;
    private List<CambioEstado> historialEstados;

    @Getter(onMethod_ = @PropertyName("fecha_alta"))
    @Setter(onMethod_ = @PropertyName("fecha_alta"))
    private LocalDate fechaAlta;

    public Router() {
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

package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.PropertyName;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Ram {

    private boolean ocupado = true;
    private String slot;
    private String locator;
    private String banco;
    private String canal;
    @Getter(onMethod_ = @PropertyName("capacidad_gb"))
    @Setter(onMethod_ = @PropertyName("capacidad_gb"))
    private int capacidadGB;
    @Getter(onMethod_ = @PropertyName("velocidad_mhz"))
    @Setter(onMethod_ = @PropertyName("velocidad_mhz"))
    private int velocidadMHz;
    private String modelo;
    private String fabricante;
    private String tecnologia;
    @Getter(onMethod_ = @PropertyName("numero_serie"))
    @Setter(onMethod_ = @PropertyName("numero_serie"))
    private String numeroSerie;
    @Getter(onMethod_ = @PropertyName("form_factor"))
    @Setter(onMethod_ = @PropertyName("form_factor"))
    private String formFactor;
    /** En Firestore suele venir como número (288); Integer evita que falle {@code toObject} del documento. */
    private Integer pines;
    @Getter(onMethod_ = @PropertyName("voltaje_v"))
    @Setter(onMethod_ = @PropertyName("voltaje_v"))
    private Double voltajeV;
    @Getter(onMethod_ = @PropertyName("ancho_datos"))
    @Setter(onMethod_ = @PropertyName("ancho_datos"))
    private Integer anchoDatos;

    @Override
    public String toString() {
        return String.format("%s %dGB %dMHz", modelo, capacidadGB, velocidadMHz);
    }
}

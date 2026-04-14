package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.PropertyName;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Ram {

    @Getter(onMethod_ = @PropertyName("capacidad_gb"))
    @Setter(onMethod_ = @PropertyName("capacidad_gb"))
    private int capacidadGB;
    @Getter(onMethod_ = @PropertyName("velocidad_mhz"))
    @Setter(onMethod_ = @PropertyName("velocidad_mhz"))
    private int velocidadMHz;
    private String modelo;
    private String fabricante;

    @Override
    public String toString() {
        return String.format("%s %dGB %dMHz", modelo, capacidadGB, velocidadMHz);
    }
}

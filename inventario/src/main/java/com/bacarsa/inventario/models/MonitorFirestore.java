package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.PropertyName;
import lombok.Getter;
import lombok.Setter;

/**
 * Elemento de {@code perifericos.monitores} en Firestore.
 */
@Getter
@Setter
public class MonitorFirestore {

    private String nombre;
    private String resolucion;
    private Double pulgadas;
    @Getter(onMethod_ = @PropertyName("ancho_cm"))
    @Setter(onMethod_ = @PropertyName("ancho_cm"))
    private Double anchoCm;
    @Getter(onMethod_ = @PropertyName("alto_cm"))
    @Setter(onMethod_ = @PropertyName("alto_cm"))
    private Double altoCm;
}

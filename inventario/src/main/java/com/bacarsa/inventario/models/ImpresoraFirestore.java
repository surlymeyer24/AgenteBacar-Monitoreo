package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.PropertyName;
import lombok.Getter;
import lombok.Setter;

/**
 * Elemento de {@code perifericos.impresoras} tal como lo escribe el agente en Firestore.
 */
@Getter
@Setter
public class ImpresoraFirestore {

    private String nombre;
    private String driver;
    private String puerto;
    private String tipo;
    @Getter(onMethod_ = @PropertyName("tipo_impresora"))
    @Setter(onMethod_ = @PropertyName("tipo_impresora"))
    private String tipoImpresora;
    /** Estado reportado por Windows; no es el estado operativo IT. */
    private String estado;
    private Boolean compartida;
    @Getter(onMethod_ = @PropertyName("predeterminada"))
    @Setter(onMethod_ = @PropertyName("predeterminada"))
    private Boolean predeterminada;
}

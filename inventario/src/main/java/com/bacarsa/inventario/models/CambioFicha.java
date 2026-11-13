package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CambioFicha {

    private String campo;

    @Getter(onMethod_ = @PropertyName("valor_anterior"))
    @Setter(onMethod_ = @PropertyName("valor_anterior"))
    private String valorAnterior;

    @Getter(onMethod_ = @PropertyName("valor_nuevo"))
    @Setter(onMethod_ = @PropertyName("valor_nuevo"))
    private String valorNuevo;
}

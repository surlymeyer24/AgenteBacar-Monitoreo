package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BaselinePerifericoEsperado {

    private String tipo;

    @Getter(onMethod_ = @PropertyName("id_stock"))
    @Setter(onMethod_ = @PropertyName("id_stock"))
    private String idStock;

    private String nombre;
    private String fabricante;

    @Getter(onMethod_ = @PropertyName("numero_serie"))
    @Setter(onMethod_ = @PropertyName("numero_serie"))
    private String numeroSerie;
}

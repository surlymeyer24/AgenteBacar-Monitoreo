package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProcesadorDetallado {

    @Getter(onMethod_ = @PropertyName("nombre_completo"))
    @Setter(onMethod_ = @PropertyName("nombre_completo"))
    private String nombreCompleto;

    private String fabricante;
    private String gama;
    private String modelo;
    private Integer generacion;

    @Getter(onMethod_ = @PropertyName("nucleos_fisicos"))
    @Setter(onMethod_ = @PropertyName("nucleos_fisicos"))
    private Integer nucleosFisicos;

    @Getter(onMethod_ = @PropertyName("nucleos_logicos"))
    @Setter(onMethod_ = @PropertyName("nucleos_logicos"))
    private Integer nucleosLogicos;

    @Getter(onMethod_ = @PropertyName("frecuencia_max_mhz"))
    @Setter(onMethod_ = @PropertyName("frecuencia_max_mhz"))
    private Integer frecuenciaMaxMhz;
}

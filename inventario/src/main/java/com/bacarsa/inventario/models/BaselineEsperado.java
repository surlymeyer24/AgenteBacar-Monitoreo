package com.bacarsa.inventario.models;

import java.util.ArrayList;
import java.util.List;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BaselineEsperado {

    @Getter(onMethod_ = @PropertyName("cpu_modelo"))
    @Setter(onMethod_ = @PropertyName("cpu_modelo"))
    private String cpuModelo;

    @Getter(onMethod_ = @PropertyName("ram_total_gb"))
    @Setter(onMethod_ = @PropertyName("ram_total_gb"))
    private Integer ramTotalGb;

    @Getter(onMethod_ = @PropertyName("disco_resumen"))
    @Setter(onMethod_ = @PropertyName("disco_resumen"))
    private String discoResumen;

    private List<BaselinePerifericoEsperado> perifericos = new ArrayList<>();

    @Getter(onMethod_ = @PropertyName("armado_at"))
    @Setter(onMethod_ = @PropertyName("armado_at"))
    private Timestamp armadoAt;

    @Getter(onMethod_ = @PropertyName("armado_por"))
    @Setter(onMethod_ = @PropertyName("armado_por"))
    private String armadoPor;
}

package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RamPlaca {

    @Getter(onMethod_ = @PropertyName("slots_totales"))
    @Setter(onMethod_ = @PropertyName("slots_totales"))
    private int slotsTotales;

    @Getter(onMethod_ = @PropertyName("slots_ocupados"))
    @Setter(onMethod_ = @PropertyName("slots_ocupados"))
    private int slotsOcupados;

    @Getter(onMethod_ = @PropertyName("canal_modo"))
    @Setter(onMethod_ = @PropertyName("canal_modo"))
    private String canalModo;

    @Getter(onMethod_ = @PropertyName("max_capacidad_gb"))
    @Setter(onMethod_ = @PropertyName("max_capacidad_gb"))
    private Integer maxCapacidadGb;
}

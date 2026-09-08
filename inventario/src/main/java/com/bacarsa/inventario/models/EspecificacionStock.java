package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

/**
 * Specs estructuradas de hardware para ítems de stock (principalmente PCs por cantidad).
 * Alineado con {@link BaselineEsperado} para facilitar trazabilidad futura.
 */
@Getter
@Setter
public class EspecificacionStock {

    @Getter(onMethod_ = @PropertyName("cpu_modelo"))
    @Setter(onMethod_ = @PropertyName("cpu_modelo"))
    private String cpuModelo;

    @Getter(onMethod_ = @PropertyName("ram_total_gb"))
    @Setter(onMethod_ = @PropertyName("ram_total_gb"))
    private Integer ramTotalGb;

    @Getter(onMethod_ = @PropertyName("disco_resumen"))
    @Setter(onMethod_ = @PropertyName("disco_resumen"))
    private String discoResumen;

    @Getter(onMethod_ = @PropertyName("tipo_equipo"))
    @Setter(onMethod_ = @PropertyName("tipo_equipo"))
    private String tipoEquipo;

    private String condicion;
}

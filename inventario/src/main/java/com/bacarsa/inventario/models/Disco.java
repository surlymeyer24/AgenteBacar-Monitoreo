package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.PropertyName;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Disco {

    @Getter(onMethod_ = @PropertyName("tipo_disco"))
    @Setter(onMethod_ = @PropertyName("tipo_disco"))
    private String tipoDisco;
    @Getter(onMethod_ = @PropertyName("modelo_disco"))
    @Setter(onMethod_ = @PropertyName("modelo_disco"))
    private String modeloDisco;
    @Getter(onMethod_ = @PropertyName("total_gb"))
    @Setter(onMethod_ = @PropertyName("total_gb"))
    private double totalGB;
    @Getter(onMethod_ = @PropertyName("libre_gb"))
    @Setter(onMethod_ = @PropertyName("libre_gb"))
    private double libreGB;
    @Getter(onMethod_ = @PropertyName("usado_gb"))
    @Setter(onMethod_ = @PropertyName("usado_gb"))
    private double usadoGB;
    @Getter(onMethod_ = @PropertyName("punto_montaje"))
    @Setter(onMethod_ = @PropertyName("punto_montaje"))
    private String puntoMontaje;
    private String dispositivo;
    @Getter(onMethod_ = @PropertyName("porcentaje_usado"))
    @Setter(onMethod_ = @PropertyName("porcentaje_usado"))
    private double porcentajeUsado;
    @Getter(onMethod_ = @PropertyName("disco_fisico_index"))
    @Setter(onMethod_ = @PropertyName("disco_fisico_index"))
    private String discoFisicoIndex;

    @Override
    public String toString() {
        return String.format("%s (%.1f/%.1f GB libres) [%s]",
                modeloDisco, libreGB, totalGB, puntoMontaje);
    }
}

package com.bacarsa.inventario.models;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SesionBloqueo {

    @DocumentId
    private String id;

    @Getter(onMethod_ = @PropertyName("computadora_id"))
    @Setter(onMethod_ = @PropertyName("computadora_id"))
    private String computadoraId;

    private String hostname;

    private String ubicacion;

    @Getter(onMethod_ = @PropertyName("bloqueado_en"))
    @Setter(onMethod_ = @PropertyName("bloqueado_en"))
    private Timestamp bloqueadoEn;

    @Getter(onMethod_ = @PropertyName("estado_anterior"))
    @Setter(onMethod_ = @PropertyName("estado_anterior"))
    private String estadoAnterior;

    @Getter(onMethod_ = @PropertyName("sesion_bloqueo_auto_min"))
    @Setter(onMethod_ = @PropertyName("sesion_bloqueo_auto_min"))
    private Integer sesionBloqueoAutoMin;
}

package com.bacarsa.inventario.models;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AsignacionResponsable {

    @Getter(onMethod_ = @PropertyName("computadora_uuid"))
    @Setter(onMethod_ = @PropertyName("computadora_uuid"))
    private String computadoraUuid;

    private String hostname;
    private String ubicacion;

    @Getter(onMethod_ = @PropertyName("asignado_at"))
    @Setter(onMethod_ = @PropertyName("asignado_at"))
    private Timestamp asignadoAt;
}

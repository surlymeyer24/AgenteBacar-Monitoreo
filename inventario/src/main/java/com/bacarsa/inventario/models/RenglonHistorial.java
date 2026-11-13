package com.bacarsa.inventario.models;

import java.util.ArrayList;
import java.util.List;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RenglonHistorial {

    private String tipo;

    @Getter(onMethod_ = @PropertyName("acto_id"))
    @Setter(onMethod_ = @PropertyName("acto_id"))
    private String actoId;

    private Timestamp cuando;
    private Timestamp desde;
    private Timestamp hasta;
    private String estado;

    @Getter(onMethod_ = @PropertyName("estado_anterior"))
    @Setter(onMethod_ = @PropertyName("estado_anterior"))
    private String estadoAnterior;

    private String motivo;

    @Getter(onMethod_ = @PropertyName("quien_uid"))
    @Setter(onMethod_ = @PropertyName("quien_uid"))
    private String quienUid;

    @Getter(onMethod_ = @PropertyName("quien_nombre"))
    @Setter(onMethod_ = @PropertyName("quien_nombre"))
    private String quienNombre;

    private String origen;

    @Getter(onMethod_ = @PropertyName("pasado_desconocido"))
    @Setter(onMethod_ = @PropertyName("pasado_desconocido"))
    private Boolean pasadoDesconocido;

    private List<CambioFicha> cambios = new ArrayList<>();
}

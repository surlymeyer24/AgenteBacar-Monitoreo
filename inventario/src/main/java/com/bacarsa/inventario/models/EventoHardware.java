package com.bacarsa.inventario.models;

import java.util.Map;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EventoHardware {

    @DocumentId
    private String id;

    private String uuid;
    private String hostname;

    @Getter(onMethod_ = @PropertyName("tipo_componente"))
    @Setter(onMethod_ = @PropertyName("tipo_componente"))
    private String tipoComponente;

    @Getter(onMethod_ = @PropertyName("tipo_evento"))
    @Setter(onMethod_ = @PropertyName("tipo_evento"))
    private String tipoEvento;

    private Timestamp timestamp;

    private Map<String, Object> antes;
    private Map<String, Object> despues;

    private String fingerprint;
    private String origen;

    @Getter(onMethod_ = @PropertyName("version_agente"))
    @Setter(onMethod_ = @PropertyName("version_agente"))
    private String versionAgente;

    @Getter(onMethod_ = @PropertyName("expire_at"))
    @Setter(onMethod_ = @PropertyName("expire_at"))
    private Timestamp expireAt;

    @Getter(onMethod_ = @PropertyName("estado_seguimiento"))
    @Setter(onMethod_ = @PropertyName("estado_seguimiento"))
    private String estadoSeguimiento;

    private Boolean leido;

    @Getter(onMethod_ = @PropertyName("revisado_por"))
    @Setter(onMethod_ = @PropertyName("revisado_por"))
    private String revisadoPor;

    @Getter(onMethod_ = @PropertyName("revisado_en"))
    @Setter(onMethod_ = @PropertyName("revisado_en"))
    private Timestamp revisadoEn;

    @Getter(onMethod_ = @PropertyName("notas_it"))
    @Setter(onMethod_ = @PropertyName("notas_it"))
    private String notasIt;
}

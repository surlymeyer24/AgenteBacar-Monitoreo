package com.bacarsa.inventario.models;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ConciliacionStock {

    private String id;

    @Getter(onMethod_ = @PropertyName("agente_uuid"))
    @Setter(onMethod_ = @PropertyName("agente_uuid"))
    private String agenteUuid;

    @Getter(onMethod_ = @PropertyName("candidato_stock_uuid"))
    @Setter(onMethod_ = @PropertyName("candidato_stock_uuid"))
    private String candidatoStockUuid;

    private Integer score;

    @Getter(onMethod_ = @PropertyName("campos_coincidentes"))
    @Setter(onMethod_ = @PropertyName("campos_coincidentes"))
    private List<String> camposCoincidentes = new ArrayList<>();

    @Getter(onMethod_ = @PropertyName("campos_diferentes"))
    @Setter(onMethod_ = @PropertyName("campos_diferentes"))
    private List<String> camposDiferentes = new ArrayList<>();

    @Getter(onMethod_ = @PropertyName("notas_match"))
    @Setter(onMethod_ = @PropertyName("notas_match"))
    private List<String> notasMatch = new ArrayList<>();

    private DecisionConciliacion decision;

    private String usuario;

    private Timestamp fecha;

    private OrigenConciliacion origen;

    @Getter(onMethod_ = @PropertyName("snapshot_clave"))
    @Setter(onMethod_ = @PropertyName("snapshot_clave"))
    private String snapshotClave;

    @Getter(onMethod_ = @PropertyName("detalle_comparacion"))
    @Setter(onMethod_ = @PropertyName("detalle_comparacion"))
    private Map<String, Object> detalleComparacion;

    @Getter(onMethod_ = @PropertyName("pospuesto_at"))
    @Setter(onMethod_ = @PropertyName("pospuesto_at"))
    private Timestamp pospuestoAt;

    /** Resumen denormalizado para bandeja (evita N+1 en listado). */
    @Getter(onMethod_ = @PropertyName("agente_hostname"))
    @Setter(onMethod_ = @PropertyName("agente_hostname"))
    private String agenteHostname;

    @Getter(onMethod_ = @PropertyName("stock_hostname"))
    @Setter(onMethod_ = @PropertyName("stock_hostname"))
    private String stockHostname;

    @Getter(onMethod_ = @PropertyName("agente_resumen"))
    @Setter(onMethod_ = @PropertyName("agente_resumen"))
    private String agenteResumen;

    @Getter(onMethod_ = @PropertyName("stock_resumen"))
    @Setter(onMethod_ = @PropertyName("stock_resumen"))
    private String stockResumen;
}

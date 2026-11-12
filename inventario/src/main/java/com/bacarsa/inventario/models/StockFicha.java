package com.bacarsa.inventario.models;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad central y única fuente de verdad para el stock (colección 'stock_fichas').
 * Cada unidad física tiene un único documento identificado por su código interno.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockFicha {

    @DocumentId
    @PropertyName("codigo_interno")
    private String codigoInterno;

    private String tipo;

    private String descripcion;

    private String marca;

    private String modelo;

    @PropertyName("serie_o_imei")
    private String serieOImei;

    private String estado; // EN_DEPOSITO, ASIGNADA, EN_MANTENIMIENTO, BAJA

    @PropertyName("responsable_id")
    private String responsableId;

    @PropertyName("responsable_nombre")
    private String responsableNombre;

    private String area;

    private String ubicacion;

    private String condicion; // NUEVA, USADA, REPARADA

    @PropertyName("ref_origen")
    private String refOrigen; // ej: "perifericos_manuales/xxx", "computadoras/uuid"

    /** Unidades que representa la ficha. 1 = unidad individual, > 1 = lote. */
    private Integer cantidad;

    /** Código del lote del que se descontó esta ficha (solo fichas hijas de una asignación parcial). */
    @PropertyName("lote_origen")
    private String loteOrigen;

    @PropertyName("created_at")
    private Timestamp createdAt;

    @PropertyName("updated_at")
    private Timestamp updatedAt;

    private String notas;
}

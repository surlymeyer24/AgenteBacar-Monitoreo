package com.bacarsa.inventario.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

/**
 * Fila de importación de cámaras (JSON o Excel); mismos campos que el inventario exportable.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CamaraImportRow {

    /** Legacy; usado solo si {@link #nombreDispositivo} está vacío. */
    private String id;

    /** ID del documento Firestore (preferido). */
    private String nombreDispositivo;

    private String nombre;
    private String ubicacion;
    private String marca;
    private String descripcion;
    private String direccionIp;
    private Integer puerto;
    private String tipo;
}

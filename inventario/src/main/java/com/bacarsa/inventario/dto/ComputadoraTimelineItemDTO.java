package com.bacarsa.inventario.dto;

import java.util.HashMap;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComputadoraTimelineItemDTO {

    /** CAMBIO_ESTADO | EVENTO_HARDWARE | CONCILIACION | SISTEMA */
    private String tipo;
    /** ISO-8601 */
    private String timestamp;
    private String titulo;
    private String descripcion;
    private String sourceId;
    /** Ruta relativa sugerida para el front (ej. /eventos-hardware/{id}). */
    private String enlace;
    private Map<String, Object> metadata = new HashMap<>();
}

package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsignarUnidadStockDTO {

    /**
     * Tipo de asignación: "PERSONA" o "AREA". Por defecto "PERSONA".
     */
    private String asignacionTipo;

    private String responsable;
    private String responsableId;
    private String area;
    private String motivo;

    /** Unidades a asignar (null = 1). */
    private Integer cantidad;
}

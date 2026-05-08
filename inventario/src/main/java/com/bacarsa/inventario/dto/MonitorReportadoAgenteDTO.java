package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Monitor del agente con PC de origen, para listados agregados ({@code GET /api/monitores}).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonitorReportadoAgenteDTO {

    private String nombre;
    private String resolucion;
    private Double pulgadas;
    private Double anchoCm;
    private Double altoCm;
    private String pcUuid;
    private String pcHostname;
}

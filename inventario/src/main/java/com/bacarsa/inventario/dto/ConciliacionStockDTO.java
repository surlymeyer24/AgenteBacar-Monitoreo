package com.bacarsa.inventario.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConciliacionStockDTO {
    private String id;
    private String agenteUuid;
    private String candidatoStockUuid;
    private Integer score;
    private List<String> camposCoincidentes;
    private List<String> camposDiferentes;
    private List<String> notasMatch;
    private String decision;
    private String usuario;
    private String fecha;
    private String origen;
    private String snapshotClave;
    private Map<String, Object> detalleComparacion;
    private String pospuestoAt;
    private String agenteHostname;
    private String stockHostname;
    private String agenteResumen;
    private String stockResumen;
    /** Enriquecido en detalle */
    private ComputadoraDTO agenteSnapshot;
    private ComputadoraDTO stockSnapshot;
}

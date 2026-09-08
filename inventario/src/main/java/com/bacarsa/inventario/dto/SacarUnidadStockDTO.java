package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SacarUnidadStockDTO {

    /** Opcional; si falta se genera desde la especificación del lote. */
    private String hostname;

    private String motivo;
}

package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Proyección liviana para el listado de etiquetas QR.
 * Excluye marcas, usuario e historial, que solo se usan en la ficha individual.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgresoLogisticaResumenDTO {
    private String uuid;
    private int etiquetadoPct;
    private int embaladoPct;
    private int destinoPct;
    private String estado;
}

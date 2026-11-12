package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SesionResumenHoyDTO {
    private String fecha;
    private Double horasActiva;
    private Double horasBloqueada;
    private Double horasSinUsuario;
    private Integer transiciones;
    private Double maxHorasActivaContinua;
}

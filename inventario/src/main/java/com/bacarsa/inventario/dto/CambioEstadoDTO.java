package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CambioEstadoDTO {
    private String estado;
    private String motivo;
    private String fechaHoraInicio; // ISO-8601
    private String fechaHoraFin; // ISO-8601
    private boolean activo;

}

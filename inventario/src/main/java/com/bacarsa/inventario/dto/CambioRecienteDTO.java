package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CambioRecienteDTO {
    private String tipo; // "computadora" | "camara"
    private String entidadId;
    private String entidadNombre;
    private String estado;
    private String motivo;
    private String fechaHoraInicio; // ISO-8601
}

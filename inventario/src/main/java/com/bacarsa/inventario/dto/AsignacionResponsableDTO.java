package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AsignacionResponsableDTO {
    private String computadoraUuid;
    private String hostname;
    private String ubicacion;
    private String estadoActual;
    private String asignadoAt;
}

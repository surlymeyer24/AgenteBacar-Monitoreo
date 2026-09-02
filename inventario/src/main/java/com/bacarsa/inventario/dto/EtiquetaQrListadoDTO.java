package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EtiquetaQrListadoDTO {
    private String uuid;
    private String hostname;
    private String usuarioActual;
    private String ubicacion;
    private String tipoEquipo;
    private int cantidadMonitores;
    private int cantidadPerifericos;
}

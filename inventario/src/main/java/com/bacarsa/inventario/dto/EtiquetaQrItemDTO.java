package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EtiquetaQrItemDTO {
    private String tipo;
    private String nombre;
    private String detalle;
    private String numeroSerie;

    public EtiquetaQrItemDTO(String tipo, String nombre, String detalle) {
        this.tipo = tipo;
        this.nombre = nombre;
        this.detalle = detalle;
    }
}

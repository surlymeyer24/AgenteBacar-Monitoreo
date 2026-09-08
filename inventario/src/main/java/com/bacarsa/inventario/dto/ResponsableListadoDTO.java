package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResponsableListadoDTO {
    private String id;
    private String nombre;
    private int cantidadEquipos;
    private String actualizadoAt;
}

package com.bacarsa.inventario.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResponsableDetalleDTO {
    private String id;
    private String nombre;
    private int cantidadEquipos;
    private List<AsignacionResponsableDTO> equipos;
}

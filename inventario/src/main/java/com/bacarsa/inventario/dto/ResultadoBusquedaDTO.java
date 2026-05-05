package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResultadoBusquedaDTO {
    private String tipo; // "computadora" | "camara"
    private String uuid;
    private String nombre;
    private String estado;
    private String ubicacion;
    private String path; // URL para acceder al detalle de la entidad


}

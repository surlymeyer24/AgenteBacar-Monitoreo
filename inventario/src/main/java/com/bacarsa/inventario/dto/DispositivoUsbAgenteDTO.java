package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class DispositivoUsbAgenteDTO {
    private String nombre;
    private String fabricante;
    private String categoria;
    private String clase;
    private String conexion;

}

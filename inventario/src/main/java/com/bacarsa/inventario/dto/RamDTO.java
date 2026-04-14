package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RamDTO {

    private int capacidadGB;
    private int velocidadMHz;
    private String modelo;
    private String fabricante;
}

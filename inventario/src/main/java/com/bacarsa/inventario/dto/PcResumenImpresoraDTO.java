package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PcResumenImpresoraDTO {

    private String uuid;
    private String hostname;
    private String ubicacion;
    private Boolean predeterminada;
    private Boolean compartida;
}

package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TelevisorDTO {

    private String id;
    private String marca;
    private String modelo;
    private String numeroSerie;
    private String area;
    private String direccionIp;
    private String estado;
}

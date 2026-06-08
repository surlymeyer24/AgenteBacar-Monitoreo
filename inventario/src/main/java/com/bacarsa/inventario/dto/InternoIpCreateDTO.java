package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternoIpCreateDTO {

    private String numeroInterno;
    private String asignadoA;
    private String direccionIp;
    private String macAddress;
    private String marcaModelo;

}

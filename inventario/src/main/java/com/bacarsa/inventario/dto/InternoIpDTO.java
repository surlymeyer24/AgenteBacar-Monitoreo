package com.bacarsa.inventario.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternoIpDTO {

    private String id;
    private String numeroInterno;
    private String asignadoA;
    private String direccionIp;
    private String macAddress;
    private String marcaModelo;
    private String estado;
    private List<CambioEstadoDTO> historialEstados;
}

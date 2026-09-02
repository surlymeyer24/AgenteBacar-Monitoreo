package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccessPointDTO {

    private String id;
    private String nombre;
    private String marca;
    private String modelo;
    private String ip;
    private String mac;
    private String switchUplink;
    private String ubicacion;
    private String estado;
}

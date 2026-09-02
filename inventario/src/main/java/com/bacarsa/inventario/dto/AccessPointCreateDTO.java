package com.bacarsa.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccessPointCreateDTO {

    @NotBlank
    private String nombre;
    private String marca;
    private String modelo;
    private String ip;
    private String mac;
    private String switchUplink;
    @NotBlank
    private String ubicacion;
    private String estado;
}

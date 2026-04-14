package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiscoDTO {

    private String tipoDisco;
    private String modeloDisco;
    private double totalGB;
    private double libreGB;
    private double usadoGB;
    private double porcentajeUsado;
    private String puntoMontaje;
    private String dispositivo;
    private String discoFisicoIndex;
}

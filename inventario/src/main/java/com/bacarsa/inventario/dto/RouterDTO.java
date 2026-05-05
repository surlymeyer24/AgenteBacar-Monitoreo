package com.bacarsa.inventario.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouterDTO {

    private String id;
    private String nombre;
    private String marca;
    private String modelo;
    private String ip;
    private String numeroSerie;
    private String firmware;
    private int cantidadPuertosWan;
    private int cantidadPuertosLan;
    private String gateway;
    private String ubicacion;
    private String estado;
    private LocalDate fechaAlta;
    private List<CambioEstadoDTO> historialEstados;
}

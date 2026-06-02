package com.bacarsa.inventario.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SwitchRedDTO {

    private String id;
    private String nombre;
    private String marca;
    private String modelo;
    private String ip;
    private String numeroSerie;
    private String sitio;
    private String ipPublica;
    private String estadoOmada;
    private String version;
    private String macUplink;
    private Integer salto;
    private int cantidadPuertos;
    private String tipo;
    private List<String> vlans;
    private String ubicacion;
    private String estado;
    private LocalDate fechaAlta;
    private List<CambioEstadoDTO> historialEstados;
}

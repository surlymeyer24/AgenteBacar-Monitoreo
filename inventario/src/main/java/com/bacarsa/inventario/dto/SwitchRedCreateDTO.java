package com.bacarsa.inventario.dto;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SwitchRedCreateDTO {

    @NotBlank
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
    @NotBlank
    private String ubicacion;
    private LocalDate fechaAlta;
}

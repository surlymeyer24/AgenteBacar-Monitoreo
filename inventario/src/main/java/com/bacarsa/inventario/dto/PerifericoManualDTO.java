package com.bacarsa.inventario.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerifericoManualDTO {

    private String id;
    private String tipo;
    private int cantidad;
    private String nombre;
    private String fabricante;
    private String conexion;
    private String computadoraHostname;
    private String ubicacion;
    private String notas;
    private String estado;
    private LocalDate fechaAlta;
    private List<CambioEstadoDTO> historialEstados;
}

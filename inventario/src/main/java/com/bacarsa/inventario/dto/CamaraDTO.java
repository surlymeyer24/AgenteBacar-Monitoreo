package com.bacarsa.inventario.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@NoArgsConstructor
@AllArgsConstructor
public class CamaraDTO {

    private String id;
    private String nombre;
    private String marca;
    private String descripcion;
    private String responsable;
    private String ubicacion;
    private String direccionIp;
    private Integer puerto;
    private String tipo;
    private String estado;
    private LocalDate fechaAlta;
    private List<CambioEstadoDTO> historialEstados;
    private String nvrId;
}

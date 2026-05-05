package com.bacarsa.inventario.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaquinaTesoreriaDTO {

    private String id;
    private String tipo;
    private String modelo;
    private String nroSerie;
    private String vida;
    private String estado;
    private List<CambioEstadoDTO> historialEstados;
}

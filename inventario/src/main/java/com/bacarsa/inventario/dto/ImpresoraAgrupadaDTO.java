package com.bacarsa.inventario.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImpresoraAgrupadaDTO {

    private String nombre;
    private String driver;
    private String puerto;
    private String tipo;
    private String tipoImpresora;
    private List<PcResumenImpresoraDTO> pcs;
}

package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImpresoraAgenteDTO {
    private String nombre;
    private String driver;
    private String puerto;
    private String tipoImpresora;
    private String estado;
    private Boolean compartida;
    private Boolean predeterminada;
}

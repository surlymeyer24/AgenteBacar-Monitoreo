package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CatalogoItemDTO {
    private String id;
    private String catalogo;
    private String codigo;
    private String label;
    private boolean activo;
    private int orden;
    private String icono;
}

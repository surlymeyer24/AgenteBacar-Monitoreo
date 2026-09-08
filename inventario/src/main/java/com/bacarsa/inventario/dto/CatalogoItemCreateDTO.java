package com.bacarsa.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CatalogoItemCreateDTO {

    @NotBlank
    private String codigo;

    @NotBlank
    private String label;

    private Integer orden;

    private String icono;
}

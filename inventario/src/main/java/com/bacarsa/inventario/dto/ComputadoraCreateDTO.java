package com.bacarsa.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComputadoraCreateDTO {

    @NotBlank
    private String hostname;
    private String usuarioActual;
    private String ubicacion;
    private String sistemaOperativo;
    private String arquitectura;
    private String motivo;
}

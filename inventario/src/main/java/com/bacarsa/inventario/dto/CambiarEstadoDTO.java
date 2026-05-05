package com.bacarsa.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CambiarEstadoDTO {
    @NotBlank
    private String estado;
    /** Opcional en API; puede quedar vacío en Firestore. */
    @Size(max = 2000)
    private String motivo;

}

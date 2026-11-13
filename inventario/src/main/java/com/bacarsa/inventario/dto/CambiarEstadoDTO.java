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
    /**
     * Opcional en el resto de cambios. En una PC, {@code BAJA} lo exige el servicio
     * y solo se acepta si el equipo está en mantenimiento.
     */
    @Size(max = 2000)
    private String motivo;

    /** Solo cuando estado = ASIGNADA: a quién se asigna el equipo. */
    @Size(max = 200)
    private String responsableInventario;

    /** Solo cuando estado = SIN_ASIGNAR: dónde se guarda físicamente. */
    @Size(max = 500)
    private String ubicacionStock;
}

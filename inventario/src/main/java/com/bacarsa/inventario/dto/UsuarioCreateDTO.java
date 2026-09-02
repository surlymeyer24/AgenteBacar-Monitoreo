package com.bacarsa.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioCreateDTO {

    /** uid de Firebase Auth. Opcional si se envía email (se resuelve desde Firebase Auth). */
    private String uid;

    @NotBlank
    private String nombre;

    @NotBlank
    private String email;

    /** Valor del enum Rol como String: ADMINISTRADOR, USUARIO, VISUALIZADOR. */
    @NotNull
    private String rol;

}

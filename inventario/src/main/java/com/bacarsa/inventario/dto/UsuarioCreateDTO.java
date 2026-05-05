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

    /** uid de Firebase Auth — lo provee el frontend tras registrar al usuario. */
    @NotBlank
    private String uid;

    @NotBlank
    private String nombre;

    @NotBlank
    private String email;

    /** Valor del enum Rol como String: ADMIN, OPERADOR, VISUALIZADOR. */
    @NotNull
    private String rol;

}

package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioUpdateDTO {

    private String nombre;
    private String email;
    /** ADMINISTRADOR, USUARIO o VISUALIZADOR. */
    private String rol;
    private Boolean activo;

}

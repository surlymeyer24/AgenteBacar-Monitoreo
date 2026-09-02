package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioDTO {

    private String id;
    private String nombre;
    private String email;
    private String rol;
    private boolean activo;
    /** Tiene cuenta en Firebase Authentication. */
    private boolean enAuth;
    /** Tiene documento de perfil/rol en Firestore (colección usuarios). */
    private boolean tienePerfil;

}

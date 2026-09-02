package com.bacarsa.inventario.models;

import lombok.Getter;


@Getter
public enum Rol {
    /** Acceso total: inventario, usuarios y endpoints /api/admin. */
    ADMINISTRADOR,
    /** Lectura y escritura de inventario; sin administración ni gestión de usuarios. */
    USUARIO,
    /** Solo lectura (GET); no puede crear, editar ni eliminar. */
    VISUALIZADOR
}

package com.bacarsa.inventario.util;

/**
 * Normaliza el usuario de sesión que reporta el agente.
 * El agente escribe {@code SYSTEM} cuando no hay una persona con sesión: se trata como sin usuario.
 */
public final class UsuarioSesionHelper {

    private static final String USUARIO_SISTEMA = "SYSTEM";

    private UsuarioSesionHelper() {
    }

    public static String limpiar(String usuario) {
        if (usuario == null) {
            return null;
        }
        String texto = usuario.trim();
        if (texto.isEmpty() || USUARIO_SISTEMA.equalsIgnoreCase(texto)) {
            return null;
        }
        return texto;
    }

    public static boolean esUsuarioSistema(String usuario) {
        if (usuario == null || usuario.isBlank()) {
            return true;
        }
        return USUARIO_SISTEMA.equalsIgnoreCase(usuario.trim());
    }
}

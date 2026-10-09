package com.bacarsa.inventario.historial;

/**
 * Quién figura en un renglón. Sale del token o de una constante del servidor.
 * Nunca del cuerpo que manda el cliente.
 */
public record ActorHistorial(String uid, String nombre) {

    public static final ActorHistorial SISTEMA = new ActorHistorial("SISTEMA", "SISTEMA");
    public static final ActorHistorial DESCONOCIDO = new ActorHistorial("DESCONOCIDO", "DESCONOCIDO");

    public ActorHistorial {
        uid = uid == null || uid.isBlank() ? DESCONOCIDO.uid() : uid.trim();
        nombre = nombre == null || nombre.isBlank() ? uid : nombre.trim();
    }
}

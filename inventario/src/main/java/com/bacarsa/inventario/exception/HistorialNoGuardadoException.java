package com.bacarsa.inventario.exception;

/**
 * La transacción no dejó el renglón. La ficha no se modifica.
 */
public class HistorialNoGuardadoException extends RuntimeException {

    private final String fichaId;

    public HistorialNoGuardadoException(String fichaId, Throwable cause) {
        super("No se pudo guardar el historial de la ficha " + fichaId, cause);
        this.fichaId = fichaId;
    }

    public String getFichaId() {
        return fichaId;
    }
}

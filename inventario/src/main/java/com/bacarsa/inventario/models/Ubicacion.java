package com.bacarsa.inventario.models;

public enum Ubicacion {
    ADMINISTRACION,
    MONITOREO,
    TESORERIA,
    CAPITAL_HUMANO,
    SISTEMAS,
    /**
     * Valor antiguo guardado en Firestore (sin guiones bajos). No usar en código nuevo;
     * al leer se normaliza a {@link #SEGURIDAD_PRIVADA}.
     */
    SEGURIDADPRIVAD,
    SEGURIDAD_PRIVADA,
    OPERACIONES;

    /** Mapea alias legacy al valor canónico actual. */
    public static Ubicacion normalizar(Ubicacion u) {
        if (u == null) {
            return null;
        }
        return u == SEGURIDADPRIVAD ? SEGURIDAD_PRIVADA : u;
    }
}

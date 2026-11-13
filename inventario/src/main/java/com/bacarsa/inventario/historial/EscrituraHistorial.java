package com.bacarsa.inventario.historial;

import java.util.Map;

/**
 * Resultado de planificar una escritura. El repositorio la aplica en una sola
 * transacción. Si no hay renglón cuando la ficha cambia, no se escribe.
 */
public final class EscrituraHistorial {

    public enum Modo {
        NADA,
        CREAR_CON_HISTORIAL,
        ACTUALIZAR_CON_HISTORIAL,
        /** Campos que pisa el agente. No agrega renglón. */
        SOLO_CAMPOS_AGENTE,
        /** Marca de migración ya hecha, sin renglón nuevo. */
        SOLO_MARCA
    }

    private final Modo modo;
    private final Map<String, Object> campos;

    private EscrituraHistorial(Modo modo, Map<String, Object> campos) {
        this.modo = modo;
        this.campos = campos;
    }

    public static EscrituraHistorial nada() {
        return new EscrituraHistorial(Modo.NADA, Map.of());
    }

    public static EscrituraHistorial crearConHistorial(Map<String, Object> campos) {
        return new EscrituraHistorial(Modo.CREAR_CON_HISTORIAL, campos);
    }

    public static EscrituraHistorial actualizarConHistorial(Map<String, Object> campos) {
        return new EscrituraHistorial(Modo.ACTUALIZAR_CON_HISTORIAL, campos);
    }

    public static EscrituraHistorial soloCamposAgente(Map<String, Object> campos) {
        return new EscrituraHistorial(Modo.SOLO_CAMPOS_AGENTE, campos);
    }

    public static EscrituraHistorial soloMarca(Map<String, Object> campos) {
        return new EscrituraHistorial(Modo.SOLO_MARCA, campos);
    }

    public Modo modo() {
        return modo;
    }

    public Map<String, Object> campos() {
        return campos;
    }
}

package com.bacarsa.inventario.repository;

import java.util.Map;

/**
 * Parche de un solo campo para {@code set(..., SetOptions.merge())}.
 * Poner la clave en el documento no borra el resto de la ficha.
 */
public final class MergeCodigoInterno {

    public static final String CAMPO = "codigo_interno";

    private MergeCodigoInterno() {
    }

    public static Map<String, Object> unSoloCampo(String codigo) {
        return Map.of(CAMPO, codigo);
    }

    public static void aplicar(Map<String, Object> documento, String codigo) {
        documento.put(CAMPO, codigo);
    }
}

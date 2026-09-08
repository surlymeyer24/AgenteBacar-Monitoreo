package com.bacarsa.inventario.util;

public final class BaselineNormalizacionHelper {

    private BaselineNormalizacionHelper() {
    }

    public static String normalizarTextoHw(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim().toLowerCase().replaceAll("\\s+", " ");
    }

    public static Integer normalizarRamGb(Integer raw) {
        if (raw == null) {
            return null;
        }
        if (raw < 0) {
            throw new IllegalArgumentException("RAM total no puede ser negativa");
        }
        return raw;
    }
}

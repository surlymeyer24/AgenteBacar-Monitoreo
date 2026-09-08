package com.bacarsa.inventario.util;

import java.util.Set;
import java.util.regex.Pattern;

public final class SerialPerifericoHelper {

    private static final Set<String> PLACEHOLDERS = Set.of(
            "n/a", "na", "unknown", "default string", "default", "none", "not available",
            "to be filled", "system serial number", "xxxxxxxx");

    private static final Pattern SOLO_CEROS = Pattern.compile("^0+$");
    private static final Pattern SOLO_X = Pattern.compile("^[xX]+$");

    private SerialPerifericoHelper() {
    }

    public static boolean esSerialValido(String serial) {
        if (serial == null || serial.isBlank()) {
            return false;
        }
        String norm = serial.trim().toLowerCase();
        if (norm.length() < 4) {
            return false;
        }
        if (PLACEHOLDERS.contains(norm)) {
            return false;
        }
        if (SOLO_CEROS.matcher(norm).matches() || SOLO_X.matcher(norm).matches()) {
            return false;
        }
        return true;
    }

    public static String normalizarSerial(String serial) {
        if (!esSerialValido(serial)) {
            return null;
        }
        return serial.trim().toLowerCase();
    }

    /** Identidad fuerte (MAC, BIOS, serial equipo) — misma heurística que periféricos. */
    public static boolean esIdentidadFuerteValida(String valor) {
        return esSerialValido(valor);
    }
}

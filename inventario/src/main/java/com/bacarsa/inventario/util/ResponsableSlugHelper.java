package com.bacarsa.inventario.util;

import java.text.Normalizer;

public final class ResponsableSlugHelper {

    private ResponsableSlugHelper() {}

    /** ID de documento Firestore a partir del nombre visible (asignado a). */
    public static String slugDeNombre(String nombre) {
        if (nombre == null) {
            return null;
        }
        String t = nombre.trim();
        if (t.isEmpty()) {
            return null;
        }
        String n = Normalizer.normalize(t.toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        n = n.replaceAll("[^a-z0-9]+", "_").replaceAll("^_+|_+$", "");
        return n.isEmpty() ? null : n;
    }

    public static boolean mismoResponsable(String a, String b) {
        if (a == null && b == null) {
            return true;
        }
        if (a == null || b == null) {
            return false;
        }
        String sa = slugDeNombre(a);
        String sb = slugDeNombre(b);
        if (sa != null && sa.equals(sb)) {
            return true;
        }
        return a.trim().equalsIgnoreCase(b.trim());
    }
}

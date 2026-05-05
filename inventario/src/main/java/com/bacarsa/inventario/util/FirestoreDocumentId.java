package com.bacarsa.inventario.util;

/**
 * Normaliza texto para usarlo como ID de documento Firestore (sin "/" ni "\\", trim).
 */
public final class FirestoreDocumentId {

    private FirestoreDocumentId() {
    }

    /** @return {@code null} si no queda un ID válido */
    public static String sanitizar(String raw) {
        if (raw == null) {
            return null;
        }
        String t = raw.trim();
        if (t.isEmpty()) {
            return null;
        }
        t = t.replace('/', '-').replace('\\', '-');
        if (".".equals(t) || "..".equals(t)) {
            return null;
        }
        return t;
    }
}

package com.bacarsa.inventario.util;

import com.bacarsa.inventario.models.DispositivoUsbFirestore;

/**
 * Misma heurística que el front ({@code utils/perifericos.js}) para listados USB del agente.
 */
public final class PerifericosAgenteHeuristica {

    private PerifericosAgenteHeuristica() {
    }

    public static boolean esTeclado(DispositivoUsbFirestore d) {
        if (d == null) {
            return false;
        }
        String clase = norm(d.getClase());
        String nombre = norm(d.getNombre());
        return clase.contains("keyboard") || nombre.contains("teclado") || nombre.contains("keyboard");
    }

    public static boolean esMouse(DispositivoUsbFirestore d) {
        if (d == null) {
            return false;
        }
        String clase = norm(d.getClase());
        String nombre = norm(d.getNombre());
        return clase.contains("mouse") || nombre.contains("mouse");
    }

    /** Solo clase USB {@code Camera} (UVC), alineado con {@code esWebcamClaseCamera} en el front. */
    public static boolean esWebcamClaseCamera(DispositivoUsbFirestore d) {
        if (d == null) {
            return false;
        }
        return norm(d.getClase()).contains("camera");
    }

    private static String norm(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }
}

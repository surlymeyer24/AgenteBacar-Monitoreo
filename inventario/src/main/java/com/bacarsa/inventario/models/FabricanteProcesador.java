package com.bacarsa.inventario.models;


public enum FabricanteProcesador {

    INTEL,
    AMD,
    DESCONOCIDO;

    public static FabricanteProcesador fromString(String nombreRaw) {
        if (nombreRaw == null) {
            return DESCONOCIDO;
        }
        String lower = nombreRaw.toLowerCase();
        if (lower.contains("intel")) {
            return INTEL;
        } else if (lower.contains("amd")) {
            return AMD;
    }    
        return DESCONOCIDO;
    }
}

package com.bacarsa.inventario.repository;

import java.util.List;

public final class ComputadoraSesionFields {

    private ComputadoraSesionFields() {
    }

    public static final List<String> ALL = List.of(
            "hostname",
            "ubicacion",
            "ultima_sincronizacion",
            "ultimaSincronizacion",
            "sesion_estado",
            "sesion_bloqueo_auto_min",
            "sesion_resumen_hoy"
    );
}

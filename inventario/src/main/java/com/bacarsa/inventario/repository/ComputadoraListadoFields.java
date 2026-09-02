package com.bacarsa.inventario.repository;

import java.util.List;

public final class ComputadoraListadoFields {

    private ComputadoraListadoFields() {
    }

    public static final List<String> ALL = List.of(
            "hostname",
            "tipo_equipo",
            "ubicacion",
            "sistema_operativo",
            "arquitectura",
            "estadoActual",
            "estado_conexion",
            "ultima_sincronizacion",
            "responsable_inventario",
            "anydesk_id",
            "anydesk",
            "procesador",
            "usuarios",
            "ubicacion_stock"
    );
}

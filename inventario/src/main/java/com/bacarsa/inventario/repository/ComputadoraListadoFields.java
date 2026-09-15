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
            "ubicacion_stock",
            "condicion",
            "origen_alta",
            "estado_conciliacion",
            "estado_preparacion",
            "estado_reporte_agente",
            "combo_esperado_id",
            "especificacion_esperada",
            "descripcion_stock",
            "lote_origen_id"
    );
}

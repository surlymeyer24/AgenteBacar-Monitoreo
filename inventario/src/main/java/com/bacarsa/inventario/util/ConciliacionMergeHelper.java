package com.bacarsa.inventario.util;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.google.cloud.firestore.DocumentSnapshot;

import lombok.Getter;

/**
 * Merge controlado agente → stock (Opción A: doc stock canónico).
 */
public final class ConciliacionMergeHelper {

    private ConciliacionMergeHelper() {
    }

    @Getter
    public static final class MergeResult {
        private final Map<String, Object> updates;
        private final List<String> camposEscritos;
        private final List<String> camposOmitidos;
        private final List<String> conflictos;

        public MergeResult(Map<String, Object> updates, List<String> camposEscritos,
                List<String> camposOmitidos, List<String> conflictos) {
            this.updates = updates;
            this.camposEscritos = camposEscritos;
            this.camposOmitidos = camposOmitidos;
            this.conflictos = conflictos;
        }
    }

    private static final List<String> IDENTIDAD_CAMPOS = List.of(
            "serial_equipo", "motherboard_serial", "bios_uuid", "mac_principal", "asset_tag");

    private static final List<String> TELEMETRIA_CAMPOS = List.of(
            "ultima_sincronizacion", "ram_total_gb", "procesador", "procesador_detallado",
            "nucleos_fisicos", "discos", "modulos_ram", "ram_placa", "perifericos",
            "estado_conexion", "sistema_operativo", "arquitectura", "cpu_uso_porcentaje",
            "ram_uso_porcentaje", "windows_version_detallada", "anydesk_id", "tipo_equipo");

    public static MergeResult construirMerge(DocumentSnapshot stockDoc, DocumentSnapshot agenteDoc, String agenteUuid) {
        Map<String, Object> stockData = stockDoc.getData() != null ? stockDoc.getData() : Map.of();
        Map<String, Object> agenteData = agenteDoc.getData() != null ? agenteDoc.getData() : Map.of();
        Map<String, Object> updates = new HashMap<>();
        List<String> escritos = new ArrayList<>();
        List<String> omitidos = new ArrayList<>();
        List<String> conflictos = new ArrayList<>();

        updates.put("agente_uuid", agenteUuid);

        for (String campo : IDENTIDAD_CAMPOS) {
            mergeIdentidad(campo, stockData.get(campo), agenteData.get(campo), updates, escritos, omitidos, conflictos);
        }

        for (String campo : TELEMETRIA_CAMPOS) {
            Object valorAgente = agenteData.get(campo);
            if (valorAgente != null) {
                updates.put(campo, valorAgente);
                escritos.add(campo);
            }
        }

        if (agenteDoc.getString("hostname") != null && !agenteDoc.getString("hostname").isBlank()) {
            updates.put("hostname", agenteDoc.getString("hostname"));
            escritos.add("hostname");
        }

        return new MergeResult(updates, escritos, omitidos, conflictos);
    }

    private static void mergeIdentidad(String campo, Object stockVal, Object agenteVal,
            Map<String, Object> updates, List<String> escritos, List<String> omitidos, List<String> conflictos) {
        String stockStr = toStr(stockVal);
        String agenteStr = toStr(agenteVal);
        if (!SerialPerifericoHelper.esIdentidadFuerteValida(agenteStr)) {
            return;
        }
        String agenteNorm = agenteStr.trim().toLowerCase(Locale.ROOT);
        if (stockStr == null || stockStr.isBlank()) {
            updates.put(campo, agenteVal);
            escritos.add(campo);
            return;
        }
        String stockNorm = stockStr.trim().toLowerCase(Locale.ROOT);
        if (stockNorm.equals(agenteNorm)) {
            omitidos.add(campo);
            return;
        }
        conflictos.add(campo);
        omitidos.add(campo);
    }

    private static String toStr(Object v) {
        if (v == null) return null;
        String s = String.valueOf(v).trim();
        return s.isEmpty() ? null : s;
    }
}

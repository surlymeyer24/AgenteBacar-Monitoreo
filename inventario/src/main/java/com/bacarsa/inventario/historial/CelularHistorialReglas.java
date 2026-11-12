package com.bacarsa.inventario.historial;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import com.google.cloud.Timestamp;

public final class CelularHistorialReglas {

    public static final String HISTORIAL = "historial";

    private static final Set<String> CAMPOS_FICHA = Set.of(
            "marca",
            "modelo",
            "imei",
            "linea_numero",
            "responsable",
            "area",
            "condicion",
            "con_cargador",
            "estado"
    );

    private CelularHistorialReglas() {}

    public static EscrituraHistorial altaManual(String id, Map<String, Object> cuerpo,
            ActorHistorial actor, Timestamp ahora) {
        Map<String, Object> updates = new LinkedHashMap<>();
        if (cuerpo != null) {
            updates.putAll(cuerpo);
        }

        List<Map<String, Object>> cambios = new ArrayList<>();
        for (String campo : CAMPOS_FICHA) {
            Object val = updates.get(campo);
            if (val != null && !String.valueOf(val).isBlank()) {
                cambios.add(Map.of(
                        "campo", campo,
                        "antes", "",
                        "despues", String.valueOf(val).trim()
                ));
            }
        }

        Map<String, Object> renglon = new LinkedHashMap<>();
        renglon.put("tipo", "ALTA_MANUAL");
        renglon.put("acto_id", UUID.randomUUID().toString());
        renglon.put("cuando", ahora);
        renglon.put("origen", "MANUAL");
        renglon.put("quien_uid", actor != null ? actor.uid() : "");
        renglon.put("quien_nombre", actor != null ? actor.nombre() : "");
        renglon.put("cambios", cambios);

        List<Map<String, Object>> historial = new ArrayList<>();
        historial.add(renglon);
        updates.put(HISTORIAL, historial);

        return EscrituraHistorial.crearConHistorial(updates);
    }

    public static EscrituraHistorial editarFicha(Map<String, Object> doc, Map<String, Object> nuevosCampos,
            ActorHistorial actor, Timestamp ahora) {
        if (doc == null) {
            throw new IllegalArgumentException("Celular no encontrado");
        }

        List<Map<String, Object>> cambios = new ArrayList<>();
        Map<String, Object> updates = new LinkedHashMap<>();

        for (String campo : CAMPOS_FICHA) {
            if (nuevosCampos.containsKey(campo)) {
                String antes = normalizar(doc.get(campo));
                String despues = normalizar(nuevosCampos.get(campo));
                if (!Objects.equals(antes, despues)) {
                    cambios.add(Map.of(
                            "campo", campo,
                            "antes", antes,
                            "despues", despues
                    ));
                    updates.put(campo, nuevosCampos.get(campo));
                }
            }
        }

        if (cambios.isEmpty()) {
            return EscrituraHistorial.nada();
        }

        List<Map<String, Object>> historial = copiarHistorial(doc.get(HISTORIAL));
        Map<String, Object> renglon = new LinkedHashMap<>();
        renglon.put("tipo", "EDICION_FICHA");
        renglon.put("acto_id", UUID.randomUUID().toString());
        renglon.put("cuando", ahora);
        renglon.put("origen", "MANUAL");
        renglon.put("quien_uid", actor != null ? actor.uid() : "");
        renglon.put("quien_nombre", actor != null ? actor.nombre() : "");
        renglon.put("cambios", cambios);

        historial.add(renglon);
        updates.put(HISTORIAL, historial);

        return EscrituraHistorial.actualizarConHistorial(updates);
    }

    private static String normalizar(Object obj) {
        if (obj == null) return "";
        return String.valueOf(obj).trim();
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> copiarHistorial(Object raw) {
        List<Map<String, Object>> out = new ArrayList<>();
        if (raw instanceof List<?> lista) {
            for (Object item : lista) {
                if (item instanceof Map<?, ?> m) {
                    out.add(new LinkedHashMap<>((Map<String, Object>) m));
                }
            }
        }
        return out;
    }
}

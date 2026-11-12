package com.bacarsa.inventario.historial;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import com.bacarsa.inventario.models.Estado;
import com.google.cloud.Timestamp;

public final class PerifericoManualHistorialReglas {

    public static final String HISTORIAL = "historial";
    public static final String HISTORIAL_ESTADOS = "historialEstados";

    private static final Set<String> CAMPOS_FICHA = Set.of(
            "nombre",
            "fabricante",
            "tipo",
            "numero_serie",
            "conexion",
            "ubicacion",
            "responsable",
            "condicion",
            "notas",
            "comentarios",
            "computadora_hostname",
            "computadora_uuid"
    );

    private PerifericoManualHistorialReglas() {}

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
            throw new IllegalArgumentException("Periférico no encontrado");
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

    public static EscrituraHistorial cambiarEstado(Map<String, Object> doc, Estado nuevoEstado,
            String motivo, ActorHistorial actor, Timestamp ahora) {
        if (doc == null) {
            throw new IllegalArgumentException("Periférico no encontrado");
        }

        Map<String, Object> updates = new LinkedHashMap<>();
        String estadoAnterior = "";
        Object estAct = doc.get("estadoActual");
        if (estAct instanceof Map<?, ?> m && m.get("nombre") != null) {
            estadoAnterior = String.valueOf(m.get("nombre"));
        }

        // 1. Tramo en historialEstados
        List<Map<String, Object>> historialEstados = copiarHistorialEstados(doc.get(HISTORIAL_ESTADOS));
        for (int i = 0; i < historialEstados.size(); i++) {
            Map<String, Object> entrada = historialEstados.get(i);
            if (entrada != null && entrada.get("fechaHoraFin") == null) {
                Map<String, Object> copia = new LinkedHashMap<>(entrada);
                copia.put("fechaHoraFin", ahora);
                historialEstados.set(i, copia);
            }
        }

        Map<String, Object> estadoMap = new LinkedHashMap<>();
        estadoMap.put("nombre", nuevoEstado.getNombre());
        estadoMap.put("descripcion", nuevoEstado.getDescripcion());

        Map<String, Object> nuevaEntrada = new LinkedHashMap<>();
        nuevaEntrada.put("estado", estadoMap);
        nuevaEntrada.put("motivo", motivo != null ? motivo : "");
        nuevaEntrada.put("fechaHoraInicio", ahora);
        nuevaEntrada.put("fechaHoraFin", null);
        historialEstados.add(nuevaEntrada);

        updates.put(HISTORIAL_ESTADOS, historialEstados);
        updates.put("estadoActual", estadoMap);

        // 2. Renglón inmutable append-only
        List<Map<String, Object>> historial = copiarHistorial(doc.get(HISTORIAL));
        Map<String, Object> renglon = new LinkedHashMap<>();
        renglon.put("tipo", "CAMBIO_ESTADO");
        renglon.put("acto_id", UUID.randomUUID().toString());
        renglon.put("cuando", ahora);
        renglon.put("estado", nuevoEstado.getNombre());
        renglon.put("estado_anterior", estadoAnterior);
        renglon.put("motivo", motivo != null ? motivo : "");
        renglon.put("origen", "MANUAL");
        renglon.put("quien_uid", actor != null ? actor.uid() : "");
        renglon.put("quien_nombre", actor != null ? actor.nombre() : "");
        renglon.put("cambios", List.of(Map.of(
                "campo", "estadoActual",
                "antes", estadoAnterior,
                "despues", nuevoEstado.getNombre()
        )));

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

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> copiarHistorialEstados(Object raw) {
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

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

public final class CamaraHistorialReglas {

    public static final String HISTORIAL = "historial";
    public static final String HISTORIAL_ESTADOS = "historialEstados";

    private static final Set<String> CAMPOS_FICHA = Set.of(
            "nombre",
            "marca",
            "descripcion",
            "responsable",
            "ubicacion",
            "direccionIp",
            "puerto",
            "tipo",
            "nvrId",
            "usuario",
            "password",
            "fechaAlta"
    );

    private CamaraHistorialReglas() {}

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
                // No exponer la contraseña en claro en el log de auditoría
                String displayVal = "password".equals(campo) ? "••••••" : String.valueOf(val).trim();
                cambios.add(Map.of(
                        "campo", campo,
                        "antes", "",
                        "despues", displayVal
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

        List<Map<String, Object>> historialNuevo = new ArrayList<>();
        historialNuevo.add(renglon);
        updates.put(HISTORIAL, historialNuevo);

        return EscrituraHistorial.crearConHistorial(updates);
    }

    public static EscrituraHistorial edicionFicha(Map<String, Object> actual, Map<String, Object> cambiosNuevos,
            ActorHistorial actor, Timestamp ahora) {
        if (cambiosNuevos == null || cambiosNuevos.isEmpty()) {
            return EscrituraHistorial.nada();
        }

        List<Map<String, Object>> listaCambios = new ArrayList<>();
        Map<String, Object> camposActualizar = new LinkedHashMap<>();

        for (Map.Entry<String, Object> entry : cambiosNuevos.entrySet()) {
            String campo = entry.getKey();
            if (!CAMPOS_FICHA.contains(campo)) {
                continue;
            }
            Object valorViejo = actual != null ? actual.get(campo) : null;
            Object valorNuevo = entry.getValue();

            String strViejo = valorViejo != null ? String.valueOf(valorViejo).trim() : "";
            String strNuevo = valorNuevo != null ? String.valueOf(valorNuevo).trim() : "";

            if (!Objects.equals(strViejo, strNuevo)) {
                camposActualizar.put(campo, valorNuevo);
                String displayViejo = "password".equals(campo) && !strViejo.isBlank() ? "••••••" : strViejo;
                String displayNuevo = "password".equals(campo) && !strNuevo.isBlank() ? "••••••" : strNuevo;
                listaCambios.add(Map.of(
                        "campo", campo,
                        "antes", displayViejo,
                        "despues", displayNuevo
                ));
            }
        }

        if (listaCambios.isEmpty()) {
            return EscrituraHistorial.nada();
        }

        Map<String, Object> renglon = new LinkedHashMap<>();
        renglon.put("tipo", "EDICION_FICHA");
        renglon.put("acto_id", UUID.randomUUID().toString());
        renglon.put("cuando", ahora);
        renglon.put("origen", "MANUAL");
        renglon.put("quien_uid", actor != null ? actor.uid() : "");
        renglon.put("quien_nombre", actor != null ? actor.nombre() : "");
        renglon.put("cambios", listaCambios);

        List<Map<String, Object>> historialExistente = copiarHistorial(actual);
        historialExistente.add(renglon);
        camposActualizar.put(HISTORIAL, historialExistente);

        return EscrituraHistorial.actualizarConHistorial(camposActualizar);
    }

    public static EscrituraHistorial cambioEstado(Map<String, Object> actual, Estado nuevoEstado,
            String motivo, ActorHistorial actor, Timestamp ahora) {
        String estadoAnterior = "";
        if (actual != null && actual.get("estadoActual") instanceof Map<?, ?> estMap) {
            Object nom = estMap.get("nombre");
            if (nom != null) {
                estadoAnterior = String.valueOf(nom);
            }
        }

        String nuevoNombre = nuevoEstado != null ? nuevoEstado.getNombre() : "";
        Map<String, Object> estadoMap = new LinkedHashMap<>();
        estadoMap.put("nombre", nuevoNombre);
        estadoMap.put("descripcion", nuevoEstado != null ? nuevoEstado.getDescripcion() : "");

        Map<String, Object> renglon = new LinkedHashMap<>();
        renglon.put("tipo", "CAMBIO_ESTADO");
        renglon.put("acto_id", UUID.randomUUID().toString());
        renglon.put("cuando", ahora);
        renglon.put("desde", ahora);
        renglon.put("estado", nuevoNombre);
        renglon.put("estado_anterior", estadoAnterior);
        renglon.put("motivo", motivo != null ? motivo.trim() : "Cambio de estado");
        renglon.put("origen", "MANUAL");
        renglon.put("quien_uid", actor != null ? actor.uid() : "");
        renglon.put("quien_nombre", actor != null ? actor.nombre() : "");
        renglon.put("cambios", List.of(Map.of(
                "campo", "estado",
                "antes", estadoAnterior,
                "despues", nuevoNombre
        )));

        List<Map<String, Object>> historial = copiarHistorial(actual);
        historial.add(renglon);

        Map<String, Object> updates = new LinkedHashMap<>();
        updates.put("estadoActual", estadoMap);
        updates.put(HISTORIAL, historial);

        // Actualizar también historialEstados legacy para retrocompatibilidad
        List<Map<String, Object>> historialLegacy = copiarHistorialLegacy(actual);
        for (int i = 0; i < historialLegacy.size(); i++) {
            Map<String, Object> entrada = historialLegacy.get(i);
            if (entrada != null && entrada.get("fechaHoraFin") == null) {
                Map<String, Object> copia = new LinkedHashMap<>(entrada);
                copia.put("fechaHoraFin", ahora);
                historialLegacy.set(i, copia);
            }
        }
        Map<String, Object> entradaLegacy = new LinkedHashMap<>();
        entradaLegacy.put("estado", estadoMap);
        entradaLegacy.put("motivo", motivo != null ? motivo.trim() : "Cambio de estado");
        entradaLegacy.put("fechaHoraInicio", ahora);
        entradaLegacy.put("fechaHoraFin", null);
        historialLegacy.add(entradaLegacy);
        updates.put(HISTORIAL_ESTADOS, historialLegacy);

        return EscrituraHistorial.actualizarConHistorial(updates);
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> copiarHistorial(Map<String, Object> actual) {
        List<Map<String, Object>> lista = new ArrayList<>();
        if (actual != null && actual.get(HISTORIAL) instanceof List<?> rawList) {
            for (Object obj : rawList) {
                if (obj instanceof Map<?, ?> m) {
                    lista.add(new LinkedHashMap<>((Map<String, Object>) m));
                }
            }
        }
        return lista;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> copiarHistorialLegacy(Map<String, Object> actual) {
        List<Map<String, Object>> lista = new ArrayList<>();
        if (actual != null && actual.get(HISTORIAL_ESTADOS) instanceof List<?> rawList) {
            for (Object obj : rawList) {
                if (obj instanceof Map<?, ?> m) {
                    lista.add(new LinkedHashMap<>((Map<String, Object>) m));
                }
            }
        }
        return lista;
    }
}

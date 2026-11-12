package com.bacarsa.inventario.mapper;

import java.util.Map;

import com.bacarsa.inventario.dto.ComputadoraSesionDTO;
import com.bacarsa.inventario.dto.SesionResumenHoyDTO;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;

public final class ComputadoraSesionMapper {

    private ComputadoraSesionMapper() {
    }

    public static ComputadoraSesionDTO fromSnapshot(DocumentSnapshot doc) {
        if (doc == null || !doc.exists()) {
            return null;
        }

        ComputadoraSesionDTO dto = new ComputadoraSesionDTO();
        dto.setId(doc.getId());
        dto.setHostname(doc.getString("hostname"));
        dto.setUbicacion(doc.getString("ubicacion"));
        dto.setSesionEstado(doc.getString("sesion_estado"));

        Long bloqueoMin = doc.getLong("sesion_bloqueo_auto_min");
        dto.setSesionBloqueoAutoMin(bloqueoMin != null ? bloqueoMin.intValue() : null);

        Timestamp ts = doc.getTimestamp("ultima_sincronizacion");
        if (ts == null) {
            ts = doc.getTimestamp("ultimaSincronizacion");
        }
        if (ts != null) {
            dto.setUltimaSincronizacion(ts.toDate().toInstant().toString());
        } else {
            Object rawSync = doc.get("ultima_sincronizacion");
            if (rawSync == null) rawSync = doc.get("ultimaSincronizacion");
            if (rawSync instanceof String s) {
                dto.setUltimaSincronizacion(s);
            }
        }

        Object resumenObj = doc.get("sesion_resumen_hoy");
        if (resumenObj instanceof Map<?, ?> m) {
            SesionResumenHoyDTO r = new SesionResumenHoyDTO();
            Object f = m.get("fecha");
            r.setFecha(f != null ? f.toString() : null);
            r.setHorasActiva(toDouble(m.get("horas_activa")));
            r.setHorasBloqueada(toDouble(m.get("horas_bloqueada")));
            r.setHorasSinUsuario(toDouble(m.get("horas_sin_usuario")));
            r.setTransiciones(toInteger(m.get("transiciones")));
            r.setMaxHorasActivaContinua(toDouble(m.get("max_horas_activa_continua")));
            dto.setSesionResumenHoy(r);
        }

        return dto;
    }

    private static Double toDouble(Object val) {
        if (val == null) return 0.0;
        if (val instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(val.toString());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private static Integer toInteger(Object val) {
        if (val == null) return 0;
        if (val instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(val.toString());
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}

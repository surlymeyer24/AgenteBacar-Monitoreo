package com.bacarsa.inventario.mapper;

import java.util.Map;

import com.bacarsa.inventario.dto.ComputadoraListadoDTO;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.Ubicacion;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;

public final class ComputadoraListadoMapper {

    private ComputadoraListadoMapper() {
    }

    @SuppressWarnings("unchecked")
    public static ComputadoraListadoDTO fromSnapshot(DocumentSnapshot doc) {
        if (doc == null || !doc.exists()) {
            return null;
        }

        ComputadoraListadoDTO dto = new ComputadoraListadoDTO();
        dto.setUuid(doc.getId());
        dto.setHostname(doc.getString("hostname"));

        dto.setTipoEquipo(getStringSafe(doc, "tipo_equipo"));

        String ubicacionRaw = doc.getString("ubicacion");
        dto.setUbicacion(normalizarUbicacion(ubicacionRaw));

        dto.setSistemaOperativo(doc.getString("sistema_operativo"));
        dto.setArquitectura(doc.getString("arquitectura"));

        String estadoConexion = doc.getString("estado_conexion");
        dto.setEstadoConexion(estadoConexion);
        dto.setEstadoAgente(mapearEstadoAgente(estadoConexion));

        Timestamp ts = doc.getTimestamp("ultima_sincronizacion");
        dto.setUltimaSincronizacion(ts != null ? ts.toDate().toInstant().toString() : null);

        Object procesadorObj = doc.get("procesador");
        if (procesadorObj instanceof String s) {
            dto.setProcesadorNombre(s);
        } else if (procesadorObj instanceof Map) {
            Map<String, Object> procMap = (Map<String, Object>) procesadorObj;
            Object nombreRaw = procMap.get("nombreRaw");
            if (nombreRaw == null) nombreRaw = procMap.get("nombre");
            if (nombreRaw instanceof String s) dto.setProcesadorNombre(s);
        }
        dto.setResponsableInventario(doc.getString("responsable_inventario"));
        dto.setUbicacionStock(doc.getString("ubicacion_stock"));

        Object usuariosObj = doc.get("usuarios");
        String usuarioActual = null;
        if (usuariosObj instanceof Map) {
            Map<String, Object> usuarios = (Map<String, Object>) usuariosObj;
            Object ua = usuarios.get("usuario_actual");
            if (ua instanceof String s && !s.isBlank()) {
                usuarioActual = s;
            }
        }
        dto.setUsuarioActual(usuarioActual);

        Object estadoActualObj = doc.get("estadoActual");
        if (estadoActualObj instanceof Map) {
            Map<String, Object> estadoMap = (Map<String, Object>) estadoActualObj;
            Object nombre = estadoMap.get("nombre");
            if (nombre instanceof String s && !s.isBlank()) {
                dto.setEstadoActual(s);
            }
        }
        if (dto.getEstadoActual() == null) {
            dto.setEstadoActual(
                    EstadoOperativo.inferirAsignacionDesdeTexto(usuarioActual).getNombre());
        }

        String anydeskId = doc.getString("anydesk_id");
        if (anydeskId == null || anydeskId.isBlank()) {
            anydeskId = doc.getString("anydesk");
        }
        dto.setAnydeskId(anydeskId);

        return dto;
    }

    private static String normalizarUbicacion(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Ubicacion.normalizar(Ubicacion.valueOf(raw.trim())).name();
        } catch (IllegalArgumentException e) {
            return raw.trim();
        }
    }

    private static String getStringSafe(DocumentSnapshot doc, String field) {
        Object val = doc.get(field);
        if (val instanceof String s) return s;
        if (val instanceof Map) {
            Object nombre = ((Map<?, ?>) val).get("nombre");
            if (nombre instanceof String s) return s;
        }
        return null;
    }

    private static String mapearEstadoAgente(String estadoConexion) {
        if (estadoConexion == null || estadoConexion.isBlank()) {
            return "Desconectado";
        }
        return "ONLINE".equalsIgnoreCase(estadoConexion.trim()) ? "Activo" : "Desconectado";
    }
}

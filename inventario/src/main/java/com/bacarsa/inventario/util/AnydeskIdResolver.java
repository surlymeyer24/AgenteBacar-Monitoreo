package com.bacarsa.inventario.util;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Resuelve el ID de AnyDesk desde el mapa crudo de Firestore.
 * El agente puede escribir {@code anydesk_id} como número, string, o variantes de nombre.
 */
public final class AnydeskIdResolver {

    private static final List<String> CLAVES_TOP = List.of(
            "anydesk_id", "anydeskId", "anydesk", "id_anydesk", "AnyDeskID", "AnyDeskId"
    );

    private static final List<String> CLAVES_USUARIOS = List.of(
            "anydesk_id", "anydeskId", "anydesk", "id_anydesk"
    );

    private static final Pattern SOLO_DIGITOS = Pattern.compile("^\\d{7,12}$");
    private static final Pattern DIGITOS_EN_TEXTO = Pattern.compile("(\\d{7,12})");

    private AnydeskIdResolver() {
    }

    public static String resolver(Map<String, Object> data) {
        if (data == null || data.isEmpty()) {
            return null;
        }
        for (String clave : CLAVES_TOP) {
            String id = normalizar(data.get(clave));
            if (id != null) {
                return id;
            }
        }
        Object usuariosObj = data.get("usuarios");
        if (usuariosObj instanceof Map<?, ?> usuarios) {
            for (String clave : CLAVES_USUARIOS) {
                String id = normalizar(usuarios.get(clave));
                if (id != null) {
                    return id;
                }
            }
        }
        return extraerDesdeImpresoras(data.get("perifericos"));
    }

    private static String extraerDesdeImpresoras(Object perifericosObj) {
        if (!(perifericosObj instanceof Map<?, ?> perifericos)) {
            return null;
        }
        Object impObj = perifericos.get("impresoras");
        if (!(impObj instanceof List<?> impresoras)) {
            return null;
        }
        for (Object item : impresoras) {
            if (!(item instanceof Map<?, ?> imp)) {
                continue;
            }
            String nombre = texto(imp.get("nombre"));
            String driver = texto(imp.get("driver"));
            String puerto = texto(imp.get("puerto"));
            String blob = (nombre + " " + driver + " " + puerto).toLowerCase();
            if (!blob.contains("anydesk") && !puerto.toLowerCase().contains("ad_port")) {
                continue;
            }
            String desdePuerto = extraerDigitosDeTexto(puerto);
            if (desdePuerto != null) {
                return desdePuerto;
            }
            String desdeNombre = extraerDigitosDeTexto(nombre);
            if (desdeNombre != null) {
                return desdeNombre;
            }
        }
        return null;
    }

    private static String normalizar(Object raw) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof Number n) {
            long v = n.longValue();
            return v > 0 ? Long.toString(v) : null;
        }
        String s = String.valueOf(raw).trim();
        if (s.isEmpty() || "null".equalsIgnoreCase(s) || "0".equals(s)) {
            return null;
        }
        if (SOLO_DIGITOS.matcher(s).matches()) {
            return s;
        }
        return extraerDigitosDeTexto(s);
    }

    private static String extraerDigitosDeTexto(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        String limpio = s.replaceAll("\\s+", "");
        if (SOLO_DIGITOS.matcher(limpio).matches()) {
            return limpio;
        }
        Matcher m = DIGITOS_EN_TEXTO.matcher(s);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }

    private static String texto(Object o) {
        return o == null ? "" : String.valueOf(o).trim();
    }
}

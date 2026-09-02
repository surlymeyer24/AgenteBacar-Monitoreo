package com.bacarsa.inventario.util;

import java.util.regex.Pattern;

/**
 * Extrae IP de red desde el puerto de impresora reportado por el agente (p. ej. {@code IP_192.168.1.10}).
 */
public final class ImpresoraIpHelper {

    private static final Pattern IPV4 = Pattern.compile("^\\d{1,3}(\\.\\d{1,3}){3}$");

    private ImpresoraIpHelper() {
    }

    /**
     * @return IP normalizada en minúsculas, o {@code null} si el puerto no contiene una IPv4 detectable
     */
    public static String extraerIp(String puerto) {
        String normalizado = normalizarPuerto(puerto);
        if (normalizado.isEmpty() || !IPV4.matcher(normalizado).matches()) {
            return null;
        }
        return normalizado;
    }

    static String normalizarPuerto(String puerto) {
        if (puerto == null) {
            return "";
        }
        String p = puerto.trim();
        if (p.toLowerCase().startsWith("ip_")) {
            p = p.substring(3);
        }
        p = p.replaceAll("(^|\\.)0+(\\d)", "$1$2");
        return p.toLowerCase();
    }
}

package com.bacarsa.inventario.services;

import java.util.Collection;
import java.util.Locale;
import java.util.function.Predicate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Código interno de stock para computadoras (PC-N / NB-N).
 * Evita que una PC que entra a depósito quede identificada por su hostname.
 */
public final class CodigoStockPc {

    private static final Pattern PATRON = Pattern.compile("^(PC|NB)-(\\d+)$");

    private CodigoStockPc() {
    }

    /** NB para notebooks/laptops; PC para cualquier otro caso (incluye tipo vacío). */
    public static String prefijo(String tipoEquipo) {
        if (tipoEquipo != null) {
            String t = tipoEquipo.trim().toLowerCase(Locale.ROOT);
            if (t.contains("notebook") || t.contains("laptop")) {
                return "NB";
            }
        }
        return "PC";
    }

    /** true si el código ya tiene la forma PC-N / NB-N. */
    public static boolean esCodigoValido(String codigo) {
        return codigo != null && PATRON.matcher(codigo.trim()).matches();
    }

    /**
     * Siguiente código libre para el prefijo: max(existentes) + 1, saltando los que
     * {@code ocupado} reporte como ya usados en otra colección.
     */
    public static String siguiente(String prefijo, Collection<String> existentes, Predicate<String> ocupado) {
        int max = 0;
        if (existentes != null) {
            for (String cod : existentes) {
                if (cod == null) {
                    continue;
                }
                Matcher m = PATRON.matcher(cod.trim());
                if (m.matches() && m.group(1).equals(prefijo)) {
                    try {
                        max = Math.max(max, Integer.parseInt(m.group(2)));
                    } catch (NumberFormatException ignored) {
                        // número fuera de rango: se ignora
                    }
                }
            }
        }
        int n = max + 1;
        String candidato = prefijo + "-" + n;
        while (ocupado != null && ocupado.test(candidato)) {
            n++;
            candidato = prefijo + "-" + n;
        }
        return candidato;
    }
}

package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class CodigoInternoBackfill {

    private static final Pattern CODIGO = Pattern.compile(
            "^(PC|NB|MON|TEC|MOU|IMP|WEB|PAR|MIC|CEL|CAM|TV|RTR|SW|AP)-(\\d+)$");

    private CodigoInternoBackfill() {
    }

    @FunctionalInterface
    public interface MergeUnCampo {
        void merge(String coleccion, String id, String codigo) throws Exception;
    }

    public record Resultado(int escritos, List<String> omitidos, List<String> fallos) {
    }

    public static Resultado ejecutar(List<FichaLectura> fichas, MergeUnCampo merge) {
        Map<String, Integer> maximos = new HashMap<>();
        for (FichaLectura ficha : fichas) {
            acumular(maximos, ficha.getCodigoInterno());
        }

        List<String> omitidos = new ArrayList<>();
        List<String> fallos = new ArrayList<>();
        int escritos = 0;
        for (FichaLectura ficha : fichas) {
            if (ficha.getCodigoInterno() != null) {
                continue;
            }
            if (ficha.getPrefijo() == null) {
                String motivo = ficha.getMotivoOmitir() == null ? "sin_codigo" : ficha.getMotivoOmitir();
                omitidos.add(ficha.referencia() + " motivo=" + motivo);
                continue;
            }
            int siguiente = maximos.getOrDefault(ficha.getPrefijo(), 0) + 1;
            String codigo = ficha.getPrefijo() + "-" + siguiente;
            try {
                merge.merge(ficha.getColeccion(), ficha.getId(), codigo);
                maximos.put(ficha.getPrefijo(), siguiente);
                escritos++;
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                fallos.add(ficha.referencia());
                break;
            } catch (Exception ex) {
                fallos.add(ficha.referencia());
            }
        }
        return new Resultado(escritos, List.copyOf(omitidos), List.copyOf(fallos));
    }

    private static void acumular(Map<String, Integer> maximos, String codigo) {
        if (codigo == null || codigo.isBlank()) {
            return;
        }
        Matcher matcher = CODIGO.matcher(codigo.trim());
        if (!matcher.matches()) {
            return;
        }
        int numero;
        try {
            numero = Integer.parseInt(matcher.group(2));
        } catch (NumberFormatException ex) {
            return;
        }
        maximos.merge(matcher.group(1), numero, Math::max);
    }
}

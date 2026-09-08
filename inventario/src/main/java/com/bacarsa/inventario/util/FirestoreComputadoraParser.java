package com.bacarsa.inventario.util;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.bacarsa.inventario.models.ProcesadorDetallado;
import com.bacarsa.inventario.models.Ram;
import com.bacarsa.inventario.models.RamPlaca;

/**
 * Parseo manual de campos del agente en documentos Firestore (evita fallos de
 * {@code toObject} por tipos numéricos Long vs String/Integer en listas anidadas).
 */
public final class FirestoreComputadoraParser {

    private FirestoreComputadoraParser() {}

    public static List<Ram> parseModulosRam(Object raw) {
        if (!(raw instanceof List<?> list)) {
            return List.of();
        }
        List<Ram> out = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> map) {
                Ram ram = parseModuloRam(map);
                if (ram != null) {
                    out.add(ram);
                }
            }
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    private static Ram parseModuloRam(Map<?, ?> map) {
        Map<String, Object> m = (Map<String, Object>) map;
        Ram ram = new Ram();
        int capacidad = toInt(m.get("capacidad_gb"));
        ram.setCapacidadGB(capacidad);
        if (m.containsKey("ocupado")) {
            ram.setOcupado(toBoolean(m.get("ocupado"), capacidad > 0));
        } else {
            ram.setOcupado(capacidad > 0);
        }
        ram.setSlot(toString(m.get("slot")));
        ram.setLocator(toString(m.get("locator")));
        ram.setBanco(toString(m.get("banco")));
        ram.setCanal(toString(m.get("canal")));
        ram.setVelocidadMHz(toInt(m.get("velocidad_mhz")));
        ram.setModelo(toString(m.get("modelo")));
        ram.setFabricante(toString(m.get("fabricante")));
        ram.setTecnologia(toString(m.get("tecnologia")));
        ram.setNumeroSerie(toString(m.get("numero_serie")));
        ram.setFormFactor(toString(m.get("form_factor")));
        ram.setPines(toIntNullable(m.get("pines")));
        ram.setVoltajeV(toDouble(m.get("voltaje_v")));
        ram.setAnchoDatos(toIntNullable(m.get("ancho_datos")));
        return ram;
    }

    @SuppressWarnings("unchecked")
    public static RamPlaca parseRamPlaca(Object raw) {
        if (!(raw instanceof Map<?, ?> map)) {
            return null;
        }
        Map<String, Object> m = (Map<String, Object>) map;
        RamPlaca placa = new RamPlaca();
        placa.setSlotsTotales(toInt(m.get("slots_totales")));
        placa.setSlotsOcupados(toInt(m.get("slots_ocupados")));
        placa.setCanalModo(toString(m.get("canal_modo")));
        Integer max = toIntNullable(m.get("max_capacidad_gb"));
        placa.setMaxCapacidadGb(max);
        return placa;
    }

    @SuppressWarnings("unchecked")
    public static ProcesadorDetallado parseProcesadorDetallado(Object raw) {
        if (!(raw instanceof Map<?, ?> map)) {
            return null;
        }
        Map<String, Object> m = (Map<String, Object>) map;
        ProcesadorDetallado d = new ProcesadorDetallado();
        d.setNombreCompleto(toString(m.get("nombre_completo")));
        d.setFabricante(toString(m.get("fabricante")));
        d.setGama(toString(m.get("gama")));
        d.setModelo(toString(m.get("modelo")));
        d.setGeneracion(toIntNullable(m.get("generacion")));
        d.setNucleosFisicos(toIntNullable(m.get("nucleos_fisicos")));
        d.setNucleosLogicos(toIntNullable(m.get("nucleos_logicos")));
        d.setFrecuenciaMaxMhz(toIntNullable(m.get("frecuencia_max_mhz")));
        return d;
    }

    public static Double toDouble(Object v) {
        if (v == null) {
            return null;
        }
        if (v instanceof Number n) {
            return n.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(v));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static int toInt(Object v) {
        Integer n = toIntNullable(v);
        return n != null ? n : 0;
    }

    private static Integer toIntNullable(Object v) {
        if (v == null) {
            return null;
        }
        if (v instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(v));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static boolean toBoolean(Object v, boolean defaultValue) {
        if (v instanceof Boolean b) {
            return b;
        }
        if (v != null) {
            return Boolean.parseBoolean(String.valueOf(v));
        }
        return defaultValue;
    }

    private static String toString(Object v) {
        if (v == null) {
            return null;
        }
        String s = String.valueOf(v).trim();
        return s.isEmpty() ? null : s;
    }

    private static String toPinesString(Object v) {
        if (v == null) {
            return null;
        }
        if (v instanceof Number n) {
            return n.intValue() + "-pin";
        }
        return toString(v);
    }
}

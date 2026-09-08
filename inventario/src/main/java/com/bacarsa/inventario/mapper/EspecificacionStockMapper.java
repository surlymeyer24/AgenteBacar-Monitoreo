package com.bacarsa.inventario.mapper;

import java.util.HashMap;
import java.util.Map;

import com.bacarsa.inventario.dto.EspecificacionStockDTO;
import com.bacarsa.inventario.models.EspecificacionStock;

public final class EspecificacionStockMapper {

    private EspecificacionStockMapper() {}

    public static EspecificacionStockDTO toDTO(EspecificacionStock spec) {
        if (spec == null) return null;
        EspecificacionStockDTO dto = new EspecificacionStockDTO();
        dto.setCpuModelo(spec.getCpuModelo());
        dto.setRamTotalGb(spec.getRamTotalGb());
        dto.setDiscoResumen(spec.getDiscoResumen());
        dto.setTipoEquipo(spec.getTipoEquipo());
        dto.setCondicion(spec.getCondicion());
        return dto;
    }

    public static EspecificacionStock fromDTO(EspecificacionStockDTO dto) {
        if (dto == null) return null;
        EspecificacionStock spec = new EspecificacionStock();
        spec.setCpuModelo(blankToNull(dto.getCpuModelo()));
        spec.setRamTotalGb(dto.getRamTotalGb());
        spec.setDiscoResumen(blankToNull(dto.getDiscoResumen()));
        spec.setTipoEquipo(blankToNull(dto.getTipoEquipo()));
        spec.setCondicion(blankToNull(dto.getCondicion()));
        if (isEmpty(spec)) return null;
        return spec;
    }

    @SuppressWarnings("unchecked")
    public static EspecificacionStock fromFirestoreMap(Object raw) {
        if (!(raw instanceof Map<?, ?> map)) return null;
        EspecificacionStock spec = new EspecificacionStock();
        String cpu = getString(map, "cpu_modelo", "cpuModelo");
        if (cpu != null) spec.setCpuModelo(cpu);
        Integer ram = getInteger(map, "ram_total_gb", "ramTotalGb");
        if (ram != null) spec.setRamTotalGb(ram);
        String disco = getString(map, "disco_resumen", "discoResumen");
        if (disco != null) spec.setDiscoResumen(disco);
        String tipo = getString(map, "tipo_equipo", "tipoEquipo");
        if (tipo != null) spec.setTipoEquipo(tipo);
        String cond = getString(map, "condicion", "condicion");
        if (cond != null) spec.setCondicion(cond);
        return isEmpty(spec) ? null : spec;
    }

    private static String getString(Map<?, ?> map, String snakeKey, String camelKey) {
        Object val = map.get(snakeKey);
        if (val == null) val = map.get(camelKey);
        if (val instanceof String s && !s.isBlank()) return s.trim();
        return null;
    }

    private static Integer getInteger(Map<?, ?> map, String snakeKey, String camelKey) {
        Object val = map.get(snakeKey);
        if (val == null) val = map.get(camelKey);
        if (val instanceof Number n) return n.intValue();
        if (val instanceof String s && !s.isBlank()) {
            try {
                return Integer.parseInt(s.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    public static Map<String, Object> toFirestoreMap(EspecificacionStock spec) {
        Map<String, Object> map = new HashMap<>();
        if (spec == null) return map;
        if (spec.getCpuModelo() != null) map.put("cpu_modelo", spec.getCpuModelo());
        if (spec.getRamTotalGb() != null) map.put("ram_total_gb", spec.getRamTotalGb());
        if (spec.getDiscoResumen() != null) map.put("disco_resumen", spec.getDiscoResumen());
        if (spec.getTipoEquipo() != null) map.put("tipo_equipo", spec.getTipoEquipo());
        if (spec.getCondicion() != null) map.put("condicion", spec.getCondicion());
        return map;
    }

    public static String buildNombreResumen(EspecificacionStock spec) {
        if (spec == null) return null;
        StringBuilder sb = new StringBuilder();
        if (spec.getCpuModelo() != null && !spec.getCpuModelo().isBlank()) {
            sb.append(spec.getCpuModelo().trim());
        }
        if (spec.getRamTotalGb() != null && spec.getRamTotalGb() > 0) {
            if (!sb.isEmpty()) sb.append(" · ");
            sb.append(spec.getRamTotalGb()).append(" GB RAM");
        }
        if (spec.getDiscoResumen() != null && !spec.getDiscoResumen().isBlank()) {
            if (!sb.isEmpty()) sb.append(" · ");
            sb.append(spec.getDiscoResumen().trim());
        }
        return sb.isEmpty() ? null : sb.toString();
    }

    private static boolean isEmpty(EspecificacionStock spec) {
        return (spec.getCpuModelo() == null || spec.getCpuModelo().isBlank())
                && spec.getRamTotalGb() == null
                && (spec.getDiscoResumen() == null || spec.getDiscoResumen().isBlank())
                && (spec.getTipoEquipo() == null || spec.getTipoEquipo().isBlank())
                && (spec.getCondicion() == null || spec.getCondicion().isBlank());
    }

    /**
     * Completa specs faltantes parseando el nombre comercial (ítems legacy sin especificacion_stock).
     */
    public static EspecificacionStock enrichFromNombre(EspecificacionStock spec, String nombre) {
        EspecificacionStock parsed = parseFromNombre(nombre);
        if (parsed == null) return spec;
        if (spec == null) return parsed;
        if (spec.getCpuModelo() == null || spec.getCpuModelo().isBlank()) {
            spec.setCpuModelo(parsed.getCpuModelo());
        }
        if (spec.getRamTotalGb() == null) {
            spec.setRamTotalGb(parsed.getRamTotalGb());
        }
        if (spec.getDiscoResumen() == null || spec.getDiscoResumen().isBlank()) {
            spec.setDiscoResumen(parsed.getDiscoResumen());
        }
        if (spec.getTipoEquipo() == null || spec.getTipoEquipo().isBlank()) {
            spec.setTipoEquipo(parsed.getTipoEquipo());
        }
        if (spec.getCondicion() == null || spec.getCondicion().isBlank()) {
            spec.setCondicion(parsed.getCondicion());
        }
        return isEmpty(spec) ? null : spec;
    }

    public static EspecificacionStock parseFromNombre(String nombre) {
        if (nombre == null || nombre.isBlank()) return null;
        String raw = nombre.trim().replace('–', '-').replace('—', '-').replace('−', '-');
        EspecificacionStock spec = new EspecificacionStock();

        if (raw.contains("·")) {
            for (String part : raw.split("·")) {
                part = part.trim();
                if (part.isEmpty()) continue;
                var ramMatch = java.util.regex.Pattern
                        .compile("^(\\d+)\\s*GB\\s*RAM$", java.util.regex.Pattern.CASE_INSENSITIVE)
                        .matcher(part);
                if (ramMatch.matches()) {
                    spec.setRamTotalGb(Integer.parseInt(ramMatch.group(1)));
                } else if (spec.getCpuModelo() == null || spec.getCpuModelo().isBlank()) {
                    spec.setCpuModelo(part);
                } else if (spec.getDiscoResumen() == null || spec.getDiscoResumen().isBlank()) {
                    spec.setDiscoResumen(part);
                }
            }
            return isEmpty(spec) ? null : spec;
        }

        var ramTail = java.util.regex.Pattern
                .compile("-\\s*(\\d+)\\s*(?:GB\\s*)?RAM\\s*$", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(raw);
        if (ramTail.find()) {
            spec.setRamTotalGb(Integer.parseInt(ramTail.group(1)));
            String cpu = raw.substring(0, ramTail.start()).replaceAll("[-\\s]+$", "").trim();
            if (!cpu.isBlank()) spec.setCpuModelo(cpu);
            return isEmpty(spec) ? null : spec;
        }

        var ramInline = java.util.regex.Pattern
                .compile("(\\d+)\\s*(?:GB\\s*)?RAM\\b", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(raw);
        if (ramInline.find()) {
            spec.setRamTotalGb(Integer.parseInt(ramInline.group(1)));
            String cpu = raw.substring(0, ramInline.start()).replaceAll("[-–—\\s]+$", "").trim();
            if (!cpu.isBlank()) spec.setCpuModelo(cpu);
            return isEmpty(spec) ? null : spec;
        }

        spec.setCpuModelo(raw);
        return isEmpty(spec) ? null : spec;
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}

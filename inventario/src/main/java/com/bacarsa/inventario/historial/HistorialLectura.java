package com.bacarsa.inventario.historial;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import com.bacarsa.inventario.dto.CambioFichaDTO;
import com.bacarsa.inventario.dto.RenglonHistorialDTO;
import com.bacarsa.inventario.models.CambioFicha;
import com.bacarsa.inventario.models.RenglonHistorial;
import com.google.cloud.Timestamp;

public final class HistorialLectura {

    private HistorialLectura() {
    }

    public static List<RenglonHistorial> desdeDocumento(Object raw) {
        List<RenglonHistorial> out = new ArrayList<>();
        if (!(raw instanceof List<?> lista)) {
            return out;
        }
        for (Object item : lista) {
            if (item instanceof Map<?, ?> mapa) {
                out.add(desdeMapa(mapa));
            }
        }
        return out;
    }

    public static List<RenglonHistorialDTO> aDtoOrdenado(List<RenglonHistorial> historial) {
        if (historial == null || historial.isEmpty()) {
            return List.of();
        }
        return historial.stream()
                .map(HistorialLectura::aDto)
                .sorted(Comparator.comparing(HistorialLectura::instante).reversed())
                .toList();
    }

    private static RenglonHistorial desdeMapa(Map<?, ?> mapa) {
        RenglonHistorial row = new RenglonHistorial();
        row.setTipo(texto(mapa.get("tipo")));
        row.setActoId(texto(mapa.get("acto_id")));
        row.setCuando(timestamp(mapa.get("cuando")));
        row.setDesde(timestamp(mapa.get("desde")));
        row.setHasta(timestamp(mapa.get("hasta")));
        row.setEstado(texto(mapa.get("estado")));
        row.setEstadoAnterior(texto(mapa.get("estado_anterior")));
        row.setMotivo(texto(mapa.get("motivo")));
        row.setQuienUid(texto(mapa.get("quien_uid")));
        row.setQuienNombre(texto(mapa.get("quien_nombre")));
        row.setOrigen(texto(mapa.get("origen")));
        Object pasado = mapa.get("pasado_desconocido");
        if (pasado instanceof Boolean b) {
            row.setPasadoDesconocido(b);
        }
        Object cambios = mapa.get("cambios");
        if (cambios instanceof List<?> lista) {
            List<CambioFicha> parsed = new ArrayList<>();
            for (Object item : lista) {
                if (item instanceof Map<?, ?> cambio) {
                    CambioFicha c = new CambioFicha();
                    c.setCampo(texto(cambio.get("campo")));
                    c.setValorAnterior(texto(cambio.get("valor_anterior")));
                    c.setValorNuevo(texto(cambio.get("valor_nuevo")));
                    parsed.add(c);
                }
            }
            row.setCambios(parsed);
        }
        return row;
    }

    private static RenglonHistorialDTO aDto(RenglonHistorial row) {
        RenglonHistorialDTO dto = new RenglonHistorialDTO();
        dto.setTipo(row.getTipo());
        dto.setActoId(row.getActoId());
        dto.setCuando(iso(row.getCuando()));
        dto.setDesde(iso(row.getDesde()));
        dto.setHasta(iso(row.getHasta()));
        dto.setEstado(row.getEstado());
        dto.setEstadoAnterior(row.getEstadoAnterior());
        dto.setMotivo(row.getMotivo());
        dto.setQuienUid(row.getQuienUid());
        dto.setQuienNombre(row.getQuienNombre());
        dto.setOrigen(row.getOrigen());
        dto.setPasadoDesconocido(row.getPasadoDesconocido());
        dto.setVigente("ESTADO".equals(row.getTipo()) && row.getHasta() == null);
        if (row.getCambios() != null) {
            dto.setCambios(row.getCambios().stream().map(c -> {
                CambioFichaDTO d = new CambioFichaDTO();
                d.setCampo(c.getCampo());
                d.setValorAnterior(c.getValorAnterior());
                d.setValorNuevo(c.getValorNuevo());
                return d;
            }).toList());
        }
        return dto;
    }

    private static Instant instante(RenglonHistorialDTO dto) {
        String raw = dto.getCuando() != null ? dto.getCuando() : dto.getDesde();
        if (raw == null) {
            return Instant.EPOCH;
        }
        try {
            return Instant.parse(raw);
        } catch (RuntimeException ex) {
            return Instant.EPOCH;
        }
    }

    private static Timestamp timestamp(Object valor) {
        if (valor instanceof Timestamp ts) {
            return ts;
        }
        return null;
    }

    private static String iso(Timestamp ts) {
        if (ts == null) {
            return null;
        }
        return ts.toDate().toInstant().toString();
    }

    private static String texto(Object valor) {
        if (valor == null) {
            return null;
        }
        String s = String.valueOf(valor).trim();
        return s.isEmpty() ? null : s;
    }
}

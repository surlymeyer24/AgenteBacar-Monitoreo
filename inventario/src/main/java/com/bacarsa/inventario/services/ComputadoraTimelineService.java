package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.ComputadoraTimelineItemDTO;
import com.bacarsa.inventario.dto.EventoHardwareDTO;
import com.bacarsa.inventario.mapper.CambioEstadoMapper;
import com.bacarsa.inventario.models.CambioEstado;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.ConciliacionStock;
import com.bacarsa.inventario.models.DecisionConciliacion;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.ConciliacionStockRepository;
import com.google.cloud.Timestamp;

@Service
public class ComputadoraTimelineService {

    private final ComputadoraRepository computadoraRepository;
    private final EventoHardwareService eventoHardwareService;
    private final ConciliacionStockRepository conciliacionStockRepository;

    public ComputadoraTimelineService(ComputadoraRepository computadoraRepository,
            EventoHardwareService eventoHardwareService,
            ConciliacionStockRepository conciliacionStockRepository) {
        this.computadoraRepository = computadoraRepository;
        this.eventoHardwareService = eventoHardwareService;
        this.conciliacionStockRepository = conciliacionStockRepository;
    }

    public List<ComputadoraTimelineItemDTO> timeline(String uuid, Integer limit)
            throws ExecutionException, InterruptedException {
        Computadora pc = computadoraRepository.findByUuid(uuid);
        if (pc == null) {
            return null;
        }

        List<ComputadoraTimelineItemDTO> items = new ArrayList<>();
        items.addAll(fromHistorial(pc));
        items.addAll(fromEventosHardware(uuid));
        items.addAll(fromConciliaciones(uuid));
        items.addAll(fromMarcadoresSistema(pc));

        items = deduplicarConciliacionHistorial(items);
        items.sort(Comparator.comparing(ComputadoraTimelineItemDTO::getTimestamp,
                Comparator.nullsLast(Comparator.reverseOrder())));

        if (limit != null && limit > 0 && items.size() > limit) {
            return items.subList(0, limit);
        }
        return items;
    }

    private List<ComputadoraTimelineItemDTO> fromHistorial(Computadora pc) {
        List<CambioEstado> historial = pc.getHistorialEstados();
        if (historial == null || historial.isEmpty()) {
            return List.of();
        }
        List<ComputadoraTimelineItemDTO> items = new ArrayList<>();
        for (int i = 0; i < historial.size(); i++) {
            CambioEstado cambio = historial.get(i);
            var dto = CambioEstadoMapper.toDTO(cambio);
            if (dto == null || dto.getFechaHoraInicio() == null) {
                continue;
            }
            ComputadoraTimelineItemDTO item = new ComputadoraTimelineItemDTO();
            item.setTipo("CAMBIO_ESTADO");
            item.setTimestamp(dto.getFechaHoraInicio());
            item.setTitulo(dto.getEstado() != null ? dto.getEstado() : "Cambio de estado");
            item.setDescripcion(buildDescripcionCambioEstado(dto));
            item.setSourceId("historial-" + i);
            Map<String, Object> meta = new HashMap<>();
            meta.put("estado", dto.getEstado());
            meta.put("activo", dto.isActivo());
            meta.put("ubicacionStock", dto.getUbicacionStock());
            meta.put("responsableInventario", dto.getResponsableInventario());
            meta.put("origenCambio", cambio.getOrigenCambio());
            item.setMetadata(meta);
            items.add(item);
        }
        return items;
    }

    private String buildDescripcionCambioEstado(com.bacarsa.inventario.dto.CambioEstadoDTO dto) {
        StringBuilder sb = new StringBuilder();
        if (dto.getMotivo() != null && !dto.getMotivo().isBlank()) {
            sb.append(dto.getMotivo().trim());
        }
        if (dto.getResponsableInventario() != null && !dto.getResponsableInventario().isBlank()) {
            if (sb.length() > 0) sb.append(" · ");
            sb.append("RI: ").append(dto.getResponsableInventario().trim());
        }
        if (dto.getUbicacionStock() != null && !dto.getUbicacionStock().isBlank()) {
            if (sb.length() > 0) sb.append(" · ");
            sb.append("Depósito: ").append(dto.getUbicacionStock().trim());
        }
        return sb.length() > 0 ? sb.toString() : null;
    }

    private List<ComputadoraTimelineItemDTO> fromEventosHardware(String uuid)
            throws ExecutionException, InterruptedException {
        List<EventoHardwareDTO> eventos = eventoHardwareService.listar(null, uuid, null);
        return eventos.stream().map(ev -> {
            ComputadoraTimelineItemDTO item = new ComputadoraTimelineItemDTO();
            item.setTipo("EVENTO_HARDWARE");
            item.setTimestamp(ev.getTimestamp());
            String componente = ev.getTipoComponente() != null ? ev.getTipoComponente() : "componente";
            String accion = ev.getTipoEvento() != null ? ev.getTipoEvento() : "cambio";
            item.setTitulo(capitalize(componente) + " " + accion);
            item.setDescripcion(resumenEventoHardware(ev));
            item.setSourceId(ev.getId());
            if (ev.getId() != null) {
                item.setEnlace("/eventos-hardware/" + ev.getId());
            }
            Map<String, Object> meta = new HashMap<>();
            meta.put("tipoComponente", ev.getTipoComponente());
            meta.put("tipoEvento", ev.getTipoEvento());
            meta.put("estadoSeguimiento", ev.getEstadoSeguimiento());
            meta.put("leido", ev.getLeido());
            item.setMetadata(meta);
            return item;
        }).collect(Collectors.toList());
    }

    private String resumenEventoHardware(EventoHardwareDTO ev) {
        Map<String, Object> map = "removido".equals(ev.getTipoEvento()) ? ev.getAntes() : ev.getDespues();
        if (map == null || map.isEmpty()) {
            return null;
        }
        List<String> parts = new ArrayList<>();
        appendIfPresent(parts, map.get("nombre"));
        appendIfPresent(parts, map.get("modelo"));
        Object cap = map.get("capacidad_gb");
        if (cap != null) parts.add(cap + " GB");
        appendIfPresent(parts, map.get("numero_serie") != null ? "S/N: " + map.get("numero_serie") : null);
        return parts.isEmpty() ? null : String.join(" · ", parts);
    }

    private void appendIfPresent(List<String> parts, Object value) {
        if (value == null) return;
        String s = String.valueOf(value).trim();
        if (!s.isEmpty()) parts.add(s);
    }

    private List<ComputadoraTimelineItemDTO> fromConciliaciones(String uuid)
            throws ExecutionException, InterruptedException {
        List<ConciliacionStock> conciliaciones = conciliacionStockRepository.findByPcUuid(uuid);
        List<ComputadoraTimelineItemDTO> items = new ArrayList<>();
        for (ConciliacionStock c : conciliaciones) {
            ComputadoraTimelineItemDTO item = new ComputadoraTimelineItemDTO();
            item.setTipo("CONCILIACION");
            item.setTimestamp(formatTimestamp(c.getFecha()));
            item.setTitulo(tituloConciliacion(c));
            item.setDescripcion(descripcionConciliacion(c));
            item.setSourceId(c.getId());
            if (c.getId() != null) {
                item.setEnlace("/conciliaciones/" + c.getId());
            }
            Map<String, Object> meta = new HashMap<>();
            meta.put("decision", c.getDecision() != null ? c.getDecision().name() : null);
            meta.put("score", c.getScore());
            meta.put("agenteUuid", c.getAgenteUuid());
            meta.put("candidatoStockUuid", c.getCandidatoStockUuid());
            meta.put("agenteHostname", c.getAgenteHostname());
            meta.put("stockHostname", c.getStockHostname());
            item.setMetadata(meta);
            items.add(item);
        }
        return items;
    }

    private String tituloConciliacion(ConciliacionStock c) {
        DecisionConciliacion d = c.getDecision();
        if (d == null) return "Conciliación stock ↔ agente";
        return switch (d) {
            case PENDIENTE -> "Match sugerido con AgenteBacar";
            case CONFIRMADA -> "Conciliación confirmada";
            case RECHAZADA -> "Conciliación rechazada";
            case POSPUESTA -> "Conciliación pospuesta";
        };
    }

    private String descripcionConciliacion(ConciliacionStock c) {
        StringBuilder sb = new StringBuilder();
        if (c.getScore() != null) {
            sb.append("Score ").append(c.getScore());
        }
        if (c.getAgenteHostname() != null && c.getStockHostname() != null) {
            if (sb.length() > 0) sb.append(" · ");
            sb.append(c.getStockHostname()).append(" ↔ ").append(c.getAgenteHostname());
        } else if (c.getStockResumen() != null) {
            if (sb.length() > 0) sb.append(" · ");
            sb.append(c.getStockResumen());
        }
        if (c.getCamposDiferentes() != null && !c.getCamposDiferentes().isEmpty()
                && c.getDecision() != DecisionConciliacion.CONFIRMADA) {
            if (sb.length() > 0) sb.append(" · ");
            sb.append("Diferencias: ").append(String.join(", ", c.getCamposDiferentes()));
        }
        return sb.length() > 0 ? sb.toString() : null;
    }

    private List<ComputadoraTimelineItemDTO> fromMarcadoresSistema(Computadora pc) {
        List<ComputadoraTimelineItemDTO> items = new ArrayList<>();
        if (pc.getPrimerReporteAgenteAt() != null) {
            items.add(marcadorSistema(
                    formatTimestamp(pc.getPrimerReporteAgenteAt()),
                    "Primer reporte de AgenteBacar",
                    "La PC apareció por primera vez en el inventario del agente.",
                    "primer-reporte"));
        }
        if (pc.getMatchingEnProcesoAt() != null
                && pc.getMatchingJobEstado() != null
                && pc.getMatchingJobEstado() != com.bacarsa.inventario.models.MatchingJobEstado.MATCHING_OK) {
            items.add(marcadorSistema(
                    formatTimestamp(pc.getMatchingEnProcesoAt()),
                    "Matching en proceso",
                    "Se está buscando coincidencia con stock.",
                    "matching"));
        }
        return items;
    }

    private ComputadoraTimelineItemDTO marcadorSistema(String timestamp, String titulo, String descripcion, String key) {
        ComputadoraTimelineItemDTO item = new ComputadoraTimelineItemDTO();
        item.setTipo("SISTEMA");
        item.setTimestamp(timestamp);
        item.setTitulo(titulo);
        item.setDescripcion(descripcion);
        item.setSourceId(key);
        return item;
    }

    private List<ComputadoraTimelineItemDTO> deduplicarConciliacionHistorial(List<ComputadoraTimelineItemDTO> items) {
        return items.stream().filter(item -> {
            if (!"CAMBIO_ESTADO".equals(item.getTipo())) return true;
            Object origen = item.getMetadata() != null ? item.getMetadata().get("origenCambio") : null;
            return !"CONCILIACION".equals(origen);
        }).collect(Collectors.toList());
    }

    private String formatTimestamp(Timestamp ts) {
        if (ts == null) return null;
        return ts.toDate().toInstant().toString();
    }

    private String capitalize(String s) {
        if (s == null || s.isBlank()) return s;
        return s.substring(0, 1).toUpperCase(Locale.ROOT) + s.substring(1);
    }
}

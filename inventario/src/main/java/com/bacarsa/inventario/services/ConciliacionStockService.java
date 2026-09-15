package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.ConciliacionCountDTO;
import com.bacarsa.inventario.dto.ConciliacionListResponseDTO;
import com.bacarsa.inventario.dto.ConciliacionStockDTO;
import com.bacarsa.inventario.dto.ComputadoraListadoDTO;
import com.bacarsa.inventario.exception.ApiConflictException;
import com.bacarsa.inventario.mapper.ComputadoraMapper;
import com.bacarsa.inventario.mapper.ConciliacionStockMapper;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.ConciliacionStock;
import com.bacarsa.inventario.models.DecisionConciliacion;
import com.bacarsa.inventario.models.EstadoConciliacion;
import com.bacarsa.inventario.models.EstadoReporteAgente;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.util.ConciliacionComparador;
import com.bacarsa.inventario.util.ConciliacionComparador.ComparacionResult;
import com.bacarsa.inventario.util.ConciliacionMergeHelper;
import com.bacarsa.inventario.util.ConciliacionMergeHelper.MergeResult;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.ConciliacionStockRepository;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;

@Service
public class ConciliacionStockService {

    private final ConciliacionStockRepository conciliacionStockRepository;
    private final ComputadoraRepository computadoraRepository;

    @Value("${app.matching.ventana-dias:90}")
    private int ventanaDias;

    public ConciliacionStockService(ConciliacionStockRepository conciliacionStockRepository,
            ComputadoraRepository computadoraRepository) {
        this.conciliacionStockRepository = conciliacionStockRepository;
        this.computadoraRepository = computadoraRepository;
    }

    public ConciliacionListResponseDTO listar(String decisionRaw, boolean historicoCompleto, int limit, int offset)
            throws ExecutionException, InterruptedException {
        DecisionConciliacion decision = decisionRaw != null && !decisionRaw.isBlank()
                ? DecisionConciliacion.valueOf(decisionRaw.trim().toUpperCase())
                : DecisionConciliacion.PENDIENTE;
        int ventana = historicoCompleto ? 3650 : ventanaDias;
        List<ConciliacionStock> items = conciliacionStockRepository.findByDecision(decision, ventana, limit, offset);
        long total = conciliacionStockRepository.countByDecision(decision, ventana);
        List<ConciliacionStockDTO> dtos = items.stream().map(ConciliacionStockMapper::toDTO).toList();
        return new ConciliacionListResponseDTO(dtos, total, limit, offset);
    }

    public ConciliacionCountDTO contarPendientes() throws ExecutionException, InterruptedException {
        long count = conciliacionStockRepository.countByDecision(DecisionConciliacion.PENDIENTE, ventanaDias);
        return new ConciliacionCountDTO(count);
    }

    public ConciliacionStockDTO obtenerDetalle(String id) throws ExecutionException, InterruptedException {
        ConciliacionStock c = conciliacionStockRepository.findById(id);
        if (c == null) {
            return null;
        }
        ConciliacionStockDTO dto = ConciliacionStockMapper.toDTO(c);
        Computadora agente = computadoraRepository.findByUuid(c.getAgenteUuid());
        Computadora stock = computadoraRepository.findByUuid(c.getCandidatoStockUuid());
        dto.setAgenteSnapshot(ComputadoraMapper.toDTO(agente));
        dto.setStockSnapshot(ComputadoraMapper.toDTO(stock));
        return dto;
    }

    public ConciliacionStockDTO confirmar(String id, String usuario, String motivo)
            throws ExecutionException, InterruptedException {
        ConciliacionStock sugerencia = requirePendiente(id);
        String stockUuid = sugerencia.getCandidatoStockUuid();
        String agenteUuid = sugerencia.getAgenteUuid();

        DocumentSnapshot stockDoc = computadoraRepository.getDocumentSnapshot(stockUuid);
        DocumentSnapshot agenteDoc = computadoraRepository.getDocumentSnapshot(agenteUuid);
        if (!stockDoc.exists() || !agenteDoc.exists()) {
            throw new IllegalArgumentException("Documento stock o agente no encontrado");
        }

        Computadora stock = computadoraRepository.findByUuid(stockUuid);
        Computadora agente = computadoraRepository.findByUuid(agenteUuid);

        MergeResult merge = ConciliacionMergeHelper.construirMerge(stockDoc, agenteDoc, agenteUuid);
        ComparacionResult comparacion = ConciliacionComparador.comparar(agente, stock.getBaselineEsperado());

        Map<String, Object> stockUpdates = new HashMap<>(merge.getUpdates());
        stockUpdates.put("estado_conciliacion", comparacion.getEstado().name());
        stockUpdates.put("estado_reporte_agente", comparacion.getEstadoReporte().name());
        stockUpdates.put("score_conciliacion", sugerencia.getScore());
        stockUpdates.put("fecha_conciliacion", Timestamp.now());
        stockUpdates.put("historialEstados",
                appendHistorial(stockDoc, buildMotivoConfirmacion(comparacion, motivo, merge)));

        computadoraRepository.mergeUpdates(stockUuid, stockUpdates);

        Map<String, Object> sugerenciaExtra = new HashMap<>();
        sugerenciaExtra.put("detalle_comparacion", comparacion.getDetalle());
        sugerenciaExtra.put("campos_diferentes", comparacion.getCamposDiferentes());
        conciliacionStockRepository.updateDecision(id, DecisionConciliacion.CONFIRMADA, usuario, sugerenciaExtra);

        return obtenerDetalle(id);
    }

    public ConciliacionStockDTO rechazar(String id, String usuario, String motivo)
            throws ExecutionException, InterruptedException {
        ConciliacionStock sugerencia = requirePendiente(id);
        Map<String, Object> extra = new HashMap<>();
        if (motivo != null && !motivo.isBlank()) {
            extra.put("motivo_rechazo", motivo);
        }
        conciliacionStockRepository.updateDecision(id, DecisionConciliacion.RECHAZADA, usuario, extra);

        if (sugerencia.getCandidatoStockUuid() != null) {
            Computadora stock = computadoraRepository.findByUuid(sugerencia.getCandidatoStockUuid());
            if (stock != null && stock.getEstadoConciliacion() == EstadoConciliacion.PENDIENTE) {
                Map<String, Object> updates = new HashMap<>();
                updates.put("estado_conciliacion", EstadoConciliacion.BASELINE_LISTO.name());
                updates.put("estado_reporte_agente", EstadoReporteAgente.SIN_REPORTE.name());
                computadoraRepository.updateMatchingFields(stock.getUuid(), updates);
            }
        }
        return ConciliacionStockMapper.toDTO(conciliacionStockRepository.findById(id));
    }

    public ConciliacionStockDTO posponer(String id, String usuario)
            throws ExecutionException, InterruptedException {
        requirePendiente(id);
        Map<String, Object> extra = new HashMap<>();
        extra.put("pospuesto_at", Timestamp.now());
        extra.put("usuario", usuario);
        conciliacionStockRepository.updateDecision(id, DecisionConciliacion.PENDIENTE, usuario, extra);
        return ConciliacionStockMapper.toDTO(conciliacionStockRepository.findById(id));
    }

    public List<ComputadoraListadoDTO> listarStockSinAgente() throws ExecutionException, InterruptedException {
        return computadoraRepository.findStockSinAgente(ventanaDias);
    }

    private ConciliacionStock requirePendiente(String id) throws ExecutionException, InterruptedException {
        ConciliacionStock c = conciliacionStockRepository.findById(id);
        if (c == null) {
            throw new IllegalArgumentException("Sugerencia no encontrada: " + id);
        }
        if (c.getDecision() != DecisionConciliacion.PENDIENTE) {
            throw new ApiConflictException("La sugerencia ya fue procesada");
        }
        return c;
    }

    private static String buildMotivoConfirmacion(ComparacionResult comparacion, String motivo, MergeResult merge) {
        String base = comparacion.getEstado() == EstadoConciliacion.COINCIDE
                ? "Validada con stock — coincide"
                : "Discrepancia detectada";
        if (motivo != null && !motivo.isBlank()) {
            base += ": " + motivo.trim();
        }
        if (!merge.getConflictos().isEmpty()) {
            base += " (conflictos identidad: " + String.join(", ", merge.getConflictos()) + ")";
        }
        return base;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> appendHistorial(DocumentSnapshot doc, String motivo) {
        List<Map<String, Object>> historial = doc.get("historialEstados") instanceof List<?> raw
                ? new ArrayList<>((List<Map<String, Object>>) raw)
                : new ArrayList<>();
        Timestamp ahora = Timestamp.now();
        for (int i = 0; i < historial.size(); i++) {
            Map<String, Object> entrada = historial.get(i);
            if (entrada.get("fechaHoraFin") == null) {
                Map<String, Object> copia = new HashMap<>(entrada);
                copia.put("fechaHoraFin", ahora);
                historial.set(i, copia);
            }
        }
        Map<String, Object> estadoMap = new HashMap<>();
        estadoMap.put("nombre", EstadoOperativo.SIN_ASIGNAR.getNombre());
        estadoMap.put("descripcion", EstadoOperativo.SIN_ASIGNAR.getDescripcion());
        Map<String, Object> nueva = new HashMap<>();
        nueva.put("estado", estadoMap);
        nueva.put("motivo", motivo);
        nueva.put("fechaHoraInicio", ahora);
        nueva.put("fechaHoraFin", null);
        nueva.put("origen_cambio", "CONCILIACION");
        historial.add(nueva);
        return historial;
    }
}

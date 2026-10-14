package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.exception.ApiConflictException;
import com.bacarsa.inventario.models.BaselineEsperado;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.ConciliacionStock;
import com.bacarsa.inventario.models.DecisionConciliacion;
import com.bacarsa.inventario.models.EstadoConciliacion;
import com.bacarsa.inventario.models.EstadoReporteAgente;
import com.bacarsa.inventario.models.MatchingJobEstado;
import com.bacarsa.inventario.models.OrigenAlta;
import com.bacarsa.inventario.models.OrigenConciliacion;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.ConciliacionStockRepository;
import com.bacarsa.inventario.util.MatchingScoreHelper;
import com.bacarsa.inventario.util.MatchingScoreHelper.ScoreResult;
import com.google.cloud.Timestamp;

@Service
public class MatchingStockService {

    private static final Logger log = LoggerFactory.getLogger(MatchingStockService.class);
    private static final int MAX_REINTENTOS = 5;

    private final ComputadoraRepository computadoraRepository;
    private final ConciliacionStockRepository conciliacionStockRepository;

    @Value("${app.matching.ventana-dias:90}")
    private int ventanaDias;

    @Value("${app.matching.lock-timeout-minutes:15}")
    private long lockTimeoutMinutes;

    public MatchingStockService(ComputadoraRepository computadoraRepository,
            ConciliacionStockRepository conciliacionStockRepository) {
        this.computadoraRepository = computadoraRepository;
        this.conciliacionStockRepository = conciliacionStockRepository;
    }

    public void ejecutarMatching(String agenteUuid) throws ExecutionException, InterruptedException {
        Computadora agente = computadoraRepository.findByUuid(agenteUuid);
        if (agente == null) {
            throw new IllegalArgumentException("Computadora no encontrada: " + agenteUuid);
        }
        if (agente.getUltimaSincronizacion() == null) {
            return;
        }

        String snapshotClave = snapshotClave(agente);
        ConciliacionStock existente = conciliacionStockRepository.findByAgenteAndSnapshotClave(agenteUuid, snapshotClave);
        if (existente != null && existente.getDecision() != DecisionConciliacion.RECHAZADA) {
            marcarOk(agenteUuid);
            return;
        }

        if (agente.getMatchingJobEstado() == MatchingJobEstado.MATCHING_EN_PROCESO) {
            if (!lockExpirado(agente)) {
                throw new ApiConflictException("Matching ya en proceso para " + agenteUuid);
            }
            log.warn("Lock huérfano liberado uuid={}", agenteUuid);
        }

        Map<String, Object> lockUpdates = new HashMap<>();
        lockUpdates.put("matching_job_estado", MatchingJobEstado.MATCHING_EN_PROCESO.name());
        lockUpdates.put("matching_en_proceso_at", Timestamp.now());
        computadoraRepository.updateMatchingFields(agenteUuid, lockUpdates);

        try {
            List<Computadora> candidatos = computadoraRepository.findCandidatosStockBaselineListo(ventanaDias);

            if (agente.getOrigenAlta() == OrigenAlta.STOCK
                    && agente.getEstadoConciliacion() == EstadoConciliacion.BASELINE_LISTO
                    && agente.getBaselineEsperado() != null) {
                boolean yaIncluido = candidatos.stream().anyMatch(c -> agenteUuid.equals(c.getUuid()));
                if (!yaIncluido) {
                    candidatos.add(agente);
                }
            }

            List<CandidatoScore> scores = new ArrayList<>();
            for (Computadora stock : candidatos) {
                if (agenteUuid.equals(stock.getUuid())) {
                    continue;
                }
                ScoreResult sr = MatchingScoreHelper.calcular(agente, stock);
                scores.add(new CandidatoScore(stock, sr));
            }

            if (agente.getOrigenAlta() == OrigenAlta.STOCK
                    && agente.getEstadoConciliacion() == EstadoConciliacion.BASELINE_LISTO) {
                ScoreResult self = MatchingScoreHelper.calcular(agente, agente);
                scores.add(new CandidatoScore(agente, self));
            }

            scores.sort(Comparator.comparingInt((CandidatoScore c) -> c.scoreResult.getScore()).reversed());
            CandidatoScore mejor = scores.isEmpty() ? null : scores.get(0);

            if (mejor == null || mejor.scoreResult.getScore() < MatchingScoreHelper.UMBRAL_SUGERENCIA) {
                marcarOk(agenteUuid);
                log.info("Sin candidatos uuid={} score={}", agenteUuid,
                        mejor != null ? mejor.scoreResult.getScore() : 0);
                return;
            }

            ConciliacionStock sugerencia = new ConciliacionStock();
            sugerencia.setAgenteUuid(agenteUuid);
            sugerencia.setCandidatoStockUuid(mejor.stock.getUuid());
            sugerencia.setScore(mejor.scoreResult.getScore());
            sugerencia.setCamposCoincidentes(mejor.scoreResult.getCamposCoincidentes());
            sugerencia.setCamposDiferentes(mejor.scoreResult.getCamposDiferentes());
            sugerencia.setNotasMatch(mejor.scoreResult.getNotasMatch());
            sugerencia.setDecision(DecisionConciliacion.PENDIENTE);
            sugerencia.setOrigen(OrigenConciliacion.PRIMER_REPORTE);
            sugerencia.setSnapshotClave(snapshotClave);
            sugerencia.setFecha(Timestamp.now());
            sugerencia.setAgenteHostname(agente.getHostname());
            sugerencia.setStockHostname(mejor.stock.getHostname());
            sugerencia.setAgenteResumen(resumenAgente(agente));
            sugerencia.setStockResumen(resumenStock(mejor.stock));
            conciliacionStockRepository.save(sugerencia);

            if (!agenteUuid.equals(mejor.stock.getUuid())) {
                Map<String, Object> stockUpdates = new HashMap<>();
                stockUpdates.put("estado_conciliacion", EstadoConciliacion.PENDIENTE.name());
                stockUpdates.put("estado_reporte_agente", EstadoReporteAgente.MATCH_SUGERIDO.name());
                computadoraRepository.updateMatchingFields(mejor.stock.getUuid(), stockUpdates);
            }

            marcarOk(agenteUuid);
            log.info("Sugerencia creada agente={} stock={} score={}", agenteUuid, mejor.stock.getUuid(),
                    mejor.scoreResult.getScore());
        } catch (RuntimeException ex) {
            marcarError(agenteUuid, agente.getMatchingIntentos());
            throw ex;
        } catch (ExecutionException | InterruptedException ex) {
            marcarError(agenteUuid, agente.getMatchingIntentos());
            throw ex;
        }
    }

    public int liberarLocksHuerfanos() throws ExecutionException, InterruptedException {
        List<Computadora> stale = computadoraRepository.findMatchingEnProcesoStale(lockTimeoutMinutes);
        for (Computadora pc : stale) {
            Map<String, Object> updates = new HashMap<>();
            int intentos = pc.getMatchingIntentos() != null ? pc.getMatchingIntentos() : 0;
            if (intentos >= MAX_REINTENTOS) {
                updates.put("matching_job_estado", MatchingJobEstado.MATCHING_ERROR.name());
            } else {
                updates.put("matching_job_estado", MatchingJobEstado.MATCHING_PENDIENTE.name());
            }
            updates.put("matching_en_proceso_at", null);
            computadoraRepository.updateMatchingFields(pc.getUuid(), updates);
            log.warn("Lock huérfano liberado uuid={} intentos={}", pc.getUuid(), intentos);
        }
        return stale.size();
    }

    public void reprocesar(String uuid) throws ExecutionException, InterruptedException {
        Map<String, Object> updates = new HashMap<>();
        updates.put("matching_job_estado", MatchingJobEstado.MATCHING_PENDIENTE.name());
        updates.put("matching_en_proceso_at", null);
        computadoraRepository.updateMatchingFields(uuid, updates);
        ejecutarMatching(uuid);
    }

    private void marcarOk(String uuid) throws ExecutionException, InterruptedException {
        Map<String, Object> updates = new HashMap<>();
        updates.put("matching_job_estado", MatchingJobEstado.MATCHING_OK.name());
        updates.put("matching_en_proceso_at", null);
        computadoraRepository.updateMatchingFields(uuid, updates);
    }

    private void marcarError(String uuid, Integer intentosPrevios)
            throws ExecutionException, InterruptedException {
        int intentos = (intentosPrevios != null ? intentosPrevios : 0) + 1;
        Map<String, Object> updates = new HashMap<>();
        updates.put("matching_intentos", intentos);
        updates.put("matching_en_proceso_at", null);
        updates.put("matching_job_estado",
                intentos >= MAX_REINTENTOS
                        ? MatchingJobEstado.MATCHING_ERROR.name()
                        : MatchingJobEstado.MATCHING_PENDIENTE.name());
        computadoraRepository.updateMatchingFields(uuid, updates);
    }

    private static boolean lockExpirado(Computadora pc) {
        if (pc.getMatchingEnProcesoAt() == null) {
            return true;
        }
        long ageMs = System.currentTimeMillis() - pc.getMatchingEnProcesoAt().toDate().getTime();
        return ageMs > 15 * 60 * 1000L;
    }

    private static String snapshotClave(Computadora agente) {
        if (agente.getUltimaSincronizacion() != null) {
            return agente.getUltimaSincronizacion().toString();
        }
        return "unknown";
    }

    private static String resumenAgente(Computadora c) {
        String cpu = c.getProcesadorRaw() != null ? c.getProcesadorRaw()
                : (c.getProcesadorDetallado() != null ? c.getProcesadorDetallado().getModelo() : "—");
        String ram = c.getRamTotalGb() != null ? c.getRamTotalGb() + " GB" : "—";
        return cpu + " · " + ram;
    }

    private static String resumenStock(Computadora c) {
        BaselineEsperado b = c.getBaselineEsperado();
        if (b == null) {
            return c.getHostname();
        }
        String cpu = b.getCpuModelo() != null ? b.getCpuModelo() : "—";
        String ram = b.getRamTotalGb() != null ? b.getRamTotalGb() + " GB" : "—";
        return (c.getCondicion() != null ? c.getCondicion() + " · " : "") + cpu + " · " + ram;
    }

    private record CandidatoScore(Computadora stock, ScoreResult scoreResult) {
    }
}

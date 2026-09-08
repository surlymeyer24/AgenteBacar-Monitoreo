package com.bacarsa.inventario.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.EstadoConciliacion;
import com.bacarsa.inventario.models.MatchingJobEstado;
import com.bacarsa.inventario.models.OrigenAlta;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.google.cloud.Timestamp;

@Service
public class MatchingDeteccionService {

    private static final Logger log = LoggerFactory.getLogger(MatchingDeteccionService.class);

    private final ComputadoraRepository computadoraRepository;

    public MatchingDeteccionService(ComputadoraRepository computadoraRepository) {
        this.computadoraRepository = computadoraRepository;
    }

    public int detectarPrimerosReportes() throws ExecutionException, InterruptedException {
        List<Computadora> todas = computadoraRepository.findAllSinCache();
        int marcadas = 0;
        for (Computadora pc : todas) {
            if (pc.getUltimaSincronizacion() == null) {
                continue;
            }
            if (pc.getEstadoConciliacion() == EstadoConciliacion.NO_APLICA) {
                continue;
            }
            if (pc.getEstadoConciliacion() == EstadoConciliacion.COINCIDE
                    || pc.getEstadoConciliacion() == EstadoConciliacion.DISCREPANCIA) {
                continue;
            }
            if (pc.getOrigenAlta() == OrigenAlta.LEGACY
                    && pc.getEstadoConciliacion() == EstadoConciliacion.NO_APLICA) {
                continue;
            }
            if (pc.getPrimerReporteAgenteAt() != null) {
                continue;
            }
            Map<String, Object> updates = new HashMap<>();
            updates.put("primer_reporte_agente_at", pc.getUltimaSincronizacion());
            updates.put("matching_job_estado", MatchingJobEstado.MATCHING_PENDIENTE.name());
            updates.put("matching_intentos", 0);
            computadoraRepository.updateMatchingFields(pc.getUuid(), updates);
            marcadas++;
            log.info("Primer reporte detectado uuid={} hostname={}", pc.getUuid(), pc.getHostname());
        }
        return marcadas;
    }

    public List<Computadora> listarPendientesMatching() throws ExecutionException, InterruptedException {
        return computadoraRepository.findAllSinCache().stream()
                .filter(pc -> pc.getUltimaSincronizacion() != null)
                .filter(pc -> pc.getMatchingJobEstado() == MatchingJobEstado.MATCHING_PENDIENTE
                        || pc.getMatchingJobEstado() == MatchingJobEstado.MATCHING_ERROR
                        || pc.getMatchingJobEstado() == null && pc.getPrimerReporteAgenteAt() != null)
                .filter(pc -> pc.getEstadoConciliacion() != EstadoConciliacion.COINCIDE
                        && pc.getEstadoConciliacion() != EstadoConciliacion.DISCREPANCIA
                        && pc.getEstadoConciliacion() != EstadoConciliacion.NO_APLICA)
                .toList();
    }
}

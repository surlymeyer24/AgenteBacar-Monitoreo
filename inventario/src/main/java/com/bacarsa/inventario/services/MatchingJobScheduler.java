package com.bacarsa.inventario.services;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.bacarsa.inventario.models.Computadora;

@Component
@ConditionalOnProperty(name = "app.matching.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class MatchingJobScheduler {

    private static final Logger log = LoggerFactory.getLogger(MatchingJobScheduler.class);

    private final MatchingDeteccionService matchingDeteccionService;
    private final MatchingStockService matchingStockService;

    public MatchingJobScheduler(MatchingDeteccionService matchingDeteccionService,
            MatchingStockService matchingStockService) {
        this.matchingDeteccionService = matchingDeteccionService;
        this.matchingStockService = matchingStockService;
    }

    @Scheduled(
            fixedDelayString = "${app.matching.detect-interval-ms:300000}",
            initialDelayString = "${app.matching.detect-initial-delay-ms:60000}")
    public void detectarYProcesar() {
        try {
            int detectados = matchingDeteccionService.detectarPrimerosReportes();
            if (detectados > 0) {
                log.info("Detección primer reporte: {} PCs marcadas", detectados);
            }
            List<Computadora> pendientes = matchingDeteccionService.listarPendientesMatching();
            for (Computadora pc : pendientes) {
                try {
                    matchingStockService.ejecutarMatching(pc.getUuid());
                } catch (Exception ex) {
                    log.warn("Matching falló uuid={}: {}", pc.getUuid(), ex.getMessage());
                }
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.error("Scheduler interrumpido", ex);
        } catch (Exception ex) {
            log.error("Error en scheduler de matching", ex);
        }
    }

    @Scheduled(
            fixedDelayString = "${app.matching.recovery-interval-ms:1800000}",
            initialDelayString = "${app.matching.recovery-initial-delay-ms:120000}")
    public void recuperacion() {
        try {
            int liberados = matchingStockService.liberarLocksHuerfanos();
            if (liberados > 0) {
                log.warn("Locks huérfanos liberados: {}", liberados);
            }
            List<Computadora> pendientes = matchingDeteccionService.listarPendientesMatching();
            for (Computadora pc : pendientes) {
                try {
                    matchingStockService.ejecutarMatching(pc.getUuid());
                } catch (Exception ex) {
                    log.debug("Reintento matching uuid={}: {}", pc.getUuid(), ex.getMessage());
                }
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        } catch (Exception ex) {
            log.error("Error en recuperación matching", ex);
        }
    }
}

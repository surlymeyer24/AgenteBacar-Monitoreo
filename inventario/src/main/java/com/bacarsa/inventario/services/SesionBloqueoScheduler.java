package com.bacarsa.inventario.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.sesion-bloqueo.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class SesionBloqueoScheduler {

    private static final Logger log = LoggerFactory.getLogger(SesionBloqueoScheduler.class);

    private final SesionBloqueoDeteccionService deteccionService;

    public SesionBloqueoScheduler(SesionBloqueoDeteccionService deteccionService) {
        this.deteccionService = deteccionService;
    }

    @Scheduled(
            fixedDelayString = "${app.sesion-bloqueo.detect-interval-ms:60000}",
            initialDelayString = "${app.sesion-bloqueo.detect-initial-delay-ms:30000}")
    public void detectarBloqueos() {
        try {
            int registrados = deteccionService.detectarYRegistrarBloqueos();
            if (registrados > 0) {
                log.info("Detección sesión: {} bloqueo(s) registrado(s)", registrados);
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.error("Scheduler sesión bloqueo interrumpido", ex);
        } catch (Exception ex) {
            log.error("Error en scheduler de detección de bloqueos de sesión", ex);
        }
    }
}

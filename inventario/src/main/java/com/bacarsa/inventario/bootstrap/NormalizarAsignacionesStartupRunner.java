package com.bacarsa.inventario.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.cache.CacheManager;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.bacarsa.inventario.dto.MigracionEstadoMasivoResultDTO;
import com.bacarsa.inventario.services.MigracionEstadosService;

/**
 * Normaliza automáticamente al iniciar las computadoras que tienen responsable o área
 * asignada pero figuraban en estado "Sin Asignar" en Firestore, e invalida la caché local.
 */
@Component
@Order(100)
public class NormalizarAsignacionesStartupRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(NormalizarAsignacionesStartupRunner.class);

    private final MigracionEstadosService migracionEstadosService;
    private final CacheManager cacheManager;

    public NormalizarAsignacionesStartupRunner(MigracionEstadosService migracionEstadosService, CacheManager cacheManager) {
        this.migracionEstadosService = migracionEstadosService;
        this.cacheManager = cacheManager;
    }

    @Override
    public void run(ApplicationArguments args) {
        Thread thread = new Thread(() -> {
            try {
                // Breve pausa para esperar a que Firestore inicialice conexiones
                Thread.sleep(1500);
                log.info("Iniciando auto-normalización de computadoras con responsable o área...");
                MigracionEstadoMasivoResultDTO r = migracionEstadosService.normalizarAsignacionesPcs(
                        "Auto-normalización al iniciar servidor: equipo con responsable o área asignada");
                log.info("Auto-normalización completada: PCs actualizadas a Asignada={}, omitidas={}, fallos={}",
                        r.getComputadorasActualizadas(), r.getComputadorasOmitidas(), r.getFallos().size());
                if (r.getComputadorasActualizadas() > 0 && cacheManager != null) {
                    var cache = cacheManager.getCache("pc-listado");
                    if (cache != null) {
                        cache.clear();
                        log.info("Caché 'pc-listado' invalidada tras normalizar {} PCs.", r.getComputadorasActualizadas());
                    }
                }
            } catch (Exception e) {
                log.warn("Auto-normalización de asignaciones en arranque omitida o no completada: {}", e.getMessage());
            }
        }, "normalizar-asignaciones-startup");
        thread.setDaemon(true);
        thread.start();
    }
}

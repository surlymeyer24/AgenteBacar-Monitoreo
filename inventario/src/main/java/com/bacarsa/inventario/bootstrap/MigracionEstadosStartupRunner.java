package com.bacarsa.inventario.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.bacarsa.inventario.dto.MigracionEstadoMasivoResultDTO;
import com.bacarsa.inventario.services.MigracionEstadosService;

/**
 * Ejecuta la migración masiva a "Asignada" una vez al levantar el contexto.
 * Requiere {@code app.migration.bulk-asignada.enabled=true} y
 * {@code app.migration.bulk-asignada.run-on-startup=true}.
 */
@Component
@Order(Integer.MAX_VALUE)
@ConditionalOnProperty(name = "app.migration.bulk-asignada.run-on-startup", havingValue = "true")
public class MigracionEstadosStartupRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MigracionEstadosStartupRunner.class);

    @Value("${app.migration.bulk-asignada.enabled:false}")
    private boolean bulkEnabled;

    private final MigracionEstadosService migracionEstadosService;

    public MigracionEstadosStartupRunner(MigracionEstadosService migracionEstadosService) {
        this.migracionEstadosService = migracionEstadosService;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!bulkEnabled) {
            log.warn(
                    "app.migration.bulk-asignada.run-on-startup=true pero enabled=false: no se ejecuta la migración.");
            return;
        }
        log.info("Migración masiva (todas Asignada): inicio…");
        MigracionEstadoMasivoResultDTO r = migracionEstadosService.marcarTodasAsignada(
                "Migración al iniciar servidor (run-on-startup)");
        log.info(
                "Migración masiva: PCs actualizadas={}, omitidas (ya Asignada)={}; cámaras actualizadas={}, omitidas={}.",
                r.getComputadorasActualizadas(),
                r.getComputadorasOmitidas(),
                r.getCamarasActualizadas(),
                r.getCamarasOmitidas());
        if (r.getComputadorasActualizadas() == 0 && r.getCamarasActualizadas() == 0) {
            log.info(
                    "Ningún documento actualizado: o ya estaban en Asignada, o las colecciones están vacías, o revisá credenciales/colección.");
        }
        for (String f : r.getFallos()) {
            log.error("Migración: fallo — {}", f);
        }
    }
}

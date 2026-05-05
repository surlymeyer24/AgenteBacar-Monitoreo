package com.bacarsa.inventario.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.bacarsa.inventario.services.CamarasActivasImportService;

/**
 * Importa al arrancar si {@code app.import.camaras-activas.enabled=true}.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 20)
@ConditionalOnProperty(name = "app.import.camaras-activas.enabled", havingValue = "true")
public class CamarasActivasImportRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CamarasActivasImportRunner.class);

    private final CamarasActivasImportService camarasActivasImportService;

    public CamarasActivasImportRunner(CamarasActivasImportService camarasActivasImportService) {
        this.camarasActivasImportService = camarasActivasImportService;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try {
            int n = camarasActivasImportService.importarDesdeClasspathJson();
            log.info("Import al inicio (cámaras activas): {} documentos.", n);
        } catch (Exception e) {
            log.error("Import al inicio (cámaras activas): falló — {}", e.getMessage(), e);
            throw e;
        }
    }
}

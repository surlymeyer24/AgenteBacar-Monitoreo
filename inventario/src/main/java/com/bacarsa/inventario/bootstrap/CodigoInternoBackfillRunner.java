package com.bacarsa.inventario.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.bacarsa.inventario.services.StockUnidadesService;

/**
 * Backfill interno al arrancar el servidor. No es un endpoint.
 * Con {@code app.stock.codigo-interno.backfill=false} no corre (los tests lo apagan).
 */
@Component
@Order(Integer.MAX_VALUE)
@ConditionalOnProperty(name = "app.stock.codigo-interno.backfill", havingValue = "true", matchIfMissing = true)
public class CodigoInternoBackfillRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CodigoInternoBackfillRunner.class);

    private final StockUnidadesService stockUnidadesService;

    public CodigoInternoBackfillRunner(StockUnidadesService stockUnidadesService) {
        this.stockUnidadesService = stockUnidadesService;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            stockUnidadesService.backfill();
        } catch (Exception ex) {
            log.error("Stock: backfill interrumpido");
        }
    }
}

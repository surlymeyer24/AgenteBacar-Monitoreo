package com.bacarsa.inventario.controller;

import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.services.NormalizacionStockService;
import com.bacarsa.inventario.services.NormalizacionStockService.ResultadoNormalizacion;
import com.bacarsa.inventario.services.StockUnidadesService;

@RestController
@RequestMapping("/api/admin/normalizacion")
public class AdminNormalizacionController {

    private final NormalizacionStockService normalizacionService;
    private final StockUnidadesService stockUnidadesService;

    public AdminNormalizacionController(NormalizacionStockService normalizacionService,
                                         StockUnidadesService stockUnidadesService) {
        this.normalizacionService = normalizacionService;
        this.stockUnidadesService = stockUnidadesService;
    }

    @GetMapping("/preview")
    public ResponseEntity<ResultadoNormalizacion> preview() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(normalizacionService.ejecutar(true));
    }

    @PostMapping("/aplicar")
    public ResponseEntity<ResultadoNormalizacion> aplicar() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(normalizacionService.ejecutar(false));
    }

    @PostMapping("/backfill-codigos")
    public ResponseEntity<Map<String, Object>> backfillCodigos() {
        stockUnidadesService.backfill();
        return ResponseEntity.ok(Map.of("status", "ok", "mensaje", "Backfill ejecutado. Revisar logs del servidor."));
    }
}

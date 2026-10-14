package com.bacarsa.inventario.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.UnidadStockDTO;
import com.bacarsa.inventario.services.StockUnidadesService;

@RestController
@RequestMapping("/api/stock/unidades")
public class StockController {

    private final StockUnidadesService stockUnidadesService;

    public StockController(StockUnidadesService stockUnidadesService) {
        this.stockUnidadesService = stockUnidadesService;
    }

    @GetMapping
    public ResponseEntity<List<UnidadStockDTO>> listar() {
        return ResponseEntity.ok(stockUnidadesService.listar());
    }
}

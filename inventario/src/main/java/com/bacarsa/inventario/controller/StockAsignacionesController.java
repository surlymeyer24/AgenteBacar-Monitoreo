package com.bacarsa.inventario.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.MovimientoStockDTO;
import com.bacarsa.inventario.services.StockAsignacionesService;

@RestController
@RequestMapping("/api/stock/asignaciones")
public class StockAsignacionesController {

    private final StockAsignacionesService stockAsignacionesService;

    public StockAsignacionesController(StockAsignacionesService stockAsignacionesService) {
        this.stockAsignacionesService = stockAsignacionesService;
    }

    @GetMapping
    public ResponseEntity<List<MovimientoStockDTO>> listar() {
        return ResponseEntity.ok(stockAsignacionesService.listar());
    }
}

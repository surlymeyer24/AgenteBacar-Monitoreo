package com.bacarsa.inventario.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.AltaUnidadStockDTO;
import com.bacarsa.inventario.dto.BajaUnidadStockDTO;
import com.bacarsa.inventario.dto.ModificarUnidadStockDTO;
import com.bacarsa.inventario.dto.UnidadStockDTO;
import com.bacarsa.inventario.services.StockAbmService;
import com.bacarsa.inventario.services.StockUnidadesService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/stock/unidades")
public class StockController {

    private final StockUnidadesService stockUnidadesService;
    private final StockAbmService stockAbmService;

    public StockController(StockUnidadesService stockUnidadesService, StockAbmService stockAbmService) {
        this.stockUnidadesService = stockUnidadesService;
        this.stockAbmService = stockAbmService;
    }

    @GetMapping
    public ResponseEntity<List<UnidadStockDTO>> listar() {
        return ResponseEntity.ok(stockUnidadesService.listar());
    }

    @GetMapping("/{codigo}")
    public ResponseEntity<UnidadStockDTO> obtenerPorCodigo(@PathVariable String codigo) {
        try {
            return ResponseEntity.ok(stockUnidadesService.obtenerPorCodigo(codigo));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<UnidadStockDTO> alta(
            @Valid @RequestBody AltaUnidadStockDTO dto,
            HttpServletRequest request) throws Exception {
        UnidadStockDTO creado = stockAbmService.alta(dto, uid(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PatchMapping("/{codigo}")
    public ResponseEntity<UnidadStockDTO> modificar(
            @PathVariable String codigo,
            @RequestBody ModificarUnidadStockDTO dto,
            HttpServletRequest request) throws Exception {
        try {
            UnidadStockDTO actualizado = stockAbmService.modificar(codigo, dto, uid(request));
            return ResponseEntity.ok(actualizado);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{codigo}/baja")
    public ResponseEntity<UnidadStockDTO> baja(
            @PathVariable String codigo,
            @Valid @RequestBody BajaUnidadStockDTO dto,
            HttpServletRequest request) throws Exception {
        try {
            UnidadStockDTO dadoDeBaja = stockAbmService.darDeBaja(codigo, dto, uid(request));
            return ResponseEntity.ok(dadoDeBaja);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    private static String uid(HttpServletRequest request) {
        if (request == null) {
            return "SISTEMA";
        }
        Object uid = request.getAttribute("uid");
        return uid == null ? "SISTEMA" : String.valueOf(uid);
    }
}

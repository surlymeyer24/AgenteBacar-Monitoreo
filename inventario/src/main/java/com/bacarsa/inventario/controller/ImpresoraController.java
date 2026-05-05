package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.ImpresoraAgrupadaDTO;
import com.bacarsa.inventario.services.ImpresoraService;

@RestController
@RequestMapping("/api/impresoras")
public class ImpresoraController {

    private final ImpresoraService impresoraService;

    public ImpresoraController(ImpresoraService impresoraService) {
        this.impresoraService = impresoraService;
    }

    @GetMapping
    public ResponseEntity<List<ImpresoraAgrupadaDTO>> listar() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(impresoraService.listarAgrupadas());
    }
}

package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.SesionBloqueoDTO;
import com.bacarsa.inventario.services.SesionBloqueoService;

@RestController
@RequestMapping("/api/sesion-bloqueos")
public class SesionBloqueoController {

    private final SesionBloqueoService service;

    public SesionBloqueoController(SesionBloqueoService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<SesionBloqueoDTO>> listar(
            @RequestParam(required = false) Integer limit)
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(service.listarRecientes(limit));
    }
}

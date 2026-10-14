package com.bacarsa.inventario.controller;

import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.services.SesionBloqueoService;

@RestController
@RequestMapping("/api/admin/sesion-bloqueos")
public class AdminSesionBloqueoController {

    private final SesionBloqueoService service;

    public AdminSesionBloqueoController(SesionBloqueoService service) {
        this.service = service;
    }

    /** Fuerza una pasada del detector (transiciones nuevas desde el último estado visto). */
    @PostMapping("/detectar")
    public ResponseEntity<Map<String, Integer>> detectar()
            throws ExecutionException, InterruptedException {
        int registrados = service.detectarAhora();
        return ResponseEntity.ok(Map.of("registrados", registrados));
    }

    /**
     * Borra el tracker y registra un snapshot de todas las PCs actualmente bloqueadas.
     * Usar una vez si el historial arrancó vacío.
     */
    @PostMapping("/sincronizar-inicial")
    public ResponseEntity<Map<String, Integer>> sincronizarInicial()
            throws ExecutionException, InterruptedException {
        int registrados = service.sincronizarInicial();
        return ResponseEntity.ok(Map.of("registrados", registrados));
    }
}

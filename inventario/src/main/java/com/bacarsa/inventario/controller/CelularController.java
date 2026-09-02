package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.CelularCreateDTO;
import com.bacarsa.inventario.dto.CelularDTO;
import com.bacarsa.inventario.services.CelularService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/celulares")
public class CelularController {

    private final CelularService celularService;

    public CelularController(CelularService celularService) {
        this.celularService = celularService;
    }

    @GetMapping
    public ResponseEntity<List<CelularDTO>> listar() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(celularService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CelularDTO> obtener(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        CelularDTO dto = celularService.obtenerPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<CelularDTO> crear(@Valid @RequestBody CelularCreateDTO body)
            throws ExecutionException, InterruptedException {
        try {
            CelularDTO creado = celularService.crear(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(creado);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CelularDTO> actualizar(
            @PathVariable String id,
            @Valid @RequestBody CelularCreateDTO dto)
            throws ExecutionException, InterruptedException {
        try {
            CelularDTO actualizado = celularService.update(id, dto);
            return ResponseEntity.ok(actualizado);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        if (!celularService.eliminar(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/eliminar")
    public ResponseEntity<Void> eliminarPost(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        return eliminar(id);
    }
}

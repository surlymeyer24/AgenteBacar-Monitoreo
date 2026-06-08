package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.CambiarEstadoDTO;
import com.bacarsa.inventario.dto.SwitchRedCreateDTO;
import com.bacarsa.inventario.dto.SwitchRedDTO;
import com.bacarsa.inventario.services.SwitchRedService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/switches")
public class SwitchRedController {

    private final SwitchRedService switchRedService;

    public SwitchRedController(SwitchRedService switchRedService) {
        this.switchRedService = switchRedService;
    }

    @GetMapping
    public ResponseEntity<List<SwitchRedDTO>> listar() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(switchRedService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SwitchRedDTO> obtener(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        SwitchRedDTO dto = switchRedService.obtenerPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<SwitchRedDTO> crear(@RequestBody SwitchRedCreateDTO body)
            throws ExecutionException, InterruptedException {
        try {
            SwitchRedDTO creado = switchRedService.crear(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(creado);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/estado")
    public ResponseEntity<SwitchRedDTO> cambiarEstado(
            @PathVariable String id,
            @Valid @RequestBody CambiarEstadoDTO body) throws ExecutionException, InterruptedException {
        try {
            SwitchRedDTO dto = switchRedService.cambiarEstado(id, body.getEstado(), body.getMotivo());
            if (dto == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}")
    public ResponseEntity<SwitchRedDTO> actualizar(
            @PathVariable String id,
            @Valid @RequestBody SwitchRedCreateDTO dto)
            throws ExecutionException, InterruptedException {
        try {
            SwitchRedDTO actualizado = switchRedService.update(id, dto);
            return ResponseEntity.ok(actualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

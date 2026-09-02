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

import com.bacarsa.inventario.dto.AccessPointCreateDTO;
import com.bacarsa.inventario.dto.AccessPointDTO;
import com.bacarsa.inventario.services.AccessPointService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/access-points")
public class AccessPointController {

    private final AccessPointService accessPointService;

    public AccessPointController(AccessPointService accessPointService) {
        this.accessPointService = accessPointService;
    }

    @GetMapping
    public ResponseEntity<List<AccessPointDTO>> listar() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(accessPointService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccessPointDTO> obtener(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        AccessPointDTO dto = accessPointService.obtenerPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<AccessPointDTO> crear(@Valid @RequestBody AccessPointCreateDTO body)
            throws ExecutionException, InterruptedException {
        try {
            AccessPointDTO creado = accessPointService.crear(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(creado);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccessPointDTO> actualizar(
            @PathVariable String id,
            @Valid @RequestBody AccessPointCreateDTO dto)
            throws ExecutionException, InterruptedException {
        try {
            AccessPointDTO actualizado = accessPointService.update(id, dto);
            return ResponseEntity.ok(actualizado);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        if (!accessPointService.eliminar(id)) {
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

package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.CambiarEstadoDTO;
import com.bacarsa.inventario.dto.RouterCreateDTO;
import com.bacarsa.inventario.dto.RouterDTO;
import com.bacarsa.inventario.services.RouterService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/routers")
public class RouterController {

    private final RouterService routerService;

    public RouterController(RouterService routerService) {
        this.routerService = routerService;
    }

    @GetMapping
    public ResponseEntity<List<RouterDTO>> listar() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(routerService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RouterDTO> obtener(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        RouterDTO dto = routerService.obtenerPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<RouterDTO> crear(@RequestBody RouterCreateDTO body)
            throws ExecutionException, InterruptedException {
        try {
            RouterDTO creado = routerService.crear(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(creado);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/estado")
    public ResponseEntity<RouterDTO> cambiarEstado(
            @PathVariable String id,
            @Valid @RequestBody CambiarEstadoDTO body) throws ExecutionException, InterruptedException {
        try {
            RouterDTO dto = routerService.cambiarEstado(id, body.getEstado(), body.getMotivo());
            if (dto == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}")
    public ResponseEntity<RouterDTO> actualizar(
            @PathVariable String id,
            @Valid @RequestBody RouterCreateDTO dto)
            throws ExecutionException, InterruptedException {
        try {
            RouterDTO actualizado = routerService.update(id, dto);
            return ResponseEntity.ok(actualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        if (!routerService.eliminar(id)) {
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

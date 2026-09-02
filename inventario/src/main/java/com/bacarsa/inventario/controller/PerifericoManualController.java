package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.ActualizarPerifericoDTO;
import com.bacarsa.inventario.dto.AsignarPerifericoDTO;
import com.bacarsa.inventario.dto.CambiarEstadoDTO;
import com.bacarsa.inventario.dto.ComboCreateDTO;
import com.bacarsa.inventario.dto.PerifericoManualCreateDTO;
import com.bacarsa.inventario.dto.PerifericoManualDTO;
import com.bacarsa.inventario.services.PerifericoManualService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/perifericos-manuales")
public class PerifericoManualController {

    private final PerifericoManualService service;

    public PerifericoManualController(PerifericoManualService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<PerifericoManualDTO>> listar()
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(service.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PerifericoManualDTO> obtener(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        PerifericoManualDTO dto = service.obtenerPorId(id);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<PerifericoManualDTO> crear(@Valid @RequestBody PerifericoManualCreateDTO body)
            throws ExecutionException, InterruptedException {
        try {
            PerifericoManualDTO creado = service.crear(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(creado);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/combo")
    public ResponseEntity<List<PerifericoManualDTO>> crearCombo(@Valid @RequestBody ComboCreateDTO body)
            throws ExecutionException, InterruptedException {
        try {
            List<PerifericoManualDTO> creados = service.crearCombo(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(creados);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/actualizar")
    public ResponseEntity<PerifericoManualDTO> actualizar(
            @PathVariable String id,
            @RequestBody ActualizarPerifericoDTO body)
            throws ExecutionException, InterruptedException {
        try {
            PerifericoManualDTO dto = service.actualizar(id, body);
            if (dto == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/asignar")
    public ResponseEntity<PerifericoManualDTO> asignar(
            @PathVariable String id,
            @Valid @RequestBody AsignarPerifericoDTO body)
            throws ExecutionException, InterruptedException {
        try {
            PerifericoManualDTO dto = service.asignar(id, body.getComputadoraHostname(), body.getMotivo());
            if (dto == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/estado")
    public ResponseEntity<PerifericoManualDTO> cambiarEstado(
            @PathVariable String id,
            @Valid @RequestBody CambiarEstadoDTO body)
            throws ExecutionException, InterruptedException {
        try {
            PerifericoManualDTO dto = service.cambiarEstado(id, body.getEstado(), body.getMotivo());
            if (dto == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}

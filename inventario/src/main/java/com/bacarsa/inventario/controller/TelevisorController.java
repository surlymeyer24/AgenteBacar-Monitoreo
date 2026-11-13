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

import com.bacarsa.inventario.dto.CambiarEstadoDTO;
import com.bacarsa.inventario.dto.TelevisorCreateDTO;
import com.bacarsa.inventario.dto.TelevisorDTO;
import com.bacarsa.inventario.services.TelevisorService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/televisores")
public class TelevisorController {

    private final TelevisorService televisorService;

    public TelevisorController(TelevisorService televisorService) {
        this.televisorService = televisorService;
    }

    @GetMapping
    public ResponseEntity<List<TelevisorDTO>> listar() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(televisorService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TelevisorDTO> obtener(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        TelevisorDTO dto = televisorService.obtenerPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<TelevisorDTO> crear(
            @Valid @RequestBody TelevisorCreateDTO body,
            HttpServletRequest request)
            throws ExecutionException, InterruptedException {
        try {
            TelevisorDTO creado = televisorService.crear(body, uid(request));
            return ResponseEntity.status(HttpStatus.CREATED).body(creado);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TelevisorDTO> actualizar(
            @PathVariable String id,
            @Valid @RequestBody TelevisorCreateDTO dto,
            HttpServletRequest request)
            throws ExecutionException, InterruptedException {
        try {
            TelevisorDTO actualizado = televisorService.update(id, dto, uid(request));
            return ResponseEntity.ok(actualizado);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/estado")
    public ResponseEntity<TelevisorDTO> cambiarEstado(
            @PathVariable String id,
            @Valid @RequestBody CambiarEstadoDTO body,
            HttpServletRequest request) throws ExecutionException, InterruptedException {
        try {
            TelevisorDTO dto = televisorService.cambiarEstado(id, body.getEstado(), body.getMotivo(), uid(request));
            if (dto == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable String id,
            HttpServletRequest request)
            throws ExecutionException, InterruptedException {
        if (!televisorService.eliminar(id, uid(request))) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/eliminar")
    public ResponseEntity<Void> eliminarPost(
            @PathVariable String id,
            HttpServletRequest request)
            throws ExecutionException, InterruptedException {
        return eliminar(id, request);
    }

    private static String uid(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        Object attr = request.getAttribute("firebaseUid");
        return attr instanceof String s ? s : null;
    }
}

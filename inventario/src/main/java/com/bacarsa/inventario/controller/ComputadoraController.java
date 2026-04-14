package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.ComputadoraDTO;
import com.bacarsa.inventario.dto.UbicacionUpdateDTO;
import com.bacarsa.inventario.services.ComputadoraService;
import com.bacarsa.inventario.dto.CambiarEstadoDTO;


import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/computadoras")
public class ComputadoraController {

    private final ComputadoraService computadoraService;

    public ComputadoraController(ComputadoraService computadoraService) {
        this.computadoraService = computadoraService;
    }

    @GetMapping
    public ResponseEntity<List<ComputadoraDTO>> listarTodas() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(computadoraService.getAllComputadoras());
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<ComputadoraDTO> obtenerPorUuid(@PathVariable String uuid) throws ExecutionException, InterruptedException {
        ComputadoraDTO dto = computadoraService.getByUuid(uuid);
        if (dto == null) {
            
            return ResponseEntity.notFound().build();
            
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{uuid}/ubicacion")
    public ResponseEntity<ComputadoraDTO> actualizarUbicacion(
            @PathVariable String uuid,
            @Valid @RequestBody UbicacionUpdateDTO body) throws ExecutionException, InterruptedException {
        try {
            ComputadoraDTO dto = computadoraService.actualizarUbicacion(uuid, body.getUbicacion());
            if (dto == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{uuid}/estado")
    public ResponseEntity<ComputadoraDTO> actualizarEstado(
            @PathVariable String uuid,
            @Valid @RequestBody CambiarEstadoDTO body) throws ExecutionException, InterruptedException {
        try {
            ComputadoraDTO dto = computadoraService.cambiarEstado(uuid, body.getEstado(), body.getMotivo());
            if (dto == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

}

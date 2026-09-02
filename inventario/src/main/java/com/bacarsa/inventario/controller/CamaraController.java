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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.CamaraCreateDTO;
import com.bacarsa.inventario.dto.CamaraDTO;
import com.bacarsa.inventario.services.CamaraService;

import jakarta.validation.Valid;

import com.bacarsa.inventario.dto.CambiarEstadoDTO;
import com.bacarsa.inventario.dto.UbicacionUpdateDTO;
import com.bacarsa.inventario.dto.NvrASignacionDTO;

@RestController
@RequestMapping("/api/camaras")
public class CamaraController {

    private final CamaraService camaraService;

    public CamaraController(CamaraService camaraService) {
        this.camaraService = camaraService;
    }

    @GetMapping("/recientes")
    public ResponseEntity<List<CamaraDTO>> listarRecientes(
            @RequestParam(name = "limit", defaultValue = "8") int limit)
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(camaraService.getRecientes(Math.min(limit, 50)));
    }

    @GetMapping
    public ResponseEntity<List<CamaraDTO>> listar(
            @RequestParam(name = "ubicacion", required = false) String ubicacion,
            @RequestParam(name = "nvrId", required = false) String nvrId)
            throws ExecutionException, InterruptedException {
        try {
            return ResponseEntity.ok(camaraService.listarCamaras(ubicacion, nvrId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CamaraDTO> obtener(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        CamaraDTO dto = camaraService.obtenerPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<CamaraDTO> crear(@RequestBody CamaraCreateDTO body)
            throws ExecutionException, InterruptedException {
        try {
            CamaraDTO creada = camaraService.crear(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(creada);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}")
    public ResponseEntity<CamaraDTO> actualizar(
            @PathVariable String id,
            @Valid @RequestBody CamaraCreateDTO dto)
            throws ExecutionException, InterruptedException {
        try {
            CamaraDTO actualizado = camaraService.update(id, dto);
            return ResponseEntity.ok(actualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/ubicacion")
    public ResponseEntity<CamaraDTO> actualizarUbicacion(
            @PathVariable String id,
            @Valid @RequestBody UbicacionUpdateDTO body) throws ExecutionException, InterruptedException {
        try {
            CamaraDTO dto = camaraService.actualizarUbicacion(id, body.getUbicacion());
            if (dto == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/estado")
    public ResponseEntity<CamaraDTO> cambiarEstado(
            @PathVariable String id,
            @Valid @RequestBody CambiarEstadoDTO body) throws ExecutionException, InterruptedException {
        try {
            CamaraDTO dto = camaraService.cambiarEstado(id, body.getEstado(), body.getMotivo());
            if (dto == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/nvr")
    public ResponseEntity<CamaraDTO> asignarNvr(
            @PathVariable String id,
            @RequestBody NvrASignacionDTO body) throws ExecutionException, InterruptedException {
        CamaraDTO dto = camaraService.asignarNvr(id, body != null ? body.getNvrId() : null);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        boolean ok = camaraService.eliminar(id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}

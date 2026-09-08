package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.CatalogoItemCreateDTO;
import com.bacarsa.inventario.dto.CatalogoItemDTO;
import com.bacarsa.inventario.dto.CatalogoItemUpdateDTO;
import com.bacarsa.inventario.services.CatalogoItemService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/catalogos")
public class CatalogoController {

    private final CatalogoItemService catalogoItemService;

    public CatalogoController(CatalogoItemService catalogoItemService) {
        this.catalogoItemService = catalogoItemService;
    }

    @GetMapping("/{catalogoId}")
    public ResponseEntity<List<CatalogoItemDTO>> listar(
            @PathVariable String catalogoId,
            @RequestParam(defaultValue = "false") boolean incluirInactivos)
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(catalogoItemService.listar(catalogoId, incluirInactivos));
    }

    @GetMapping("/{catalogoId}/{codigo}")
    public ResponseEntity<CatalogoItemDTO> obtener(
            @PathVariable String catalogoId,
            @PathVariable String codigo)
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(catalogoItemService.obtener(catalogoId, codigo));
    }

    @PostMapping("/{catalogoId}")
    public ResponseEntity<CatalogoItemDTO> crear(
            @PathVariable String catalogoId,
            @Valid @RequestBody CatalogoItemCreateDTO body)
            throws ExecutionException, InterruptedException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(catalogoItemService.crear(catalogoId, body));
    }

    @PutMapping("/{catalogoId}/{codigo}")
    public ResponseEntity<CatalogoItemDTO> actualizar(
            @PathVariable String catalogoId,
            @PathVariable String codigo,
            @Valid @RequestBody CatalogoItemUpdateDTO body)
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(catalogoItemService.actualizar(catalogoId, codigo, body));
    }

    @PatchMapping("/{catalogoId}/{codigo}/activo")
    public ResponseEntity<CatalogoItemDTO> cambiarActivo(
            @PathVariable String catalogoId,
            @PathVariable String codigo,
            @RequestBody Map<String, Boolean> body)
            throws ExecutionException, InterruptedException {
        Boolean activo = body.get("activo");
        if (activo == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(catalogoItemService.cambiarActivo(catalogoId, codigo, activo));
    }
}

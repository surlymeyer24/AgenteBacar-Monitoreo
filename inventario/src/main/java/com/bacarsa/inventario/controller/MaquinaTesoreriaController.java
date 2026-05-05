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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.CambiarEstadoDTO;
import com.bacarsa.inventario.dto.MaquinaTesoreriaCreateDTO;
import com.bacarsa.inventario.dto.MaquinaTesoreriaDTO;
import com.bacarsa.inventario.services.MaquinaTesoreriaService;

@RestController
@RequestMapping("/api/maquinas-tesoreria")
public class MaquinaTesoreriaController {

    private final MaquinaTesoreriaService maquinaTesoreriaService;

    public MaquinaTesoreriaController(MaquinaTesoreriaService maquinaTesoreriaService) {
        this.maquinaTesoreriaService = maquinaTesoreriaService;
    }

    @GetMapping
    public ResponseEntity<List<MaquinaTesoreriaDTO>> listar(
            @RequestParam(name = "tipo", required = false) String tipo)
            throws ExecutionException, InterruptedException {
        try {
            return ResponseEntity.ok(maquinaTesoreriaService.listar(tipo));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaquinaTesoreriaDTO> obtener(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        MaquinaTesoreriaDTO dto = maquinaTesoreriaService.obtenerPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<MaquinaTesoreriaDTO> crear(@RequestBody MaquinaTesoreriaCreateDTO body)
            throws ExecutionException, InterruptedException {
        try {
            MaquinaTesoreriaDTO creada = maquinaTesoreriaService.crear(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(creada);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/estado")
    public ResponseEntity<MaquinaTesoreriaDTO> cambiarEstado(
            @PathVariable String id,
            @RequestBody CambiarEstadoDTO body) throws ExecutionException, InterruptedException {
        try {
            MaquinaTesoreriaDTO dto = maquinaTesoreriaService.cambiarEstado(id, body.getEstado(), body.getMotivo());
            if (dto == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}

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

import com.bacarsa.inventario.dto.ServidorDTO;
import com.bacarsa.inventario.services.ServidorService;

@RestController
@RequestMapping("/api/servidores")
public class ServidorController {

    private final ServidorService servidorService;

    public ServidorController(ServidorService servidorService) {
        this.servidorService = servidorService;
    }

    @GetMapping
    public ResponseEntity<List<ServidorDTO>> listar() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(servidorService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServidorDTO> obtener(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        ServidorDTO dto = servidorService.obtenerPorId(id);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<ServidorDTO> crear(@RequestBody ServidorDTO body)
            throws ExecutionException, InterruptedException {
        try {
            ServidorDTO creado = servidorService.crear(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(creado);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServidorDTO> actualizar(@PathVariable String id, @RequestBody ServidorDTO body)
            throws ExecutionException, InterruptedException {
        ServidorDTO dto = servidorService.actualizar(id, body);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        boolean ok = servidorService.eliminar(id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}

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
import com.bacarsa.inventario.dto.CambioEstadoDTO;
import com.bacarsa.inventario.dto.InternoIpCreateDTO;
import com.bacarsa.inventario.dto.InternoIpDTO;
import com.bacarsa.inventario.services.InternoIpService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/internos")
@RequiredArgsConstructor
public class InternoIpController {

    private final InternoIpService internoIpService;

    @GetMapping
    public ResponseEntity<List<InternoIpDTO>> findAll() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(internoIpService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InternoIpDTO> findById(@PathVariable String id) throws ExecutionException, InterruptedException {
        InternoIpDTO dto = internoIpService.findById(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<String> create(@RequestBody InternoIpCreateDTO dto) throws ExecutionException, InterruptedException {
        String id = internoIpService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }

    @PostMapping("/bulk")
    public ResponseEntity<Integer> createBulk(@RequestBody List<InternoIpCreateDTO> dtos) throws ExecutionException, InterruptedException {
        int count = internoIpService.createBulk(dtos);
        return ResponseEntity.status(HttpStatus.CREATED).body(count);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable String id, @RequestBody InternoIpCreateDTO dto) throws ExecutionException, InterruptedException {
        try {
            internoIpService.update(id, dto);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) throws ExecutionException, InterruptedException {
        internoIpService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/estado")
    public ResponseEntity<Void> cambiarEstado(@PathVariable String id, @RequestBody CambiarEstadoDTO dto) throws ExecutionException, InterruptedException {
        try {
            internoIpService.cambiarEstado(id, dto);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/historial")
    public ResponseEntity<List<CambioEstadoDTO>> getHistorial(@PathVariable String id) throws ExecutionException, InterruptedException {
        List<CambioEstadoDTO> historial = internoIpService.getHistorial(id);
        if (historial == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(historial);
    }
}

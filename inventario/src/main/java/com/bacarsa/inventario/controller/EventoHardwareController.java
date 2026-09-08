package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.EventoHardwareDTO;
import com.bacarsa.inventario.dto.EventoHardwareUpdateDTO;
import com.bacarsa.inventario.services.EventoHardwareService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/eventos-hardware")
public class EventoHardwareController {

    private final EventoHardwareService service;

    public EventoHardwareController(EventoHardwareService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<EventoHardwareDTO>> listar(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String uuid,
            @RequestParam(required = false) Boolean leido)
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(service.listar(estado, uuid, leido));
    }

    @GetMapping("/pendientes-count")
    public ResponseEntity<Map<String, Long>> contarPendientes()
            throws ExecutionException, InterruptedException {
        long count = service.contarPendientesNoLeidos();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventoHardwareDTO> obtener(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        EventoHardwareDTO dto = service.obtenerPorId(id);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<EventoHardwareDTO> actualizar(
            @PathVariable String id,
            @RequestBody EventoHardwareUpdateDTO body,
            HttpServletRequest request)
            throws ExecutionException, InterruptedException {
        String uid = (String) request.getAttribute("uid");
        EventoHardwareDTO dto = service.actualizar(id, body, uid);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }
}

package com.bacarsa.inventario.controller;

import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.ActualizarProgresoLogisticaDTO;
import com.bacarsa.inventario.dto.ActualizarProgresoLogisticaMasivoDTO;
import com.bacarsa.inventario.dto.ProgresoLogisticaDTO;
import com.bacarsa.inventario.dto.ResultadoProgresoLogisticaMasivoDTO;
import com.bacarsa.inventario.services.ProgresoLogisticaService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/etiquetas-qr")
public class ProgresoLogisticaController {

    private final ProgresoLogisticaService progresoService;

    public ProgresoLogisticaController(ProgresoLogisticaService progresoService) {
        this.progresoService = progresoService;
    }

    @GetMapping("/{uuid}/progreso")
    public ResponseEntity<ProgresoLogisticaDTO> obtener(@PathVariable String uuid)
            throws ExecutionException, InterruptedException {
        ProgresoLogisticaDTO dto = progresoService.obtener(uuid);
        return dto == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(dto);
    }

    @PatchMapping("/progreso")
    public ResponseEntity<ResultadoProgresoLogisticaMasivoDTO> actualizarMasivo(
            @RequestAttribute("uid") String uid,
            @Valid @RequestBody ActualizarProgresoLogisticaMasivoDTO body)
            throws ExecutionException, InterruptedException {
        try {
            return ResponseEntity.ok(progresoService.actualizarMasivo(body, uid));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{uuid}/progreso")
    public ResponseEntity<ProgresoLogisticaDTO> actualizar(
            @PathVariable String uuid,
            @RequestAttribute("uid") String uid,
            @Valid @RequestBody ActualizarProgresoLogisticaDTO body)
            throws ExecutionException, InterruptedException {
        try {
            ProgresoLogisticaDTO dto = progresoService.actualizar(uuid, body, uid);
            return dto == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}

package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.CambiarTipoInfraRequest;
import com.bacarsa.inventario.dto.InfraestructuraDuplicadoItemDTO;
import com.bacarsa.inventario.dto.LimpiezaDuplicadosInfraResultDTO;
import com.bacarsa.inventario.services.InfraestructuraLimpiezaService;
import com.bacarsa.inventario.services.InfraestructuraMigracionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/infraestructura")
public class InfraestructuraMigracionController {

    private final InfraestructuraMigracionService migracionService;
    private final InfraestructuraLimpiezaService limpiezaService;

    public InfraestructuraMigracionController(
            InfraestructuraMigracionService migracionService,
            InfraestructuraLimpiezaService limpiezaService) {
        this.migracionService = migracionService;
        this.limpiezaService = limpiezaService;
    }

    /**
     * Actualiza o migra un equipo entre routers, switches y access points conservando el ID.
     */
    @PostMapping("/cambiar-tipo")
    public ResponseEntity<Object> cambiarTipo(@Valid @RequestBody CambiarTipoInfraRequest body)
            throws ExecutionException, InterruptedException {
        try {
            return ResponseEntity.ok(migracionService.cambiarTipo(body));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    /** Lista duplicados detectados (mismo ID en colecciones distintas o switch+AP con mismo nombre/IP). */
    @GetMapping("/duplicados")
    public ResponseEntity<List<InfraestructuraDuplicadoItemDTO>> duplicados()
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(limpiezaService.detectarDuplicados());
    }

    /** Elimina duplicados dejando access point > switch > router. */
    @PostMapping("/limpiar-duplicados")
    public ResponseEntity<LimpiezaDuplicadosInfraResultDTO> limpiarDuplicados()
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(limpiezaService.limpiarDuplicados());
    }
}

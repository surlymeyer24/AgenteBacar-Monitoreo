package com.bacarsa.inventario.controller;

import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.MigracionEstadoMasivoResultDTO;
import com.bacarsa.inventario.services.MigracionEstadosService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@RestController
@RequestMapping("/api/admin/migracion")
public class AdminMigracionController {

    @Value("${app.migration.bulk-asignada.enabled:false}")
    private boolean bulkAsignadaEnabled;

    private final MigracionEstadosService migracionEstadosService;

    public AdminMigracionController(MigracionEstadosService migracionEstadosService) {
        this.migracionEstadosService = migracionEstadosService;
    }

    /**
     * Marca todas las computadoras y cámaras con estado IT "Asignada" (con historial).
     * Requiere {@code app.migration.bulk-asignada.enabled=true} en configuración.
     */
    @PostMapping("/todas-asignada")
    public ResponseEntity<?> todasAsignada(@RequestBody(required = false) @Valid MigracionTodasAsignadaBody body)
            throws ExecutionException, InterruptedException {
        if (!bulkAsignadaEnabled) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error",
                    "Migración deshabilitada. Definí app.migration.bulk-asignada.enabled=true y reiniciá el servidor."));
        }
        String motivo = body != null ? body.getMotivo() : null;
        MigracionEstadoMasivoResultDTO r = migracionEstadosService.marcarTodasAsignada(motivo);
        return ResponseEntity.ok(r);
    }

    @Getter
    @Setter
    public static class MigracionTodasAsignadaBody {
        @Size(max = 500)
        private String motivo;
    }
}

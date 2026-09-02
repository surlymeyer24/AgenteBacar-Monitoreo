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
import com.bacarsa.inventario.dto.MigracionUbicacionStockResultDTO;
import com.bacarsa.inventario.services.MigracionEstadosService;
import com.bacarsa.inventario.services.MigracionUbicacionStockService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@RestController
@RequestMapping("/api/admin/migracion")
public class AdminMigracionController {

    @Value("${app.migration.bulk-asignada.enabled:false}")
    private boolean bulkAsignadaEnabled;

    @Value("${app.migration.ubicacion-stock.enabled:false}")
    private boolean ubicacionStockEnabled;

    private final MigracionEstadosService migracionEstadosService;
    private final MigracionUbicacionStockService migracionUbicacionStockService;

    public AdminMigracionController(MigracionEstadosService migracionEstadosService,
                                     MigracionUbicacionStockService migracionUbicacionStockService) {
        this.migracionEstadosService = migracionEstadosService;
        this.migracionUbicacionStockService = migracionUbicacionStockService;
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

    @PostMapping("/ubicacion-stock")
    public ResponseEntity<?> ubicacionStock() throws ExecutionException, InterruptedException {
        if (!ubicacionStockEnabled) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error",
                    "Migración deshabilitada. Definí app.migration.ubicacion-stock.enabled=true y reiniciá el servidor."));
        }
        MigracionUbicacionStockResultDTO r = migracionUbicacionStockService.migrar();
        return ResponseEntity.ok(r);
    }

    @Getter
    @Setter
    public static class MigracionTodasAsignadaBody {
        @Size(max = 500)
        private String motivo;
    }
}

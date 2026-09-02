package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.EtiquetaQrDetalleDTO;
import com.bacarsa.inventario.dto.EtiquetaQrListadoDTO;
import com.bacarsa.inventario.dto.ProgresoLogisticaResumenDTO;
import com.bacarsa.inventario.services.EtiquetaQrService;
import com.bacarsa.inventario.services.ProgresoLogisticaService;

@RestController
@RequestMapping("/api/etiquetas-qr")
public class EtiquetaQrController {

    private final EtiquetaQrService etiquetaQrService;
    private final ProgresoLogisticaService progresoLogisticaService;

    public EtiquetaQrController(
            EtiquetaQrService etiquetaQrService,
            ProgresoLogisticaService progresoLogisticaService) {
        this.etiquetaQrService = etiquetaQrService;
        this.progresoLogisticaService = progresoLogisticaService;
    }

    @GetMapping
    public ResponseEntity<List<EtiquetaQrListadoDTO>> listar()
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(etiquetaQrService.listar());
    }

    /** Literal: si no, {@code GET /{uuid}} interpreta "progreso" como UUID y responde 404. */
    @GetMapping("/progreso")
    public ResponseEntity<Map<String, ProgresoLogisticaResumenDTO>> listarProgreso()
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(progresoLogisticaService.listarResumen());
    }

    @GetMapping("/por-hostname/{hostname}")
    public ResponseEntity<EtiquetaQrDetalleDTO> porHostname(@PathVariable String hostname)
            throws ExecutionException, InterruptedException {
        EtiquetaQrDetalleDTO dto = etiquetaQrService.obtenerPorHostname(hostname);
        return dto == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(dto);
    }

    @GetMapping("/{uuid:^(?!progreso$).+}")
    public ResponseEntity<EtiquetaQrDetalleDTO> porUuid(@PathVariable String uuid)
            throws ExecutionException, InterruptedException {
        EtiquetaQrDetalleDTO dto = etiquetaQrService.obtenerPorUuid(uuid);
        return dto == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(dto);
    }
}

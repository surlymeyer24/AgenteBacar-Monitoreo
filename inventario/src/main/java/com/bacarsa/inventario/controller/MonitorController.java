package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.MonitorReportadoAgenteDTO;
import com.bacarsa.inventario.services.MonitorService;

@RestController
@RequestMapping("/api/monitores")
public class MonitorController {

    private final MonitorService monitorService;

    public MonitorController(MonitorService monitorService) {
        this.monitorService = monitorService;
    }

    @GetMapping
    public ResponseEntity<List<MonitorReportadoAgenteDTO>> listarReportadosAgente()
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(monitorService.listarReportadosAgente());
    }
}

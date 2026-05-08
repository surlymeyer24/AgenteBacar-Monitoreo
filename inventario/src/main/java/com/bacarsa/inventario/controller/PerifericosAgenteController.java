package com.bacarsa.inventario.controller;

import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.PerifericosAgenteListadosDTO;
import com.bacarsa.inventario.services.PerifericosAgenteListadoService;

@RestController
@RequestMapping("/api/perifericos/agente")
public class PerifericosAgenteController {

    private final PerifericosAgenteListadoService perifericosAgenteListadoService;

    public PerifericosAgenteController(PerifericosAgenteListadoService perifericosAgenteListadoService) {
        this.perifericosAgenteListadoService = perifericosAgenteListadoService;
    }

    /**
     * Listados de teclados, mouse, webcams, parlantes y micrófonos en una sola respuesta
     * (una lectura de inventario de PCs; sin N+1 desde el navegador).
     */
    @GetMapping("/listados")
    public ResponseEntity<PerifericosAgenteListadosDTO> listados()
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(perifericosAgenteListadoService.listados());
    }
}

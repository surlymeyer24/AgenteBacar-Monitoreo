package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.ResultadoBusquedaDTO;
import com.bacarsa.inventario.services.BusquedaService;

@RestController
@RequestMapping("/api")
public class BusquedaController {

    private final BusquedaService busquedaService;

    public BusquedaController(BusquedaService busquedaService) {
        this.busquedaService = busquedaService;
    }

    @GetMapping("/buscar")
    public List<ResultadoBusquedaDTO> buscar(@RequestParam String q) throws ExecutionException, InterruptedException {
        return busquedaService.buscar(q);
    }
}

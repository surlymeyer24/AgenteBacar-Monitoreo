package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.ResponsableDetalleDTO;
import com.bacarsa.inventario.dto.ResponsableListadoDTO;
import com.bacarsa.inventario.services.ResponsableService;

@RestController
@RequestMapping("/api/responsables")
public class ResponsableController {

    private final ResponsableService responsableService;

    public ResponsableController(ResponsableService responsableService) {
        this.responsableService = responsableService;
    }

    @GetMapping
    public ResponseEntity<List<ResponsableListadoDTO>> listar()
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(responsableService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponsableDetalleDTO> detalle(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        ResponsableDetalleDTO dto = responsableService.obtenerDetalle(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    /** Reconstruye el índice desde las PCs actuales (admin / mantenimiento). */
    @PostMapping("/reconstruir")
    public ResponseEntity<Void> reconstruir() throws ExecutionException, InterruptedException {
        responsableService.reconstruirIndice();
        return ResponseEntity.noContent().build();
    }
}

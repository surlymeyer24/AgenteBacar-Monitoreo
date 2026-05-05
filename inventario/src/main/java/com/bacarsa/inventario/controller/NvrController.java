package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.NvrDTO;
import com.bacarsa.inventario.dto.CamaraDTO;
import com.bacarsa.inventario.services.NvrService;
import com.bacarsa.inventario.services.CamaraService;
import com.bacarsa.inventario.dto.NvrCreateDTO;

import org.springframework.http.HttpStatus;



@RestController
@RequestMapping("/api/nvrs")
public class NvrController {

    private final NvrService nvrService;
    private final CamaraService camaraService;

    public NvrController(NvrService nvrService, CamaraService camaraService) {
        this.nvrService = nvrService;
        this.camaraService = camaraService;
    }

    @GetMapping
    public ResponseEntity<List<NvrDTO>> listar() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(nvrService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NvrDTO> obtenerPorId(@PathVariable String id) throws ExecutionException, InterruptedException {
        NvrDTO dto = nvrService.obtenerPorId(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<NvrDTO> crear(@RequestBody NvrCreateDTO body) 
            throws ExecutionException, InterruptedException {
        try {
            NvrDTO creada = nvrService.crear(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(creada);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{id}/camaras")
    public ResponseEntity<List<CamaraDTO>> listarCamaras(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        NvrDTO nvr = nvrService.obtenerPorId(id);
        if (nvr == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(camaraService.listarCamaras(null, id));
    }

}

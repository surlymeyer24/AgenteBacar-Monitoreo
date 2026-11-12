package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.CamaraDTO;
import com.bacarsa.inventario.dto.CambiarEstadoDTO;
import com.bacarsa.inventario.dto.NvrCreateDTO;
import com.bacarsa.inventario.dto.NvrDTO;
import com.bacarsa.inventario.services.CamaraService;
import com.bacarsa.inventario.services.NvrService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

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
    public ResponseEntity<NvrDTO> crear(
            @RequestBody NvrCreateDTO body,
            HttpServletRequest request) 
            throws ExecutionException, InterruptedException {
        try {
            NvrDTO creada = nvrService.crear(body, uid(request));
            return ResponseEntity.status(HttpStatus.CREATED).body(creada);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NvrDTO> actualizar(
            @PathVariable String id,
            @RequestBody NvrCreateDTO dto,
            HttpServletRequest request) throws ExecutionException, InterruptedException {
        try {
            NvrDTO actualizado = nvrService.update(id, dto, uid(request));
            return ResponseEntity.ok(actualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/estado")
    public ResponseEntity<NvrDTO> cambiarEstado(
            @PathVariable String id,
            @Valid @RequestBody CambiarEstadoDTO body,
            HttpServletRequest request) throws ExecutionException, InterruptedException {
        try {
            NvrDTO dto = nvrService.cambiarEstado(id, body.getEstado(), body.getMotivo(), uid(request));
            if (dto == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable String id,
            HttpServletRequest request) throws ExecutionException, InterruptedException {
        boolean ok = nvrService.eliminar(id, uid(request));
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
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

    private static String uid(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        Object attr = request.getAttribute("firebaseUid");
        return attr instanceof String s ? s : null;
    }
}

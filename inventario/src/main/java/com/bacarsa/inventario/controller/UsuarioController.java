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

import com.bacarsa.inventario.dto.UsuarioCreateDTO;
import com.bacarsa.inventario.dto.UsuarioDTO;
import com.bacarsa.inventario.services.UsuarioService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listar() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @GetMapping("/{uid}")
    public ResponseEntity<UsuarioDTO> obtenerPorId(@PathVariable String uid)
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(usuarioService.obtenerPorId(uid));
    }

    @PostMapping
    public ResponseEntity<UsuarioDTO> crear(@Valid @RequestBody UsuarioCreateDTO body)
            throws ExecutionException, InterruptedException {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.crear(body));
    }

    @PutMapping("/{uid}")
    public ResponseEntity<UsuarioDTO> actualizar(@PathVariable String uid,
            @Valid @RequestBody UsuarioCreateDTO body)
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(usuarioService.actualizar(uid, body));
    }

    @DeleteMapping("/{uid}")
    public ResponseEntity<Void> eliminar(@PathVariable String uid)
            throws ExecutionException, InterruptedException {
        usuarioService.eliminar(uid);
        return ResponseEntity.noContent().build();
    }
}

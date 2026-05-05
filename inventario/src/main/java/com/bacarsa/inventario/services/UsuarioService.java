package com.bacarsa.inventario.services;

import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.bacarsa.inventario.dto.UsuarioCreateDTO;
import com.bacarsa.inventario.dto.UsuarioDTO;
import com.bacarsa.inventario.mapper.UsuarioMapper;
import com.bacarsa.inventario.models.Rol;
import com.bacarsa.inventario.models.Usuario;
import com.bacarsa.inventario.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public List<UsuarioDTO> listarTodos() throws ExecutionException, InterruptedException {
        return usuarioRepository.findAll().stream()
                .map(UsuarioMapper::toDTO)
                .collect(Collectors.toList());
    }

    public UsuarioDTO obtenerPorId(String uid) throws ExecutionException, InterruptedException {
        return usuarioRepository.findById(uid)
                .map(UsuarioMapper::toDTO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado: " + uid));
    }

    public UsuarioDTO crear(UsuarioCreateDTO dto) throws ExecutionException, InterruptedException {
        validarRol(dto.getRol());
        Usuario u = UsuarioMapper.toModel(dto);
        usuarioRepository.save(u);
        return usuarioRepository.findById(u.getId())
                .map(UsuarioMapper::toDTO)
                .orElseThrow();
    }

    public UsuarioDTO actualizar(String uid, UsuarioCreateDTO dto) throws ExecutionException, InterruptedException {
        Usuario existente = usuarioRepository.findById(uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado: " + uid));

        if (dto.getNombre() != null && !dto.getNombre().isBlank()) {
            existente.setNombre(dto.getNombre().trim());
        }
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            existente.setEmail(dto.getEmail().trim());
        }
        if (dto.getRol() != null) {
            validarRol(dto.getRol());
            existente.setRol(Rol.valueOf(dto.getRol()));
        }

        usuarioRepository.save(existente);
        return UsuarioMapper.toDTO(existente);
    }

    public void eliminar(String uid) throws ExecutionException, InterruptedException {
        usuarioRepository.findById(uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado: " + uid));
        usuarioRepository.delete(uid);
    }

    private static void validarRol(String rolRaw) {
        try {
            Rol.valueOf(rolRaw);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol inválido: " + rolRaw);
        }
    }
}

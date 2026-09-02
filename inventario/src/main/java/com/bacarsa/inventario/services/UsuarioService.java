package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.bacarsa.inventario.dto.UsuarioAuthLookupDTO;
import com.bacarsa.inventario.dto.UsuarioCreateDTO;
import com.bacarsa.inventario.dto.UsuarioDTO;
import com.bacarsa.inventario.dto.UsuarioUpdateDTO;
import com.bacarsa.inventario.mapper.UsuarioMapper;
import com.bacarsa.inventario.models.Rol;
import com.bacarsa.inventario.models.Usuario;
import com.bacarsa.inventario.repository.UsuarioRepository;
import com.google.firebase.auth.ExportedUserRecord;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.ListUsersPage;
import com.google.firebase.auth.UserRecord;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Lista todas las cuentas de Firebase Auth cruzadas con perfiles en Firestore.
     * Las cuentas Auth sin documento en {@code usuarios} aparecen sin rol ({@code tienePerfil=false}).
     */
    public List<UsuarioDTO> listarTodos() throws ExecutionException, InterruptedException {
        Map<String, UsuarioDTO> porUid = new HashMap<>();

        for (Usuario u : usuarioRepository.findAll()) {
            UsuarioDTO dto = UsuarioMapper.toDTO(u);
            porUid.put(dto.getId(), dto);
        }

        try {
            ListUsersPage page = FirebaseAuth.getInstance().listUsers(null);
            while (page != null) {
                for (ExportedUserRecord authUser : page.getValues()) {
                    UsuarioDTO dto = porUid.get(authUser.getUid());
                    if (dto == null) {
                        dto = new UsuarioDTO();
                        dto.setId(authUser.getUid());
                        dto.setNombre(displayNameOrEmail(authUser));
                        dto.setEmail(authUser.getEmail());
                        dto.setRol(null);
                        dto.setActivo(true);
                        dto.setTienePerfil(false);
                        dto.setEnAuth(true);
                        porUid.put(authUser.getUid(), dto);
                    } else {
                        dto.setEnAuth(true);
                        if ((dto.getEmail() == null || dto.getEmail().isBlank()) && authUser.getEmail() != null) {
                            dto.setEmail(authUser.getEmail());
                        }
                        if ((dto.getNombre() == null || dto.getNombre().isBlank())
                                && authUser.getDisplayName() != null
                                && !authUser.getDisplayName().isBlank()) {
                            dto.setNombre(authUser.getDisplayName());
                        }
                    }
                }
                page = page.hasNextPage() ? page.getNextPage() : null;
            }
        } catch (FirebaseAuthException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "No se pudieron listar las cuentas de Firebase Auth: " + e.getMessage());
        }

        List<UsuarioDTO> result = new ArrayList<>(porUid.values());
        result.sort(Comparator
                .comparing(UsuarioDTO::isTienePerfil)
                .thenComparing(u -> u.getEmail() == null ? "" : u.getEmail().toLowerCase()));
        return result;
    }

    public UsuarioDTO obtenerPorId(String uid) throws ExecutionException, InterruptedException {
        return usuarioRepository.findById(uid)
                .map(UsuarioMapper::toDTO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado: " + uid));
    }

    public UsuarioAuthLookupDTO buscarEnFirebaseAuth(String emailRaw)
            throws ExecutionException, InterruptedException {
        String email = emailRaw == null ? "" : emailRaw.trim().toLowerCase();
        if (email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email requerido");
        }

        UserRecord authUser;
        try {
            authUser = FirebaseAuth.getInstance().getUserByEmail(email);
        } catch (FirebaseAuthException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "No hay cuenta Firebase Auth con ese correo. El usuario debe registrarse primero en el login.");
        }

        boolean yaRegistrado = usuarioRepository.findById(authUser.getUid()).isPresent();
        return new UsuarioAuthLookupDTO(
                authUser.getUid(),
                authUser.getEmail(),
                authUser.getDisplayName(),
                yaRegistrado);
    }

    public UsuarioDTO crear(UsuarioCreateDTO dto) throws ExecutionException, InterruptedException {
        validarRol(dto.getRol());

        String uid = dto.getUid() == null ? "" : dto.getUid().trim();
        if (uid.isBlank()) {
            uid = resolverUidPorEmail(dto.getEmail());
        }

        if (usuarioRepository.findById(uid).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ese usuario ya está registrado en el inventario.");
        }

        Usuario u = UsuarioMapper.toModel(dto);
        u.setId(uid);
        usuarioRepository.save(u);
        UsuarioDTO creado = usuarioRepository.findById(u.getId())
                .map(UsuarioMapper::toDTO)
                .orElseThrow();
        creado.setEnAuth(true);
        return creado;
    }

    public UsuarioDTO actualizar(String uid, UsuarioUpdateDTO dto)
            throws ExecutionException, InterruptedException {
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
        if (dto.getActivo() != null) {
            existente.setActivo(dto.getActivo());
        }

        usuarioRepository.save(existente);
        UsuarioDTO actualizado = UsuarioMapper.toDTO(existente);
        actualizado.setEnAuth(true);
        return actualizado;
    }

    public void eliminar(String uid) throws ExecutionException, InterruptedException {
        usuarioRepository.findById(uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado: " + uid));
        usuarioRepository.delete(uid);
    }

    private static String displayNameOrEmail(ExportedUserRecord authUser) {
        if (authUser.getDisplayName() != null && !authUser.getDisplayName().isBlank()) {
            return authUser.getDisplayName();
        }
        if (authUser.getEmail() != null && !authUser.getEmail().isBlank()) {
            return authUser.getEmail().split("@")[0];
        }
        return authUser.getUid();
    }

    private static String resolverUidPorEmail(String emailRaw) {
        String email = emailRaw == null ? "" : emailRaw.trim();
        if (email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email o uid requerido");
        }
        try {
            return FirebaseAuth.getInstance().getUserByEmail(email).getUid();
        } catch (FirebaseAuthException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No hay cuenta Firebase Auth con ese correo.");
        }
    }

    private static void validarRol(String rolRaw) {
        try {
            Rol.valueOf(rolRaw);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol inválido: " + rolRaw);
        }
    }
}
